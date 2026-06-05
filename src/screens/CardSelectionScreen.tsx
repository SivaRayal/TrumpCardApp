import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { CardBack } from '../components/PlayingCard';
import { buildDeck, CardDef } from '../components/PlayingCard';
import { useDaily } from '../hooks/useDaily';
import { useAuth } from '../hooks/useAuth';

const { width: W, height: H } = Dimensions.get('window');

// 7 cards in a circle gives maximum individual visibility
const VISIBLE_CARDS = 7;
const CARD_W = 82;
const CARD_H = 124;

// Circle radius scales with screen size
const CIRCLE_RADIUS = Math.min(W, H) * 0.32;

interface AnimatedCard {
  def: CardDef;
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  zIndex: Animated.Value;
  glow: Animated.Value;
}

interface Props {
  onCardSelected: (cardIndex: number, quote: string) => void;
  todayCard?: number | null;
  todayQuote?: string | null;
}

export function CardSelectionScreen({ onCardSelected, todayCard, todayQuote }: Props) {
  const { user } = useAuth();
  const { pickCard } = useDaily();
  const [animCards, setAnimCards] = useState<AnimatedCard[]>([]);
  const [phase, setPhase] = useState<'shuffling' | 'spread' | 'selected'>('shuffling');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [picking, setPicking] = useState(false);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const instructionOpacity = useRef(new Animated.Value(0)).current;
  const deckReady = useRef(false);

  // Pulsing ring behind the circle
  const ringScale = useRef(new Animated.Value(0.92)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (todayCard !== null && todayCard !== undefined && todayQuote) {
      onCardSelected(todayCard, todayQuote);
      return;
    }

    const deck = buildDeck();
    const picked = deck.slice(0, VISIBLE_CARDS);

    const cards: AnimatedCard[] = picked.map((def, i) => ({
      def,
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotate: new Animated.Value((i - VISIBLE_CARDS / 2) * 3),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(0),
      zIndex: new Animated.Value(i),
      glow: new Animated.Value(0),
    }));
    setAnimCards(cards);
  }, []);

  useEffect(() => {
    if (animCards.length === 0) return;
    runShuffleAnimation();
  }, [animCards]);

  // Pulse the selection ring while in spread phase
  useEffect(() => {
    if (phase !== 'spread') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringScale, { toValue: 1.06, duration: 1400, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(ringScale, { toValue: 0.94, duration: 1400, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0.15, duration: 700, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [phase]);

  const runShuffleAnimation = () => {
    const cards = animCards;

    // Fade in cards as stacked deck
    const fadeIn = cards.map((c, i) =>
      Animated.timing(c.opacity, {
        toValue: 1,
        duration: 300,
        delay: i * 40,
        useNativeDriver: true,
      })
    );

    // Shuffle sequence (2 rounds)
    const shuffleRound = () =>
      cards.map(c =>
        Animated.parallel([
          Animated.spring(c.x, {
            toValue: (Math.random() - 0.5) * W * 0.55,
            friction: 6,
            tension: 50,
            useNativeDriver: true,
          }),
          Animated.spring(c.y, {
            toValue: (Math.random() - 0.5) * H * 0.22,
            friction: 6,
            tension: 50,
            useNativeDriver: true,
          }),
          Animated.spring(c.rotate, {
            toValue: Math.random() * 60 - 30,
            friction: 5,
            useNativeDriver: true,
          }),
        ])
      );

    // Circular spread — cards arranged evenly around a circle
    const spreadCards = cards.map((c, i) => {
      // Start from top (-π/2) and go clockwise
      const angle = (i / VISIBLE_CARDS) * Math.PI * 2 - Math.PI / 2;
      const xPos = Math.cos(angle) * CIRCLE_RADIUS;
      const yPos = Math.sin(angle) * CIRCLE_RADIUS;

      return Animated.parallel([
        Animated.spring(c.x, {
          toValue: xPos,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(c.y, {
          toValue: yPos,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(c.rotate, {
          toValue: 0,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(c.scale, {
          toValue: 1,
          friction: 7,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.sequence([
      Animated.parallel(fadeIn),
      Animated.delay(200),
      Animated.parallel(shuffleRound()),
      Animated.delay(150),
      Animated.parallel(shuffleRound()),
      Animated.delay(200),
      Animated.parallel(spreadCards),
    ]).start(() => {
      setPhase('spread');
      deckReady.current = true;
      Animated.parallel([
        Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(instructionOpacity, {
          toValue: 1,
          duration: 800,
          delay: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleCardPress = async (card: AnimatedCard, i: number) => {
    if (phase !== 'spread' || picking || !deckReady.current) return;
    setPicking(true);
    setSelectedIndex(i);
    setPhase('selected');

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Dim and shrink unchosen cards
    const dimOthers = animCards
      .filter((_, idx) => idx !== i)
      .map(c =>
        Animated.parallel([
          Animated.timing(c.opacity, { toValue: 0.12, duration: 400, useNativeDriver: true }),
          Animated.timing(c.scale, { toValue: 0.8, duration: 400, useNativeDriver: true }),
        ])
      );

    // Lift selected card to centre of circle
    const liftSelected = Animated.parallel([
      Animated.spring(card.x, { toValue: 0, friction: 6, useNativeDriver: true }),
      Animated.spring(card.y, { toValue: 0, friction: 6, useNativeDriver: true }),
      Animated.spring(card.scale, { toValue: 1.35, friction: 5, useNativeDriver: true }),
      Animated.timing(card.rotate, { toValue: 0, duration: 350, useNativeDriver: true }),
      Animated.timing(card.glow, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]);

    Animated.parallel([...dimOthers, liftSelected]).start(async () => {
      const result = await pickCard(card.def.index);
      if (result) {
        setTimeout(() => {
          onCardSelected(card.def.index, result.quote);
        }, 450);
      } else {
        setPicking(false);
        setPhase('spread');
      }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#050510', '#0A0520', '#150510', '#050510']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.3, 0.7, 1]}
      />

      {/* Mystical particles */}
      <View style={styles.particleContainer} pointerEvents="none">
        {Array.from({ length: 6 }).map((_, i) => (
          <MysticParticle key={i} index={i} />
        ))}
      </View>

      {/* Pulsing circle guide ring */}
      <Animated.View
        style={[
          styles.circleGuide,
          {
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
        pointerEvents="none"
      />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <Text style={styles.headerTitle}>Choose Your Card</Text>
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerSym}>✦</Text>
          <View style={styles.dividerLine} />
        </View>
      </Animated.View>

      {/* Card spread area — fills available screen */}
      <View style={styles.cardArea} pointerEvents={phase === 'spread' ? 'auto' : 'none'}>
        {animCards.map((card, i) => (
          <Animated.View
            key={card.def.index}
            style={[
              styles.cardWrapper,
              {
                opacity: card.opacity,
                transform: [
                  { translateX: card.x },
                  { translateY: card.y },
                  {
                    rotate: card.rotate.interpolate({
                      inputRange: [-360, 360],
                      outputRange: ['-360deg', '360deg'],
                    }),
                  },
                  { scale: card.scale },
                ],
              },
            ]}
          >
            {/* Glow halo on selected card */}
            <Animated.View style={[styles.cardGlow, { opacity: card.glow }]} />
            <TouchableOpacity
              onPress={() => handleCardPress(card, i)}
              activeOpacity={0.88}
              disabled={phase !== 'spread'}
            >
              <CardBack width={CARD_W} height={CARD_H} />
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* Instruction */}
      <Animated.View style={[styles.instruction, { opacity: instructionOpacity }]}>
        {picking ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ActivityIndicator color={Colors.gold} size="small" />
            <Text style={styles.instructionText}>The cards speak…</Text>
          </View>
        ) : (
          <Text style={styles.instructionText}>Touch a card to reveal your destiny</Text>
        )}
      </Animated.View>

      {/* Username badge */}
      {user && (
        <Animated.View style={[styles.userBadge, { opacity: headerOpacity }]}>
          <Text style={styles.userText}>{user.username}</Text>
        </Animated.View>
      )}
    </View>
  );
}

function MysticParticle({ index }: { index: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const x = (index / 5) * W * 0.9 + W * 0.05;
  const startY = H * 0.2 + Math.random() * H * 0.6;
  const duration = 3000 + index * 700;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(index * 500),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.6, duration: 600, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -80, duration, useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x,
        top: startY,
        width: 3,
        height: 3,
        borderRadius: 2,
        backgroundColor: Colors.gold,
        opacity,
        transform: [{ translateY }],
      }}
    />
  );
}

const RING_D = CIRCLE_RADIUS * 2 + CARD_W + 24;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050510' },
  particleContainer: { position: 'absolute', width: '100%', height: '100%' },
  circleGuide: {
    position: 'absolute',
    width: RING_D,
    height: RING_D,
    borderRadius: RING_D / 2,
    borderWidth: 1,
    borderColor: Colors.gold,
    top: H / 2 - RING_D / 2,
    left: W / 2 - RING_D / 2,
  },
  header: {
    position: 'absolute',
    top: 62,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  headerTitle: {
    fontFamily: Typography.displayBold,
    fontSize: Typography.xl,
    color: Colors.gold,
    letterSpacing: 6,
    textShadowColor: Colors.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    width: 180,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.goldDark, opacity: 0.5 },
  dividerSym: { color: Colors.gold, fontSize: 10, marginHorizontal: 8 },
  // Card area takes the full screen so the circle is centered
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    position: 'absolute',
  },
  cardGlow: {
    position: 'absolute',
    top: -22,
    left: -22,
    right: -22,
    bottom: -22,
    borderRadius: 32,
    backgroundColor: 'transparent',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 15,
  },
  instruction: {
    position: 'absolute',
    bottom: 76,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    fontFamily: Typography.serifItalic,
    fontSize: 16,
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  userBadge: {
    position: 'absolute',
    top: 52,
    right: 20,
  },
  userText: {
    fontFamily: Typography.displayBold,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
});
