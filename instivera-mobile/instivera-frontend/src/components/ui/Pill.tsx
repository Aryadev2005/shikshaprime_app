import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TOKENS } from '../../theme/tokens';

export type PillTone = 'plum' | 'green' | 'coral' | 'amber' | 'neutral';

type Props = {
  tone: PillTone;
  dot?: boolean;
  children: React.ReactNode;
};

const TONE_MAP: Record<PillTone, { bg: string; text: string }> = {
  plum: { bg: TOKENS.plumTint, text: TOKENS.plum },
  green: { bg: TOKENS.greenTint, text: TOKENS.green },
  coral: { bg: TOKENS.coralTint, text: TOKENS.coral },
  amber: { bg: TOKENS.amberTint, text: '#A07015' },
  neutral: { bg: 'rgba(255,255,255,0.12)', text: 'rgba(255,255,255,0.85)' },
};

export const Pill: React.FC<Props> = ({ tone, dot, children }) => {
  const { bg, text } = TONE_MAP[tone];
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      {dot && <View style={[styles.dot, { backgroundColor: text }]} />}
      <Text style={[styles.text, { color: text }]}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 5,
  },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  text: { fontSize: 11, fontWeight: '600' },
});
