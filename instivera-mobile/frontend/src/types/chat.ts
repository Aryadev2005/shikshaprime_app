export interface Participant {
  userId: number;
  userType: string;
  name: string;
}

export interface Conversation {
  id: number;
  title: string | null;
  type: 'DIRECT' | 'GROUP';
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  participants: Participant[];
  isOnline?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  isSystem?: boolean;
}

export interface Message {
  id: number;
  content: string;
  senderId: number;
  senderType: string;
  senderName?: string;
  sentAt: string;
  isOwn: boolean;
  isVoice?: boolean;
  voiceDuration?: string;
}

export interface SendMessagePayload {
  conversationId: number;
  content: string;
}

export interface CreateDirectPayload {
  targetUserId: number;
  targetUserType: string;
}

export interface UserSearchResult {
  id: number;
  name: string;
  role: 'student' | 'teacher';
}
