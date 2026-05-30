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
      paddingBottom: 40,
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 24,
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontFamily: AppStyle.fonts.FONT_BOLD,
      color: colors.text,
      marginTop: 16,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: AppStyle.fonts.FONT_REGULAR,
      color: colors.secondary,
      marginTop: 8,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    form: {
      paddingHorizontal: 24,
      marginTop: 20,
    },
    input: {
      marginBottom: 4,
      backgroundColor: colors.surface,
    },
    actionButton: {
      marginTop: 16,
      borderRadius: 12,
    },
    actionButtonContent: {
      height: 48,
    },
    resetButton: {
      marginTop: 24,
      paddingVertical: 6,
      borderRadius: 12,
    },
    footerLink: {
      marginTop: 24,
      alignItems: 'center',
    },
    footerText: {
      color: colors.primary,
      fontFamily: AppStyle.fonts.FONT_MEDIUM,
      textDecorationLine: 'underline',
    },
    otpContainer: {
      marginTop: 8,
    },
  });

export default createStyles;
