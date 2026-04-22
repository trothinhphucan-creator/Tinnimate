import React from 'react';
import { View, Text, ViewStyle, TextStyle, Pressable } from 'react-native';
import { V } from '@/constants/theme';

// ── Card ─────────────────────────────────────────────────────────────────────

type CardTint = 'default' | 'sage' | 'petal' | 'terra' | 'sky';

const CARD_TINT_BG: Record<CardTint, string> = {
  default: V.surface,
  sage:    V.primaryContainer,
  petal:   '#2D2429',
  terra:   '#2A2823',
  sky:     '#242B2F',
};

interface CardProps {
  children: React.ReactNode;
  tint?: CardTint;
  style?: ViewStyle;
  onPress?: () => void;
}

export function BotanicalCard({ children, tint = 'default', style, onPress }: CardProps) {
  const bg = CARD_TINT_BG[tint];
  const inner = (
    <View style={[{
      backgroundColor: bg,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(245,237,224,0.06)',
      padding: 18,
      overflow: 'hidden',
    }, style]}>
      {children}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{inner}</Pressable> : inner;
}

// ── Pill / chip ───────────────────────────────────────────────────────────────

interface PillProps {
  children: React.ReactNode;
  active?: boolean;
  soft?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  onPress?: () => void;
  icon?: React.ReactNode;
}

export function BotanicalPill({ children, active = false, soft = false, style, textStyle, onPress, icon }: PillProps) {
  const bg = active
    ? V.sage
    : soft
      ? 'rgba(168,197,160,0.12)'
      : 'rgba(245,237,224,0.08)';

  return (
    <Pressable
      onPress={onPress}
      style={[{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor: bg,
        borderWidth: active ? 0 : 1,
        borderColor: 'rgba(245,237,224,0.1)',
      }, style]}
    >
      {icon}
      <Text style={[{
        fontSize: 13,
        fontWeight: active ? '700' : '600',
        color: active ? V.bg : V.textPrimary,
        letterSpacing: 0.1,
      }, textStyle]}>
        {children}
      </Text>
    </Pressable>
  );
}

// ── Eyebrow (handwritten section label) ──────────────────────────────────────

interface EyebrowProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export function Eyebrow({ children, style }: EyebrowProps) {
  return (
    <Text style={[{
      fontSize: 18,
      fontWeight: '600',
      color: V.sage,
      letterSpacing: 0.3,
    }, style]}>
      {children}
    </Text>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  eyebrow?: string;
  title?: string;
  right?: React.ReactNode;
  style?: ViewStyle;
}

export function SectionHeader({ eyebrow, title, right, style }: SectionHeaderProps) {
  return (
    <View style={[{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 14,
    }, style]}>
      <View>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        {title && (
          <Text style={{
            fontSize: 22,
            fontWeight: '500',
            color: V.cream,
            letterSpacing: -0.3,
            lineHeight: 28,
            marginTop: 2,
          }}>
            {title}
          </Text>
        )}
      </View>
      {right}
    </View>
  );
}

// ── StatTile — small metric card ─────────────────────────────────────────────

interface StatTileProps {
  value: string;
  label: string;
  accent?: string;
  style?: ViewStyle;
}

export function StatTile({ value, label, accent = V.sage, style }: StatTileProps) {
  return (
    <View style={[{
      flex: 1,
      backgroundColor: V.surface,
      borderRadius: 16,
      padding: 14,
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: V.borderCard,
    }, style]}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: accent, letterSpacing: -0.5 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: V.textMuted, textAlign: 'center', letterSpacing: 0.2 }}>
        {label}
      </Text>
    </View>
  );
}

// ── ToolTile — square action tile ────────────────────────────────────────────

interface ToolTileProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  accent?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function ToolTile({ icon, label, sublabel, accent = V.sage, onPress, style }: ToolTileProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[{
        flex: 1,
        backgroundColor: V.surface,
        borderRadius: 20,
        padding: 16,
        gap: 10,
        borderWidth: 1,
        borderColor: V.borderCard,
      }, style]}
    >
      <View style={{ width: 44, height: 44, borderRadius: 14,
        backgroundColor: `${accent}22`, alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </View>
      <View style={{ gap: 2 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: V.textPrimary }}>{label}</Text>
        {sublabel && (
          <Text style={{ fontSize: 12, color: V.textMuted }}>{sublabel}</Text>
        )}
      </View>
    </Pressable>
  );
}
