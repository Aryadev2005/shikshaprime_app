import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAppFonts } from './src/hooks/useFonts';
import { TOKENS } from './src/theme/tokens';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Mobile networks fail transiently; one silent retry beats an error screen.
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppInner() {
  const [fontsLoaded] = useAppFonts();

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: TOKENS.paper }}>
        <ActivityIndicator size="large" color={TOKENS.plum} />
      </View>
    );
  }

  return (
    <>
      <RootNavigator />
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  return (
    // React Navigation self-provides safe-area context via SafeAreaProviderCompat,
    // but screens use <SafeAreaView> outside navigators too — providing it once at
    // the root gives every consumer real insets from the first frame.
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppInner />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
