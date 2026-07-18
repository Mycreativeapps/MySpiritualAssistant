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
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Navigator from './navigation';
import { Provider as PaperProvider } from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import { requestUserPermission } from './services/firebaseService';
import { requestAllPermissions, checkAndRequestBatteryOptimization } from './utils/permissions';

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

    // Auto-Logout Check
    const checkInactivity = async () => {
      try {
        const lastOpenTime = await AsyncStorage.getItem('LAST_APP_OPEN_TIME');
        const currentTime = Date.now();
        
        if (lastOpenTime) {
          const diffMs = currentTime - parseInt(lastOpenTime, 10);
          const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
          
          if (diffMs > sevenDaysMs) {
            const user = useUserStore.getState().user;
            if (user && user.token) {
                // Call backend logout API silently if possible, but local clear is most important
                try {
                  const API_BASE = require('./services/Config').API_BASE_URL();
                  await fetch(`${API_BASE}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                    body: JSON.stringify({ refresh_token: user.refreshToken })
                  });
                } catch (e) {
                  // Ignore backend logout errors if offline
                }

                useUserStore.getState().clearUser();
                Alert.alert(
                  "Session Expired",
                  "You have been inactive for more than 7 days. Please login again to continue.",
                  [{ text: "OK" }]
                );
                return;
            }
          }
        }
        await AsyncStorage.setItem('LAST_APP_OPEN_TIME', currentTime.toString());
      } catch (err) {
        console.error("Error checking inactivity:", err);
      }
    };
    checkInactivity();

    // Request all necessary permissions on launch
    requestAllPermissions().then(() => {
      // After basic permissions, check battery optimization to ensure push reliability
      setTimeout(() => {
        checkAndRequestBatteryOptimization();
      }, 2000); // Small delay to let initial permission modals pass
    });

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
