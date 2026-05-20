import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '../../theme/colors';
import { Radius, Spacing } from '../../theme/spacing';

interface SkeletonCardProps {
  height?: number;
  width?: number | string;
  borderRadius?: number;
  style?: object;
}

export function SkeletonCard({ height = 80, width = '100%', borderRadius = Radius.card, style }: SkeletonCardProps) {
  const opacity = new Animated.Value(0.3);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { height, width: width as number, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: Spacing.md }}>
      {Array(count).fill(null).map((_, i) => (
        <SkeletonCard key={i} height={100} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.surfaceBorder,
  },
});
