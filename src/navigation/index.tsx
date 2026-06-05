import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useDaily } from '../hooks/useDaily';
import { BootScreen } from '../screens/BootScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { CardSelectionScreen } from '../screens/CardSelectionScreen';
import { CardRevealScreen } from '../screens/CardRevealScreen';
import { WallpaperScreen } from '../screens/WallpaperScreen';
import { Colors } from '../theme/colors';

type Screen =
  | 'boot'
  | 'login'
  | 'register'
  | 'cardSelection'
  | 'cardReveal'
  | 'wallpaper';

interface DailyData {
  cardIndex: number;
  quote: string;
}

export function AppNavigator() {
  const { user, loading: authLoading } = useAuth();
  const { checkToday } = useDaily();

  const [screen, setScreen] = useState<Screen>('boot');
  const [bootDone, setBootDone] = useState(false);
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [alreadyRevealed, setAlreadyRevealed] = useState(false);

  // After boot, determine what screen to show
  const handleBootReady = () => {
    setBootDone(true);
  };

  useEffect(() => {
    if (!bootDone || authLoading) return;

    if (!user) {
      setScreen('login');
      return;
    }

    // User is logged in — check if they already picked today
    checkToday().then(result => {
      if (result) {
        setDailyData({ cardIndex: result.selection.card_index, quote: result.quote });
        setAlreadyRevealed(true);
        setScreen('cardReveal');
      } else {
        setScreen('cardSelection');
      }
    });
  }, [bootDone, authLoading, user]);

  const handleLogin = () => {
    // After login, re-check via useEffect trigger (user will update)
    // The effect above handles this
  };

  const handleCardSelected = (cardIndex: number, quote: string) => {
    setDailyData({ cardIndex, quote });
    setAlreadyRevealed(false); // fresh pick — show flip animation
    setScreen('cardReveal');
  };

  const handleGoWallpaper = () => setScreen('wallpaper');

  const handleBackToReveal = () => setScreen('cardReveal');

  const handleBackToSelection = () => setScreen('cardSelection');

  if (authLoading && bootDone) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  switch (screen) {
    case 'boot':
      return <BootScreen onReady={handleBootReady} />;
    case 'login':
      return (
        <LoginScreen
          onLogin={handleLogin}
          onRegister={() => setScreen('register')}
        />
      );
    case 'register':
      return (
        <RegisterScreen
          onRegister={handleLogin}
          onBack={() => setScreen('login')}
        />
      );
    case 'cardSelection':
      return (
        <CardSelectionScreen
          onCardSelected={handleCardSelected}
          todayCard={dailyData?.cardIndex ?? null}
          todayQuote={dailyData?.quote ?? null}
        />
      );
    case 'cardReveal':
      return dailyData ? (
        <CardRevealScreen
          cardIndex={dailyData.cardIndex}
          quote={dailyData.quote}
          onWallpaper={handleGoWallpaper}
          onBack={handleBackToSelection}
          alreadyRevealed={alreadyRevealed}
        />
      ) : null;
    case 'wallpaper':
      return dailyData ? (
        <WallpaperScreen
          cardIndex={dailyData.cardIndex}
          quote={dailyData.quote}
          onBack={handleBackToReveal}
        />
      ) : null;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.backgroundDeep ?? Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
