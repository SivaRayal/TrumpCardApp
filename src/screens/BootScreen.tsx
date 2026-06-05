import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { getDb } from '../services/database';

const { width: W, height: H } = Dimensions.get('window');

interface Props {
  onReady: () => void;
}

export function BootScreen({ onReady }: Props) {
  const iconScale = useRef(new Animated.Value(0.55)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const glowInner = useRef(new Animated.Value(0)).current;
  const glowOuter = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.7)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Phase 1: Icon appears with slow zoom and glow
    Animated.sequence([
      Animated.parallel([
        Animated.timing(iconOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(iconScale, { toValue: 1.08, friction: 3.5, tension: 20, useNativeDriver: true }),
        Animated.timing(glowInner, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(glowOuter, { toValue: 0.7, duration: 1100, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.spring(ringScale, { toValue: 1, friction: 4, tension: 22, useNativeDriver: true }),
      ]),
      // Gentle settle
      Animated.spring(iconScale, { toValue: 1.0, friction: 7, tension: 35, useNativeDriver: true }),
      Animated.delay(200),
      // Logo reveal
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
      ]),
      // Tagline
      Animated.timing(taglineOpacity, { toValue: 1, duration: 600, delay: 100, useNativeDriver: true }),
      // Loading text
      Animated.timing(loadingOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Continuous glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();

    // Slow breathing zoom after initial zoom
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(iconScale, { toValue: 1.07, duration: 2800, useNativeDriver: true }),
          Animated.timing(iconScale, { toValue: 0.97, duration: 2800, useNativeDriver: true }),
        ])
      ).start();
    }, 2000);

    getDb().finally(() => {
      setTimeout(onReady, 4000);
    });
  }, []);

  const pulseRingOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.55],
  });
  const pulseRingScale = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1.18],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#04040A', '#08081A', '#100A08', '#04040A']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.33, 0.66, 1]}
      />

      {/* Outer soft glow halo */}
      <Animated.View style={[styles.glowOuter, { opacity: glowOuter }]} />

      {/* Inner glow */}
      <Animated.View style={[styles.glowInner, { opacity: glowInner }]} />

      {/* Pulsing ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            opacity: pulseRingOpacity,
            transform: [{ scale: pulseRingScale }],
          },
        ]}
      />

      {/* Static glow ring border */}
      <Animated.View style={[styles.glowRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />

      {/* App Icon */}
      <Animated.View
        style={[
          styles.iconContainer,
          {
            opacity: iconOpacity,
            transform: [{ scale: iconScale }],
          },
        ]}
      >
        <Image
          source={require('../../assets/appicon.png')}
          style={styles.icon}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <Text style={styles.logoText}>TRUMP</Text>
        <Text style={styles.logoAccent}>✦ CARD ✦</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={[styles.taglineContainer, { opacity: taglineOpacity }]}>
        <Text style={styles.tagline}>Your Daily Word of Power</Text>
      </Animated.View>

      {/* Loading */}
      <Animated.View style={[styles.loadingContainer, { opacity: loadingOpacity }]}>
        <Text style={styles.loadingText}>Shuffling the cosmos…</Text>
      </Animated.View>
    </View>
  );
}

const ICON_SIZE = Math.min(W, H) * 0.34;
const RING_SIZE = ICON_SIZE * 1.45;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#04040A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: RING_SIZE * 1.9,
    height: RING_SIZE * 1.9,
    borderRadius: RING_SIZE,
    backgroundColor: 'transparent',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 90,
    elevation: 0,
    top: H / 2 - RING_SIZE * 0.95,
    left: W / 2 - RING_SIZE * 0.95,
  },
  glowInner: {
    position: 'absolute',
    width: RING_SIZE * 0.95,
    height: RING_SIZE * 0.95,
    borderRadius: RING_SIZE,
    backgroundColor: 'transparent',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 45,
    elevation: 0,
    top: H / 2 - RING_SIZE * 0.475,
    left: W / 2 - RING_SIZE * 0.475,
  },
  pulseRing: {
    position: 'absolute',
    width: RING_SIZE * 1.3,
    height: RING_SIZE * 1.3,
    borderRadius: RING_SIZE,
    borderWidth: 2,
    borderColor: Colors.gold,
    top: H / 2 - RING_SIZE * 0.65,
    left: W / 2 - RING_SIZE * 0.65,
  },
  glowRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
    borderColor: Colors.goldDark,
    top: H / 2 - RING_SIZE / 2,
    left: W / 2 - RING_SIZE / 2,
  },
  iconContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE * 0.2,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    zIndex: 10,
  },
  logoText: {
    fontFamily: Typography.displayBlack,
    fontSize: 48,
    color: Colors.goldBright ?? Colors.gold,
    letterSpacing: 12,
    textShadowColor: Colors.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  logoAccent: {
    fontFamily: Typography.displayBold,
    fontSize: 17,
    color: Colors.gold,
    letterSpacing: 8,
    marginTop: -4,
  },
  taglineContainer: {
    marginTop: 12,
    zIndex: 10,
  },
  tagline: {
    fontFamily: Typography.serifItalic,
    fontSize: 15,
    color: Colors.textSecondary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 60,
    zIndex: 10,
  },
  loadingText: {
    fontFamily: Typography.serif,
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});
