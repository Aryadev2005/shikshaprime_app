import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TOKENS } from '../../theme/tokens';
import { useInstitutions } from '../../hooks/useInstitutions';
import { Institution } from '../../api/modules/institutions.api';
import { useAuthStore } from '../../store/authStore';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'SelectInstitution'>;

export const SelectInstitutionScreen: React.FC<Props> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const { data: institutions, isLoading, isError, refetch } = useInstitutions();
  const setSelectedInstitution = useAuthStore((s) => s.setSelectedInstitution);

  const filtered = (institutions ?? []).filter((i) =>
    i.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const handleSelect = async (institution: Institution) => {
    // Persist immediately (not just on login submit) so any pre-login flow
    // that reads the stored tenant — e.g. "Track existing application" —
    // has a valid x-tenant to send.
    await setSelectedInstitution({
      tenant: institution.slug,
      name: institution.name,
      type: institution.type,
    });
    navigation.navigate('Login', {
      tenant: institution.slug,
      institutionName: institution.name,
      institutionType: institution.type,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>INSTIVERA</Text>
        <Text style={styles.subtitle}>Select your institution</Text>
      </View>

      <View style={styles.searchWrap}>
        <MaterialCommunityIcons name="magnify" size={18} color={TOKENS.ink3} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search institutions…"
          placeholderTextColor={TOKENS.ink3}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={TOKENS.plum} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Failed to load institutions</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="school-outline" size={48} color={TOKENS.line} />
          <Text style={styles.emptyText}>No institutions found</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => handleSelect(item)} activeOpacity={0.7}>
              <View style={styles.rowIcon}>
                <MaterialCommunityIcons
                  name={item.type === 'school' ? 'school' : 'town-hall'}
                  size={22}
                  color={TOKENS.coral}
                />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowType}>{item.type === 'school' ? 'School' : 'College'}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={TOKENS.ink3} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: TOKENS.plumTint },
  header: { alignItems: 'center', paddingTop: 32, paddingBottom: 20 },
  title: { fontSize: 32, fontWeight: '700', color: TOKENS.plum, marginBottom: 8 },
  subtitle: { fontSize: 14, color: TOKENS.ink3 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: TOKENS.paper,
    borderWidth: 1,
    borderColor: TOKENS.line,
  },
  searchInput: { flex: 1, fontSize: 15, color: TOKENS.ink },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorText: { fontSize: 15, color: TOKENS.ink3 },
  retryBtn: { backgroundColor: TOKENS.plum, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: TOKENS.paper, fontWeight: '600' },
  emptyText: { fontSize: 15, color: TOKENS.ink3 },

  listContent: { paddingHorizontal: 24, paddingBottom: 40, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TOKENS.paper,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: TOKENS.coralTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '600', color: TOKENS.ink },
  rowType: { fontSize: 12, color: TOKENS.ink3, marginTop: 2 },
});
