/**
 * React Native App
 * Everything starts from the entrypoint
 */
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Modal,
  View,
  Text,
  Platform,
  UIManager,
} from 'react-native';
import Navigator from './navigation';
import { Provider as PaperProvider } from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import { requestUserPermission } from './services/firebaseService';
import { requestAllPermissions } from './utils/permissions';

import {
  PaperThemeDefault,
  PaperThemeDark,
  CombinedDefaultTheme,
  CombinedDarkTheme,
} from './config/theme';
import { NotifierWrapper } from 'react-native-notifier';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  initialWindowMetrics,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { AppStoreProvider, useAppStore } from './store';
import MaterialIcon from '@react-native-vector-icons/material-icons';
import { syncTimezone } from './services/auth';
import { useUserStore } from './store';

const NavigatorWithInsets: React.FC = () => {
  return (
    <GestureHandlerRootView>
      <NotifierWrapper translucentStatusBar={true} useRNScreensOverlay={true}>
        <Navigator theme={CombinedDarkTheme} />
      </NotifierWrapper>
    </GestureHandlerRootView>
  );
};

const RootNavigation: React.FC = () => {
  return (
    <PaperProvider
      theme={PaperThemeDark}
      settings={{
        icon: props => <MaterialIcon {...props} />,
      }}
    >
      <NavigatorWithInsets />
    </PaperProvider>
  );
};

const AppContent: React.FC = () => {
  const netStatus = useAppStore(state => state.netStatus);
  const hasHydrated = useAppStore(state => state.hasHydrated);
  const setNetStatus = useAppStore(state => state.setNetStatus);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS === 'android') {
      if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
    }

    // Request all necessary permissions on launch
    requestAllPermissions();

    // Sync timezone if user is logged in
    const user = useUserStore.getState().user;
    if (user && user.token) {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) {
        syncTimezone(tz).catch(err =>
          console.error('Failed to auto-sync timezone on launch:', err),
        );
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetStatus(!state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, [setNetStatus]);

  if (!hasHydrated) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingBottom: insets.bottom }}>
      <RootNavigation />
      <Modal visible={netStatus} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.alertText}>No Internet Access</Text>
            <Text style={styles.alertText1}>
              Please check your internet connection.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const Entrypoint: React.FC = () => {
  return (
    <AppStoreProvider>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <AppContent />
      </SafeAreaProvider>
    </AppStoreProvider>
  );
};

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    height: 100,
    width: '90%',
    borderWidth: 1,
    alignSelf: 'center',
  },
  alertText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    margin: '5%',
  },
  alertText1: {
    fontSize: 16,
    color: '#333',
    marginLeft: '7%',
  },
});
export default Entrypoint;
