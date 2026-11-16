import { Platform, ViewStyle } from 'react-native';

// Système de design commun aux deux versions (mêmes valeurs dans lib/core/theme.dart).
export const colors = {
  primary: '#0B6B5B',
  primaryDark: '#074B40',
  primaryLight: '#D4E4DE',
  primarySoft: '#EAF4F0',
  accent: '#F2A541',
  accentSoft: '#FDF1DE',
  text: '#14212B',
  muted: '#64707B',
  subtle: '#98A2AB',
  border: '#E3E8EB',
  background: '#FFFFFF',
  canvas: '#F4F6F5',
  surface: '#FFFFFF',
  danger: '#C4362C',
  dangerSoft: '#FDECEA',
  success: '#1F8A5B',
  overlay: 'rgba(20,33,43,0.55)',
};

export const radius = { sm: 10, input: 14, md: 14, card: 18, lg: 22, xl: 28, pill: 999 };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

export const font = {
  h1: { fontSize: 28, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.3 },
  h3: { fontSize: 17, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  small: { fontSize: 13, color: colors.muted },
  label: { fontSize: 13, fontWeight: '600' as const, color: colors.muted },
};

// Ombre douce, identique sur iOS, Android et web.
export function shadow(level: 1 | 2 | 3 = 1): ViewStyle {
  const y = level * 2;
  const blur = level * 6;
  const opacity = 0.06 + level * 0.02;
  if (Platform.OS === 'android') return { elevation: level * 2 };
  if (Platform.OS === 'web') {
    return { boxShadow: `0px ${y}px ${blur * 2}px rgba(20,33,43,${opacity})` } as ViewStyle;
  }
  return {
    shadowColor: '#14212B',
    shadowOpacity: opacity,
    shadowRadius: blur,
    shadowOffset: { width: 0, height: y },
  };
}
