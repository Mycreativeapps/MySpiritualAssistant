import {
  MD3DarkTheme as PaperDarkTheme,
  MD3LightTheme as PaperDefaultTheme,
} from 'react-native-paper';
import {
  DefaultTheme as NavigationDefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from '@react-navigation/native';

import AppStyles from './styles';

export const PaperThemeDefault = {
  ...PaperDefaultTheme,
  colors: {
    ...PaperDefaultTheme.colors,
    primary: AppStyles.light.primary,
    onPrimary: AppStyles.light.white,
    secondary: AppStyles.light.secondary,
    background: AppStyles.light.background,
    surface: AppStyles.light.surface,
    error: AppStyles.light.error,
    text: AppStyles.light.text,
  },
};

export const PaperThemeDark = {
  ...PaperDarkTheme,
  colors: {
    ...PaperDarkTheme.colors,
    primary: AppStyles.dark.primary,
    onPrimary: AppStyles.dark.white,
    secondary: AppStyles.dark.secondary,
    background: AppStyles.dark.background,
    surface: AppStyles.dark.surface,
    error: AppStyles.dark.error,
    text: AppStyles.dark.text,
  },
};

export const CombinedDefaultTheme = {
  ...PaperThemeDefault,
  ...NavigationDefaultTheme,
  colors: {
    ...PaperThemeDefault.colors,
    ...NavigationDefaultTheme.colors,
    primary: AppStyles.light.primary,
    background: AppStyles.light.background,
    card: AppStyles.light.card,
    text: AppStyles.light.text,
    border: AppStyles.light.border,
  },
};

export const CombinedDarkTheme = {
  ...PaperThemeDark,
  ...NavigationDarkTheme,
  colors: {
    ...PaperThemeDark.colors,
    ...NavigationDarkTheme.colors,
    background: AppStyles.dark.background,
    card: AppStyles.dark.card,
    text: AppStyles.dark.text,
    border: AppStyles.dark.border,
  },
};
