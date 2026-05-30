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
      paddingTop: 40,
      paddingBottom: 24,
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 16,
    },
    subtitle: {
      fontSize: 16,
      color: colors.secondary,
      marginTop: 8,
      textAlign: 'center',
    },
    form: {
      paddingHorizontal: 24,
    },
    input: {
      marginBottom: 4,
    },
    pickerContainer: {
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    registerButton: {
      marginTop: 16,
      paddingVertical: 6,
      borderRadius: 12,
    },
    registerButtonLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    verifiedEmailContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.success,
    },
    verifiedEmailLabel: {
      fontSize: 12,
      color: colors.secondary,
      fontWeight: '600',
    },
    verifiedEmailText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: 'bold',
    },
    actionButton: {
      marginTop: 8,
      borderRadius: 12,
    },
    actionButtonContent: {
      height: 48,
    },
    phoneRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 4,
    },
    countryCodeInput: {
      width: 80,
    },
    phoneInput: {
      flex: 1,
    },
    footerLink: {
      marginTop: 24,
      alignItems: 'center',
    },
    footerText: {
      color: colors.primary,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
  });

export default createStyles;
