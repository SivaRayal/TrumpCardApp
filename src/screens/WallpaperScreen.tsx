import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { buildDeck } from '../components/PlayingCard';

// Lazy load MediaLibrary - only available in native builds, not in Expo Go
let MediaLibrary: any = null;
try {
  MediaLibrary = require('expo-media-library');
} catch (e) {
  // MediaLibrary not available in Expo Go
}

const { width: W, height: H } = Dimensions.get('window');

// Wallpaper renders at phone screen proportions: 9:19.5 ≈ full-screen
const WP_W = 1080;
const WP_H = 1920;
const PREVIEW_W = W * 0.72;
const PREVIEW_H = PREVIEW_W * (WP_H / WP_W);

const CARD_W = PREVIEW_W * 0.58;
const CARD_H = CARD_W * 1.5;

interface Props {
  cardIndex: number;
  quote: string;
  onBack: () => void;
}

export function WallpaperScreen({ cardIndex, quote, onBack }: Props) {
  const deck = buildDeck();
  const card = deck[cardIndex] ?? deck[0];
  const isRed = ['♥', '♦'].includes(card.suit);

  const wallpaperRef = useRef<View>(null);
  const [generating, setGenerating] = useState(false);
  const [savedUri, setSavedUri] = useState<string | null>(null);
  const [mediaPermission, setMediaPermission] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const previewScale = useRef(new Animated.Value(0.85)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(previewScale, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]),
      Animated.timing(btnOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 2500, useNativeDriver: true }),
      ])
    ).start();

    // Request media permissions if available (not in Expo Go)
    if (MediaLibrary?.requestPermissionsAsync) {
      MediaLibrary.requestPermissionsAsync().then(({ granted }: any) => {
        setMediaPermission(granted);
      });
    }
  }, []);

  const captureWallpaper = async (): Promise<string | null> => {
    try {
      const uri = await captureRef(wallpaperRef, {
        format: 'jpg',
        quality: 1,
        result: 'tmpfile',
        width: WP_W,
        height: WP_H,
      });
      return uri;
    } catch (e) {
      console.error('Capture failed', e);
      return null;
    }
  };

  const handleSave = async () => {
    // Fallback to share if MediaLibrary not available (Expo Go)
    if (!MediaLibrary?.saveToLibraryAsync) {
      Alert.alert(
        'MediaLibrary Not Available',
        'Gallery save is not available in Expo Go. Please use "Share & Set as Wallpaper" instead, or build a native app with EAS.',
        [{ text: 'Share Instead', onPress: handleShare }, { text: 'Cancel', style: 'cancel' }]
      );
      return;
    }

    setGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const uri = await captureWallpaper();
    if (!uri) {
      setGenerating(false);
      Alert.alert('Error', 'Failed to generate wallpaper.');
      return;
    }
    setSavedUri(uri);

    if (!mediaPermission) {
      const { granted } = await MediaLibrary.requestPermissionsAsync();
      if (!granted) {
        setGenerating(false);
        Alert.alert('Permission Denied', 'Cannot save to gallery without permission.');
        return;
      }
      setMediaPermission(true);
    }

    try {
      await MediaLibrary.saveToLibraryAsync(uri);
      setGenerating(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✦ Wallpaper Saved ✦',
        'Your TrumpCard wallpaper has been saved to your gallery.',
        [{ text: 'Set as Wallpaper', onPress: handleShare }, { text: 'Done', style: 'cancel' }]
      );
    } catch (e) {
      setGenerating(false);
      Alert.alert('Error', 'Failed to save wallpaper.');
    }
  };

  const handleShare = async () => {
    let uri = savedUri;
    if (!uri) {
      setGenerating(true);
      uri = await captureWallpaper();
      setGenerating(false);
    }
    if (!uri) return;
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Set as Wallpaper',
      });
    } else {
      Alert.alert('Sharing not available on this device.');
    }
  };

  const glowShadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#050510', '#0A0520', '#150510', '#050510']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.3, 0.7, 1]}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Text style={styles.headerTitle}>Wallpaper Studio</Text>
          <Text style={styles.headerSub}>High-Quality Mobile Wallpaper</Text>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerSym}>✦</Text>
            <View style={styles.dividerLine} />
          </View>
        </Animated.View>

        {/* Wallpaper preview */}
        <Animated.View
          style={[
            styles.previewContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: previewScale }],
            },
          ]}
        >
          {/* Glow around preview */}
          <Animated.View style={[styles.previewGlow, { opacity: glowShadowOpacity }]} />

          {/* The actual wallpaper — captured via captureRef */}
          <View
            ref={wallpaperRef}
            style={[styles.wallpaperCanvas, { width: PREVIEW_W, height: PREVIEW_H }]}
          >
            {/* Background gradient */}
            <LinearGradient
              colors={['#050510', '#0F0825', '#200A30', '#0F0825', '#050510']}
              style={StyleSheet.absoluteFill}
              locations={[0, 0.25, 0.5, 0.75, 1]}
            />

            {/* Decorative top ornament */}
            <View style={styles.wpOrnamentTop}>
              <View style={styles.wpDividerLine} />
              <Text style={styles.wpOrnamentText}>✦ TRUMP CARD ✦</Text>
              <View style={styles.wpDividerLine} />
            </View>

            {/* Playing card */}
            <View style={styles.wpCardWrapper}>
              {/* Card glow */}
              <View style={[styles.wpCardGlow, { shadowColor: isRed ? Colors.crimson : Colors.gold }]} />

              {/* Card */}
              <View style={[styles.wpCard, { width: CARD_W, height: CARD_H }]}>
                <LinearGradient
                  colors={['#0D0D22', '#1A0A20', '#0A0D22']}
                  style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                />
                <View style={[styles.wpCardBorder, { borderColor: isRed ? Colors.crimson : Colors.gold }]} />
                <View style={[styles.wpCardInnerBorder, { borderColor: isRed ? Colors.crimsonLight : Colors.goldDark }]} />

                {/* Card value corners */}
                <View style={styles.wpCornerTL}>
                  <Text style={[styles.wpCornerVal, { color: isRed ? Colors.crimson : Colors.goldDark }]}>{card.value}</Text>
                  <Text style={[styles.wpCornerSuit, { color: isRed ? Colors.crimson : Colors.goldDark }]}>{card.suit}</Text>
                </View>

                {/* Big suit */}
                <Text style={[styles.wpCenterSuit, { color: isRed ? Colors.crimson : Colors.gold, opacity: 0.12 }]}>
                  {card.suit}
                </Text>

                {/* Quote */}
                <View style={styles.wpQuoteArea}>
                  <Text style={styles.wpQuoteOpen}>"</Text>
                  <Text style={styles.wpQuoteText}>{quote}</Text>
                  <Text style={styles.wpQuoteClose}>"</Text>
                </View>

                <View style={styles.wpCornerBR}>
                  <Text style={[styles.wpCornerVal, { color: isRed ? Colors.crimson : Colors.goldDark, transform: [{ rotate: '180deg' }] }]}>{card.value}</Text>
                  <Text style={[styles.wpCornerSuit, { color: isRed ? Colors.crimson : Colors.goldDark, transform: [{ rotate: '180deg' }] }]}>{card.suit}</Text>
                </View>
              </View>
            </View>

            {/* Quote below card */}
            <View style={styles.wpQuoteBelow}>
              <Text style={styles.wpQuoteBelowText}>{quote}</Text>
            </View>

            {/* Bottom ornament */}
            <View style={styles.wpOrnamentBottom}>
              <View style={styles.wpDividerLine} />
              <Text style={styles.wpDateText}>
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
              <View style={styles.wpDividerLine} />
            </View>
          </View>
        </Animated.View>

        {/* Action buttons */}
        <Animated.View style={[styles.actions, { opacity: btnOpacity }]}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={generating}
          >
            <LinearGradient
              colors={['#8B6914', '#C9A84C', '#FFD700', '#C9A84C', '#8B6914']}
              style={styles.saveBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {generating ? (
                <ActivityIndicator color={Colors.backgroundDeep} />
              ) : (
                <Text style={styles.saveBtnText}>✦ SAVE TO GALLERY ✦</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShare}
            activeOpacity={0.85}
            disabled={generating}
          >
            <View style={styles.shareBtnInner}>
              <Text style={styles.shareBtnText}>Share & Set as Wallpaper</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.wallpaperTip}>
            After saving, open your Gallery → Set as Wallpaper to apply as Lock Screen or Home Screen
          </Text>

          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.75}>
            <Text style={styles.backBtnText}>← Back to Card</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050510' },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  header: { alignItems: 'center', marginBottom: 24 },
  headerTitle: {
    fontFamily: Typography.displayBold,
    fontSize: Typography.xl,
    color: Colors.gold,
    letterSpacing: 5,
    textShadowColor: Colors.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  headerSub: {
    fontFamily: Typography.serifItalic,
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    letterSpacing: 1.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    width: 200,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.goldDark, opacity: 0.5 },
  dividerSym: { color: Colors.gold, fontSize: 10, marginHorizontal: 8 },
  previewContainer: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'visible',
  },
  previewGlow: {
    position: 'absolute',
    top: -15,
    left: -15,
    right: -15,
    bottom: -15,
    borderRadius: 35,
    backgroundColor: 'transparent',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 15,
  },
  wallpaperCanvas: {
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: PREVIEW_H * 0.05,
  },
  wpOrnamentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '85%',
    marginTop: PREVIEW_H * 0.02,
  },
  wpDividerLine: { flex: 1, height: 0.8, backgroundColor: Colors.goldDark, opacity: 0.6 },
  wpOrnamentText: {
    fontFamily: Typography.displayBold,
    fontSize: PREVIEW_W * 0.03,
    color: Colors.gold,
    letterSpacing: 3,
    marginHorizontal: 8,
  },
  wpCardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  wpCardGlow: {
    position: 'absolute',
    top: -30,
    left: -30,
    right: -30,
    bottom: -30,
    borderRadius: 50,
    backgroundColor: 'transparent',
    shadowOpacity: 0.9,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  wpCard: {
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  wpCardBorder: {
    position: 'absolute',
    top: 5, left: 5, right: 5, bottom: 5,
    borderWidth: 1.5,
    borderRadius: 12,
    opacity: 0.8,
  },
  wpCardInnerBorder: {
    position: 'absolute',
    top: 12, left: 12, right: 12, bottom: 12,
    borderWidth: 0.8,
    borderRadius: 8,
    opacity: 0.5,
  },
  wpCornerTL: {
    position: 'absolute',
    top: CARD_H * 0.04,
    left: CARD_W * 0.06,
    alignItems: 'center',
  },
  wpCornerBR: {
    position: 'absolute',
    bottom: CARD_H * 0.04,
    right: CARD_W * 0.06,
    alignItems: 'center',
  },
  wpCornerVal: { fontSize: CARD_W * 0.09, fontWeight: '700', lineHeight: CARD_W * 0.1 },
  wpCornerSuit: { fontSize: CARD_W * 0.08, lineHeight: CARD_W * 0.09 },
  wpCenterSuit: {
    position: 'absolute',
    fontSize: CARD_W * 0.4,
    top: CARD_H * 0.05,
  },
  wpQuoteArea: {
    paddingHorizontal: CARD_W * 0.1,
    alignItems: 'center',
    zIndex: 5,
  },
  wpQuoteOpen: {
    fontFamily: Typography.serifBold,
    fontSize: CARD_W * 0.18,
    color: Colors.gold,
    lineHeight: CARD_W * 0.12,
    opacity: 0.7,
    alignSelf: 'flex-start',
  },
  wpQuoteText: {
    fontFamily: Typography.serifItalic,
    fontSize: CARD_W * 0.075,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: CARD_W * 0.115,
    letterSpacing: 0.3,
  },
  wpQuoteClose: {
    fontFamily: Typography.serifBold,
    fontSize: CARD_W * 0.18,
    color: Colors.gold,
    lineHeight: CARD_W * 0.12,
    opacity: 0.7,
    alignSelf: 'flex-end',
  },
  wpQuoteBelow: {
    paddingHorizontal: PREVIEW_W * 0.1,
    alignItems: 'center',
    marginTop: 12,
  },
  wpQuoteBelowText: {
    fontFamily: Typography.serifItalic,
    fontSize: PREVIEW_W * 0.038,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: PREVIEW_W * 0.058,
    letterSpacing: 0.5,
  },
  wpOrnamentBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '85%',
    marginBottom: PREVIEW_H * 0.02,
  },
  wpDateText: {
    fontFamily: Typography.displayBold,
    fontSize: PREVIEW_W * 0.025,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginHorizontal: 8,
  },
  actions: {
    width: '100%',
    marginTop: 28,
    gap: 12,
    alignItems: 'center',
  },
  saveBtn: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  saveBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  saveBtnText: {
    fontFamily: Typography.displayBold,
    fontSize: 13,
    color: Colors.backgroundDeep,
    letterSpacing: 4,
  },
  shareBtn: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: 10,
    overflow: 'hidden',
  },
  shareBtnInner: { paddingVertical: 14, alignItems: 'center' },
  shareBtnText: {
    fontFamily: Typography.displayBold,
    fontSize: 13,
    color: Colors.gold,
    letterSpacing: 3,
  },
  wallpaperTip: {
    fontFamily: Typography.serifItalic,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: Colors.goldDark,
    borderRadius: 8,
    marginTop: 4,
  },
  backBtnText: {
    fontFamily: Typography.displayBold,
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
});
