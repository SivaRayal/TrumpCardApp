import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { buildDeck, CardBack } from '../components/PlayingCard';

const { width: W, height: H } = Dimensions.get('window');

// Larger card for maximum readability
const CARD_W = W * 0.80;
const CARD_H = CARD_W * 1.62;

const ALL_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const ALL_SUITS = ['♠', '♥', '♦', '♣'];

interface Props {
  cardIndex: number;
  quote: string;
  onWallpaper: () => void;
  onBack: () => void;
  alreadyRevealed?: boolean;
}

export function CardRevealScreen({ cardIndex, quote, onWallpaper, onBack, alreadyRevealed }: Props) {
  const deck = buildDeck();
  const card = deck[cardIndex] ?? deck[0];

  const [flipped, setFlipped] = useState(alreadyRevealed ?? false);
  const [displayValue, setDisplayValue] = useState(alreadyRevealed ? card.value : '?');
  const [displaySuit, setDisplaySuit] = useState(alreadyRevealed ? card.suit : '?');

  const flipAnim = useRef(new Animated.Value(alreadyRevealed ? 1 : 0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const quoteOpacity = useRef(new Animated.Value(alreadyRevealed ? 1 : 0)).current;
  const quoteScale = useRef(new Animated.Value(alreadyRevealed ? 1 : 0.85)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(alreadyRevealed ? 1 : 0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const cardContainerScale = useRef(new Animated.Value(alreadyRevealed ? 1 : 0.72)).current;
  const cardContainerOpacity = useRef(new Animated.Value(0)).current;

  // Float animation — subtle up/down oscillation on the revealed card
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Particles
  const particles = useRef(
    Array.from({ length: 12 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  const startFloat = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 6, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: -4, duration: 1600, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  };

  const runBackgroundPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(backgroundAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(cardContainerScale, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.timing(cardContainerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start(() => {
      if (!alreadyRevealed) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
          ])
        ).start();
      } else {
        glowAnim.setValue(1);
        runBackgroundPulse();
        startFloat();
      }
    });
  }, []);

  const triggerParticles = () => {
    const anims = particles.map((p, i) => {
      const angle = (i / particles.length) * Math.PI * 2;
      const radius = 130 + Math.random() * 90;
      p.x.setValue(0);
      p.y.setValue(0);
      p.opacity.setValue(1);
      p.scale.setValue(0);
      return Animated.parallel([
        Animated.spring(p.x, {
          toValue: Math.cos(angle) * radius,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(p.y, {
          toValue: Math.sin(angle) * radius,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(p.scale, { toValue: 1, friction: 4, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(p.opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]),
      ]);
    });
    Animated.parallel(anims).start();
  };

  // Roll through random values/suits then land on actual card
  const startRolling = () => {
    let count = 0;
    const total = 18;
    const intervalMs = 60;
    const rollTimer = setInterval(() => {
      count++;
      if (count < total) {
        setDisplayValue(ALL_VALUES[Math.floor(Math.random() * ALL_VALUES.length)]);
        setDisplaySuit(ALL_SUITS[Math.floor(Math.random() * ALL_SUITS.length)]);
      } else {
        clearInterval(rollTimer);
        setDisplayValue(card.value);
        setDisplaySuit(card.suit);
      }
    }, intervalMs);
  };

  const handleFlip = () => {
    if (flipped) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setFlipped(true);
    glowAnim.stopAnimation();

    Animated.timing(flipAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start(() => {
      startRolling();
      triggerParticles();
      runBackgroundPulse();
      startFloat();
      Animated.parallel([
        Animated.spring(quoteOpacity, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.spring(quoteScale, { toValue: 1, friction: 6, useNativeDriver: true, delay: 200 }),
        Animated.timing(btnOpacity, { toValue: 1, duration: 600, delay: 800, useNativeDriver: true }),
      ]).start();
    });
  };

  const frontRotateY = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '180deg'],
  });
  const backRotateY = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['180deg', '90deg', '0deg'],
  });

  const bgOpacity = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  const isRedSuit = ['♥', '♦'].includes(card.suit);
  const displayIsRed = ['♥', '♦'].includes(displaySuit);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient
        colors={['#050510', '#0F0820', '#150510', '#050510']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.3, 0.7, 1]}
      />
      <Animated.View style={[StyleSheet.absoluteFill, styles.bgOverlay, { opacity: bgOpacity }]}>
        <LinearGradient
          colors={['#0A0520', '#200A30', '#0A0520']}
          style={StyleSheet.absoluteFill}
          locations={[0, 0.5, 1]}
        />
      </Animated.View>

      {/* Ambient glow orb */}
      <Animated.View style={[styles.glowOrb, { opacity: glowAnim }]} pointerEvents="none" />

      {/* Particles */}
      <View style={styles.particleContainer} pointerEvents="none">
        {particles.map((p, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              top: H * 0.46,
              left: W * 0.5,
              width: i % 3 === 0 ? 8 : 5,
              height: i % 3 === 0 ? 8 : 5,
              borderRadius: 4,
              backgroundColor: i % 2 === 0 ? Colors.gold : (Colors.goldLight ?? Colors.gold),
              opacity: p.opacity,
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                { scale: p.scale },
              ],
            }}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Title */}
        <Animated.View style={[styles.titleContainer, { opacity: titleOpacity }]}>
          <Text style={styles.titleTop}>✦ THE ORACLE SPEAKS ✦</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </Animated.View>

        {/* Card flip area */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: cardContainerOpacity,
              transform: [
                { scale: cardContainerScale },
                { translateY: floatAnim },
              ],
            },
          ]}
        >
          {/* BACK face */}
          <Animated.View
            style={[
              styles.cardFace,
              {
                transform: [{ perspective: 1200 }, { rotateY: frontRotateY }],
                backfaceVisibility: 'hidden',
              },
            ]}
          >
            <TouchableOpacity onPress={handleFlip} activeOpacity={0.9} disabled={flipped}>
              <View style={styles.cardGlowWrapper}>
                <Animated.View style={[styles.cardGlow, { opacity: glowAnim }]} />
                <CardBack width={CARD_W} height={CARD_H} />
              </View>
              {!flipped && <Text style={styles.tapHint}>✦ Tap to reveal ✦</Text>}
            </TouchableOpacity>
          </Animated.View>

          {/* FRONT face with quote */}
          <Animated.View
            style={[
              styles.cardFace,
              styles.cardFaceAbsolute,
              {
                transform: [{ perspective: 1200 }, { rotateY: backRotateY }],
                backfaceVisibility: 'hidden',
              },
            ]}
          >
            <View style={styles.quotedCard}>
              <LinearGradient
                colors={['#0D0D22', '#1A0A20', '#0A0D22']}
                style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
              />

              {/* Faded app icon background for depth */}
              <Image
                source={require('../../assets/appicon.png')}
                style={styles.cardBgIcon}
                resizeMode="contain"
              />

              {/* Gold border */}
              <View style={styles.quotedCardBorder} />
              <View style={styles.quotedCardInnerBorder} />

              {/* Card identity — top left with rolling effect */}
              <View style={styles.quotedCardTop}>
                <Text
                  style={[
                    styles.cardValue,
                    { color: displayIsRed ? Colors.crimson : Colors.goldDark },
                  ]}
                >
                  {displayValue}
                </Text>
                <Text
                  style={[
                    styles.cardSuitCorner,
                    { color: displayIsRed ? Colors.crimson : Colors.goldDark },
                  ]}
                >
                  {displaySuit}
                </Text>
              </View>

              {/* Large faint suit centre */}
              <Text
                style={[
                  styles.centerSuit,
                  { color: isRedSuit ? Colors.crimson : Colors.gold },
                ]}
              >
                {card.suit}
              </Text>

              {/* Quote — contained, no overflow */}
              <Animated.View
                style={[
                  styles.quoteContainer,
                  { opacity: quoteOpacity, transform: [{ scale: quoteScale }] },
                ]}
              >
                <Text style={styles.quoteOpenMark}>"</Text>
                <Text
                  style={styles.quoteText}
                  adjustsFontSizeToFit
                  numberOfLines={12}
                  minimumFontScale={0.75}
                >
                  {quote}
                </Text>
                <Text style={styles.quoteCloseMark}>"</Text>
              </Animated.View>

              {/* Card identity — bottom right, rotated */}
              <View style={styles.quotedCardBottom}>
                <Text
                  style={[
                    styles.cardValue,
                    {
                      color: displayIsRed ? Colors.crimson : Colors.goldDark,
                      transform: [{ rotate: '180deg' }],
                    },
                  ]}
                >
                  {displayValue}
                </Text>
                <Text
                  style={[
                    styles.cardSuitCorner,
                    {
                      color: displayIsRed ? Colors.crimson : Colors.goldDark,
                      transform: [{ rotate: '180deg' }],
                    },
                  ]}
                >
                  {displaySuit}
                </Text>
              </View>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Action buttons */}
        <Animated.View style={[styles.buttonsContainer, { opacity: btnOpacity }]}>
          <TouchableOpacity style={styles.wallpaperBtn} onPress={onWallpaper} activeOpacity={0.85}>
            <LinearGradient
              colors={['#8B6914', '#C9A84C', '#FFD700', '#C9A84C', '#8B6914']}
              style={styles.wallpaperBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.wallpaperBtnText}>✦ CREATE WALLPAPER ✦</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.75}>
            <Text style={styles.backBtnText}>Return</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050510' },
  bgOverlay: { position: 'absolute' },
  glowOrb: {
    position: 'absolute',
    top: H * 0.2,
    left: W * 0.5 - 140,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'transparent',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 90,
    elevation: 0,
  },
  particleContainer: { position: 'absolute', width: '100%', height: '100%' },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 55,
    paddingBottom: 40,
  },
  titleContainer: { alignItems: 'center', marginBottom: 24 },
  titleTop: {
    fontFamily: Typography.displayBold,
    fontSize: 14,
    color: Colors.gold,
    letterSpacing: 5,
    textAlign: 'center',
    textShadowColor: Colors.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  dateText: {
    fontFamily: Typography.serifItalic,
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
    letterSpacing: 1,
  },
  cardContainer: {
    width: CARD_W,
    height: CARD_H,
    alignItems: 'center',
  },
  cardFace: {
    width: CARD_W,
    height: CARD_H,
  },
  cardFaceAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cardGlowWrapper: { position: 'relative', alignItems: 'center' },
  cardGlow: {
    position: 'absolute',
    top: -30,
    left: -30,
    right: -30,
    bottom: -30,
    borderRadius: 40,
    backgroundColor: 'transparent',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 45,
  },
  tapHint: {
    fontFamily: Typography.serifItalic,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 14,
    letterSpacing: 2,
  },
  quotedCard: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 35,
    elevation: 20,
  },
  cardBgIcon: {
    position: 'absolute',
    width: CARD_W * 0.7,
    height: CARD_W * 0.7,
    opacity: 0.10,
    tintColor: Colors.gold,
  },
  quotedCardBorder: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderWidth: 2,
    borderColor: Colors.gold,
    borderRadius: 13,
    opacity: 0.85,
  },
  quotedCardInnerBorder: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    bottom: 14,
    borderWidth: 1,
    borderColor: Colors.goldDark,
    borderRadius: 8,
    opacity: 0.45,
  },
  quotedCardTop: {
    position: 'absolute',
    top: 18,
    left: 20,
    alignItems: 'center',
  },
  quotedCardBottom: {
    position: 'absolute',
    bottom: 18,
    right: 20,
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 20,
    letterSpacing: 1,
  },
  cardSuitCorner: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 17,
  },
  centerSuit: {
    position: 'absolute',
    top: 18,
    alignSelf: 'center',
    fontSize: 28,
    opacity: 0.12,
  },
  quoteContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    alignItems: 'center',
    zIndex: 5,
    width: '100%',
    // bounded so text never bleeds outside card
    maxHeight: CARD_H * 0.68,
  },
  quoteOpenMark: {
    fontFamily: Typography.serifBold,
    fontSize: 44,
    color: Colors.gold,
    lineHeight: 28,
    opacity: 0.8,
    alignSelf: 'flex-start',
    marginLeft: 4,
  },
  quoteText: {
    fontFamily: Typography.serifItalic,
    fontSize: 14,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.4,
    flexShrink: 1,
    textShadowColor: 'rgba(255,215,0,0.15)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  quoteCloseMark: {
    fontFamily: Typography.serifBold,
    fontSize: 44,
    color: Colors.gold,
    lineHeight: 28,
    opacity: 0.8,
    alignSelf: 'flex-end',
    marginRight: 4,
  },
  buttonsContainer: {
    width: '100%',
    paddingHorizontal: 28,
    marginTop: 30,
    gap: 14,
  },
  wallpaperBtn: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  wallpaperBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  wallpaperBtnText: {
    fontFamily: Typography.displayBold,
    fontSize: 13,
    color: Colors.backgroundDeep,
    letterSpacing: 4,
  },
  backBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.goldDark,
    borderRadius: 10,
  },
  backBtnText: {
    fontFamily: Typography.displayBold,
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 3,
  },
});
