import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { Colors, Typography } from '../theme';

interface Props {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
  size?: 'sm' | 'base' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl';
  variant?: 'display' | 'serif' | 'body';
  align?: 'left' | 'center' | 'right';
  dim?: boolean;
}

export function GoldText({ children, style, size = 'base', variant = 'display', align = 'center', dim }: Props) {
  const fontSize = Typography[size as keyof typeof Typography] as number ?? 16;
  const fontFamily =
    variant === 'display' ? Typography.displayBold :
    variant === 'serif' ? Typography.serif :
    undefined;

  return (
    <Text
      style={[
        styles.base,
        {
          fontSize,
          fontFamily,
          textAlign: align,
          color: dim ? Colors.goldDark : Colors.gold,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: Colors.gold,
    letterSpacing: 1,
  },
});
