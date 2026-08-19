import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TOKENS } from '../../theme/tokens';

type Props = {
  name: string;
  size: number;
  ring?: boolean;
};

const BG_COLORS = [TOKENS.plum700, TOKENS.coral, TOKENS.green];

const getInitials = (name: string): string => {
  const words = name.trim().split(' ');
  if (words.length === 1) return (words[0][0] ?? '?').toUpperCase();
  return ((words[0][0] ?? '') + (words[words.length - 1][0] ?? '')).toUpperCase();
};

const getBgColor = (name: string): string => {
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return BG_COLORS[sum % 3];
};

export const Avatar: React.FC<Props> = ({ name, size, ring }) => {
  const initials = getInitials(name);
  const bg = getBgColor(name);
  const fontSize = Math.round(size * 0.38);

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderWidth: ring ? 1.5 : 0,
          borderColor: ring ? TOKENS.paper : 'transparent',
        },
      ]}
    >
      <Text style={[styles.text, { fontSize }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontWeight: '700' },
});
