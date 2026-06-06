import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TOKENS } from '../../theme/tokens';
import { useRepositoryFiles } from '../../hooks/useRepository';
import { repositoryApi } from '../../api/modules/repository.api';
import { RepositoryFile } from '../../types/repository';
import { RepositoryStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RepositoryStackParamList, 'RepositoryFiles'>;

// ─── File type icon ───────────────────────────────────────────────────────────

type IconConfig = {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
  bg: string;
};

const getFileIconConfig = (fileType: string | null): IconConfig => {
  const t = (fileType ?? '').toLowerCase();
  if (t.includes('pdf'))   return { name: 'file-pdf-box',      color: TOKENS.red,   bg: TOKENS.redTint };
  if (t.includes('video') || t.includes('mp4') || t.includes('mov'))
                           return { name: 'file-video-outline', color: TOKENS.blue,  bg: '#EAF2FD' };
  if (t.includes('image') || t.includes('jpg') || t.includes('jpeg') || t.includes('png'))
                           return { name: 'file-image-outline', color: TOKENS.green, bg: TOKENS.greenTint };
  if (t.includes('doc') || t.includes('word'))
                           return { name: 'file-word-outline',  color: TOKENS.blue,  bg: '#EAF2FD' };
  return                          { name: 'file-outline',       color: TOKENS.ink3,  bg: TOKENS.surface };
};

const formatDate = (dateStr: string): string => {
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

const formatSize = (kb: number | null): string => {
  if (kb == null) return '';
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
};

// ─── File row ─────────────────────────────────────────────────────────────────

const FileRow: React.FC<{ item: RepositoryFile }> = ({ item }) => {
  const cfg = getFileIconConfig(item.file_type);

  const handleOpen = () => {
    Linking.openURL(repositoryApi.getDownloadUrl(String(item.id)));
  };

  return (
    <TouchableOpacity style={styles.fileRow} onPress={handleOpen} activeOpacity={0.72}>
      <View style={[styles.fileIconWrap, { backgroundColor: cfg.bg }]}>
        <MaterialCommunityIcons name={cfg.name} size={24} color={cfg.color} />
      </View>

      <View style={styles.fileBody}>
        <Text style={styles.fileTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.fileMeta}>
          {item.file_size_kb != null && (
            <Text style={styles.fileMetaText}>{formatSize(item.file_size_kb)}</Text>
          )}
          {item.file_size_kb != null && item.created_at && (
            <View style={styles.metaDot} />
          )}
          {item.created_at && (
            <Text style={styles.fileMetaText}>{formatDate(item.created_at)}</Text>
          )}
        </View>
      </View>

      <MaterialCommunityIcons name="download-outline" size={20} color={TOKENS.ink3} />
    </TouchableOpacity>
  );
};

// ─── Main screen ─────────────────────────────────────────────────────────────

export const RepositoryFilesScreen: React.FC<Props> = ({ route, navigation }) => {
  const { categoryId, name } = route.params;
  const { data, isLoading, isError, refetch, isFetching } = useRepositoryFiles(categoryId);

  const files: RepositoryFile[] = data ?? [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={TOKENS.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {name}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={TOKENS.plum} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Failed to load files</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => String(item.id)}
          refreshing={isFetching && !isLoading}
          onRefresh={() => refetch()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={files.length === 0 ? styles.emptyContainer : styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="file-outline" size={48} color={TOKENS.line} />
              <Text style={styles.emptyText}>No files in this category</Text>
            </View>
          }
          renderItem={({ item }) => <FileRow item={item} />}
          ListFooterComponent={<View style={{ height: 60 }} />}
        />
      )}
    </View>
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.line,
    backgroundColor: TOKENS.paper,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: TOKENS.ink,
    textAlign: 'center',
    marginHorizontal: 8,
  },

  listContent: { paddingHorizontal: 20, paddingTop: 12 },
  emptyContainer: { flex: 1, paddingHorizontal: 20 },
  separator: { height: 10 },

  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TOKENS.line,
    padding: 14,
  },
  fileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fileBody: { flex: 1 },
  fileTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: TOKENS.ink,
    letterSpacing: -0.1,
    marginBottom: 4,
  },
  fileMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fileMetaText: { fontSize: 11, color: TOKENS.ink3 },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: TOKENS.ink4 },

  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: TOKENS.ink3 },
});
