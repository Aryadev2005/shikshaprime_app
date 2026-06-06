import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TOKENS } from '../../theme/tokens';
import { Avatar } from '../../components/ui';
import { useUserSearch, useCreateDirectConversation } from '../../hooks/useChat';
import { UserSearchResult } from '../../types/chat';
import { ChatStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ChatStackParamList, 'NewConversation'>;

const RoleBadge: React.FC<{ role: 'student' | 'teacher' }> = ({ role }) => (
  <View style={[styles.badge, role === 'teacher' ? styles.badgeTeacher : styles.badgeStudent]}>
    <Text style={[styles.badgeText, role === 'teacher' ? styles.badgeTextTeacher : styles.badgeTextStudent]}>
      {role === 'teacher' ? 'Teacher' : 'Student'}
    </Text>
  </View>
);

const UserRow: React.FC<{ user: UserSearchResult; onPress: () => void; loading: boolean }> = ({
  user,
  onPress,
  loading,
}) => (
  <TouchableOpacity style={styles.userRow} onPress={onPress} activeOpacity={0.7} disabled={loading}>
    <Avatar name={user.name} size={44} />
    <View style={styles.userInfo}>
      <Text style={styles.userName}>{user.name}</Text>
      <RoleBadge role={user.role} />
    </View>
    {loading ? (
      <ActivityIndicator size="small" color={TOKENS.plum} />
    ) : (
      <MaterialCommunityIcons name="chevron-right" size={18} color={TOKENS.ink3} />
    )}
  </TouchableOpacity>
);

export const NewConversationScreen: React.FC<Props> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [startingFor, setStartingFor] = useState<number | null>(null);

  const { data: users, isFetching } = useUserSearch(query);
  const createDirect = useCreateDirectConversation();

  const handleSelectUser = (user: UserSearchResult) => {
    setStartingFor(user.id);
    createDirect.mutate(
      { targetUserId: user.id, targetUserType: user.role },
      {
        onSuccess: (conversation: any) => {
          setStartingFor(null);
          const convId: number = conversation?.id ?? conversation?.conversation_id;
          const name: string = conversation?.title ?? user.name;
          navigation.replace('ChatRoom', { conversationId: convId, name });
        },
        onError: () => {
          setStartingFor(null);
          Alert.alert('Error', 'Could not start conversation. Please try again.');
        },
      }
    );
  };

  const showEmpty = query.length >= 2 && !isFetching && (!users || users.length === 0);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={TOKENS.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Message</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Search input */}
      <View style={styles.searchWrap}>
        <MaterialCommunityIcons name="magnify" size={18} color={TOKENS.ink3} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          placeholderTextColor={TOKENS.ink4}
          value={query}
          onChangeText={setQuery}
          autoFocus
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={16} color={TOKENS.ink3} />
          </TouchableOpacity>
        )}
      </View>

      {/* Hint */}
      {query.length > 0 && query.length < 2 && (
        <Text style={styles.hint}>Type at least 2 characters to search</Text>
      )}

      {/* Results */}
      {isFetching && query.length >= 2 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={TOKENS.plum} />
        </View>
      ) : showEmpty ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="account-search-outline" size={48} color={TOKENS.ink4} />
          <Text style={styles.emptyText}>No users found</Text>
        </View>
      ) : (
        <FlatList
          data={users ?? []}
          keyExtractor={(item) => `${item.role}-${item.id}`}
          renderItem={({ item }) => (
            <UserRow
              user={item}
              onPress={() => handleSelectUser(item)}
              loading={startingFor === item.id}
            />
          )}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.paper },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontFamily: 'InstrumentSerif',
    fontSize: 22,
    color: TOKENS.ink,
    letterSpacing: -0.3,
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: TOKENS.line,
    gap: 8,
  },
  searchIcon: { flexShrink: 0 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: TOKENS.ink,
  },

  hint: { fontSize: 12, color: TOKENS.ink3, marginHorizontal: 20, marginTop: 6 },

  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 110, gap: 2 },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontSize: 14, fontWeight: '600', color: TOKENS.ink, letterSpacing: -0.1 },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeTeacher: { backgroundColor: TOKENS.plumTint },
  badgeStudent: { backgroundColor: TOKENS.coralTint },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextTeacher: { color: TOKENS.plum },
  badgeTextStudent: { color: TOKENS.coral },

  emptyText: { fontSize: 14, color: TOKENS.ink3, fontWeight: '500' },
});
