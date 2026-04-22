import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, {
  Circle, Ellipse, G, Defs,
  RadialGradient, LinearGradient, Stop, Text as SvgText,
} from 'react-native-svg';
import { V } from '@/constants/theme';

interface LotusOrbProps {
  size?: number;
  progress?: number; // 0..1
  animate?: boolean;
}

const VB = '-110 -110 220 220';
const RING_R = 88;
const RING_C = 2 * Math.PI * RING_R;

export function LotusOrb({ size = 220, progress = 0.72, animate = true }: LotusOrbProps) {
  const outerRot = useRef(new Animated.Value(0)).current;
  const innerRot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) return;
    const outer = Animated.loop(
      Animated.timing(outerRot, { toValue: 1, duration: 12000, easing: Easing.linear, useNativeDriver: true })
    );
    const inner = Animated.loop(
      Animated.timing(innerRot, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true })
    );
    outer.start();
    inner.start();
    return () => { outer.stop(); inner.stop(); };
  }, [animate]);

  const outerDeg = outerRot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const innerDeg = innerRot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });

  const dashOffset = RING_C * (1 - Math.max(0, Math.min(1, progress)));
  const pct = Math.round(progress * 100);

  const outerPetals = Array.from({ length: 12 }, (_, i) => (
    <Ellipse key={i} cx={0} cy={-70} rx={14} ry={36}
      fill={V.petal} opacity={0.72}
      rotation={(i / 12) * 360} originX={0} originY={0} />
  ));

  const innerPetals = Array.from({ length: 8 }, (_, i) => (
    <Ellipse key={i} cx={0} cy={-46} rx={10} ry={26}
      fill={V.cream} opacity={0.82}
      rotation={(i / 8) * 360 + 22.5} originX={0} originY={0} />
  ));

  return (
    <View style={{ width: size, height: size }}>
      {/* Glow aura + progress ring (static) */}
      <Svg width={size} height={size} viewBox={VB} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="lotusGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={V.petal} stopOpacity={0.3} />
            <Stop offset="0.6" stopColor={V.petal} stopOpacity={0.07} />
            <Stop offset="1" stopColor={V.petal} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle r={100} fill="url(#lotusGlow)" />
        <Circle r={RING_R} fill="none" stroke={V.surfaceHighest} strokeWidth={1.5} opacity={0.5} />
        <Circle
          r={RING_R} fill="none" stroke={V.sage} strokeWidth={2.5}
          strokeDasharray={[RING_C, RING_C]}
          strokeDashoffset={dashOffset}
          rotation={-90} originX={0} originY={0}
          strokeLinecap="round"
        />
      </Svg>

      {/* Outer 12 petals — rotate CW */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: outerDeg }] }]}>
        <Svg width={size} height={size} viewBox={VB}>
          <G>{outerPetals}</G>
        </Svg>
      </Animated.View>

      {/* Inner 8 petals — rotate CCW */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: innerDeg }] }]}>
        <Svg width={size} height={size} viewBox={VB}>
          <G>{innerPetals}</G>
        </Svg>
      </Animated.View>

      {/* Center — static on top */}
      <Svg width={size} height={size} viewBox={VB} style={StyleSheet.absoluteFill}>
        <Circle r={20} fill={V.honey} opacity={0.95} />
        <Circle r={20} fill="none" stroke={V.cream} strokeWidth={1} opacity={0.55} />
        <SvgText textAnchor="middle" y={6} fill={V.bg} fontSize={13} fontWeight="800">
          {pct}%
        </SvgText>
      </Svg>
    </View>
  );
}
