import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import apiClient from '../services/apiClient';
import { buildApiUrl } from '../utils/tenantUrlBuilder';
import { useTenant } from './useTenant';

interface Message {
  id: number;
  conversation_id: number;
  sender_user_id: number;
  sender_user_type: string;
  sender_name: string;
  message_text: string;
  message_type: string;
  created_at: string;
  is_read: boolean;
}

interface Conversation {
  id: number;
  type: string;
  conversation_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  subject?: string;
  class_id?: number;
}

interface SendDirectMessagePayload {
  recipientUserId: number;
  recipientUserType: string;
  messageText: string;
  messageType?: string;
}

interface SendClassBroadcastPayload {
  programId: string;
  departmentId: string;
  academicYearId: string;
  classId: string;
  subject: string;
  messageText: string;
  messageType?: string;
}

export const useChatAPI = (userId?: string, userType?: string) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  
  // Component mount tracking to prevent setState on unmounted components
  const isMountedRef = useRef(true);
  
  // Rate limiting state
  const [rateLimitBackoff, setRateLimitBackoff] = useState(0);
  const [lastRateLimit, setLastRateLimit] = useState(0);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [isInCircuitBreaker, setIsInCircuitBreaker] = useState(false);

  const tenant = useTenant();
  
  // Chat service API base URL
  const CHAT_API_BASE = buildApiUrl(tenant, Number(process.env.NEXT_PUBLIC_BASE_PORT), '/api');

  // Request deduplication to prevent race conditions
  const [activeRequests, setActiveRequests] = useState(new Set<string>());
  const [lastRefreshTime, setLastRefreshTime] = useState(0);

  // Auto-refresh functionality for real-time updates
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  
  // Component mount tracking cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);
  
  // Debug environment variables once
  useEffect(() => {
    if (!tenant) return;
    console.log('🔧 Chat API Configuration:', {
      CHAT_API_BASE,
      userId,
      userType
    });
  }, [tenant, CHAT_API_BASE, userId, userType]);

  const handleError = (error: any, context: string) => {
    console.error(`Chat API Error (${context}):`, error);
    const message = error.response?.data?.message || error.message || `Failed to ${context}`;
    setError(message);
    return message;
  };

  const clearError = () => setError(null);

  /**
   * Fetch conversations for current user with deduplication
   */
  const fetchConversations = useCallback(async (page = 1, limit = 20, force = false, silent = false) => {
    if (!userId || !userType) {
        return { success: false, error: 'User not authenticated' };
    }

    const requestKey = `fetchConversations-${userId}-${userType}-${page}-${limit}`;
    const now = Date.now();
    
    // Prevent duplicate requests within 2 seconds unless forced
    if (!force && (activeRequests.has(requestKey) || (now - lastRefreshTime < 2000))) {
      return { success: true, data: conversations };
    }

    // Skip if in circuit breaker mode
    if (isInCircuitBreaker && !force) {
      return { success: true, data: conversations };
    }

    try {
      // Only show loading indicator if not silent (not background refresh) and component is mounted
      if (!silent && isMountedRef.current) {
        setLoading(true);
      }
      clearError();
      setActiveRequests(prev => new Set([...prev, requestKey]));
      setLastRefreshTime(now);
      
      // Add timeout for network requests to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout (increased)
      
      const fetchUrl = `${CHAT_API_BASE}/chat/conversations?userId=${userId}&userType=${userType}&page=${page}&limit=${limit}`;
            
      const response = await apiClient.get(fetchUrl, {signal: controller.signal});
      
      clearTimeout(timeoutId); // Clear timeout on successful response

           
      const data = response.data;
      
      if (data.success) {
               
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          // Deduplicate conversations by ID to prevent React key conflicts
          const uniqueConversations = data.conversations?.reduce((acc: any[], current: any) => {
            const existingIndex = acc.findIndex(conv => conv.id === current.id);
            if (existingIndex === -1) {
              acc.push(current);
            } else {
              // Keep the most recent version (better data)
              acc[existingIndex] = current;
            }
            return acc;
          }, []) || [];
          
          setConversations(uniqueConversations);
        }
        setLastRefreshTime(now);
        return { success: true, data: data.conversations };
      } else {
        throw new Error(data.message || 'Failed to fetch conversations');
      }
    } catch (error: any) {
      // Skip errors for aborted requests (component unmounted)
      if (error.name === 'AbortError') {
        console.log('🚫 Request aborted (component unmounted or timeout)');
        return { success: false, error: 'Request cancelled' };
      }
      
      // Handle rate limiting with exponential backoff
      if (error.message?.includes('Too many requests') || error.message?.includes('429')) {
        const newBackoff = Math.min(rateLimitBackoff + 3000 + Math.random() * 3000, 60000); // Max 60s
        setRateLimitBackoff(newBackoff);
        setLastRateLimit(Date.now());
        setConsecutiveErrors(prev => prev + 1);
        
        // Circuit breaker - stop all requests for 2 minutes after 5 consecutive rate limits
        if (consecutiveErrors >= 4) {
          setIsInCircuitBreaker(true);
          setTimeout(() => {
            setIsInCircuitBreaker(false);
            setConsecutiveErrors(0);
          }, 120000); // 2 minutes
        }
        
        // Silent for background requests - no user-facing errors
        if (silent) {
          return { success: true, data: conversations }; // Return cached data
        }
        return { success: false, error: 'Network busy - please wait' };
      }
      
      // Reset consecutive errors on non-rate-limit errors
      if (consecutiveErrors > 0) {
        setConsecutiveErrors(0);
      }
      
      console.error('❌ fetchConversations error:', error);
      const message = handleError(error, 'fetch conversations');
      return { success: false, error: message };
    } finally {
      // Only hide loading indicator if it was shown (not silent) and component still mounted
      if (!silent && isMountedRef.current) {
        setLoading(false);
      }
      if (isMountedRef.current) {
        setActiveRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(requestKey);
          return newSet;
        });
      }
    }
  }, [tenant, userId, userType, CHAT_API_BASE]);

  /**
   * Add optimistic message to UI immediately
   */
  const addOptimisticMessage = useCallback((message: Partial<Message>) => {
    const optimisticMsg: Message = {
      id: Date.now(), // Temporary ID
      conversation_id: message.conversation_id!,
      sender_user_id: parseInt(userId || '1'),
      sender_user_type: userType as any || 'teacher',
      sender_name: `${getUserDisplayName()}`,
      message_text: message.message_text!,
      message_type: message.message_type || 'text',
      created_at: new Date().toISOString(),
      is_read: false, // Show as sending/pending
    };
    
    setOptimisticMessages(prev => [...prev, optimisticMsg]);
    return optimisticMsg.id;
  }, [userId, userType]);

  /**
   * Remove optimistic message (on error or when replaced by real message)
   */
  const removeOptimisticMessage = useCallback((tempId: number) => {
    setOptimisticMessages(prev => prev.filter(msg => msg.id !== tempId));
  }, []);

  /**
   * Get user display name for optimistic messages
   */
  const getUserDisplayName = useCallback(() => {
    // This would typically come from user context, for now return a default
    return userType === 'teacher' ? 'You' : 'You';
  }, [userType]);

  /**
   * Fetch messages in a conversation
   */
  const fetchMessages = useCallback(async (conversationId: number, page = 1, limit = 50, silent = false) => {
    if (!userId || !userType || !tenant) return { success: false, error: 'User not authenticated' };

    try {
      // Only show loading indicator if not silent (not background refresh)
      if (!silent) {
        setLoading(true);
      }
      clearError();

      const response = await apiClient.get(
        `${CHAT_API_BASE}/chat/conversations/${conversationId}/messages?userId=${userId}&userType=${userType}&page=${page}&limit=${limit}`);

      const data = response.data;

      if (data.success) {
        setCurrentMessages(data.messages || []);
        // Clear optimistic messages when real messages are loaded
        setOptimisticMessages([]);
        return { success: true, data: data.messages };
      } else {
        throw new Error(data.message || 'Failed to fetch messages');
      }
    } catch (error: any) {
      // Handle rate limiting with exponential backoff
      if (error.message?.includes('Too many requests') || error.message?.includes('429')) {
        const newBackoff = Math.min(rateLimitBackoff + 2000 + Math.random() * 2000, 45000); // Max 45s
        setRateLimitBackoff(newBackoff);
        setLastRateLimit(Date.now());
        setConsecutiveErrors(prev => prev + 1);
        
        // Silent return for background requests
        if (silent) {
          return { success: true, data: currentMessages }; // Return cached messages
        }
        return { success: false, error: 'Network busy - please wait' };
      }
      
      const message = handleError(error, 'fetch messages');
      return { success: false, error: message };
    } finally {
      // Only hide loading indicator if it was shown (not silent)
      if (!silent) {
        setLoading(false);
      }
    }
  }, [tenant, userId, userType, CHAT_API_BASE]);

  /**
   * Fetch unread message count
   */
  const fetchUnreadCount = useCallback(async () => {
    if (!userId || !userType || !tenant) return { success: false, error: 'User not authenticated' };

    try {
      // Add timeout for network requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 second timeout
      
      const response = await apiClient.get(
        `${CHAT_API_BASE}/chat/messages/unread-count?userId=${userId}&userType=${userType}`,
        {         
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      const data = response.data;

      if (data.success) {
        if (isMountedRef.current) {
          setUnreadCount(data.unreadCount || 0);
        }
        return { success: true, count: data.unreadCount };
      } else {
        throw new Error(data.message || 'Failed to fetch unread count');
      }
    } catch (error: any) {
      // Skip errors for aborted requests (component unmounted)
      if (error.name === 'AbortError') {
        console.log('🚫 Unread count request aborted (component unmounted or timeout)');
        return { success: false, error: 'Request cancelled' };
      }
      
      // Handle rate limiting
      if (error.message?.includes('Too many requests') || error.message?.includes('429')) {
        const newBackoff = Math.min(rateLimitBackoff + 2000 + Math.random() * 2000, 40000); // Max 40s
        setRateLimitBackoff(newBackoff);
        setLastRateLimit(Date.now());
        setConsecutiveErrors(prev => prev + 1);
        
        // Silent return for background requests
        return { success: true, count: unreadCount }; // Return cached count
      }
      
      const message = handleError(error, 'fetch unread count');
      return { success: false, error: message };
    }
  }, [tenant, userId, userType, CHAT_API_BASE]);

  /**
   * Send direct message with optimistic UI update
   */
  const sendDirectMessage = useCallback(async (payload: SendDirectMessagePayload & { conversationId?: number }) => {
    if (!tenant) return;
    // Use default values if user is not authenticated
    const senderUserId = userId || '1';
    const senderUserType = userType || 'teacher';

    // Add optimistic message immediately
    let tempMessageId: number | null = null;
    if (payload.conversationId) {
      tempMessageId = addOptimisticMessage({
        conversation_id: payload.conversationId,
        message_text: payload.messageText,
        message_type: payload.messageType || 'text',
      });
    }

    try {
      clearError();

      console.log('🚀 Sending message with sender:', { senderUserId, senderUserType });

      const response = await apiClient.post(`${CHAT_API_BASE}/chat/messages/direct`, {
          senderUserId: parseInt(senderUserId),
          senderUserType: senderUserType,
          recipientUserId: payload.recipientUserId,
          recipientUserType: payload.recipientUserType,
          messageText: payload.messageText,
          messageType: payload.messageType || 'text',
        });

      const data = response.data;

      if (data.success) {
        // Remove optimistic message and refresh to get the real message
        if (tempMessageId) {
          removeOptimisticMessage(tempMessageId);
        }
        
        // Refresh conversations and current messages if we have a conversation ID
        if (payload.conversationId) {
          // Add a small delay to ensure server has processed the message
          setTimeout(async () => {
            await fetchMessages(payload.conversationId!, 1, 50, true); // Silent refresh for background
          }, 200);
        }
        // Refresh conversations list with longer delay and force flag to prevent race conditions
        setTimeout(async () => {
          await fetchConversations(1, 20, true, true); // Force + silent refresh (background)
          await fetchUnreadCount();
        }, 800); // Longer delay to avoid conflicts
        
        return { success: true, data: data.message };
      } else {
        // Remove optimistic message on error
        if (tempMessageId) {
          removeOptimisticMessage(tempMessageId);
        }
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error: any) {
      // Remove optimistic message on error
      if (tempMessageId) {
        removeOptimisticMessage(tempMessageId);
      }
      const message = handleError(error, 'send direct message');
      return { success: false, error: message };
    }
  }, [tenant, userId, userType, CHAT_API_BASE, addOptimisticMessage, removeOptimisticMessage, fetchMessages, fetchConversations, fetchUnreadCount]);

  /**
   * Send class broadcast message
   */
  const sendClassBroadcast = useCallback(async (payload: SendClassBroadcastPayload) => {
    // Use default values if user is not authenticated
    const senderUserId = userId || '1';
    const senderUserType = userType || 'teacher';

    try {
      setLoading(true);
      clearError();

      console.log('🚀 Sending broadcast with sender:', { senderUserId, senderUserType });
      console.log('🎯 Class broadcast payload:', {
        programId: payload.programId,
        departmentId: payload.departmentId, 
        academicYearId: payload.academicYearId,
        classId: payload.classId,
        subject: payload.subject,
        messageText: payload.messageText
      });

      const response = await apiClient.post(`${CHAT_API_BASE}/chat/messages/class-broadcast`, 
        {
          senderUserId: parseInt(senderUserId),
          senderUserType: senderUserType,
          programId: payload.programId,
          departmentId: payload.departmentId,
          academicYearId: payload.academicYearId,
          classId: payload.classId,
          subject: payload.subject,
          messageText: payload.messageText,
          messageType: payload.messageType || 'announcement',
        });

      const data = response.data;

      if (data.success) {
        // Refresh conversations immediately for class broadcasts
        setTimeout(async () => {
          await fetchConversations(1, 20, false, true); // Silent refresh (background update)
        }, 200);
        return { success: true, data: data.message, recipientCount: data.recipientCount };
      } else {
        throw new Error(data.message || 'Failed to send class broadcast');
      }
    } catch (error: any) {
      const message = handleError(error, 'send class broadcast');
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [tenant, userId, userType, CHAT_API_BASE, fetchConversations]);

  /**
   * Mark conversation as read
   */
  const markConversationAsRead = useCallback(async (conversationId: number) => {
    if (!tenant) return;
    if (!userId || !userType) return { success: false, error: 'User not authenticated' };

    try {
      const response = await apiClient.put(`${CHAT_API_BASE}/chat/conversations/${conversationId}/read`, {
          userId: parseInt(userId),
          userType: userType,
      });

      const data = response.data;

      if (data.success) {
        // Refresh unread count and conversations
        await fetchUnreadCount();
        await fetchConversations(1, 20, false, true); // Silent refresh (background update)
        return { success: true };
      } else {
        throw new Error(data.message || 'Failed to mark conversation as read');
      }
    } catch (error: any) {
      const message = handleError(error, 'mark conversation as read');
      return { success: false, error: message };
    }
  }, [tenant, userId, userType, CHAT_API_BASE, fetchUnreadCount, fetchConversations]);

  /**
   * Get students by class (for teacher's class broadcasts)
   */
  const getStudentsByClass = useCallback(async (classId: number) => {
    try {
      const response = await apiClient.get(`${CHAT_API_BASE}/students/class/${classId}`);

      const data = response.data;

      if (data.success) {
        return { success: true, students: data.students };
      } else {
        throw new Error(data.message || 'Failed to fetch students');
      }
    } catch (error: any) {
      const message = handleError(error, 'fetch students');
      return { success: false, error: message };
    }
  }, [tenant, CHAT_API_BASE]);

  /**
   * Get available teachers (for teacher-teacher communication)
   */
  const getTeachers = useCallback(async () => {
    try {
      const excludeUserId = userId ? `?excludeUserId=${userId}` : '';
      const response = await apiClient.get(`${CHAT_API_BASE}/teachers${excludeUserId}`);

      const data = response.data;

      if (data.success) {
        return { success: true, teachers: data.teachers };
      } else {
        throw new Error(data.message || 'Failed to fetch teachers');
      }
    } catch (error: any) {
      const message = handleError(error, 'fetch teachers');
      return { success: false, error: message };
    }
  }, [tenant, userId, CHAT_API_BASE]);

  /**
   * Get teacher's classes for class broadcast by analyzing assigned students
   */
  const getTeacherClasses = useCallback(async () => {
    if (!userId || userType !== 'teacher') {
      return { success: false, error: 'Only teachers can access classes' };
    }

    try {
           
      // Fetch real department data and students in parallel
      const { getStudents } = require('../services/studentService');
      const { fetchMasterDepartments, fetchChildDepartments } = require('../services/departmentService');
      
      const [studentsResult, masterDepartments] = await Promise.all([
        getStudents(1, 1000), // Get all students
        fetchMasterDepartments().catch(() => ({ data: [] })) // Fallback to empty array on error
      ]);

      if (!studentsResult || !studentsResult.data || studentsResult.data.length === 0) {
        console.log('❌ No students found for teacher');
        return { success: true, classes: [] };
      }

      // Build department name mapping from real data
      const departmentNames: Record<number, string> = {};
      
      if (masterDepartments && masterDepartments.data) {
        // First, add master departments
        masterDepartments.data.forEach((dept: any) => {
          departmentNames[dept.id] = dept.name;
        });
        
        // Then fetch child departments for each master department
        try {
          const childDeptPromises = masterDepartments.data.map((master: any) => 
            fetchChildDepartments(master.id).catch(() => ({ data: [] }))
          );
          
          const childResults = await Promise.all(childDeptPromises);
          childResults.forEach(result => {
            if (result && result.data) {
              result.data.forEach((child: any) => {
                departmentNames[child.id] = child.name;
              });
            }
          });
        } catch (error) {
          console.log('⚠️ Could not fetch child departments, using master departments only');
        }
      }

      const allStudents = studentsResult.data;
            
      // More permissive filtering - only require basic fields, don't worry about status initially
      const studentsWithClassInfo = allStudents.filter((student: any) => {
        const hasName = student.student_name;
        const hasClassId = student.class_id !== null && student.class_id !== undefined;
        const hasDeptId = student.department_id !== null && student.department_id !== undefined;
        
        return hasName && hasClassId && hasDeptId;
      });

      if (studentsWithClassInfo.length === 0) {        
        return { success: true, classes: [] };
      }

      // Group students by class and department to derive classes
      const classMap = new Map();

      studentsWithClassInfo.forEach((student: any) => {
        // Create a unique key for each class combination
        const programId = student.program_id?.toString() || '1';
        const departmentId = student.department_id?.toString(); 
        const academicYearId = student.academic_year_id?.toString() || '1';
        const classId = student.class_id?.toString();
        
        const classKey = `${programId}-${departmentId}-${academicYearId}-${classId}`;
        
             
        if (!classMap.has(classKey)) {
          // Get department name from real database data
          let departmentName = 'Unknown Department';
          
          if (student.dept_name && student.dept_name !== 'Department') {
            // Use department name from student data if available
            departmentName = student.dept_name;
          } else if (departmentNames[student.department_id]) {
            // Use department name from departmentNames mapping
            departmentName = departmentNames[student.department_id];
          } else {
            // Last fallback - just use department ID
            departmentName = `Department ${student.department_id}`;
          }
          
          const classData = {
            id: classKey,
            name: `${departmentName} - Class ${classId}`,
            code: `${programId}-${classId}`,
            programId: programId,
            departmentId: departmentId,
            academicYearId: academicYearId,
            classId: classId,
            students: [],
            students_count: 0,
            departmentName: departmentName
          };         
          
          classMap.set(classKey, classData);
        }
        
        // Add student to the class
        const classData = classMap.get(classKey);
        classData.students.push(student);
        classData.students_count = classData.students.length;
        
      });

      // Convert map to array and sort by department/class name
      const classes = Array.from(classMap.values()).sort((a, b) => {
        // Sort by department name first, then by class ID
        const deptCompare = a.departmentName.localeCompare(b.departmentName);
        if (deptCompare !== 0) return deptCompare;
        return parseInt(a.classId) - parseInt(b.classId);
      });
      
      classes.forEach(cls => {
        console.log(`  - ${cls.name}: ${cls.students_count} students (Dept: ${cls.departmentName})`);
      });

      return { success: true, classes };
    } catch (error: any) {
      console.error('❌ Error deriving teacher classes from students:', error);
      // Still return empty array to prevent UI crash
      return { success: true, classes: [] };
    }
  }, [userId, userType]);

  /**
   * Get students that a teacher can message (all students)
   */
  const getStudentsForChat = useCallback(async () => {
    try {
          
      // Import the student service functions statically
      const { getStudents } = require('../services/studentService');
      
      // Fetch all students (page 1, large limit to get all)
      const result = await getStudents(1, 1000);
      
      if (result && result.data) {
        const students = result.data;
        return { success: true, students };
      } else {
        return { success: true, students: [] };
      }
    } catch (error: any) {
      console.error('❌ Error fetching students for chat:', error);
      const message = handleError(error, 'fetch students for chat');
      return { success: false, error: message };
    }
  }, []);

  // Auto-refresh conversations and unread count
  useEffect(() => {
    if (userId && userType && tenant) {
      fetchConversations(1, 20, false, true); // Initial load - silent (no loading indicator)
      fetchUnreadCount();
    }
  }, [tenant, userId, userType, fetchConversations, fetchUnreadCount]);

  // Auto-refresh conversations every 20 seconds (more frequent for better UX)
  useEffect(() => {
    if (!userId || !userType || !autoRefreshEnabled || !tenant) return;

    // Initial short delay, then longer intervals
    const initialDelay = setTimeout(async () => {
      // Only make initial call if not in circuit breaker
      if (!isInCircuitBreaker && isMountedRef.current) {
        try {
          await fetchConversations(1, 20, true, true);
        } catch (error) {
          // Silently handle initial load errors
        }
      }
    }, 2000);

    const interval = setInterval(async () => {
      try {
        if (isMountedRef.current && !isInCircuitBreaker) {
          // Check if we're in a backoff period
          const now = Date.now();
          if (rateLimitBackoff > 0 && (now - lastRateLimit) < rateLimitBackoff) {
            return; // Silent skip during backoff
          }
          
          // Reset backoff if enough time has passed
          if (rateLimitBackoff > 0 && (now - lastRateLimit) >= rateLimitBackoff) {
            setRateLimitBackoff(0);
            setConsecutiveErrors(0);
          }
          
          // Silent background refresh - no console logs during normal operation
          await fetchConversations(1, 20, true, true);
          
          // Fetch unread count less frequently (every other refresh)
          const refreshCount = Math.floor(now / 20000);
          if (refreshCount % 2 === 0) {
            await fetchUnreadCount();
          }
        }
      } catch (error: any) {
        // Completely silent error handling for seamless UX
        if (error.name !== 'AbortError' && isMountedRef.current) {
          setConsecutiveErrors(prev => prev + 1);
        }
      }
    }, 20000); // 20 seconds - more frequent for better real-time experience

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [tenant, userId, userType, autoRefreshEnabled, isInCircuitBreaker]); // Removed rate limit dependencies for stability

  // Auto-refresh current conversation messages every 10 seconds (faster for real-time feel)
  useEffect(() => {
    if (!userId || !userType || !currentConversationId || !autoRefreshEnabled || !tenant) return;

    const interval = setInterval(async () => {
      try {
        if (isMountedRef.current && !isInCircuitBreaker) {
          // Check if we're in a backoff period
          const now = Date.now();
          if (rateLimitBackoff > 0 && (now - lastRateLimit) < rateLimitBackoff) {
            return; // Silent skip during backoff
          }
          
          // Fetch messages for the current conversation - silent background refresh
          await fetchMessages(currentConversationId, 1, 50, true);
        }
      } catch (error: any) {
        // Completely silent error handling
        if (error.name !== 'AbortError' && isMountedRef.current) {
          setConsecutiveErrors(prev => prev + 1);
        }
      }
    }, 10000); // 10 seconds - faster for real-time messaging experience

    return () => clearInterval(interval);
  }, [tenant, userId, userType, currentConversationId, autoRefreshEnabled, isInCircuitBreaker]); // Removed rate limit dependencies

  // Function to set current conversation for message auto-refresh
  const setCurrentConversation = useCallback((conversationId: number | null) => {
    setCurrentConversationId(conversationId);
  }, []);

  // Function to control auto-refresh
  const setAutoRefresh = useCallback((enabled: boolean) => {
    setAutoRefreshEnabled(enabled);
  }, []);

  // Merge real messages with optimistic messages for display
  const allMessages = useMemo(() => {
    return [...currentMessages, ...optimisticMessages].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [currentMessages, optimisticMessages]);

  return {
    // State
    conversations,
    currentMessages: allMessages, // Return merged messages
    unreadCount,
    loading,
    error,
    
    // Actions
    fetchConversations,
    fetchMessages,
    fetchUnreadCount,
    sendDirectMessage,
    sendClassBroadcast,
    markConversationAsRead,
    getStudentsByClass,
    getTeachers,
    getStudentsForChat,
    getTeacherClasses,
    clearError,
    
    // Auto-refresh controls
    setCurrentConversation,
    setAutoRefresh,
    autoRefreshEnabled,
  };
};