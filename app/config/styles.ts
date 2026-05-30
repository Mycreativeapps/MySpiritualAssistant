/*
 * Provides universal color configs used in the app.
 * Provides universal fonts used in the app.
 */
import { useColorScheme } from 'react-native';

const palette = {
  // New clean names from design
  primaryLight: '#402E96',
  primaryHoverLight: '#2E1D7F',
  secondaryLight: '#192847',

  primaryDark: '#7961E4',
  primaryHoverDark: '#5D45D3',
  secondaryDark: 'rgba(255, 255, 255, 0.85)',

  white: '#FFFFFF',
  black: '#000000',
  grey: '#8E99A4',
  lightGrey: '#DEDEDE',
  softDarkGrey: '#121212', // Base background for dark mode
  surfaceDark: '#1E1E1E', // Surface color for dark mode
  darkGrey: '#536476',
  green: '#00CC18',
  red: '#FF0000',
  orange: '#F59700',
  orangeDark: '#D44200',
  blueWhale: '#082B4A',
  greenShade: '#2CC9AB',
  grey90: '#536476',
  grey70: '#7F92A3',
  grey30: '#EBEEF3',
  orangeSave: '#f86c04',
  underline: '#0BA6F6',
  link: '#402E96',
  placeholder: '#111111',
  separator: '#d4d4d4',
  transparentBlack: 'rgba(0, 0, 0, 0.7)',
  transparentGrey: 'rgba(67, 85, 85, 0.7)',
  loaderBg: '#00000040',
  gradientTop: '#D7E0E7',

  // Legacy names for backward compatibility (updated to designers' primary)
  COLOR_PRIMARY: '#402E96',
  COLOR_BG: '#DEDEDE',
  COLOR_WHITE: '#FFFFFF',
  COLOR_BLACK: '#000000',
  COLOR_GREY: '#8E99A4',
  COLOR_GREEN: '#00CC18',
  COLOR_PLACEHOLDER: '#111111',
  COLOR_GREY_WHITE: '#fafafa',
  COLOR_DARK_SEPERATOR: '#d4d4d4',
  COLOR_BLACK_TRANSP: 'rgba(0, 0, 0, 0.7)',
  COLOR_GREY_TRANSP: 'rgba(67, 85, 85, 0.7)',
  PRIMAR_COLOR: '#402E96',
  SECONDARY_COLOR: '#192847',
  ORANGE_PEEL: '#F59700',
  ORANGE_DARK: '#D44200',
  BLUE_WHALE: '#082B4A',
  GREEN_SHADE: '#2CC9AB',
  GREY_90: '#536476',
  GREY_70: '#7F92A3',
  GREY_30: '#EBEEF3',
  ORANGE_50: '#F59700',
  DARK_ORANGE_90: '#D41F00',
  ORANGE_SAVE: '#f86c04',
  PRIMARY_BUTTON_COLOR: '#402E96',
  TITLE_COLOR: '#082B4A',
  SKIP_COLOR: '#D7E0E7',
  UNDERLINECOLOR: '#0BA6F6',
  COLOR_LOADER_BG: '#00000040',
  COLOR_RED: '#FF0000',
  GRADIENT_TOP: '#D7E0E7',
};

const light = {
  ...palette,
  primary: palette.primaryLight,
  primaryHover: palette.primaryHoverLight,
  secondary: palette.secondaryLight,
  background: '#F5F7FA',
  surface: palette.white,
  header: palette.primaryLight,
  text: palette.black,
  subtext: palette.grey,
  border: '#E1E8ED',
  card: palette.white,
  error: palette.red,
  success: palette.green,
  // Chart-specific tokens
  chartBar: '#5295e1', // Bar fill color
  chartAxis: '#003e85', // Axis lines color
  chartLabel: '#333333', // Axis label text
  chartTitle: '#000080', // Section title (navy blue)
  chartSectionBg: '#f8f8f8', // Chart section card background
  chartAccent: '#4191F7', // Pie slice accent / highlight
  tableBorder: '#000000', // Table outer border
  tableRowBorder: '#333333', // Table inner row border
  kanbanTabBg: '#e3f2fd', // Kanban non-qualify tab bg
  kanbanQualifyBg: '#e6ffe6', // Kanban qualify tab bg
  kanbanTabHover: '#67beff', // Kanban tab hover non-qualify
  kanbanQualifyHover: '#86fe86', // Kanban tab hover qualify
  grey30: '#EBEEF3', // Dropdown active row highlight (light)
  iconAction: '#1F69F3', // Action icons (eye, edit, phone, attach) — light
  iconMeet: '#FF3B30', // Meet/video icon — light
  iconComment: '#1811f0', // Comments icon — light
};

