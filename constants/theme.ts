/**
 * Theme constants for consistent styling across the app
 */

export const Colors = {
  // Primary
  primary: '#1E63D8',
  primaryLight: '#D6E4FF',
  primaryDark: '#0D3C9D',

  // Neutral
  white: '#FFFFFF',
  black: '#000000',
  background: '#E6EFFF',
  surface: '#FFFFFF',

  // Text
  textPrimary: '#0F2744',
  textSecondary: '#3A5B82',
  textTertiary: '#7F9BBF',
  textDisabled: '#B0C4DE',

  // Border & Divider
  border: '#C2D6F3',
  divider: '#C2D6F3',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.4)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',

  // Chart Colors
  chartHeight: '#9C27B0', // Purple (distinct from WHO Median Green)
  chartWeight: '#2196F3',
  chartHeadCirc: '#FF9800',

  // Vaccination Status
  vaccineCompleted: '#4CAF50',
  vaccineUpcoming: '#FF9800',
  vaccineOverdue: '#F44336',

  // Appointment Status
  appointmentScheduled: '#2196F3',
  appointmentCompleted: '#4CAF50',
  appointmentCancelled: '#9E9E9E',
};

export const DarkColors = {
  // Primary
  primary: '#3B82F6',
  primaryLight: '#1E3A8A',
  primaryDark: '#60A5FA',

  // Neutral
  white: '#FFFFFF',
  black: '#000000',
  background: '#0B1120',
  surface: '#1E293B',

  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textDisabled: '#475569',

  // Border & Divider
  border: '#334155',
  divider: '#334155',

  // Status
  success: '#3FB950',
  warning: '#D29922',
  error: '#F85149',
  info: '#58A6FF',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',

  // Chart Colors
  chartHeight: '#BA68C8', // Lighter Purple for Dark Mode
  chartWeight: '#42A5F5',
  chartHeadCirc: '#FFA726',

  // Vaccination Status
  vaccineCompleted: '#66BB6A',
  vaccineUpcoming: '#FFA726',
  vaccineOverdue: '#EF5350',

  // Appointment Status
  appointmentScheduled: '#42A5F5',
  appointmentCompleted: '#66BB6A',
  appointmentCancelled: '#BDBDBD',
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
