export const Colors = {
  // Backgrounds
  background: '#0B0F19',
  surface: '#131B2E',
  surfaceHover: '#1B263E',
  surfaceCard: '#162035',
  surfaceBorder: '#23314E',

  // Primaries & Accents
  primary: '#6366F1',       // Electric Indigo
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  secondary: '#06B6D4',     // Cyber Cyan
  secondaryLight: '#22D3EE',
  accent: '#A855F7',        // Purple

  // Status & Feedback
  success: '#10B981',       // Emerald Green
  successBg: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B',       // Amber
  warningBg: 'rgba(245, 158, 11, 0.15)',
  danger: '#EF4444',        // Rose
  dangerBg: 'rgba(239, 68, 68, 0.15)',
  info: '#3B82F6',

  // Typography
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textDisabled: '#475569',
  textWhite: '#FFFFFF',

  // UI Elements
  border: '#1E293B',
  inputBg: '#0F172A',
  badgeBg: '#1E293B',
  star: '#FBBF24',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Typography = {
  h1: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary },
  h2: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  h3: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  body: { fontSize: 14, color: Colors.textSecondary },
  caption: { fontSize: 12, color: Colors.textMuted },
  badge: { fontSize: 11, fontWeight: '600' },
};
