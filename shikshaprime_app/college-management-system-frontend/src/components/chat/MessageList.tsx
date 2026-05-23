"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { useChatAPI } from '../../hooks/useChatAPI';
import { Button } from '@/components/ui/button';
import './MessageList.css';

interface Message {
  id: number;
  sender_user_id: number;
  sender_user_type: string;
  sender_name: string;
  message_text: string;
  message_type: string;
  created_at: string;
  is_read: boolean;
}

interface MessageListProps {
  conversation: any;
  currentUser: any;
  onMessageSent: () => void;
}

const formatMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } else if (diffDays === 1) {
    return 'Yesterday ' + date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
};

const getInitials = (name: string): string => {
  if (!name) return '?';
  const words = name.split(' ').filter(word => word.length > 0);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name[0].toUpperCase();
};

export const MessageList: React.FC<MessageListProps> = ({
  conversation,
  currentUser,
  onMessageSent
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    currentMessages,
    fetchMessages,
    markConversationAsRead,
    sendDirectMessage,
    loading
  } = useChatAPI(currentUser?.user_id, currentUser?.role);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversation?.id) {
      fetchMessages(conversation.id, 1, 50, false); // Show loading when user opens conversation
    }
  }, [conversation?.id, fetchMessages]);

  // Mark conversation as read when messages are loaded
  useEffect(() => {
    if (conversation?.id && currentMessages.length > 0) {
      markConversationAsRead(conversation.id);
    }
  }, [conversation?.id, currentMessages.length, markConversationAsRead]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) {
      return; // Just return, no alert needed
    }
    
    if (sending) {
      return; // Just return, no alert needed
    }

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX
    setSending(true);

    try {
      if (conversation.type === 'direct') {
        // Get the other participant from conversation data
        if (!conversation.other_participant_id || !conversation.other_participant_type) {
          const errorMsg = 'No recipient information found in conversation data';
          console.error('❌', errorMsg);
          // Re-add message to input on error
          setNewMessage(messageText);
          return;
        }

        console.log('📤 Sending direct message to:', {
          recipientId: conversation.other_participant_id,
          recipientType: conversation.other_participant_type,
          messageText
        });

        const result = await sendDirectMessage({
          recipientUserId: conversation.other_participant_id,
          recipientUserType: conversation.other_participant_type,
          messageText,
          messageType: 'text',
          conversationId: conversation.id // Pass conversation ID for optimistic updates
        });

        if (result.success) {
          console.log('✅ Message sent successfully!');
          // No need to manually refresh messages - optimistic update handles it
          onMessageSent();
        } else {
          const errorMsg = result.error || 'Failed to send message';
          console.error('❌ Failed to send message:', errorMsg);
          // Re-add message to input on error
          setNewMessage(messageText);
        }
      } else {
        // Re-add message to input
        setNewMessage(messageText);
      }
      // Note: Class broadcasts should be sent from compose view, not here
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error occurred';
      console.error('❌ Error sending message:', error);
      // Re-add message to input on error
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const isCurrentUser = (message: Message) => {
    return message.sender_user_id.toString() === currentUser?.user_id.toString() && 
           message.sender_user_type === currentUser?.role;
  };

  if (loading && currentMessages.length === 0) {
    return (
      <div className="message-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="message-list-container">
      {/* Messages */}
      <div className="message-list">
        {currentMessages.length === 0 ? (
          <div className="message-list-empty">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          currentMessages.map((message, index) => {
            const isOwn = isCurrentUser(message);
            const showAvatar = !isOwn && (
              index === 0 || 
              !isCurrentUser(currentMessages[index - 1]) ||
              currentMessages[index - 1].sender_user_id !== message.sender_user_id
            );

            return (
              <div 
                key={message.id}
                className={`message-item ${isOwn ? 'own' : 'other'}`}
              >
                {/* Avatar for other users */}
                {showAvatar && (
                  <div className="message-avatar">
                    {getInitials(message.sender_name)}
                  </div>
                )}
                
                {/* Message bubble */}
                <div className="message-bubble-container">
                  {/* Sender name for group/class messages */}
                  {!isOwn && conversation.type === 'class_broadcast' && (
                    <div className="message-sender-name">
                      {message.sender_name}
                    </div>
                  )}
                  
                  {/* Message bubble */}
                  <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
                    {/* Special styling for announcements */}
                    {message.message_type === 'announcement' && (
                      <div className="message-type-indicator">
                        📢 Announcement
                      </div>
                    )}
                    {message.message_type === 'important' && (
                      <div className="message-type-indicator important">
                        ⚠️ Important
                      </div>
                    )}
                    
                    <p className="message-text">{message.message_text}</p>
                    
                    <div className="message-meta">
                      <span className="message-time">
                        {formatMessageTime(message.created_at)}
                      </span>
                      {isOwn && (
                        <span className={`message-status ${message.is_read ? 'read' : 'pending'}`}>
                          {message.is_read ? '✓✓' : '🕒'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Hide for read-only broadcast conversations */}
      {(() => {
        // Check if this is a broadcast conversation (has subject)
        const isBroadcast = conversation.subject && conversation.subject.trim() !== '';
        
        // Show input only for:
        // 1. Regular direct conversations (no subject)
        // 2. Non-broadcast conversations where user is teacher
        // Hide input for: All broadcast conversations (read-only for everyone)
        return !isBroadcast && (conversation.type === 'direct' || currentUser?.role === 'teacher');
      })() && (
        <form className="message-input-form" onSubmit={handleSendMessage}>
          <div className="message-input-container">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={
                conversation.type === 'class_broadcast' 
                  ? "Send message to class..."
                  : "Type a message..."
              }
              className="message-input"
              disabled={sending}
              maxLength={5000}
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!newMessage.trim() || sending}
              className="send-button"
            >
              {sending ? '...' : <Send size={16} />}
            </Button>
          </div>
        </form>
      )}

      {/* Read-only indicator for broadcast conversations */}
      {(() => {
        const isBroadcast = conversation.subject && conversation.subject.trim() !== '';
        return isBroadcast && (
          <div className="broadcast-info">
            <p>📢 This is a read-only class announcement. No replies are allowed.</p>
          </div>
        );
      })()}

      {/* Legacy info for old class broadcasts */}
      {conversation.type === 'class_broadcast' && currentUser?.role === 'student' && (
        <div className="broadcast-info">
          <p>📢 This is a class announcement. You can only read messages.</p>
        </div>
      )}
    </div>
  );
};