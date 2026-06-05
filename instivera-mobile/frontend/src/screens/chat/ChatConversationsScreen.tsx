import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TOKENS } from '../../theme/tokens';
import { Avatar } from '../../components/ui';
import { useConversations } from '../../hooks/useChat';
import { Conversation } from '../../types/chat';
import { ChatStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ChatStackParamList, 'Conversations'>;

// ─── Active bubble ────────────────────────────────────────────────────────────

const ActiveBubble: React.FC<{
  name: string;
  online?: boolean;
  count?: number;
  isGroup?: boolean;
}> = ({ name, online, count, isGroup }) => {
  const initials = isGroup
    ? name.split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase()
    : name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <View style={styles.activeBubbleWrap}>
      <View style={[styles.activeBubbleRing, online && !isGroup && { borderColor: TOKENS.coral }]}>
        {isGroup ? (
          <View style={styles.groupBubble}>
            <Text style={styles.groupBubbleText}>{initials}</Text>
          </View>
        ) : (
          <Avatar name={name} size={49} />
        )}
        {online && !isGroup && <View style={styles.onlineDot} />}
        {count !== undefined && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{count}</Text>
          </View>
        )}
      </View>
      <Text style={styles.activeBubbleName} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
};

// ─── Chat row ─────────────────────────────────────────────────────────────────

