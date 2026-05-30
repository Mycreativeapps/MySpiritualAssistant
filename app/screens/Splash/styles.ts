import { StyleSheet } from 'react-native';
import AppStyle from '../../config/styles';

type ThemeColors = typeof AppStyle.light;

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 24,
    },
    brandWrap: {
      alignItems: 'center',
      marginBottom: 66,
    },
    badge: {
      width: 200,
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    logo: {
      width: '100%',
      height: '100%',
      borderRadius: 100,
    },
    title: {
      fontFamily: AppStyle.fonts.FONT_BOLD,
      fontSize: 30,
      color: colors.text,
      letterSpacing: 0.4,
      marginBottom: 6,
    },
    subtitle: {
      fontFamily: AppStyle.fonts.FONT_MEDIUM,
      fontSize: 15,
      color: colors.subtext,
      textAlign: 'center',
    },
    footer: {
      position: 'absolute',
      bottom: 48,
      fontFamily: AppStyle.fonts.FONT_REGULAR,
      fontSize: 13,
      color: colors.subtext,
    },
  });

export default createStyles;
