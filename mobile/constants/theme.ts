/**
 * TinniMate — Botanical Healing Garden Design System
 * Warm dark mode, watercolor botanical palette
 * Fonts: Fraunces (serif display) · Nunito (body) · Caveat (handwriting)
 */

import { Platform } from 'react-native';

// ───────────────────────────────────────────────
// Botanical — Core Design Tokens
// ───────────────────────────────────────────────
export const V = {
  // ── Backgrounds / Surfaces ──
  bg:              '#1A1F1C',   // deepest — page bg
  bgDim:           '#141918',   // even deeper
  surface:         '#242B27',   // cards, panels
  surfaceHigh:     '#2F3832',   // elevated surface
  surfaceHighest:  '#3A453E',   // highest elevation / inset chip
  surfaceBright:   '#3D4840',

  // ── Text (warm cream scale) ──
  textPrimary:     '#F5EDE0',   // cream — headings, main text
  textSecondary:   '#CBBFAE',   // muted cream — body
  textMuted:       '#8A8478',   // dim — captions
  textDim:         '#5C5A52',   // disabled, placeholders

  // ── Botanical Accent Colors ──
  sage:            '#A8C5A0',   // leaf green — primary accent
  sageDeep:        '#6B8F71',   // moss — secondary green
  sageDark:        '#3E5B46',
  lavender:        '#C4B5E0',   // petal purple — tertiary
  lavenderD:       '#9A8BC0',
  petal:           '#E8B4B8',   // soft pink bloom
  terracotta:      '#D4A574',   // warm earth — active/CTA
  terracottaD:     '#B07E4E',
  cream:           '#F5EDE0',   // parchment text
  sky:             '#B8D4E3',   // pale sky blue
  honey:           '#E8C97A',   // golden center

  // ── V.* aliases for backward compat (screens use these) ──
  primary:             '#A8C5A0',   // sage — was teal
  primaryDark:         '#1A1F1C',
  primaryContainer:    '#253029',
  primaryFixed:        '#C8E6C0',
  secondary:           '#D4A574',   // terracotta — was amber
  secondaryContainer:  '#4E3220',
  secondaryDim:        '#B07E4E',
  secondaryFixed:      '#F5D8B8',
  tertiary:            '#C4B5E0',   // lavender
  tertiaryContainer:   '#2D2A3E',

  // ── Borders ──
  outline:             '#6B8F71',
  outlineVariant:      '#3E5B46',
  borderCard:          '#2F3832',

  // ── Tab Bar ──
  tabActive:     '#A8C5A0',     // sage
  tabInactive:   '#5C5A52',
  tabBg:         'rgba(26,31,28,0.95)',
  tabBgSolid:    '#1A1F1C',
  tabBorder:     '#242B27',

  // ── Status ──
  error:      '#FFB4AB',
  errorBg:    '#5C1F1A',
  success:    '#A8C5A0',
  successBg:  '#1F3024',
  warning:    '#E8C97A',

  // ── Glass ──
  glass:     'rgba(47,56,50,0.60)',
  glassDark: 'rgba(26,31,28,0.92)',

  // ── Gradients (as string pairs for LinearGradient) ──
  gradMoss:   ['#2F3832', '#1E2521'] as const,
  gradDawn:   ['#2D3A30', '#3A2E34', '#2A3038'] as const,
  gradSage:   ['#A8C5A0', '#6B8F71'] as const,
  gradTerra:  ['#E8C97A', '#D4A574', '#B07E4E'] as const,
  gradLaven:  ['#C4B5E0', '#9A8BC0'] as const,
  gradPetal:  ['#E8B4B8', '#C48AA0'] as const,
  gradNight:  ['#1B1F28', '#252139', '#1A1F2E'] as const,
} as const;

export const Colors = {
  light: {
    text: V.textPrimary,
    background: '#F0EDE8',
    tint: V.sageDeep,
    icon: V.textMuted,
    tabIconDefault: V.tabInactive,
    tabIconSelected: V.sageDeep,
  },
  dark: {
    text: V.textPrimary,
    background: V.bg,
    tint: V.sage,
    icon: V.textMuted,
    tabIconDefault: V.tabInactive,
    tabIconSelected: V.tabActive,
  },
};

export const Fonts = Platform.select({
  ios: {
    display:  'Georgia',          // Fraunces fallback — serif display
    body:     'system-ui',        // Nunito fallback
    hand:     'Georgia',          // Caveat fallback — italic Georgia
    mono:     'ui-monospace',
  },
  android: {
    display:  'serif',
    body:     'normal',
    hand:     'serif',
    mono:     'monospace',
  },
  default: {
    display:  "Georgia, 'Times New Roman', serif",
    body:     "Nunito, system-ui, -apple-system, sans-serif",
    hand:     "Caveat, cursive",
    mono:     "monospace",
  },
});
