import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Cinzel_400Regular, Cinzel_700Bold, Cinzel_900Black } from '@expo-google-fonts/cinzel';
import {
  EBGaramond_400Regular,
  EBGaramond_400Regular_Italic,
  EBGaramond_700Bold,
} from '@expo-google-fonts/eb-garamond';
import { View, StyleSheet } from 'react-native';

import { AuthProvider } from './src/hooks/useAuth';
import { AppNavigator } from './src/navigation';
import { Colors } from './src/theme/colors';

export default function App() {
  const [fontsLoaded] = useFonts({
    Cinzel_400Regular,
    Cinzel_700Bold,
    Cinzel_900Black,
    EBGaramond_400Regular,
    EBGaramond_400Regular_Italic,
    EBGaramond_700Bold,
  });

  // Show dark screen while fonts load — BootScreen itself handles the loading state
  if (!fontsLoaded) {
    return <View style={styles.splash} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: { flex: 1, backgroundColor: '#04040A' },
});
