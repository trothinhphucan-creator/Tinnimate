import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, {
  Circle, Ellipse, Defs, RadialGradient, LinearGradient, Stop,
} from 'react-native-svg';
import { V } from '@/constants/theme';

interface BreathingFlowerProps {
  size?: number;
  animate?: boolean;
  inhaleDuration?: number;
  exhaleDuration?: number;
}

export function BreathingFlower({
  size = 240,
  animate = true,
  inhaleDuration = 4000,
  exhaleDuration = 4000,
}: BreathingFlowerProps) {
  const [phase, setPhase] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) return;
    const id = anim.addListener(({ value }) => setPhase(value));
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: inhaleDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: exhaleDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    );
    breathe.start();
    return () => {
      anim.removeListener(id);
      breathe.stop();
    };
  }, [animate, inhaleDuration, exhaleDuration]);

  const glowR = 90 + phase * 15;
  const petalCy = -(30 + phase * 50);
  const petalRx = 14 + phase * 6;
  const petalRy = 34 + phase * 20;
  const centerR = 12 + phase * 4;

  const PETAL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <Svg width={size} height={size} viewBox="-120 -120 240 240">
      <Defs>
        <RadialGradient id="bfGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={V.petal} stopOpacity={0.4} />
          <Stop offset="1" stopColor={V.petal} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="bfPetal" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={V.petal} />
          <Stop offset="1" stopColor={V.lavender} />
        </LinearGradient>
      </Defs>

      <Circle r={glowR} fill="url(#bfGlow)" />

      {PETAL_ANGLES.map(angle => (
        <Ellipse
          key={angle}
          cx={0}
          cy={petalCy}
          rx={petalRx}
          ry={petalRy}
          fill="url(#bfPetal)"
          opacity={0.85}
          rotation={angle}
          originX={0}
          originY={0}
        />
      ))}

      <Circle r={centerR} fill={V.honey} opacity={0.95} />
    </Svg>
  );
}
