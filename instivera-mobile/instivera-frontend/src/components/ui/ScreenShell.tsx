import React from 'react';
import { View, Platform, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TOKENS } from '../../theme/tokens';

type Props = {
  children: React.ReactNode;
  bg?: string;
  padTop?: number;
};

export const ScreenShell: React.FC<Props> = ({ children, bg = TOKENS.paper, padTop = 0 }) => {
  const topPad =
    padTop + (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0);
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: bg }]} edges={['bottom']}>
      <View style={[styles.inner, { paddingTop: topPad, backgroundColor: bg }]}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1 },
});
