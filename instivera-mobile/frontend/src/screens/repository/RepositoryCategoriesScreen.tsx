import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TOKENS } from '../../theme/tokens';
import { useRepositoryCategories } from '../../hooks/useRepository';
import { RepositoryCategory } from '../../types/repository';
import { RepositoryStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RepositoryStackParamList, 'RepositoryCategories'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const H_PAD = 20;
const GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - GAP) / 2;

// Cycle through a set of accent colors for visual variety
const ACCENT_COLORS = [
  TOKENS.plum,
  TOKENS.blue,
  TOKENS.green,
  TOKENS.coral,
  TOKENS.amber,
  TOKENS.plum700,
];
const accentFor = (index: number) => ACCENT_COLORS[index % ACCENT_COLORS.length];

// ─── Category card ────────────────────────────────────────────────────────────

const CategoryCard: React.FC<{
  item: RepositoryCategory;
  index: number;
  onPress: () => void;
}> = ({ item, index, onPress }) => {
  const accent = accentFor(index);

  return (
    <TouchableOpacity
      style={[styles.card, { width: CARD_WIDTH }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.cardIconWrap, { backgroundColor: accent + '18' }]}>
        <MaterialCommunityIcons name="folder-outline" size={28} color={accent} />
      </View>

      <Text style={styles.cardName} numberOfLines={2}>
        {item.name}
      </Text>

      {item.description ? (
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      <View style={[styles.fileBadge, { backgroundColor: accent + '18' }]}>
        <Text style={[styles.fileBadgeText, { color: accent }]}>
          {item.fileCount} {item.fileCount === 1 ? 'file' : 'files'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main screen ─────────────────────────────────────────────────────────────

export const RepositoryCategoriesScreen: React.FC<Props> = ({ navigation }) => {
  const { data, isLoading, isError, refetch, isFetching } = useRepositoryCategories();

  const categories: RepositoryCategory[] = data ?? [];

  const handleRefresh = useCallback(() => { refetch(); }, [refetch]);

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
        <Text style={styles.errorText}>Failed to load library</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        refreshing={isFetching && !isLoading}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          categories.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListHeaderComponent={
          <View style={styles.headerArea}>
            <Text style={styles.headerSuper}>Learning</Text>
            <Text style={styles.headerTitle}>Library</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bookshelf" size={52} color={TOKENS.line} />
            <Text style={styles.emptyText}>No categories yet</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <CategoryCard
            item={item}
            index={index}
            onPress={() =>
              navigation.navigate('RepositoryFiles', {
                categoryId: String(item.id),
                name: item.name,
              })
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
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
    paddingHorizontal: H_PAD,
    paddingBottom: 16,
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

  listContent: { paddingHorizontal: H_PAD },
  emptyContainer: { flex: 1, paddingHorizontal: H_PAD },
  row: { gap: GAP },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.line,
    padding: 16,
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: TOKENS.ink,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: TOKENS.ink3,
    lineHeight: 16,
    marginBottom: 10,
  },
  fileBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  fileBadgeText: { fontSize: 11, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: TOKENS.ink3 },
});
