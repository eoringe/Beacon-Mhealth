/**
 * Theme constants for consistent styling across the app
 */

export const Colors = {
  // Primary
  primary: '#2E5BFF',
  primaryLight: '#F0F5FF',
  primaryDark: '#1E3A8A',
  
  // Neutral
  white: '#FFFFFF',
  black: '#000000',
  background: '#F8F9FB',
  surface: '#FFFFFF',
  
  // Text
  textPrimary: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textDisabled: '#CCCCCC',
  
  // Border & Divider
  border: '#E5E5E5',
  divider: '#E0E0E0',
  
  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.4)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const Typography = {
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 13,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  // Font Weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const Layout = {
  // Screen horizontal padding
  screenPadding: Spacing.lg,
  
  // Header height
  headerHeight: 56,
  
  // Tab bar height (for safe area calculations)
  tabBarHeight: 60,
  
  // Input height
  inputHeight: 48,
  
  // Button height
  buttonHeight: 48,
  buttonHeightSmall: 36,
  buttonHeightLarge: 56,
};

export default {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
  Shadow,
  Layout,
};
