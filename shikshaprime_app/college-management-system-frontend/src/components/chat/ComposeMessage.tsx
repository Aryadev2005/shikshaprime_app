"use client";
import React, { useState, useEffect } from 'react';
import { Search, Send, Users, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatAPI } from '../../hooks/useChatAPI';
import './ComposeMessage.css';

interface ComposeMessageProps {
  currentUser: any;
  onMessageSent: () => void;
  onCancel: () => void;
}

type ComposeMode = 'select' | 'direct' | 'class_broadcast';

interface Recipient {
  id: number;
  name: string;
  email?: string;
  type: 'teacher' | 'student';
  designation?: string;
  department_id?: number;
}

interface ClassOption {
  id: string; // Composite ID: programId-departmentId-academicYearId-classId
  name: string;
  code?: string;
  programId: string;
  departmentId: string;
  academicYearId: string;
  classId: string;
  students_count?: number;
}

export const ComposeMessage: React.FC<ComposeMessageProps> = ({
  currentUser,
  onMessageSent,
  onCancel
}) => {
  const [mode, setMode] = useState<ComposeMode>('select');
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassOption | null>(null);
  const [messageText, setMessageText] = useState('');
  const [subject, setSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const {
    sendDirectMessage,
    sendClassBroadcast,
    getTeachers,
    getStudentsByClass,
    getStudentsForChat,
    getTeacherClasses
  } = useChatAPI(currentUser?.user_id, currentUser?.role);

  // Load available recipients based on user role
  useEffect(() => {
    if (mode === 'direct') {
      loadRecipients();
    } else if (mode === 'class_broadcast') {
      loadClasses();
    }
  }, [mode]);

  const loadRecipients = async () => {
    setLoading(true);
    try {
      if (currentUser?.role === 'teacher') {
        console.log('🔍 Loading recipients for teacher...');
        
        // Fetch both teachers and students for teacher users
        const [teachersResult, studentsResult] = await Promise.all([
          getTeachers(),
          getStudentsForChat() // Simplified - no parameters needed
        ]);

        console.log('📊 Teachers result:', teachersResult);
        console.log('📊 Students result:', studentsResult);

        let allRecipients: Recipient[] = [];

        // Add teachers to recipient list
        if (teachersResult.success) {
          const teachersList = teachersResult.teachers.map((t: any) => ({
            id: t.user_id,
            name: t.name,
            email: t.email,
            type: 'teacher' as const,
            designation: t.designation,
            department_id: t.department_id
          }));
          allRecipients = [...allRecipients, ...teachersList];
          console.log('✅ Added teachers:', teachersList.length);
        }

        // Add students to recipient list
        if (studentsResult.success) {
          const studentsList = studentsResult.students.map((s: any) => ({
            id: s.id, // ✅ Use database id for messaging
            name: s.student_name,
            email: s.email,
            type: 'student' as const,
            department_id: s.department_id
          }));
          allRecipients = [...allRecipients, ...studentsList];
          console.log('✅ Added students:', studentsList.length);
        } else {
          console.error('❌ Failed to fetch students:', studentsResult.error);
        }

        console.log(`📝 Total recipients loaded: ${allRecipients.length} (${teachersResult.teachers?.length || 0} teachers, ${studentsResult.students?.length || 0} students)`);
        setRecipients(allRecipients);
        
      } else if (currentUser?.role === 'student') {
        console.log('🔍 Loading recipients for student (teachers only)...');
        
        // Students can only message teachers
        const teachersResult = await getTeachers();
        console.log('📊 Teachers result for student:', teachersResult);

        if (teachersResult.success) {
          const teachersList = teachersResult.teachers.map((t: any) => ({
            id: t.user_id,
            name: t.name,
            email: t.email,
            type: 'teacher' as const,
            designation: t.designation,
            department_id: t.department_id
          }));
          setRecipients(teachersList);
          console.log('✅ Added teachers for student:', teachersList.length);
        } else {
          console.error('❌ Failed to fetch teachers for student:', teachersResult.error);
        }
      }
    } catch (error) {
      console.error('Error loading recipients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    setLoading(true);
    try {
      console.log('🏫 Loading real teacher classes...');
      const result = await getTeacherClasses();
      
      if (result.success) {
        setClasses(result.classes || []);
        console.log(`✅ Loaded ${result.classes?.length || 0} classes from API`);
        
        // Fetch student counts for each class
        if (result.classes && result.classes.length > 0) {
          // Classes already have correct student counts from the API
          console.log(`📊 Setting ${result.classes.length} classes with student counts`);
          result.classes.forEach((cls: any) => {
            console.log(`  - ${cls.name}: ${cls.students_count} students`);
          });
          setClasses(result.classes);
        }
      } else {
        console.error('❌ Failed to load teacher classes:', result.error);
        setClasses([]);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipients = recipients.filter(recipient =>
    recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (recipient.email && recipient.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim()) {
      return; // Just return, no alert needed
    }
    
    if (sending)  {
      return; // Just return, no alert needed
    }

    setSending(true);
    console.log('🔄 Compose send button clicked!');

    try {
      if (mode === 'direct' && selectedRecipient) {
        console.log('📤 Sending direct message to:', selectedRecipient.name);
        
        const result = await sendDirectMessage({
          recipientUserId: selectedRecipient.id,
          recipientUserType: selectedRecipient.type,
          messageText: messageText.trim(),
          messageType: 'text'
        });

        if (result.success) {
          console.log('✅ Direct message sent successfully!');
          setMessageText('');
          onMessageSent();
        } else {
          const errorMsg = result.error || 'Failed to send direct message';
          console.error('❌ Failed to send direct message:', errorMsg);
          // Show error in console instead of alert
        }
      } else if (mode === 'class_broadcast' && selectedClass) {
        if (!subject.trim()) {
          return; // Just return, no alert needed
        }

        console.log('📢 Sending class broadcast to:', selectedClass.name);
        console.log('🔍 Selected class full data:', {
          programId: selectedClass.programId,
          departmentId: selectedClass.departmentId,
          academicYearId: selectedClass.academicYearId,
          classId: selectedClass.classId,
          students_count: selectedClass.students_count
        });
        
        const result = await sendClassBroadcast({
          programId: selectedClass.programId,
          departmentId: selectedClass.departmentId,
          academicYearId: selectedClass.academicYearId,
          classId: selectedClass.classId,
          subject: subject.trim(),
          messageText: messageText.trim(),
          messageType: 'announcement'
        });

        if (result.success) {
          setSubject('');
          setMessageText('');
          setSelectedClass(null);
          onMessageSent();
        } else {
          const errorMsg = result.error || 'Failed to send class broadcast';
          console.error('❌ Failed to send class broadcast:', errorMsg);
        }
      } else {
        return; // Just return, no alert needed
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error occurred';
      console.error('❌ Error sending message:', error);
      // Show error in console instead of alert
    } finally {
      setSending(false);
    }
  };

  const canSendClassBroadcast = currentUser?.role === 'teacher';

  if (mode === 'select') {
    return (
      <div className="compose-select-mode">
        <div className="compose-options">
          <button
            className="compose-option-btn"
            onClick={() => setMode('direct')}
          >
            <User size={24} />
            <div>
              <h4>Direct Message</h4>
              <p>{currentUser?.role === 'student' 
                ? "Send a private message to a teacher" 
                : "Send a private message to a teacher or student"}</p>
            </div>
          </button>

          {canSendClassBroadcast && (
            <button
              className="compose-option-btn"
              onClick={() => setMode('class_broadcast')}
            >
              <Users size={24} />
              <div>
                <h4>Class Broadcast</h4>
                <p>Send an announcement to all students in a class</p>
              </div>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (mode === 'direct') {
    return (
      <div className="compose-message">
        {!selectedRecipient ? (
          <div className="recipient-selection">
            <div className="search-container">
              <Search size={16} />
              <input
                type="text"
                placeholder={currentUser?.role === 'student' ? "Search teachers..." : "Search recipients..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {loading ? (
              <div className="loading-state">Loading recipients...</div>
            ) : (
              <div className="recipients-list">
                {filteredRecipients.map((recipient) => (
                  <div
                    key={`${recipient.type}-${recipient.id}`}
                    className="recipient-item"
                    onClick={() => setSelectedRecipient(recipient)}
                  >
                    <div className="recipient-avatar">
                      {recipient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div className="recipient-info">
                      <h4>{recipient.name}</h4>
                      <p>{recipient.email}</p>
                      {recipient.designation && (
                        <span className="recipient-designation">{recipient.designation}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="message-composition">
            <div className="selected-recipient">
              <div className="recipient-header">
                <button className="back-btn" onClick={() => setSelectedRecipient(null)}>
                  ←
                </button>
                <div className="recipient-info">
                  <h4>To: {selectedRecipient.name}</h4>
                  <p>{selectedRecipient.email}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSendMessage} className="message-form">
              <div className="message-input-container">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  className="message-textarea"
                  rows={6}
                  maxLength={5000}
                  required
                />
              </div>

              <div className="form-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={sending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!messageText.trim() || sending}
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  if (mode === 'class_broadcast') {
    return (
      <div className="compose-message">
        {!selectedClass ? (
          <div className="class-selection">
            <div className="search-container">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {loading ? (
              <div className="loading-state">Loading classes...</div>
            ) : filteredClasses.length === 0 ? (
              <div className="no-classes-state">
                <Users size={48} />
                <h3>No Classes Available</h3>
                <p>You don't have any classes assigned for broadcasting messages.</p>
                <p>Contact your administrator to get classes assigned to your account.</p>
              </div>
            ) : (
              <div className="classes-list">
                {filteredClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="class-item"
                    onClick={() => setSelectedClass(cls)}
                  >
                    <div className="class-avatar">
                      <Users size={20} />
                    </div>
                    <div className="class-info">
                      <h4>{cls.name}</h4>
                      <p>{cls.students_count || 0} students {cls.code ? `• ${cls.code}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="message-composition">
            <div className="selected-class">
              <div className="class-header">
                <button className="back-btn" onClick={() => setSelectedClass(null)}>
                  ←
                </button>
                <div className="class-info">
                  <h4>Broadcasting to: {selectedClass.name}</h4>
                  <p>{selectedClass.students_count || 0} students will receive this message</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSendMessage} className="message-form">
              <div className="form-field">
                <label htmlFor="subject">Subject *</label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter broadcast subject"
                  className="subject-input"
                  maxLength={255}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your announcement..."
                  className="message-textarea"
                  rows={6}
                  maxLength={5000}
                  required
                />
              </div>

              <div className="form-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={sending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!messageText.trim() || !subject.trim() || sending}
                >
                  {sending ? 'Broadcasting...' : 'Send Broadcast'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  return null;
};