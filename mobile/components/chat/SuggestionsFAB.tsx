import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Sparkles } from 'lucide-react-native';

interface Props {
  onPress: () => void;
  visible?: boolean;
}

export function SuggestionsFAB({ onPress, visible = true }: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Entrance animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Pulse animation loop
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.pulseCircle,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <Sparkles size={24} color="#0F172A" fill="#0F172A" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    right: 20,
    zIndex: 1000,
  },
  pulseCircle: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#818CF8',
    opacity: 0.3,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#818CF8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
});
