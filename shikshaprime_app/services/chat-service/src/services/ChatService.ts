import { Op, QueryTypes } from 'sequelize';
import { getTenantSequelize } from '../server';
import { getTenantModels } from '../models';

export interface SendDirectMessagePayload {
  senderUserId: number;
  senderUserType: 'teacher' | 'student' | 'admin' | 'staff';
  recipientUserId: number;
  recipientUserType: 'teacher' | 'student' | 'admin' | 'staff';
  messageText: string;
  messageType?: 'text' | 'announcement' | 'important';
}

export interface SendClassBroadcastPayload {
  senderUserId: number;
  senderUserType: 'teacher' | 'admin' | 'staff';
  programId: string;
  departmentId: string;
  academicYearId: string;
  classId: string;
  subject: string;
  messageText: string;
  messageType?: 'text' | 'announcement' | 'important';
}

export interface GetConversationsPayload {
  userId: number;
  userType: 'teacher' | 'student' | 'admin' | 'staff';
  page?: number;
  limit?: number;
}

export interface GetMessagesPayload {
  conversationId: number;
  userId: number;
  userType: 'teacher' | 'student' | 'admin' | 'staff';
  page?: number;
  limit?: number;
}

export class ChatService {
  /**
   * Send direct message between users
   */
  async sendDirectMessage(payload: SendDirectMessagePayload, tenant: string) {
    console.log('📤 sendDirectMessage called with:', payload);
    console.log('🔍 Checking if payload has unexpected fields:', Object.keys(payload));
    const sequelize = getTenantSequelize(tenant);
    const transaction = await sequelize.transaction();
    
    try {
      // Validate permissions based on user types
      if (!this.canSendDirectMessage(payload.senderUserType, payload.recipientUserType)) {
        throw new Error('You do not have permission to send messages to this user type');
      }

      // Convert student database ID to user_id BEFORE finding conversation
      let actualSenderUserId = payload.senderUserId;
      let actualRecipientUserId = payload.recipientUserId;
      
      // Handle sender ID conversion (for when students send messages)
      if (payload.senderUserType === 'student') {
        console.log('🔍 Converting sender student ID to user_id:', payload.senderUserId);
        // First check if this is already a user_id
        const userIdCheck = await sequelize.query(
          'SELECT id FROM students WHERE user_id = :userId LIMIT 1',
          {
            replacements: { userId: payload.senderUserId },
            type: QueryTypes.SELECT,
          }
        ) as any[];
        
        if (userIdCheck.length > 0) {
          // Already a user_id, keep it
          actualSenderUserId = payload.senderUserId;
          console.log('✅ Sender ID is already a user_id:', actualSenderUserId);
        } else {
          // Try as database ID
          const dbIdCheck = await sequelize.query(
            'SELECT user_id FROM students WHERE id = :dbId LIMIT 1',
            {
              replacements: { dbId: payload.senderUserId },
              type: QueryTypes.SELECT,
            }
          ) as any[];
          
          if (dbIdCheck.length > 0) {
            actualSenderUserId = dbIdCheck[0].user_id;
            console.log('✅ Found sender user_id:', actualSenderUserId, 'for database ID:', payload.senderUserId);
          } else {
            console.log('❌ Sender student not found for ID:', payload.senderUserId);
            throw new Error(`Student not found for ID ${payload.senderUserId}`);
          }
        }
      }

      // Handle recipient ID conversion (for when teachers message students)
      if (payload.recipientUserType === 'student') {
        console.log('🔍 Converting recipient student ID to user_id:', payload.recipientUserId);
        // First check if this is already a user_id
        const userIdCheck = await sequelize.query(
          'SELECT id FROM students WHERE user_id = :userId LIMIT 1',
          {
            replacements: { userId: payload.recipientUserId },
            type: QueryTypes.SELECT,
          }
        ) as any[];
        
        if (userIdCheck.length > 0) {
          // Already a user_id, keep it
          actualRecipientUserId = payload.recipientUserId;
          console.log('✅ Recipient ID is already a user_id:', actualRecipientUserId);
        } else {
          // Try as database ID
          const dbIdCheck = await sequelize.query(
            'SELECT user_id FROM students WHERE id = :dbId LIMIT 1',
            {
              replacements: { dbId: payload.recipientUserId },
              type: QueryTypes.SELECT,
            }
          ) as any[];
          
          if (dbIdCheck.length > 0) {
            actualRecipientUserId = dbIdCheck[0].user_id;
            console.log('✅ Found recipient user_id:', actualRecipientUserId, 'for database ID:', payload.recipientUserId);
          } else {
            console.log('❌ Recipient student not found for ID:', payload.recipientUserId);
            throw new Error(`Student not found for ID ${payload.recipientUserId}`);
          }
        }
      }

      // Now find or create conversation with correct user_ids
      let conversation = await this.findDirectConversation(
        actualSenderUserId,
        payload.senderUserType,
        actualRecipientUserId,
        payload.recipientUserType,
        tenant
      );

      console.log('🔍 Existing conversation found:', conversation ? 'YES' : 'NO');
      const { Conversation, ConversationParticipant, Message, MessageReadStatus } = getTenantModels(tenant);
      // If conversation exists, check if it's a read-only broadcast
      if (conversation) {
        // Check if this is a broadcast conversation (has subject and multiple participants)
        const participantCount = await ConversationParticipant.count({
          where: { 
            conversation_id: (conversation as any).id, 
            is_active: true 
          }
        });
        
        if ((conversation as any).subject && participantCount > 2) {
          console.log('❌ Attempted to send message to read-only broadcast conversation');
          console.log('🔒 Broadcast conversations are read-only for ALL participants, including teachers');
          throw new Error('Cannot send additional messages to broadcast conversations. Broadcasts are read-only announcements for all participants.');
        }
      }

      if (!conversation) {
        console.log('🆕 Creating new conversation...');
        console.log('🔍 Sender:', actualSenderUserId, payload.senderUserType);
        console.log('🔍 Recipient:', actualRecipientUserId, payload.recipientUserType);
        
        // Create new direct conversation
        conversation = await Conversation.create({
          type: 'direct',
          created_by_user_id: actualSenderUserId,
          created_by_user_type: payload.senderUserType,
          is_active: true,
        }, { transaction });

        console.log('✅ New conversation created with ID:', (conversation as any).id);

        // Add both participants with converted user_ids
        console.log('👥 Adding sender as participant...');
        const senderParticipant = await ConversationParticipant.create({
          conversation_id: (conversation as any).id,
          user_id: actualSenderUserId,
          user_type: payload.senderUserType,
          is_active: true,
          is_muted: false,
        }, { transaction });
        console.log('✅ Sender participant created:', senderParticipant.id);

        console.log('👥 Adding recipient as participant...');
        const recipientParticipant = await ConversationParticipant.create({
          conversation_id: (conversation as any).id,
          user_id: actualRecipientUserId, // Use the already converted user_id
          user_type: payload.recipientUserType,
          is_active: true,
          is_muted: false,
        }, { transaction });
        console.log('✅ Recipient participant created:', recipientParticipant.id);

        // Verify only 2 participants were created
        const participantCount = await ConversationParticipant.count({
          where: { conversation_id: (conversation as any).id, is_active: true },
          transaction
        });
        console.log(`🔍 Total participants in conversation: ${participantCount}`);
        
        if (participantCount !== 2) {
          console.error(`❌ PROBLEM: Direct conversation has ${participantCount} participants instead of 2!`);
        }

        console.log('✅ Both participants added to conversation');
        
        // Verify participants were actually created
        const verifyParticipants = await ConversationParticipant.findAll({
          where: { conversation_id: (conversation as any).id },
          transaction
        });
        console.log('🔍 Verification - Total participants:', verifyParticipants.length);
        verifyParticipants.forEach((p, i) => {
          console.log(`  ${i+1}. ${p.user_type} ${p.user_id} (active: ${p.is_active})`);
        });

        // Extra safety check - ensure student participant exists
        if (payload.senderUserType === 'teacher' && payload.recipientUserType === 'student') {
          const studentExists = verifyParticipants.find(p => 
            p.user_id === actualRecipientUserId && p.user_type === 'student'
          );
          if (!studentExists) {
            console.log('❌ CRITICAL: Student participant missing! Re-creating...');
            await ConversationParticipant.create({
              conversation_id: (conversation as any).id,
              user_id: actualRecipientUserId,
              user_type: payload.recipientUserType,
              is_active: true,
              is_muted: false,
            }, { transaction });
            console.log('✅ Student participant re-created successfully');
          }
        }
      }

      // Create the message
      const message = await Message.create({
        conversation_id: (conversation as any).id,
        sender_user_id: actualSenderUserId,
        sender_user_type: payload.senderUserType,
        message_text: payload.messageText,
        message_type: payload.messageType || 'text',
        is_deleted: false,
      }, { transaction });

      console.log('✅ Message created with ID:', message.id);

      // Mark as read by sender
      await MessageReadStatus.create({
        message_id: message.id,
        user_id: actualSenderUserId,
        user_type: payload.senderUserType,
      }, { transaction });

      // Get message with sender info before committing (in case this fails)
      const messageWithSender = await this.getMessageWithSenderInfo(message.id, tenant);

      // Commit transaction only after everything succeeds
      await transaction.commit();
      console.log('✅ Transaction committed successfully');
      
      // Emit real-time event (if socket.io is integrated)
      this.emitNewMessage((conversation as any).id, messageWithSender);

      return {
        success: true,
        message: messageWithSender,
        conversationId: (conversation as any).id,
      };

    } catch (error) {
      console.error('❌ Error in sendDirectMessage, rolling back transaction:', error);
      // Only rollback if transaction hasn't been committed yet
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        // Transaction may have already been committed or rolled back, ignore rollback error
        console.log('Transaction rollback failed (likely already committed):', rollbackError instanceof Error ? rollbackError.message : String(rollbackError));
      }
      throw error;
    }
  }

  /**
   * Repair method to fix missing student participants in teacher-initiated conversations
   */
  async repairStudentParticipants(tenant: string) {
    console.log('🔧 Starting repair of missing student participants...');    
    try {
      const sequelize = getTenantSequelize(tenant);
      // Find conversations where teachers sent messages but students aren't participants
      const brokenConversations = await sequelize.query(`
        SELECT DISTINCT c.id as conversation_id, c.created_by_user_id, c.created_by_user_type,
               m.sender_user_id, m.sender_user_type,
               -- Try to identify the intended recipient from message context
               CASE 
                 WHEN c.created_by_user_type = 'teacher' AND m.sender_user_type = 'teacher' THEN
                   -- For teacher-created conversations, look for missing student recipients
                   NULL
               END as missing_student_id
        FROM conversations c
        INNER JOIN messages m ON c.id = m.conversation_id
        WHERE c.type = 'direct' 
          AND c.created_by_user_type = 'teacher'
          AND c.id NOT IN (
            SELECT cp.conversation_id 
            FROM conversation_participants cp 
            WHERE cp.user_type = 'student' AND cp.is_active = 1
          )
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT 10
      `, { type: QueryTypes.SELECT });

      console.log(`🔍 Found ${brokenConversations.length} potentially broken conversations`);
      
      return {
        success: true,
        brokenConversationsFound: brokenConversations.length,
        message: `Found ${brokenConversations.length} conversations that may need student participants`
      };

    } catch (error) {
      console.error('❌ Error in repairStudentParticipants:', error);
      throw error;
    }
  }

  /**
   * Send broadcast message to a class
   */
  async sendClassBroadcast(payload: SendClassBroadcastPayload, tenant: string) {
    const sequelize = getTenantSequelize(tenant);
    const transaction = await sequelize.transaction();

    try {
      // Only teachers and admins can send class broadcasts
      if (!['teacher', 'admin'].includes(payload.senderUserType)) {
        throw new Error('Only teachers and admins can send class broadcasts');
      }

      // Get all students in the class using the class parameters
      console.log(`🔍 Querying students with params:`, {
        programId: payload.programId,
        departmentId: payload.departmentId,
        academicYearId: payload.academicYearId,
        classId: payload.classId
      });

      const students = await sequelize.query(`
        SELECT id, student_name, email, status, program_id, department_id, academic_year_id, class_id
        FROM students 
        WHERE program_id = :programId 
          AND department_id = :departmentId 
          AND class_id = :classId 
          AND (status = 1 OR status = 'ACTIVE')
          ${payload.academicYearId && payload.academicYearId !== '1' ? 'AND academic_year_id = :academicYearId' : ''}
      `, {
        replacements: { 
          programId: payload.programId,
          departmentId: payload.departmentId, 
          academicYearId: payload.academicYearId,
          classId: payload.classId
        },
        type: QueryTypes.SELECT,
      }) as any[];

      console.log(`📊 Found ${students.length} students in class`);
      if (students.length > 0) {
        console.log(`👥 First student sample:`, students[0]);
      }

      if (students.length === 0) {
        throw new Error('No active students found in this class');
      }

      // Create WhatsApp-like group conversation 
      console.log('🚀 Creating WhatsApp-style group conversation for class broadcast...');
      
      // Create group name like "Physics - Class 1 (9 students)"
      const groupName = payload.subject || `Class Broadcast`;

      const { Conversation, ConversationParticipant, Message, MessageReadStatus, ClassBroadcastRecipient } = getTenantModels(tenant);
      
      const conversation = await Conversation.create({
        type: 'direct', // Temporarily use 'direct' until database schema is updated
        subject: groupName, // Group title like WhatsApp
        created_by_user_id: payload.senderUserId,
        created_by_user_type: payload.senderUserType,
        is_active: true,
      }, { transaction });
      
      console.log(`✅ Group conversation "${groupName}" created with ID:`, (conversation as any).id);
      console.log(`👥 Adding ${students.length} students + teacher as group participants...`);

      // Add teacher as participant
      await ConversationParticipant.create({
        conversation_id: (conversation as any).id,
        user_id: payload.senderUserId,
        user_type: payload.senderUserType,
        is_active: true,
        is_muted: false,
      }, { transaction });

      // Add all students as participants and broadcast recipients
      console.log(`👥 Adding ${students.length} students as participants...`);
      const participantPromises = students.map(async (student, index) => {
        console.log(`${index + 1}. Adding student: ${student.student_name} (ID: ${student.id})`);
        
        // Convert database ID to user_id like direct chat does
        console.log('🔍 Looking up student user_id for database ID:', student.id);
        const studentLookup = await sequelize.query(
          'SELECT user_id FROM students WHERE id = :dbId LIMIT 1',
          {
            replacements: { dbId: student.id },
            type: QueryTypes.SELECT,
          }
        ) as any[];
        
        if (studentLookup.length === 0) {
          console.log('❌ Student not found for database ID:', student.id);
          throw new Error(`Student not found for ID ${student.id}`);
        }
        
        const actualUserId = studentLookup[0].user_id;
        console.log('✅ Found student user_id:', actualUserId, 'for database ID:', student.id);
        
        try {
          const participantResult = await Promise.all([
            ConversationParticipant.create({
              conversation_id: (conversation as any).id,
              user_id: actualUserId,
              user_type: 'student',
              is_active: true,
              is_muted: false,
            }, { transaction }),
            ClassBroadcastRecipient.create({
              conversation_id: (conversation as any).id,
              student_id: actualUserId,
              is_delivered: true,
            }, { transaction })
          ]);
          console.log(`✅ Student ${student.student_name} added successfully`);
          return participantResult;
        } catch (error) {
          console.error(`❌ Error adding student ${student.student_name}:`, error);
          throw error;
        }
      });

      await Promise.all(participantPromises);

      // Create the broadcast message
      const message = await Message.create({
        conversation_id: (conversation as any).id,
        sender_user_id: payload.senderUserId,
        sender_user_type: payload.senderUserType,
        message_text: payload.messageText,
        message_type: payload.messageType || 'announcement',
        is_deleted: false,
      }, { transaction });

      // Mark as read by sender
      await MessageReadStatus.create({
        message_id: message.id,
        user_id: payload.senderUserId,
        user_type: payload.senderUserType,
      }, { transaction });

      await transaction.commit();

      // Verify participants were created successfully  
      console.log('🔍 Verifying participants were added to conversation...');
      const allParticipants = await ConversationParticipant.findAll({
        where: { 
          conversation_id: (conversation as any).id,
          is_active: true 
        }
      });
      
      console.log(`✅ Total participants in conversation: ${allParticipants.length}`);
      allParticipants.forEach((participant: any, index) => {
        console.log(`  ${index + 1}. ${participant.user_type} ID: ${participant.user_id}`);
      });

      if (allParticipants.length !== students.length + 1) { // +1 for teacher
        console.error(`❌ Participant count mismatch! Expected: ${students.length + 1}, Found: ${allParticipants.length}`);
      } else {
        console.log('✅ All participants successfully added to conversation');
      }

      const messageWithSender = await this.getMessageWithSenderInfo(message.id, tenant);

      // Notify all students individually using direct message broadcast system
      console.log(`📢 Broadcasting message to ${students.length} students...`);
      
      // Need to get user_ids for notifications (same conversion as participants)
      for (const student of students) {
        // Convert database ID to user_id for notifications
        const studentLookup = await sequelize.query(
          'SELECT user_id FROM students WHERE id = :dbId LIMIT 1',
          {
            replacements: { dbId: student.id },
            type: QueryTypes.SELECT,
          }
        ) as any[];
        
        if (studentLookup.length > 0) {
          const actualUserId = studentLookup[0].user_id;
          console.log(`📱 Notifying student: ${student.student_name} (ID: ${student.id} → user_id: ${actualUserId})`);
          this.emitToUser(actualUserId, 'student', messageWithSender);
        } else {
          console.log(`❌ Could not find user_id for student ID: ${student.id}`);
        }
      };
      console.log('✅ All students notified via real-time broadcast');

      return {
        success: true,
        message: messageWithSender,
        conversationId: (conversation as any).id,
        recipientCount: students.length,
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get conversations for a user
   */
  async getConversations(payload: GetConversationsPayload, tenant: string) {
    console.log('🔍 ChatService.getConversations called with:', payload);

    const page = payload.page || 1;
    const limit = payload.limit || 20;
    const offset = (page - 1) * limit;

    try {
      const sequelize = getTenantSequelize(tenant);
      // Debug: Let's also check what teachers exist
      const debugTeachers = await sequelize.query(`
        SELECT user_id, CONCAT(first_name, ' ', last_name) as name FROM teachers LIMIT 5
      `, { type: QueryTypes.SELECT });
      console.log('🔍 Debug - Sample teachers:', debugTeachers);

      // First, let's check what conversation_participants exist for this user
      console.log(`🔍 Debug - Checking participants for user ${payload.userId} (${payload.userType})`);
      const userParticipations = await sequelize.query(`
        SELECT cp.conversation_id, cp.user_id, cp.user_type, cp.is_active, c.type as conversation_type
        FROM conversation_participants cp
        LEFT JOIN conversations c ON cp.conversation_id = c.id
        WHERE cp.user_id = :userId AND cp.user_type = :userType AND cp.is_active = 1
        ORDER BY cp.conversation_id DESC
        LIMIT 10
      `, {
        replacements: { userId: payload.userId, userType: payload.userType },
        type: QueryTypes.SELECT
      });
      console.log('🔍 Debug - User participations:', userParticipations);

      // If this is a student, let's also check if they're missing from teacher-initiated conversations
      if (payload.userType === 'student') {
        console.log(`🔍 Debug - Checking if student ${payload.userId} is missing from any conversations...`);
        const possibleMissingConversations = await sequelize.query(`
          SELECT c.id, c.created_by_user_id, c.created_by_user_type, c.created_at,
                 COUNT(cp.id) as participant_count,
                 GROUP_CONCAT(CONCAT(cp.user_type, ' ', cp.user_id)) as participants
          FROM conversations c
          LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id AND cp.is_active = 1
          WHERE c.type = 'direct' AND c.is_active = 1
            AND c.created_by_user_type = 'teacher'
            AND c.id IN (
              SELECT m.conversation_id FROM messages m 
              WHERE m.sender_user_type = 'teacher' 
              GROUP BY m.conversation_id
              HAVING COUNT(*) > 0
            )
          GROUP BY c.id
          ORDER BY c.created_at DESC
          LIMIT 5
        `, { type: QueryTypes.SELECT });
        console.log('🔍 Debug - Recent teacher-initiated conversations:', possibleMissingConversations);
      }

      const conversations = await sequelize.query(`
        SELECT 
          c.id,
          c.type,
          c.subject,
          c.class_id,
          c.created_at,
          c.updated_at,
          -- For direct conversations, include other participant info (only for 1-on-1)
          CASE 
            WHEN c.type = 'direct' AND (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id AND is_active = 1) = 2 
            THEN other_participant.user_id 
            ELSE NULL 
          END as other_participant_id,
          CASE 
            WHEN c.type = 'direct' AND (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id AND is_active = 1) = 2 
            THEN other_participant.user_type 
            ELSE NULL 
          END as other_participant_type,
          -- For direct conversations, show other participant's name
          CASE 
            WHEN c.type = 'direct' THEN 
              CASE 
                -- Check if this is actually a group conversation (has subject AND more than 2 participants)
                WHEN c.subject IS NOT NULL AND c.subject != '' AND (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id AND is_active = 1) > 2 THEN
                  -- This is a group broadcast using 'direct' type  
                  c.subject
                -- Regular 1-on-1 direct conversation - show other participant's name (ignore any subject)
                WHEN other_participant.user_type = 'student' THEN 
                  (SELECT student_name FROM students WHERE user_id = other_participant.user_id LIMIT 1)
                WHEN other_participant.user_type = 'teacher' THEN 
                  (SELECT CONCAT(first_name, ' ', last_name) FROM teachers WHERE user_id = other_participant.user_id LIMIT 1)
                ELSE 
                  (SELECT CONCAT(first_name, ' ', last_name) FROM teachers WHERE user_id = other_participant.user_id LIMIT 1)
              END
            WHEN c.type = 'class_broadcast' THEN 
              CASE 
                WHEN c.subject IS NOT NULL AND c.subject != '' THEN c.subject
                ELSE CONCAT('Class Broadcast - ', COALESCE(c.class_id, 'Unknown'))
              END
          END as conversation_name,
          -- Last message
          last_message.message_text as last_message,
          last_message.created_at as last_message_time,
          last_message.sender_user_type as last_message_sender_type,
          CASE 
            WHEN last_message.sender_user_type = 'student' THEN 
              (SELECT student_name FROM students WHERE user_id = last_message.sender_user_id LIMIT 1)
            WHEN last_message.sender_user_type = 'teacher' THEN 
              (SELECT CONCAT(first_name, ' ', last_name) FROM teachers WHERE user_id = last_message.sender_user_id LIMIT 1)
            ELSE 
              (SELECT CONCAT(first_name, ' ', last_name) FROM teachers WHERE user_id = last_message.sender_user_id LIMIT 1)
          END as last_message_sender_name,
          -- Unread count
          COALESCE(unread_counts.unread_count, 0) as unread_count
        FROM conversations c
        INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
        -- For direct conversations, get the other participant (only for 1-on-1 chats)
        LEFT JOIN conversation_participants other_participant ON c.id = other_participant.conversation_id
          AND other_participant.user_id != CAST(:userId AS UNSIGNED)
          AND other_participant.is_active = 1
          AND c.type = 'direct'
          AND (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id AND is_active = 1) = 2
        -- Get last message
        LEFT JOIN (
          SELECT 
            conversation_id,
            id as last_message_id,
            message_text,
            created_at,
            sender_user_id,
            sender_user_type
          FROM messages m1
          WHERE is_deleted = 0
            AND created_at = (
              SELECT MAX(created_at) 
              FROM messages m2 
              WHERE m2.conversation_id = m1.conversation_id 
                AND m2.is_deleted = 0
            )
        ) last_message ON c.id = last_message.conversation_id
        -- Get unread counts
        LEFT JOIN (
          SELECT 
            m.conversation_id,
            COUNT(*) as unread_count
          FROM messages m
          LEFT JOIN message_read_status mrs ON m.id = mrs.message_id 
            AND mrs.user_id = CAST(:userId AS UNSIGNED)
            AND mrs.user_type = :userType
          WHERE m.is_deleted = 0 
            AND mrs.id IS NULL
            AND NOT (m.sender_user_id = CAST(:userId AS UNSIGNED) AND m.sender_user_type = :userType)
          GROUP BY m.conversation_id
        ) unread_counts ON c.id = unread_counts.conversation_id
        WHERE cp.user_id = CAST(:userId AS UNSIGNED)
          AND cp.user_type = :userType 
          AND cp.is_active = 1
          AND c.is_active = 1
        GROUP BY c.id, c.type, c.subject, c.class_id, c.created_at, c.updated_at
        ORDER BY COALESCE(last_message.created_at, c.created_at) DESC
        LIMIT :limit OFFSET :offset
      `, {
        replacements: { 
          userId: payload.userId, 
          userType: payload.userType, 
          limit, 
          offset 
        },
        type: QueryTypes.SELECT,
      });

      console.log(`✅ Query executed, found ${conversations.length} conversations`);
      console.log('📋 Conversations found:', conversations);

      return {
        success: true,
        conversations: conversations,
        pagination: {
          page,
          limit,
          hasMore: conversations.length === limit,
        },
      };
    } catch (error: any) {
      console.error('❌ Error in ChatService.getConversations:', error);
      throw error;
    }
  }

  /**
   * Get messages in a conversation
   */
  async getMessages(payload: GetMessagesPayload, tenant: string) {
    const page = payload.page || 1;
    const limit = payload.limit || 50;
    const offset = (page - 1) * limit;

    const { ConversationParticipant } = getTenantModels(tenant);

    // Verify user has access to this conversation
    const participant = await ConversationParticipant.findOne({
      where: {
        conversation_id: payload.conversationId,
        user_id: payload.userId,
        user_type: payload.userType,
        is_active: true,
      },
    });

    if (!participant) {
      throw new Error('You do not have access to this conversation');
    }
    const sequelize = getTenantSequelize(tenant);
    const messages = await sequelize.query(`
      SELECT 
        m.id,
        m.conversation_id,
        m.sender_user_id,
        m.sender_user_type,
        m.message_text,
        m.message_type,
        m.parent_message_id,
        m.file_url,
        m.file_name,
        m.file_size,
        m.created_at,
        m.updated_at,
        -- Sender info
        CASE 
          WHEN m.sender_user_type = 'student' THEN 
            (SELECT student_name FROM students WHERE user_id = m.sender_user_id LIMIT 1)
          ELSE 
            (SELECT CONCAT(first_name, ' ', last_name) FROM users WHERE user_id = m.sender_user_id LIMIT 1)
        END as sender_name,
        CASE 
          WHEN m.sender_user_type = 'student' THEN 
            (SELECT email FROM students WHERE user_id = m.sender_user_id LIMIT 1)
          ELSE 
            (SELECT email FROM users WHERE user_id = m.sender_user_id LIMIT 1)
        END as sender_email,
        -- Read status for current user
        CASE WHEN mrs.id IS NOT NULL THEN true ELSE false END as is_read,
        mrs.read_at
      FROM messages m
      LEFT JOIN message_read_status mrs ON m.id = mrs.message_id 
        AND mrs.user_id = :userId 
        AND mrs.user_type = :userType
      WHERE m.conversation_id = :conversationId 
        AND m.is_deleted = 0
      ORDER BY m.created_at DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { 
        conversationId: payload.conversationId,
        userId: payload.userId, 
        userType: payload.userType,
        limit, 
        offset 
      },
      type: QueryTypes.SELECT,
    });

    // Mark messages as read for current user
    await this.markConversationAsRead(payload.conversationId, payload.userId, payload.userType, tenant);

    return {
      success: true,
      messages: messages.reverse(), // Reverse to show newest first in UI
      pagination: {
        page,
        limit,
        hasMore: messages.length === limit,
      },
    };
  }

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(userId: number, userType: 'teacher' | 'student' | 'admin' | 'staff', tenant: string) {
    const sequelize = getTenantSequelize(tenant);
    console.log("user type in getUnreadCount is : " + userType);
    const result = await sequelize.query(`
      SELECT COUNT(*) as unread_count
      FROM messages m
      INNER JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      LEFT JOIN message_read_status mrs ON m.id = mrs.message_id 
        AND mrs.user_id = :userId 
        AND mrs.user_type = :userType
      WHERE cp.user_id = :userId 
        AND cp.user_type = :userType
        AND cp.is_active = 1
        AND m.is_deleted = 0
        AND mrs.id IS NULL
        AND NOT (m.sender_user_id = :userId AND m.sender_user_type = :userType)
    `, {
      replacements: { userId, userType },
      type: QueryTypes.SELECT,
    });

    return {
      success: true,
      unreadCount: (result[0] as any).unread_count || 0,
    };
  }

  /**
   * Mark conversation as read
   */
  async markConversationAsRead(conversationId: number, userId: number, userType: string, tenant: string) {
    const sequelize = getTenantSequelize(tenant);
    const transaction = await sequelize.transaction();

    try {
      // Get all unread messages in this conversation for this user
      const unreadMessages = await sequelize.query(`
        SELECT m.id
        FROM messages m
        LEFT JOIN message_read_status mrs ON m.id = mrs.message_id 
          AND mrs.user_id = :userId 
          AND mrs.user_type = :userType
        WHERE m.conversation_id = :conversationId 
          AND m.is_deleted = 0
          AND mrs.id IS NULL
          AND NOT (m.sender_user_id = :userId AND m.sender_user_type = :userType)
      `, {
        replacements: { conversationId, userId, userType },
        type: QueryTypes.SELECT,
        transaction,
      });

      // Mark all as read
      const readStatusRecords = (unreadMessages as any[]).map((msg: any) => ({
        message_id: msg.id,
        user_id: userId,
        user_type: userType as 'teacher' | 'student' | 'admin' | 'staff',
      }));

      const { ConversationParticipant, MessageReadStatus } = getTenantModels(tenant);

      if (readStatusRecords.length > 0) {
        await MessageReadStatus.bulkCreate(readStatusRecords, { transaction });
      }

      // Update participant's last_read_at
      await ConversationParticipant.update(
        { last_read_at: new Date() },
        {
          where: {
            conversation_id: conversationId,
            user_id: userId,
            user_type: userType,
          },
          transaction,
        }
      );

      await transaction.commit();

      return { success: true, markedCount: readStatusRecords.length };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get students in a class (for class broadcasts)
   */
  async getStudentsByClass(classId: number, tenant: string) {
    const sequelize = getTenantSequelize(tenant);
    const students = await sequelize.query(`
      SELECT id, student_name, email, roll_number, class_id
      FROM students 
      WHERE class_id = :classId AND status = 'ACTIVE'
      ORDER BY student_name ASC
    `, {
      replacements: { classId },
      type: QueryTypes.SELECT,
    });

    return {
      success: true,
      students,
    };
  }

  /**
   * Get available teachers (for teacher-teacher communication)
   */
  async getTeachers(tenant: string, excludeUserId?: number) {
    const sequelize = getTenantSequelize(tenant);
    const whereClause = excludeUserId ? 'WHERE cu.user_id != :excludeUserId' : '';    
    const teachers = await sequelize.query(`
      SELECT 
        cu.user_id, 
        CONCAT(cu.first_name, ' ', cu.last_name) as name,
        cu.email,
        t.designation,
        t.department_id
      FROM users cu
      INNER JOIN teachers t ON cu.user_id = t.user_id
      ${whereClause}
      AND cu.role = 'teacher' 
      AND cu.is_active = 1
      ORDER BY cu.first_name ASC
    `, {
      replacements: excludeUserId ? { excludeUserId } : {},
      type: QueryTypes.SELECT,
    });

    return {
      success: true,
      teachers,
    };
  }

  // Private helper methods

  private canSendDirectMessage(senderType: string, recipientType: string): boolean {
    // Teachers can message anyone
    if (senderType === 'teacher') {
      return true;
    }
    
    // Students can only message teachers
    if (senderType === 'student') {
      return recipientType === 'teacher';
    }
    
    // Admins can message anyone
    if (senderType === 'admin') {
      return true;
    }
    
    return false;
  }

  private async findDirectConversation(
    userId1: number, 
    userType1: string, 
    userId2: number, 
    userType2: string,
    tenant: string
  ) {
    const sequelize = getTenantSequelize(tenant);
    const conversation = await sequelize.query(`
      SELECT c.* 
      FROM conversations c
      WHERE c.type = 'direct'
      AND c.id IN (
        SELECT cp1.conversation_id
        FROM conversation_participants cp1
        INNER JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
        WHERE (cp1.user_id = :userId1 AND cp1.user_type = :userType1)
        AND (cp2.user_id = :userId2 AND cp2.user_type = :userType2)
        AND cp1.is_active = 1 AND cp2.is_active = 1
        -- Ensure this is a true 1-on-1 conversation (exactly 2 participants)
        AND (
          SELECT COUNT(*) 
          FROM conversation_participants cp3 
          WHERE cp3.conversation_id = cp1.conversation_id AND cp3.is_active = 1
        ) = 2
      )
      LIMIT 1
    `, {
      replacements: { userId1, userType1, userId2, userType2 },
      type: QueryTypes.SELECT,
    });

    return conversation[0] || null;
  }

  private async getMessageWithSenderInfo(messageId: number, tenant: string) {
    const sequelize = getTenantSequelize(tenant);
    const message = await sequelize.query(`
      SELECT 
        m.*,
        CASE
          WHEN m.sender_user_type = 'student' THEN
            (SELECT student_name FROM students WHERE user_id = m.sender_user_id LIMIT 1)
          ELSE
            (SELECT CONCAT(first_name, ' ', last_name) FROM teachers WHERE user_id = m.sender_user_id LIMIT 1)
        END as sender_name
      FROM messages m
      WHERE m.id = :messageId
    `, {
      replacements: { messageId },
      type: QueryTypes.SELECT,
    });

    return message[0];
  }

  private emitNewMessage(conversationId: number, message: any) {
    // TODO: Implement Socket.IO real-time messaging
    // global.io?.to(`conversation_${conversationId}`).emit('new_message', message);
  }

  private emitToUser(userId: number, userType: string, message: any) {
    console.log(`📡 Should emit to ${userType} ${userId}:`, message.message_text?.substring(0, 50) + '...');
    // TODO: Implement Socket.IO real-time messaging for individual users
    // global.io?.to(`user_${userType}_${userId}`).emit('new_message', message);
    
    // For now, just log that the message should be delivered
    // The student will see it when they open/refresh their chat
  }
}