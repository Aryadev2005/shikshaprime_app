import { apiClient } from '../client';
import {
  Conversation,
  Message,
  CreateDirectPayload,
  UserSearchResult,
} from '../../types/chat';

const client = apiClient.getClient();

export const chatApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const res = await client.get('/chat/conversations');
    return res.data?.data ?? res.data ?? [];
  },

  createDirect: async (payload: CreateDirectPayload): Promise<Conversation> => {
    const res = await client.post('/chat/conversations/direct', payload);
    return res.data?.data ?? res.data;
  },

  createGroup: async (payload: { title: string; participantIds: number[] }): Promise<Conversation> => {
    const res = await client.post('/chat/conversations/group', payload);
    return res.data?.data ?? res.data;
  },

  getMessages: async (
    conversationId: number,
    page = 1,
    limit = 50,
  ): Promise<Message[]> => {
    const res = await client.get(
      `/chat/conversations/${conversationId}/messages`,
      { params: { page, limit } },
    );
    return res.data?.data ?? res.data ?? [];
  },

  sendMessage: async (conversationId: number, content: string): Promise<Message> => {
    const res = await client.post(`/chat/conversations/${conversationId}/messages`, {
      content,
    });
    return res.data?.data ?? res.data;
  },

  markAsRead: async (conversationId: number): Promise<void> => {
    await client.put(`/chat/conversations/${conversationId}/read`);
  },

  searchUsers: async (query: string, role?: string): Promise<UserSearchResult[]> => {
    const res = await client.get('/chat/users/search', { params: { q: query, ...(role ? { role } : {}) } });
    return res.data?.data ?? res.data ?? [];
  },
};
