import { ThemeConfig, ThemePreset } from '../types';

export const THEME_PRESETS: Record<ThemePreset, ThemeConfig> = {
  'system': {
    id: 'system',
    name: 'System',
    bgColor: '#18181b',
    bgOpacity: 85,
    backdropBlur: 20,
    textColor: '#f4f4f5',
    textSecondaryColor: '#a1a1aa',
    accentColor: '#38bdf8',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    rowSurfaceOpacity: 6,
  },
  'dark': {
    id: 'dark',
    name: 'Dark',
    bgColor: '#131418',
    bgOpacity: 88,
    backdropBlur: 20,
    textColor: '#f4f4f5',
    textSecondaryColor: '#94a3b8',
    accentColor: '#38bdf8',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    rowSurfaceOpacity: 6,
  },
  'light': {
    id: 'light',
    name: 'Light',
    bgColor: '#ffffff',
    bgOpacity: 92,
    backdropBlur: 20,
    textColor: '#0f172a',
    textSecondaryColor: '#64748b',
    accentColor: '#2563eb',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    rowSurfaceOpacity: 4,
  },
  'transparent': {
    id: 'transparent',
    name: 'Transparent (Glass)',
    bgColor: '#101216',
    bgOpacity: 50,
    backdropBlur: 26,
    textColor: '#f8fafc',
    textSecondaryColor: '#94a3b8',
    accentColor: '#38bdf8',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    rowSurfaceOpacity: 12, // slightly higher local row surface for guaranteed text readability
  },
};

export function resolveTheme(preset: ThemePreset, customOpacity?: number, customBlur?: number): ThemeConfig {
  let base: ThemeConfig;

  if (preset === 'system') {
    const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    base = isDark ? THEME_PRESETS['dark'] : THEME_PRESETS['light'];
  } else {
    base = THEME_PRESETS[preset] || THEME_PRESETS['dark'];
  }

  return {
    ...base,
    bgOpacity: customOpacity ?? base.bgOpacity,
    backdropBlur: customBlur ?? base.backdropBlur,
  };
}
