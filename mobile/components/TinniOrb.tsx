/**
 * TinniOrb — Premium Aurora Living Orb.
 *
 * playing mode: RGB gradient cycling interior + ripple rings
 * idle/breathing/sleep/chat: aurora aurora color shifts
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export type OrbMode = 'idle' | 'playing' | 'breathing' | 'sleep' | 'chat';

interface TinniOrbProps {
  mode?: OrbMode;
  size?: number;
}

const MODE_GLOW: Record<OrbMode, string> = {
  idle:      '#C86B2A',   // amber warm glow
  playing:   '#00B896',   // teal active glow
  breathing: '#8FB996',   // sage calm glow
  sleep:     '#003D31',   // deep teal sleep glow
  chat:      '#0EA5E9',   // sky blue chat glow
};

const MODE_SPEED: Record<OrbMode, { blobA: number; blobB: number; scale: number; glow: number; rgb: number }> = {
  idle:      { blobA: 14000, blobB: 20000, scale: 5000, glow: 3000, rgb: 6000 },
  playing:   { blobA: 3500,  blobB: 5000,  scale: 700,  glow: 800,  rgb: 1800 },
  breathing: { blobA: 8000,  blobB: 12000, scale: 4000, glow: 4000, rgb: 5000 },
  sleep:     { blobA: 28000, blobB: 40000, scale: 8000, glow: 6000, rgb: 12000},
  chat:      { blobA: 5000,  blobB: 7000,  scale: 1200, glow: 900,  rgb: 3000 },
};

const MODE_SCALE: Record<OrbMode, [number, number]> = {
  idle:      [1.0,  1.05],
  playing:   [0.88, 1.16],
  breathing: [0.82, 1.18],
  sleep:     [0.97, 1.02],
  chat:      [0.93, 1.10],
};

// Aurora color sets for non-playing modes
const MODE_COLORS: Record<OrbMode, [string, string, string, string]> = {
  idle:      ['#003D31', '#C86B2A', '#00B896', '#F4A261'],
  playing:   ['#FF6B35', '#00B896', '#F4A261', '#FF6B35'], // overridden by RGB
  breathing: ['#0EA5E9', '#8FB996', '#00B896', '#8FB996'],
  sleep:     ['#090E0B', '#141E18', '#0D1E18', '#003D31'],
  chat:      ['#0284C7', '#00B896', '#F4A261', '#06B6D4'],
};

export function TinniOrb({ mode = 'idle', size = 200 }: TinniOrbProps) {
  const rotA   = useRef(new Animated.Value(0)).current;
  const rotB   = useRef(new Animated.Value(0)).current;
  const scale  = useRef(new Animated.Value(1)).current;
  const glowOp = useRef(new Animated.Value(0.3)).current;
  const glowSc = useRef(new Animated.Value(1)).current;
  const ripple1= useRef(new Animated.Value(0)).current;
  const ripple2= useRef(new Animated.Value(0)).current;
  // RGB cycling — 3 color layers with phase offset
  const rgbA   = useRef(new Animated.Value(1)).current; // red-violet
  const rgbB   = useRef(new Animated.Value(0)).current; // blue-cyan
  const rgbC   = useRef(new Animated.Value(0)).current; // green-gold

  useEffect(() => {
    const spd = MODE_SPEED[mode];
    const [minSc, maxSc] = MODE_SCALE[mode];
    const allAnims = [rotA, rotB, scale, glowOp, glowSc, ripple1, ripple2, rgbA, rgbB, rgbC];
    allAnims.forEach(a => a.stopAnimation());

    Animated.loop(Animated.timing(rotA, {
      toValue: 360, duration: spd.blobA, easing: Easing.linear, useNativeDriver: true,
    })).start();

    Animated.loop(Animated.timing(rotB, {
      toValue: -360, duration: spd.blobB, easing: Easing.linear, useNativeDriver: true,
    })).start();

    Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: maxSc, duration: spd.scale, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(scale, { toValue: minSc, duration: spd.scale, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(glowOp, { toValue: mode === 'sleep' ? 0.12 : 0.6, duration: spd.glow, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(glowOp, { toValue: mode === 'sleep' ? 0.05 : 0.18, duration: spd.glow, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(glowSc, { toValue: 1.2, duration: spd.glow, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(glowSc, { toValue: 1.0, duration: spd.glow, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ])).start();

    // Ripple rings
    if (mode === 'playing' || mode === 'chat') {
      const startRipple = (val: Animated.Value, delay: number) =>
        Animated.loop(Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: spd.blobA * 0.9, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])).start();
      startRipple(ripple1, 0);
      startRipple(ripple2, spd.blobA * 0.45);
    }

    // RGB gradient cycling — three layers shift 0→1→0 with 120° phase offsets
    if (mode === 'playing') {
      const period = spd.rgb;
      const cycleLayer = (val: Animated.Value, delay: number) =>
        Animated.loop(Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: period * 0.4, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: period * 0.5, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.delay(period * 0.1),
        ])).start();
      cycleLayer(rgbA, 0);
      cycleLayer(rgbB, period / 3);
      cycleLayer(rgbC, (period * 2) / 3);
    }
  }, [mode]);

  const colors = MODE_COLORS[mode];
  const glow   = MODE_GLOW[mode];
  const halo   = size * 1.65;
  const blob   = size * 1.5;
  const rotADeg = rotA.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });
  const rotBDeg = rotB.interpolate({ inputRange: [-360, 0], outputRange: ['-360deg', '0deg'] });

  return (
    <View style={[styles.root, { width: size, height: size }]}>

      {/* Deep halo */}
      <Animated.View style={[styles.halo, {
        width: halo, height: halo, borderRadius: halo / 2,
        backgroundColor: glow, opacity: glowOp, transform: [{ scale: glowSc }],
      }]} />

      {/* Mid glow ring */}
      <Animated.View style={[styles.midGlow, {
        width: size * 1.2, height: size * 1.2, borderRadius: (size * 1.2) / 2,
        borderColor: glow + '55', opacity: glowOp, transform: [{ scale: glowSc }],
      }]} />

      {/* Ripple rings */}
      {(mode === 'playing' || mode === 'chat') && ([ripple1, ripple2] as const).map((rip, idx) => (
        <Animated.View key={idx} style={[styles.ripple, {
          width: size, height: size, borderRadius: size / 2,
          borderColor: (idx === 0 ? glow : colors[2]) + '77',
          opacity: rip.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.7, 0.35, 0] }),
          transform: [{ scale: rip.interpolate({ inputRange: [0, 1], outputRange: [1, 2.1] }) }],
        }]} />
      ))}

      {/* Glass shell */}
      <Animated.View style={[styles.shell, {
        width: size, height: size, borderRadius: size / 2,
        shadowColor: glow, transform: [{ scale }],
      }]}>

        {/* Blob A — CW */}
        <Animated.View style={[styles.blob, {
          width: blob, height: blob, borderRadius: blob / 2,
          transform: [{ rotate: rotADeg }],
        }]}>
          <LinearGradient
            colors={mode === 'playing' ? ['#FF6B35', '#00B896', '#F4A261', '#FF6B35'] : [colors[0], colors[1], colors[3], colors[0]]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Blob B — CCW */}
        <Animated.View style={[styles.blob, {
          width: blob * 0.85, height: blob * 0.85, borderRadius: (blob * 0.85) / 2,
          transform: [{ rotate: rotBDeg }], opacity: 0.65,
        }]}>
          <LinearGradient
            colors={mode === 'playing' ? ['#0EA5E9', '#06D6A0', '#F4A261', '#0EA5E9'] : [colors[2], colors[3], colors[1], colors[2]]}
            start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* RGB Layer A — coral / teal (playing only) */}
        {mode === 'playing' && (
          <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: size / 2, opacity: rgbA }]}>
            <LinearGradient
              colors={['#FF6B35', '#00B896', 'transparent']}
              start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
            />
          </Animated.View>
        )}
        {/* RGB Layer B — sky / jade */}
        {mode === 'playing' && (
          <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: size / 2, opacity: rgbB }]}>
            <LinearGradient
              colors={['#0EA5E9', '#06D6A0', 'transparent']}
              start={{ x: 0.8, y: 0.1 }} end={{ x: 0.2, y: 0.9 }}
              style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
            />
          </Animated.View>
        )}
        {/* RGB Layer C — amber / warm gold */}
        {mode === 'playing' && (
          <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: size / 2, opacity: rgbC }]}>
            <LinearGradient
              colors={['#F4A261', '#FFB700', 'transparent']}
              start={{ x: 0.5, y: 1 }} end={{ x: 0.5, y: 0 }}
              style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
            />
          </Animated.View>
        )}

        {/* Depth fog */}
        <View style={[StyleSheet.absoluteFill, {
          backgroundColor: 'rgba(2,6,23,0.18)', borderRadius: size / 2,
        }]} />
        {/* Specular */}
        <View style={[styles.specular, { width: size * 0.4, height: size * 0.22 }]} />
        <View style={[styles.specularSecondary, { width: size * 0.22, height: size * 0.12 }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { justifyContent: 'center', alignItems: 'center' },
  halo: { position: 'absolute' },
  midGlow: { position: 'absolute', borderWidth: 1.5, backgroundColor: 'transparent' },
  ripple: { position: 'absolute', borderWidth: 1.5, backgroundColor: 'transparent' },
  shell: {
    overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(165,180,252,0.2)',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8,
    shadowRadius: 28, elevation: 18,
  },
  blob: { position: 'absolute', overflow: 'hidden' },
  specular: {
    position: 'absolute', top: '9%', left: '12%',
    borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.17)',
    transform: [{ rotate: '-30deg' }],
  },
  specularSecondary: {
    position: 'absolute', bottom: '14%', right: '14%',
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)',
    transform: [{ rotate: '20deg' }],
  },
});
