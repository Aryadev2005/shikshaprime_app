import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TOKENS } from '../../theme/tokens';
import { useNoticeList } from '../../hooks/useNotices';
import { Notice } from '../../api/modules/notice.api';
import { NoticesStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<NoticesStackParamList, 'NoticeList'>;

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

// ─── Notice card ─────────────────────────────────────────────────────────────

const NoticeCard: React.FC<{ item: Notice; onPress: () => void }> = ({ item, onPress }) => {
  const date = formatDate(item.published_date ?? item.created_at);
  const preview = item.content ?? '';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.72}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconWrap}>
          <MaterialCommunityIcons name="bulletin-board" size={18} color={TOKENS.plum} />
        </View>
        <View style={styles.cardMeta}>
          {date ? <Text style={styles.cardDate}>{date}</Text> : null}
          {item.attachment ? (
            <MaterialCommunityIcons name="paperclip" size={14} color={TOKENS.ink3} />
          ) : null}
        </View>
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </Text>

      {preview ? (
        <Text style={styles.cardPreview} numberOfLines={2}>
          {preview}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

// ─── Main screen ─────────────────────────────────────────────────────────────

export const NoticeListScreen: React.FC<Props> = ({ navigation }) => {
  const [page] = useState(1);
  const { data, isLoading, isError, refetch, isFetching } = useNoticeList(page);

  const notices: Notice[] = data?.notices ?? [];

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={TOKENS.plum} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load notices</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={notices}
        keyExtractor={(item) => String(item.id)}
        refreshing={isFetching && !isLoading}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={notices.length === 0 ? styles.emptyContainer : styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerArea}>
            <Text style={styles.headerSuper}>School</Text>
            <Text style={styles.headerTitle}>Notice Board</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bulletin-board" size={52} color={TOKENS.line} />
            <Text style={styles.emptyText}>No notices yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <NoticeCard
            item={item}
            onPress={() =>
              navigation.navigate('NoticeDetail', {
                id: String(item.id),
                title: item.title,
              })
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={<View style={{ height: 110 }} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.paper },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 16, color: TOKENS.ink3, marginBottom: 16 },
  retryBtn: {
    backgroundColor: TOKENS.plum,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: { color: TOKENS.paper, fontWeight: '600' },

  headerArea: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: TOKENS.paper,
  },
  headerSuper: {
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

  listContent: { paddingHorizontal: 20 },
  emptyContainer: { flex: 1, paddingHorizontal: 20 },

  separator: { height: 10 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.line,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: TOKENS.plumTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardDate: { fontSize: 12, color: TOKENS.ink3, fontWeight: '500' },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TOKENS.ink,
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  cardPreview: {
    fontSize: 13,
    color: TOKENS.ink3,
    lineHeight: 19,
  },

  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: TOKENS.ink3 },
});
