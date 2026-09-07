/**
 * Shadcn-inspired Design Tokens for React Native
 * Clean Zinc/Slate neutral scale with purposeful athletic accents.
 */

export const colors = {
  // Base neutrals (Zinc scale)
  white: '#ffffff',
  black: '#000000',

  background: '#fafafa',
  foreground: '#09090b',

  // Card & Surface
  card: '#ffffff',
  cardForeground: '#09090b',
  popover: '#ffffff',
  popoverForeground: '#09090b',

  // Primary Action (Deep Slate/Zinc)
  primary: '#18181b',
  primaryForeground: '#fafafa',

  // Secondary Surface / Button
  secondary: '#f4f4f5',
  secondaryForeground: '#18181b',

  // Muted Content
  muted: '#f4f4f5',
  mutedForeground: '#71717a',

  // Subtle Borders & Hairlines
  border: '#e4e4e7',
  borderDark: '#d4d4d8',
  input: '#e4e4e7',
  ring: '#18181b',

  // Athletic Accent (Sky Blue / Cyan for highlights)
  accent: '#0284c7',
  accentForeground: '#ffffff',
  accentSoft: '#e0f2fe',
  accentSubtle: '#f0f9ff',

  // Semantic
  success: '#16a34a',
  successSoft: '#dcfce7',
  successText: '#15803d',
  successBorder: '#bbf7d0',

  warning: '#f59e0b',
  warningSoft: '#fef3c7',
  warningText: '#b45309',
  warningBorder: '#fde68a',

  destructive: '#ef4444',
  destructiveSoft: '#fee2e2',
  destructiveText: '#b91c1c',
  destructiveBorder: '#fecaca',

  // Dark variant tokens (for camera / telemetry / broadcast overlay)
  dark: {
    background: '#09090b',
    surface: '#121215',
    card: '#18181b',
    border: '#27272a',
    muted: '#27272a',
    text: '#fafafa',
    textMuted: '#a1a1aa',
    accent: '#38bdf8',
  },
};

export const radii = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const typography = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
};

export const shadows = {
  none: {
    elevation: 0,
    shadowColor: 'transparent',
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 20,
    elevation: 6,
  },
};
