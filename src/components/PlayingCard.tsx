import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';

export type CardSuit = '♠' | '♥' | '♦' | '♣';
export type CardValue = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface CardDef {
  suit: CardSuit;
  value: CardValue;
  index: number;
}

export function buildDeck(): CardDef[] {
  const suits: CardSuit[] = ['♠', '♥', '♦', '♣'];
  const values: CardValue[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: CardDef[] = [];
  let index = 0;
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value, index: index++ });
    }
  }
  return deck;
}

interface Props {
  card: CardDef;
  width?: number;
  height?: number;
  style?: ViewStyle;
  showFace?: boolean;
}

const RED_SUITS: CardSuit[] = ['♥', '♦'];

export function CardFace({ card, width = 100, height = 150, style }: Props) {
  const isRed = RED_SUITS.includes(card.suit);
  const suitColor = isRed ? Colors.suitRed : '#1A1A1A';

  return (
    <View style={[styles.card, { width, height }, style]}>
      <LinearGradient
        colors={['#F8F0E0', '#EDE0C4', '#F8F0E0']}
        style={StyleSheet.absoluteFill}
      />
      {/* Border */}
      <View style={[styles.innerBorder, { borderColor: isRed ? Colors.suitRed : '#333' }]} />

      {/* Top-left corner */}
      <View style={styles.cornerTL}>
        <Text style={[styles.cornerValue, { color: suitColor }]}>{card.value}</Text>
        <Text style={[styles.cornerSuit, { color: suitColor }]}>{card.suit}</Text>
      </View>

      {/* Center suit */}
      <View style={styles.center}>
        <Text style={[styles.centerSuit, { color: suitColor }]}>{card.suit}</Text>
      </View>

      {/* Bottom-right corner (inverted) */}
      <View style={styles.cornerBR}>
        <Text style={[styles.cornerValue, { color: suitColor, transform: [{ rotate: '180deg' }] }]}>
          {card.value}
        </Text>
        <Text style={[styles.cornerSuit, { color: suitColor, transform: [{ rotate: '180deg' }] }]}>
          {card.suit}
        </Text>
      </View>
    </View>
  );
}

export function CardBack({ width = 100, height = 150, style }: { width?: number; height?: number; style?: ViewStyle }) {
  return (
    <View style={[styles.card, { width, height }, style]}>
      <LinearGradient
        colors={['#0D0D22', '#1A0A18', '#0A0D22']}
        style={StyleSheet.absoluteFill}
      />
      {/* Outer gold border */}
      <View style={styles.backBorderOuter} />
      {/* Inner pattern */}
      <View style={styles.backBorderInner} />
      {/* Diamond pattern overlay */}
      <View style={styles.backCenter}>
        <Text style={styles.backSymbol}>✦</Text>
        <Text style={styles.backTitle}>TC</Text>
        <Text style={styles.backSymbol}>✦</Text>
      </View>
      {/* Corner ornaments */}
      <Text style={[styles.cornerOrnament, styles.ornamentTL]}>❧</Text>
      <Text style={[styles.cornerOrnament, styles.ornamentTR, { transform: [{ scaleX: -1 }] }]}>❧</Text>
      <Text style={[styles.cornerOrnament, styles.ornamentBL, { transform: [{ rotate: '180deg' }, { scaleX: -1 }] }]}>❧</Text>
      <Text style={[styles.cornerOrnament, styles.ornamentBR, { transform: [{ rotate: '180deg' }] }]}>❧</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
    backgroundColor: '#F8F0E0',
  },
  innerBorder: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderWidth: 1,
    borderRadius: 6,
    zIndex: 1,
  },
  cornerTL: {
    position: 'absolute',
    top: 8,
    left: 8,
    alignItems: 'center',
    zIndex: 2,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    alignItems: 'center',
    zIndex: 2,
  },
  cornerValue: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 14,
  },
  cornerSuit: {
    fontSize: 11,
    lineHeight: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  centerSuit: {
    fontSize: 40,
  },
  // Back styles
  backBorderOuter: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderWidth: 2,
    borderColor: Colors.gold,
    borderRadius: 7,
    opacity: 0.8,
  },
  backBorderInner: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderWidth: 1,
    borderColor: Colors.goldDark,
    borderRadius: 4,
    opacity: 0.6,
  },
  backCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  backSymbol: {
    fontSize: 18,
    color: Colors.gold,
    opacity: 0.9,
  },
  backTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.goldBright ?? Colors.gold,
    letterSpacing: 4,
  },
  cornerOrnament: {
    position: 'absolute',
    fontSize: 14,
    color: Colors.goldDark,
    opacity: 0.7,
  },
  ornamentTL: { top: 14, left: 14 },
  ornamentTR: { top: 14, right: 14 },
  ornamentBL: { bottom: 14, left: 14 },
  ornamentBR: { bottom: 14, right: 14 },
});
