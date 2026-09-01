import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TOKENS } from '../../theme/tokens';
import { Avatar } from '../../components/ui';
import { useMessages, useSendMessage } from '../../hooks/useChat';
import { Message } from '../../types/chat';
import { useAuthStore } from '../../store/authStore';
import { getSocket } from '../../lib/socket';
import { useQueryClient } from '@tanstack/react-query';
import { ChatStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ChatStackParamList, 'ChatRoom'>;

// ─── Message bubble ───────────────────────────────────────────────────────────

const MessageBubble: React.FC<{ msg: Message }> = ({ msg }) => {
  const timeLabel = (() => {
    try {
      return new Date(msg.sentAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  })();

  if (msg.isOwn) {
    return (
      <View style={styles.bubbleOwnWrap}>
        <View style={styles.bubbleOwn}>
          <Text style={styles.bubbleOwnText}>{msg.content}</Text>
        </View>
        <Text style={styles.bubbleTime}>{timeLabel}</Text>
      </View>
    );
  }

  return (
    <View style={styles.bubbleOtherWrap}>
      <Avatar name={msg.senderName ?? 'U'} size={28} />
      <View>
        <View style={styles.bubbleOther}>
          {msg.senderName && (
            <Text style={styles.bubbleSender}>{msg.senderName}</Text>
          )}
          <Text style={styles.bubbleOtherText}>{msg.content}</Text>
        </View>
        <Text style={[styles.bubbleTime, { alignSelf: 'flex-start', marginLeft: 4 }]}>
          {timeLabel}
        </Text>
      </View>
    </View>
  );
};

// ─── Main screen ─────────────────────────────────────────────────────────────

export const ChatRoomScreen: React.FC<Props> = ({ route, navigation }) => {
  const { conversationId, name } = route.params;
  const { token, tenant } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useMessages(conversationId);
  const { mutate: sendMsg } = useSendMessage();
  const [inputText, setInputText] = useState('');

  const flatListRef = useRef<FlatList>(null);

  // ─── Socket.io setup ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !tenant) return;
    const socket = getSocket(token, tenant);

    socket.emit('join_conversation', { conversationId, tenant });

    const handleNewMessage = () => {
      queryClient.invalidateQueries({
        queryKey: ['chat', 'messages', conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    };

    socket.on('new_message', handleNewMessage);

    // Leave this room but keep the shared connection alive — it is an app-wide
    // singleton, so disconnecting here also killed the conversation list's
    // live updates and forced a full reconnect on every room change.
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.emit('leave_conversation', { conversationId, tenant });
    };
  }, [conversationId, token, tenant, queryClient]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    sendMsg({ conversationId, content: text });
  };

  // Inverted FlatList: reverse the array so newest is rendered first (at bottom)
  const reversedMessages = messages ? [...messages].reverse() : [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={TOKENS.ink} />
          </TouchableOpacity>
          <Avatar name={name} size={34} />
          <View style={styles.headerCenter}>
            <Text style={styles.headerName} numberOfLines={1}>
              {name}
            </Text>
          </View>
          <TouchableOpacity hitSlop={8}>
            <MaterialCommunityIcons name="chat-outline" size={20} color={TOKENS.ink3} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={TOKENS.plum} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={reversedMessages}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <MessageBubble msg={item} />}
            inverted
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Type a message…"
              placeholderTextColor={TOKENS.ink3}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              multiline
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.paper },
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.line,
    backgroundColor: TOKENS.paper,
  },
  headerCenter: { flex: 1, minWidth: 0 },
  headerName: { fontSize: 16, fontWeight: '700', color: TOKENS.ink },

  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexDirection: 'column',
  },

  bubbleOwnWrap: { alignItems: 'flex-end', marginBottom: 4 },
  bubbleOwn: {
    backgroundColor: TOKENS.plum,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '75%',
  },
  bubbleOwnText: { color: '#fff', fontSize: 14, lineHeight: 20 },

  bubbleOtherWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  bubbleOther: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '75%',
    borderWidth: 1,
    borderColor: TOKENS.line,
  },
  bubbleSender: { fontSize: 11, fontWeight: '700', color: TOKENS.plum, marginBottom: 2 },
  bubbleOtherText: { color: TOKENS.ink, fontSize: 14, lineHeight: 20 },
  bubbleTime: { fontSize: 10.5, color: TOKENS.ink3, marginTop: 2, alignSelf: 'flex-end' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: TOKENS.paper,
    borderTopWidth: 1,
    borderTopColor: TOKENS.line,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: TOKENS.line,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  input: {
    fontSize: 14,
    color: TOKENS.ink,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TOKENS.coral,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: TOKENS.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  sendBtnDisabled: { opacity: 0.5 },
});
