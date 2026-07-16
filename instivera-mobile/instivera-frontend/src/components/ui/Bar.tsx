import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TOKENS } from '../../theme/tokens';

type Props = {
  value: number;
  tone?: 'plum' | 'coral' | 'green';
  height?: number;
};

const FILL_COLORS: Record<string, string> = {
  plum: TOKENS.plum,
  coral: TOKENS.coral,
  green: TOKENS.green,
};

export const Bar: React.FC<Props> = ({ value, tone = 'plum', height = 5 }) => {
  const fillColor = FILL_COLORS[tone] ?? TOKENS.plum;
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${pct}%`,
            height,
            borderRadius: height / 2,
            backgroundColor: fillColor,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: TOKENS.line2,
    overflow: 'hidden',
  },
  fill: {},
});
