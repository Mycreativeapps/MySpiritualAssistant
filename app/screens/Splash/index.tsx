import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, Image, StatusBar, Text, View } from 'react-native';
import AppStyle, { useThemeColors } from '../../config/styles';
import NavigationService from '../../navigation/NavigationService';
import createStyles from './styles';
import { useUserStore } from '../../store';
import { Logo } from '../../assets/images/exports';

const Splash: React.FC = () => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const user = useUserStore(state => state.user);
  const hasHydrated = useUserStore(state => state.hasHydrated);

  useEffect(() => {
    if (hasHydrated) {
      const timer = setTimeout(() => {
        if (user?.token) {
          NavigationService.replace('MainApp', {
            screen: 'Home',
          });
        } else {
          NavigationService.replace('Login');
        }
      }, 3000); // 2s delay for better branding visibility

      return () => clearTimeout(timer);
    }
  }, [hasHydrated, user]);

  return (
    <View style={styles.container}>
      <StatusBar
        translucent={true}
        backgroundColor="transparent"
        barStyle={
          colors.background === AppStyle.dark.background
            ? 'light-content'
            : 'dark-content'
        }
      />

      <View style={styles.brandWrap}>
        <View style={[styles.badge, { backgroundColor: 'transparent' }]}>
          <Image source={Logo} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.title}>My Spiritual Assistant</Text>
        <Text style={styles.subtitle}>
          Divine guidance for your spiritual journey.
        </Text>
      </View>
      <Text style={styles.footer}>Preparing your workspace...</Text>
    </View>
  );
};

export default Splash;
