import { StyleSheet } from 'react-native';
import AppStyle from '../../../config/styles';

type ThemeColors = typeof AppStyle.light;

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 32,
      justifyContent: 'center',
      paddingBottom: 40,
    },
    header: {
      alignItems: 'center',
      marginBottom: 48,
    },
    logoBadge: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    logoText: {
      color: colors.white,
      fontFamily: AppStyle.fonts.FONT_BOLD,
      fontSize: 32,
    },
    title: {
      fontFamily: AppStyle.fonts.ROBOTO_FONT_REGULAR,
      fontSize: 28,
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontFamily: AppStyle.fonts.FONT_REGULAR,
      fontSize: 16,
      color: colors.subtext,
    },
    form: {
      gap: 16,
    },
    input: {
      backgroundColor: colors.surface,
    },
    loginButton: {
      marginTop: 8,
      borderRadius: 12,
      paddingVertical: 6,
    },
    forgotPasswordLink: {
      alignItems: 'center',
      marginTop: 16,
    },
    forgotPasswordText: {
      fontFamily: AppStyle.fonts.FONT_MEDIUM,
      fontSize: 14,
      color: colors.primary,
      textDecorationLine: 'underline',
    },
    loginButtonLabel: {
      fontFamily: AppStyle.fonts.FONT_BOLD,
      fontSize: 16,
    },
    footerLink: {
      marginTop: 24,
      alignItems: 'center',
    },
    footerText: {
      fontFamily: AppStyle.fonts.FONT_MEDIUM,
      fontSize: 14,
      color: colors.primary,
      textDecorationLine: 'underline',
    },
    logo: {
      width: '100%',
      height: '100%',
      borderRadius: 100,
    },
  });

export default createStyles;
