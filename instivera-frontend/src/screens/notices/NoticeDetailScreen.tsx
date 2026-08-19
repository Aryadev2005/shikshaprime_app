import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TOKENS } from '../../theme/tokens';
import { useNoticeDetail } from '../../hooks/useNotices';
import { NoticesStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<NoticesStackParamList, 'NoticeDetail'>;

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

export const NoticeDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { id, title } = route.params;
  const { data, isLoading, isError } = useNoticeDetail(id);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={TOKENS.plum} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load notice</Text>
      </View>
    );
  }

  const date = formatDate(data.published_date ?? data.created_at);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={TOKENS.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date row */}
        {date ? (
          <View style={styles.dateRow}>
            <MaterialCommunityIcons name="calendar-outline" size={14} color={TOKENS.ink3} />
            <Text style={styles.dateText}>{date}</Text>
            {data.created_by ? (
              <>
                <View style={styles.dot} />
                <Text style={styles.dateText}>{data.created_by}</Text>
              </>
            ) : null}
          </View>
        ) : null}

        {/* Title */}
        <Text style={styles.title}>{data.title}</Text>

        {/* Audience badge */}
        {data.target_audience && data.target_audience !== 'ALL' ? (
          <View style={styles.audienceBadge}>
            <Text style={styles.audienceBadgeText}>
              {data.target_audience === 'TEACHER' ? 'Staff only' : 'Students only'}
            </Text>
          </View>
        ) : null}

        {/* Content */}
        {data.content ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <Text style={styles.sectionBody}>{data.content}</Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.emptyContent}>No additional details provided.</Text>
          </View>
        )}

        {/* Attachment */}
        {data.attachment ? (
          <TouchableOpacity
            style={styles.attachmentBtn}
            activeOpacity={0.8}
            onPress={() => Linking.openURL(data.attachment!)}
          >
            <MaterialCommunityIcons name="paperclip" size={18} color={TOKENS.plum} />
            <Text style={styles.attachmentBtnText}>View Attachment</Text>
            <MaterialCommunityIcons name="open-in-new" size={14} color={TOKENS.ink3} />
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.paper },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: TOKENS.ink3 },

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

  content: { padding: 20, paddingBottom: 60 },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dateText: { fontSize: 13, color: TOKENS.ink3 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: TOKENS.ink4 },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: TOKENS.ink,
    letterSpacing: -0.4,
    lineHeight: 28,
    marginBottom: 12,
  },

  audienceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: TOKENS.plumTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 20,
  },
  audienceBadgeText: { fontSize: 12, fontWeight: '600', color: TOKENS.plum },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: TOKENS.ink3,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.line2,
    paddingBottom: 8,
  },
  sectionBody: { fontSize: 15, color: TOKENS.ink2, lineHeight: 24 },
  emptyContent: { fontSize: 14, color: TOKENS.ink3, fontStyle: 'italic' },

  attachmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: TOKENS.plumTint,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: TOKENS.line,
  },
  attachmentBtnText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: TOKENS.plum,
  },
});
