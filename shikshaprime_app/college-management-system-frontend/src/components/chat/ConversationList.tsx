"use client";
import React from 'react';
import { MessageCircle, Clock, Users } from 'lucide-react';
import './ConversationList.css';

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

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  onSelectConversation: (conversation: Conversation) => void;
  currentUser: any;
}

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};

const getInitials = (name: string): string => {
  if (!name) return '?';
  const words = name.split(' ').filter(word => word.length > 0);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name[0].toUpperCase();
};

const getConversationIcon = (conversation: Conversation) => {
  // Check if this is a group conversation (has subject or multiple participants indicated)
  if (conversation.type === 'class_broadcast' || 
      (conversation.subject && conversation.subject.trim() !== '')) {
    return <Users size={16} />;
  }
  return null;
};

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  loading,
  onSelectConversation,
  currentUser
}) => { 

  if (loading) {
    return (
      <div className="conversation-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading conversations...</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    console.log('📋 ConversationList: Showing empty state');
    return (
      <div className="conversation-list-empty">
        <MessageCircle size={48} color="#ccc" />
        <h4>No conversations yet</h4>
        <p>
          {currentUser?.role === 'teacher' 
            ? 'Start a conversation with students or other teachers'
            : 'Your messages with teachers will appear here'
          }
        </p>
      </div>
    );
  }

  console.log('📋 ConversationList: Showing conversations list');
  return (
    <div className="conversation-list">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className="conversation-item"
          onClick={() => onSelectConversation(conversation)}
        >
          {/* Avatar */}
          <div className="conversation-avatar">
            {getConversationIcon(conversation) || getInitials(conversation.conversation_name)}
          </div>

          {/* Content */}
          <div className="conversation-details">
            <div className="conversation-header">
              <h4 className="conversation-name">
                {conversation.conversation_name}
              </h4>
              <div className="conversation-meta">
                {conversation.last_message_time && (
                  <span className="conversation-time">
                    {formatTime(conversation.last_message_time)}
                  </span>
                )}
                {conversation.unread_count > 0 && (
                  <span className="conversation-unread">
                    {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                  </span>
                )}
              </div>
            </div>
            
            {conversation.subject && (
              <p className="conversation-subject">
                📢 {conversation.subject}
              </p>
            )}
            
            {conversation.last_message && (
              <p className="conversation-preview">
                {conversation.last_message}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};