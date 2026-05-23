"use client";
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Users, User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatAPI } from '../../hooks/useChatAPI';
import { MessageList } from './MessageList';
import { ConversationList } from './ConversationList';
import { ComposeMessage } from './ComposeMessage';
import './FloatingChatWidget.css';

interface FloatingChatWidgetProps {
  currentUser: {
    user_id: string;
    role: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

type ChatView = 'conversations' | 'messages' | 'compose';

export const FloatingChatWidget: React.FC<FloatingChatWidgetProps> = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ChatView>('conversations');
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  
  const {
    conversations,
    unreadCount,
    loading,
    fetchConversations,
    fetchUnreadCount,
    sendDirectMessage,
    sendClassBroadcast,
    setCurrentConversation,
    setAutoRefresh,
    autoRefreshEnabled
  } = useChatAPI(currentUser?.user_id, currentUser?.role);

  const chatWidgetRef = useRef<HTMLDivElement>(null);

  // Initial unread count fetch when component loads
  useEffect(() => {
    if (currentUser) {
      fetchUnreadCount();
    }
  }, [currentUser, fetchUnreadCount]);

  // Refresh conversations when widget opens
  useEffect(() => {
    if (isOpen && currentUser) {
      fetchConversations(1, 20, true, false); // Force refresh when widget opens, show loading (user action)
    }
  }, [isOpen, currentUser, fetchConversations]);

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatWidgetRef.current && !chatWidgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (!currentUser) return null;

  // Don't show chat for admin users as per requirements
  if (currentUser.role === 'admin') return null;

  const handleToggleChat = () => {
    const willBeOpen = !isOpen;
    setIsOpen(willBeOpen);
    
    if (willBeOpen) {
      // Opening chat widget
      setCurrentView('conversations');
      setSelectedConversation(null);
      setCurrentConversation(null);
      // Keep auto-refresh always enabled for real-time messaging
      // setAutoRefresh(true); // Remove this - let it stay enabled always
      // Refresh conversations when opening chat widget (show loading for user action)
      fetchConversations(1, 20, true, false); // Force refresh, not silent (show loading)
    } else {
      // Closing chat widget - but keep auto-refresh enabled for notifications
      setCurrentConversation(null);
    }
  };

  const handleSelectConversation = (conversation: any) => {
    setSelectedConversation(conversation);
    setCurrentView('messages');
    setCurrentConversation(conversation.id); // Enable auto-refresh for this conversation
    console.log('💬 Selected conversation:', conversation.id, '- Message auto-refresh enabled');
  };

  const handleBackToConversations = () => {
    setCurrentView('conversations');
    setSelectedConversation(null);
    setCurrentConversation(null); // Clear current conversation auto-refresh
    fetchConversations(1, 20, true, false); // Force refresh when returning, show loading (user action)
    console.log('🔙 Back to conversations - cleared auto-refresh target');
  };

  const handleOpenCompose = () => {
    setCurrentView('compose');
    setCurrentConversation(null); // Clear auto-refresh when composing
  };

  const handleMessageSent = () => {
    // Only navigate back to conversations if we're in compose mode (new message)
    if (currentView === 'compose') {
      setCurrentView('conversations');
      setSelectedConversation(null);
      setCurrentConversation(null);
    }
    
    // If we're in a conversation, stay in the conversation (like WhatsApp)
    // Just refresh the data in background
    setTimeout(() => {
      fetchConversations(1, 20, true, true); // Background refresh - silent, no loading indicator
      fetchUnreadCount();
    }, 300);
  };

  const getHeaderTitle = () => {
    switch (currentView) {
      case 'messages':
        return selectedConversation?.conversation_name || 'Messages';
      case 'compose':
        return 'New Message';
      default:
        return 'Messages';
    }
  };

  const canComposeMessage = () => {
    // Teachers can compose messages to anyone
    // Students can compose messages to teachers
    return currentUser.role === 'teacher' || currentUser.role === 'student';
  };

  return (
    <div className="floating-chat-widget" ref={chatWidgetRef}>
      {/* Chat Toggle Button */}
      <button
        className={`chat-toggle-btn ${isOpen ? 'active' : ''}`}
        onClick={handleToggleChat}
        title="Messages"
      >
        <MessageCircle size={24} />
        {unreadCount > 0 && (
          <span className="chat-unread-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="header-content">
              {currentView !== 'conversations' && (
                <button 
                  className="back-btn"
                  onClick={handleBackToConversations}
                >
                  ←
                </button>
              )}
              <h3 className="header-title">{getHeaderTitle()}</h3>
              <div className="header-actions">
                {currentView === 'conversations' && canComposeMessage() && (
                  <button 
                    className="compose-btn"
                    onClick={handleOpenCompose}
                    title="New Message"
                  >
                    <Users size={18} />
                  </button>
                )}
                <button 
                  className="close-btn"
                  onClick={handleToggleChat}
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="chat-content">
            {currentView === 'conversations' && (
              <>
                {console.log('💬 FloatingChatWidget: Rendering ConversationList with:')}
                {console.log('  - conversations:', conversations)}
                {console.log('  - loading:', loading)}
                {console.log('  - currentUser:', currentUser)}
                <ConversationList
                  conversations={conversations}
                  loading={loading}
                  onSelectConversation={handleSelectConversation}
                  currentUser={currentUser}
                />
              </>
            )}
            
            {currentView === 'messages' && selectedConversation && (
              <MessageList
                conversation={selectedConversation}
                currentUser={currentUser}
                onMessageSent={handleMessageSent}
              />
            )}
            
            {currentView === 'compose' && (
              <ComposeMessage
                currentUser={currentUser}
                onMessageSent={handleMessageSent}
                onCancel={handleBackToConversations}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingChatWidget;