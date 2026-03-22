import React, { useState, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  Dimensions, Animated, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { TinniOrb } from '@/components/TinniOrb';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    mode: 'idle' as const,
    title: 'Chào mừng đến\nTinnimate',
    subtitle: 'Người bạn đồng hành thông minh\ntrên hành trình chữa lành ù tai',
    cta: 'Tiếp theo',
    color: '#818CF8',
  },
  {
    mode: 'playing' as const,
    title: 'Âm thanh\ntrị liệu',
    subtitle: 'Sóng biển, tiếng mưa, white noise…\nGiảm ù tai bằng liệu pháp âm thanh khoa học',
    cta: 'Tiếp theo',
    color: '#06B6D4',
  },
  {
    mode: 'chat' as const,
    title: 'Tinni –\nAI của bạn',
    subtitle: 'Trò chuyện, theo dõi tiến trình\nvà nhận gợi ý cá nhân mỗi ngày',
    cta: 'Bắt đầu nào!',
    color: '#A855F7',
  },
];

export default function OnboardingScreen() {
  const [slide, setSlide]   = useState(0);
  const scrollRef           = useRef<ScrollView>(null);
  const router              = useRouter();

  function goNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (slide < SLIDES.length - 1) {
      const next = slide + 1;
      setSlide(next);
      scrollRef.current?.scrollTo({ x: width * next, animated: true });
    } else {
      router.replace('/(tabs)');
    }
  }

  function skip() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(tabs)');
  }

  const current = SLIDES[slide];

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip */}
      <TouchableOpacity style={styles.skipBtn} onPress={skip}>
        <Text style={styles.skipText}>Bỏ qua</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal pagingEnabled scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}>
        {SLIDES.map((s, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            {/* Orb */}
            <View style={styles.orbContainer}>
              <TinniOrb mode={s.mode} size={220} />
            </View>
            {/* Text */}
            <Text style={[styles.title, { color: s.color }]}>{s.title}</Text>
            <Text style={styles.subtitle}>{s.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[
            styles.dot,
            i === slide && [styles.dotActive, { backgroundColor: current.color }],
          ]} />
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.ctaBtn, { backgroundColor: current.color }]}
        onPress={goNext}
        activeOpacity={0.85}>
        <Text style={styles.ctaText}>{current.cta}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', alignItems: 'center' },
  skipBtn: { alignSelf: 'flex-end', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 4 },
  skipText: { color: '#475569', fontSize: 14 },
  slide: { alignItems: 'center', justifyContent: 'center', flex: 1, paddingHorizontal: 32 },
  orbContainer: { marginBottom: 40 },
  title: {
    fontSize: 34, fontWeight: '800', textAlign: 'center',
    letterSpacing: -0.5, marginBottom: 16, lineHeight: 42,
  },
  subtitle: { fontSize: 16, color: '#94A3B8', textAlign: 'center', lineHeight: 24 },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1E293B' },
  dotActive: { width: 24 },
  ctaBtn: {
    width: width - 48, paddingVertical: 16, borderRadius: 100,
    alignItems: 'center', marginBottom: 32,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
