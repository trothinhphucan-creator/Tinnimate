/**
 * Violet Serenity Design System — TinniMate
 * Deep violet/indigo wellness theme with amber accents
 */

import { Platform } from 'react-native';

// ───────────────────────────────────────────────
// Violet Serenity — Core Design Tokens
// ───────────────────────────────────────────────
export const V = {
  // ── Backgrounds / Surfaces ──
  bg:              '#151120',   // Main app background
  bgDim:           '#100C1A',   // Deepest layer (tab bar, modals)
  surface:         '#1D1928',   // Cards, secondary containers
  surfaceHigh:     '#2C2837',   // Elevated cards, interactive elements
  surfaceHighest:  '#373243',   // Highest elevation
  surfaceBright:   '#3B3747',   // Bright surface accent

  // ── Text ──
  textPrimary:     '#E7DFF5',   // Headings, main text
  textSecondary:   '#C9C4D3',   // Body, descriptions
  textMuted:       '#938F9C',   // Captions, timestamps
  textDim:         '#484551',   // Disabled, placeholders

  // ── Primary — Amber Beacon ──
  primary:             '#FBBC00',   // CTA buttons
  primaryDark:         '#402D00',   // CTA text
  primaryContainer:    '#4E3800',   // Primary container tint
  primaryFixed:        '#FFDFA0',   // Light amber

  // ── Secondary — Lavender ──
  secondary:           '#C7BFFF',   // Active states, links
  secondaryContainer:  '#4533AD',   // Active chip/tab bg
  secondaryDim:        '#5B4BC4',   // Mid purple
  secondaryFixed:      '#E4DFFF',   // Very light lavender

  // ── Tertiary — Warm Peach ──
  tertiary:            '#FFB77F',   // Warm highlight accents
  tertiaryContainer:   '#5E2F00',

  // ── Borders ──
  outline:             '#938F9C',   // Visible borders
  outlineVariant:      '#484551',   // Subtle borders
  borderCard:          '#373243',   // Card borders

  // ── Tab Bar ──
  tabActive:     '#C7BFFF',
  tabInactive:   '#484551',
  tabBg:         'rgba(16,12,26,0.95)',
  tabBgSolid:    '#100C1A',
  tabBorder:     '#1D1928',

  // ── Status ──
  error:      '#FFB4AB',
  errorBg:    '#93000A',
  success:    '#94D3C1',
  successBg:  '#065043',
  warning:    '#FBBC00',

  // ── Glassmorphism ──
  glass:     'rgba(55,50,67,0.60)',  // 60% surfaceHighest
  glassDark: 'rgba(29,25,40,0.90)',  // 90% surface
} as const;

// ───────────────────────────────────────────────
// Legacy Colors export (backwards compat)
// ───────────────────────────────────────────────
export const Colors = {
  light: {
    text: V.textPrimary,
    background: '#F6F6F8',
    tint: V.secondaryContainer,
    icon: V.textMuted,
    tabIconDefault: V.tabInactive,
    tabIconSelected: V.secondaryContainer,
  },
  dark: {
    text: V.textPrimary,
    background: V.bg,
    tint: V.secondary,
    icon: V.textMuted,
    tabIconDefault: V.tabInactive,
    tabIconSelected: V.tabActive,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
