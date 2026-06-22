/**
 * @fileOverview Theme color palette for light/dark modes
 * Light: Clean, minimal, focus work
 * Dark: Energetic, music-focused, gradient accents
 */

export const THEME_COLORS = {
  light: {
    bg: {
      primary: '#FAFAFA',      // Main background
      secondary: '#FFFFFF',    // Card/surface background
      tertiary: '#F0F0F0',     // Subtle backgrounds
    },
    text: {
      primary: '#1A1A1A',      // Main text
      secondary: '#666666',    // Secondary text
      tertiary: '#999999',     // Tertiary/hint text
    },
    border: {
      primary: '#E5E5E5',      // Main borders
      secondary: '#DDDDDD',    // Hover borders
    },
    accent: {
      primary: '#7C3AED',      // Violet accent (solid)
      hover: '#6D28D9',        // Darker violet
    },
  },
  dark: {
    bg: {
      primary: '#0F0F0F',      // Main background
      secondary: '#1A1A1A',    // Card/surface background
      tertiary: '#2A2A2A',     // Subtle backgrounds
    },
    text: {
      primary: '#EFEFEF',      // Main text
      secondary: '#AAAAAA',    // Secondary text
      tertiary: '#777777',     // Tertiary/hint text
    },
    border: {
      primary: '#2A2A2A',      // Main borders
      secondary: '#333333',    // Hover borders
    },
    accent: {
      primary: '#8B5CF6',      // Violet start (gradient)
      secondary: '#A78BFA',    // Violet end (gradient)
    },
    gradient: 'linear-gradient(135deg, #8B5CF6, #A78BFA)', // Button gradient
  },
} as const;

export type ThemeMode = 'light' | 'dark';

export const getThemeClasses = (theme: ThemeMode) => ({
  container: theme === 'light'
    ? 'bg-white border border-gray-200'
    : 'bg-neutral-950 border border-neutral-800',

  button: {
    primary: theme === 'light'
      ? 'bg-violet-600 hover:bg-violet-700 text-white'
      : 'bg-violet-600 hover:bg-violet-500 text-white',
  },

  input: {
    border: theme === 'light'
      ? 'border-gray-300 bg-white text-gray-900'
      : 'border-neutral-700 bg-neutral-900 text-neutral-100',
  },

  text: {
    primary: theme === 'light' ? 'text-gray-900' : 'text-neutral-100',
    secondary: theme === 'light' ? 'text-gray-600' : 'text-neutral-400',
  },
});
