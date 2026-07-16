import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/modules/chat.api';
import { CreateDirectPayload } from '../types/chat';

const CHAT_KEYS = {
  conversations: ['chat', 'conversations'] as const,
  messages: (conversationId: number) => ['chat', 'messages', conversationId] as const,
};

export const useConversations = () =>
  useQuery({
    queryKey: CHAT_KEYS.conversations,
    queryFn: chatApi.getConversations,
    staleTime: 30_000,
  });

export const useMessages = (conversationId: number) =>
  useQuery({
    queryKey: CHAT_KEYS.messages(conversationId),
    queryFn: () => chatApi.getMessages(conversationId),
    staleTime: 0,
    enabled: conversationId > 0,
  });

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      content,
    }: {
      conversationId: number;
      content: string;
    }) => chatApi.sendMessage(conversationId, content),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: CHAT_KEYS.messages(variables.conversationId),
      });
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.conversations });
    },
  });
};

export const useCreateDirect = () =>
  useMutation({
    mutationFn: (payload: CreateDirectPayload) => chatApi.createDirect(payload),
    onSuccess: () => {
      // Refresh conversation list after creating a new direct chat
    },
  });

export const useUserSearch = (query: string, role?: string) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  return useQuery({
    queryKey: ['chat', 'userSearch', debouncedQuery, role],
    queryFn: () => chatApi.searchUsers(debouncedQuery, role),
    enabled: debouncedQuery.length >= 2,
    staleTime: 60_000,
  });
};

export const useCreateDirectConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDirectPayload) => chatApi.createDirect(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.conversations });
    },
  });
};
