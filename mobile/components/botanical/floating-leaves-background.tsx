import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Leaf } from './leaf-sprig-vine';
import { V } from '@/constants/theme';

interface LeafConfig {
  topPct: number;
  leftPct: number;
  size: number;
  rotate: number;
  duration: number;
  delay: number;
  driftX: number; // px
  driftY: number; // px
}

function buildLeafConfigs(count: number): LeafConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    topPct:   (i * 37) % 80,
    leftPct:  (i * 53) % 90,
    size:     14 + (i % 3) * 4,
    rotate:   i * 40,
    duration: (18 + i * 3) * 1000,
    delay:    i * 2000,
    driftX:   ((i % 3) - 1) * 12,
    driftY:   -8 - (i % 4) * 6,
  }));
}

function DriftingLeaf({ config }: { config: LeafConfig }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: config.duration,
          delay: config.delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: config.duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, config.driftX] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, config.driftY] });
  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: [`${config.rotate}deg`, `${config.rotate + 15}deg`] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: `${config.topPct}%` as any,
        left: `${config.leftPct}%` as any,
        opacity: 0.22,
        transform: [{ translateX }, { translateY }, { rotate }],
      }}
    >
      <Leaf size={config.size} color={V.sage} rotate={0} />
    </Animated.View>
  );
}

interface FloatingLeavesBackgroundProps {
  count?: number;
}

export function FloatingLeavesBackground({ count = 6 }: FloatingLeavesBackgroundProps) {
  const configs = buildLeafConfigs(count);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {configs.map((cfg, i) => (
        <DriftingLeaf key={i} config={cfg} />
      ))}
    </View>
  );
}
