import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TOKENS } from '../../theme/tokens';

type Props = {
  title: string;
  sub?: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
};

export const TopBar: React.FC<Props> = ({ title, sub, onBack, trailing }) => (
  <View style={styles.row}>
    {onBack ? (
      <TouchableOpacity onPress={onBack} style={styles.sideSlot} hitSlop={8}>
        <MaterialCommunityIcons name="chevron-left" size={24} color={TOKENS.ink} />
      </TouchableOpacity>
    ) : (
      <View style={styles.sideSlot} />
    )}
    <View style={styles.center}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {sub ? (
        <Text style={styles.sub} numberOfLines={1}>
          {sub}
        </Text>
      ) : null}
    </View>
    <View style={styles.sideSlot}>{trailing ?? null}</View>
  </View>
);

const styles = StyleSheet.create({
  row: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  sideSlot: { width: 38, alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: TOKENS.ink },
  sub: { fontSize: 12, color: TOKENS.ink3, marginTop: 1 },
});