export type ThemeColors = typeof light;

const dark = {
  ...palette,
  primary: palette.primaryDark,
  primaryHover: palette.primaryHoverDark,
  secondary: palette.secondaryDark,
  background: '#17212B',
  surface: '#1E2B38',
  header: palette.primaryDark,
  text: palette.white,
  subtext: palette.grey70,
  border: '#232E3C',
  card: '#1E2B38',
  error: '#CF6679',
  success: palette.greenShade,
  placeholder: palette.grey,
  // Chart-specific tokens (dark-adjusted)
  chartBar: '#7961E4', // Dark primary as bar fill
  chartAxis: '#7961E4', // Axis lines — dark primary
  chartLabel: '#A0A8B8', // Axis label text — muted on dark
  chartTitle: '#A0B4FF', // Section title — light blue on dark
  chartSectionBg: '#1E2B38', // Chart section card background = surface
  chartAccent: '#7961E4', // Pie slice accent
  tableBorder: '#232E3C', // Table outer border
  tableRowBorder: '#232E3C', // Table inner row border
  kanbanTabBg: '#1E2D40', // Kanban non-qualify tab bg
  kanbanQualifyBg: '#1A2E22', // Kanban qualify tab bg
  kanbanTabHover: '#2A3F58', // Kanban tab hover non-qualify
  kanbanQualifyHover: '#1F3D28', // Kanban tab hover qualify
  grey30: '#2A3A4A', // Dropdown active row highlight (dark)
  iconAction: '#63A7FF', // Action icons — brighter blue for dark bg contrast
  iconMeet: '#FF6B6B', // Meet/video icon — softer red on dark bg
  iconComment: '#C084FC', // Comments icon — vivid lavender, visible on dark cards
};

/**
 * Theme-aware color proxy.
 * Intercepts every property access and returns the correct
 * light or dark value based on the current system theme.
 *
 * Usage (anywhere — no hook needed):
 *   AppStyle.color.primary     → dark primary  (#7961E4) when dark mode
 *                              → light primary (#402E96) when light mode
 *   AppStyle.color.background  → auto-resolved
 *   AppStyle.color.white       → always white (not theme-specific, falls back to palette)
 */
const themeColor = new Proxy({} as typeof light & typeof palette, {
  get(_target, key: string) {
    const { Appearance } = require('react-native');
    const scheme = Appearance.getColorScheme();
    const themeTokens = scheme === 'dark' ? dark : light;
    // Theme token first (e.g. primary, background, surface, text…)
    // then fall back to palette static values (e.g. white, black, green…)
    return (themeTokens as any)[key] ?? (palette as any)[key];
  },
});

const AppStyle = {
  /**
   * Smart color object — reads system theme at access time.
   * AppStyle.color.primary → dark or light primary automatically.
   * AppStyle.color.white   → always white (palette fallback).
   */
  color: themeColor,
  // Keep explicit light/dark for cases where you need a specific theme
  light,
  dark,
  fonts: {
    FONT_REGULAR: 'Raleway-Regular',
    FONT_MEDIUM: 'Raleway-Medium',
    FONT_LIGHT: 'Raleway-Light',
    FONT_SEMIBOLD: 'Raleway-SemiBold',
    FONT_BOLD: 'Raleway-Bold',
    FONT_ITALIC: 'Raleway-Italic',
    ROBOTO_FONT_REGULAR: 'Roboto-Regular',
    ROBOTO_FONT_MEDIUM: 'Roboto-Medium',
    ROBOTO_FONT_LIGHT: 'Roboto-Light',
    ROBOTO_FONT_ITALIC: 'Roboto-Italic',
    ROBOTO_FONT_BOLD: 'Roboto-Bold',
  },
};

/**
 * Synchronous theme color getter.
 * For use outside components when you need the full theme object.
 */
export const getThemeColors = () => {
  const { Appearance } = require('react-native');
  return Appearance.getColorScheme() === 'dark' ? dark : dark;
};

export const useThemeColors = () => {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : dark;
};

export default AppStyle;