const ChatRow: React.FC<{
  conversation: Conversation;
  onPress: () => void;
}> = ({ conversation, onPress }) => {
  const isGroup = conversation.type === 'GROUP';
  const hasUnread = conversation.unreadCount > 0;
  const participantName =
    conversation.title ??
    conversation.participants.find((p) => p.userType !== 'self')?.name ??
    'Unknown';

  const displayTime = (() => {
    try {
      const d = new Date(conversation.lastTime);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  })();

  return (
    <TouchableOpacity
      style={[styles.chatRow, hasUnread && styles.chatRowUnread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.chatAvatarWrap}>
        {conversation.isSystem ? (
          <View style={styles.systemAvatar}>
            <MaterialCommunityIcons name="wallet" size={20} color={TOKENS.coral} />
          </View>
        ) : isGroup ? (
          <View style={styles.groupAvatar}>
            <Text style={styles.groupAvatarText}>
              {participantName.split(' ').map((w) => w[0]).join('').slice(0, 2)}
            </Text>
          </View>
        ) : (
          <View style={{ position: 'relative' }}>
            <Avatar name={participantName} size={44} />
            {conversation.isOnline && <View style={styles.onlineDotSmall} />}
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.chatBody}>
        <View style={styles.chatNameRow}>
          <Text style={styles.chatName} numberOfLines={1}>
            {participantName}
          </Text>
          {conversation.isPinned && (
            <MaterialCommunityIcons name="pin" size={11} color={TOKENS.ink3} />
          )}
          {conversation.isMuted && (
            <MaterialCommunityIcons name="bell-off-outline" size={11} color={TOKENS.ink4} />
          )}
        </View>
        <Text style={styles.chatPreview} numberOfLines={1}>
          {conversation.lastMessage}
        </Text>
      </View>

      {/* Meta */}
      <View style={styles.chatMeta}>
        <Text style={styles.chatTime}>{displayTime}</Text>
        {hasUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{conversation.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── Fallback static conversations ────────────────────────────────────────────

const STATIC_CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    title: 'Class XII-A',
    type: 'GROUP',
    lastMessage: 'Mrs. Nair: Submission window extended to…',
    lastTime: new Date().toISOString(),
    unreadCount: 2,
    participants: [],
    isPinned: true,
  },
  {
    id: 2,
    title: null,
    type: 'DIRECT',
    lastMessage: 'Great work on yesterday\'s worksheet',
    lastTime: new Date().toISOString(),
    unreadCount: 1,
    participants: [{ userId: 1, userType: 'teacher', name: 'John Doe' }],
    isOnline: true,
  },
  {
    id: 3,
    title: null,
    type: 'DIRECT',
    lastMessage: 'see you at the library at 4',
    lastTime: new Date(Date.now() - 86400000).toISOString(),
    unreadCount: 0,
    participants: [{ userId: 2, userType: 'student', name: 'Riya Mukherjee' }],
  },
  {
    id: 4,
    title: 'Sports Squad',
    type: 'GROUP',
    lastMessage: 'Karan: who\'s in for tomorrow practice?',
    lastTime: new Date(Date.now() - 86400000).toISOString(),
    unreadCount: 0,
    participants: [],
    isMuted: true,
  },
  {
    id: 5,
    title: 'Admin · Fees',
    type: 'DIRECT',
    lastMessage: 'Q2 payment due in 18 days',
    lastTime: new Date(Date.now() - 172800000).toISOString(),
    unreadCount: 0,
    participants: [],
    isSystem: true,
  },
];

// ─── Main screen ─────────────────────────────────────────────────────────────

export const ChatConversationsScreen: React.FC<Props> = ({ navigation }) => {
  const { data, isLoading } = useConversations();
  const conversations: Conversation[] =
    (data && data.length > 0 ? data : STATIC_CONVERSATIONS);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          {totalUnread > 0 && (
            <Text style={styles.headerUnread}>{totalUnread} unread</Text>
          )}
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn}>
            <MaterialCommunityIcons name="magnify" size={17} color={TOKENS.ink} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.composeBtn}>
            <MaterialCommunityIcons name="pencil" size={17} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Active bubbles */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.activesRow}
        contentContainerStyle={styles.activesContent}
      >
        <ActiveBubble name="Class XII-A" isGroup count={42} />
        <ActiveBubble name="John Doe" online />
        <ActiveBubble name="P. Nair" />
        <ActiveBubble name="Karan V." online />
        <ActiveBubble name="Tara I." />
      </ScrollView>

      {/* Section header */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Recent</Text>
        <Text style={styles.sectionFilter}>Pinned · Class · DMs</Text>
      </View>

      {/* Conversation list */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={TOKENS.plum} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ChatRow
              conversation={item}
              onPress={() =>
                navigation.navigate('ChatRoom', {
                  conversationId: item.id,
                  name:
                    item.title ??
                    item.participants.find((p) => p.userType !== 'self')?.name ??
                    'Chat',
                })
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.paper },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 8,
  },
  headerUnread: {
    fontSize: 11,
    color: TOKENS.ink3,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontFamily: 'InstrumentSerif',
    fontSize: 30,
    color: TOKENS.ink,
    letterSpacing: -0.5,
    lineHeight: 34,
    marginTop: 4,
  },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: TOKENS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composeBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: TOKENS.coral,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: TOKENS.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 3,
  },

  activesRow: { paddingTop: 18 },
  activesContent: { paddingHorizontal: 20, gap: 14 },
  activeBubbleWrap: { alignItems: 'center', gap: 6, width: 60 },
  activeBubbleRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'visible',
  },
  groupBubble: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: TOKENS.plum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupBubbleText: {
    fontFamily: 'InstrumentSerif',
    fontSize: 20,
    color: '#fff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: TOKENS.green,
    borderWidth: 2.5,
    borderColor: TOKENS.paper,
  },
  countBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: TOKENS.paper,
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  countBadgeText: { fontSize: 9, fontWeight: '700', color: TOKENS.plum },
  activeBubbleName: {
    fontSize: 11,
    fontWeight: '600',
    color: TOKENS.ink2,
    textAlign: 'center',
    maxWidth: 60,
  },

  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: TOKENS.ink },
  sectionFilter: { fontSize: 12, color: TOKENS.ink3 },

  listContent: { paddingHorizontal: 16, paddingBottom: 110, gap: 4 },

  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 16,
  },
  chatRowUnread: { backgroundColor: TOKENS.plumTint },
  chatAvatarWrap: { flexShrink: 0, position: 'relative' },
  systemAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: TOKENS.coralTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: TOKENS.plum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupAvatarText: {
    fontFamily: 'InstrumentSerif',
    fontSize: 18,
    color: '#fff',
  },
  onlineDotSmall: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: TOKENS.green,
    borderWidth: 2.5,
    borderColor: TOKENS.paper,
  },
  chatBody: { flex: 1, minWidth: 0 },
  chatNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chatName: { fontSize: 14, fontWeight: '600', color: TOKENS.ink, letterSpacing: -0.1 },
  chatPreview: { fontSize: 12.5, color: TOKENS.ink3, marginTop: 2 },
  chatMeta: { flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  chatTime: { fontSize: 10.5, color: TOKENS.ink3 },
  unreadBadge: {
    backgroundColor: TOKENS.coral,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  unreadBadgeText: { fontSize: 10.5, fontWeight: '700', color: '#fff' },
});
