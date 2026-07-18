import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';

/**
 * Unified utility to request all necessary permissions for the app.
 * This includes Camera, Location (Fine and Coarse), and Notifications (Android 13+).
 */
export const requestAllPermissions = async () => {
  if (Platform.OS !== 'android') {
    // For iOS, handle permissions using react-native-permissions or specific library methods
    // Here we handle notifications as a primary example for iOS
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      return { notifications: enabled };
    } catch (error) {
      console.error('[Permissions] Error requesting iOS notifications:', error);
      return { notifications: false };
    }
  }

  try {
    const permissions: import('react-native').Permission[] = [
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ];

    // Android 13 (API 33) and above require explicit POST_NOTIFICATIONS permission
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      permissions.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }

    console.log('[Permissions] Requesting multiple permissions:', permissions);
    
    const granted = await PermissionsAndroid.requestMultiple(permissions);

    const result = {
      camera: granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED,
      locationFine: granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED,
      locationCoarse: granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED,
      notifications: (Platform.OS === 'android' && Platform.Version >= 33)
        ? granted[PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS] === PermissionsAndroid.RESULTS.GRANTED
        : true, // Assume true for older versions as it was default
    };

    console.log('[Permissions] Final results:', result);
    return result;
  } catch (err) {
    console.warn('[Permissions] Error requesting multiple permissions:', err);
    return null;
  }
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

/**
 * Checks and prompts the user to disable Battery Optimization 
 * and enable Autostart (Power Manager) to ensure background 
 * notifications are delivered even when the app is asleep.
 */
export const checkAndRequestBatteryOptimization = async () => {
  if (Platform.OS !== 'android') return;

  try {
    const brand = DeviceInfo.getBrand() || 'device';

    let instruction = '"Unrestricted" or "Not optimized"';
    const lowerBrand = brand.toLowerCase();
    if (lowerBrand.includes('xiaomi') || lowerBrand.includes('redmi') || lowerBrand.includes('poco')) {
      instruction = '"No restrictions"';
    } else if (lowerBrand.includes('samsung')) {
      instruction = '"Unrestricted"';
    } else if (lowerBrand.includes('oppo') || lowerBrand.includes('vivo') || lowerBrand.includes('oneplus')) {
      instruction = '"Don\'t optimize" or "Allow background activity"';
    }

    // 1. Check for basic Android Battery Optimization
    const batteryOptimizationEnabled = await notifee.isBatteryOptimizationEnabled();
    if (batteryOptimizationEnabled) {
      Alert.alert(
        `Battery Restrictions on your ${brand} ⚠️`,
        `Your ${brand} device restricts background features to save battery.\n\nTo receive notifications reliably even when you haven't opened the app for a few days, please disable battery optimization.\n\nClick "Open Settings", tap on "Battery" (or Battery usage), and change it to ${instruction}.`,
        [
          {
            text: 'Open Settings',
            onPress: async () => await Linking.openSettings(),
          },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: false }
      );
      // Wait for user to interact or return
      return; 
    }

    // 2. Check for device-specific Power Managers (like Xiaomi Autostart, Oppo, Vivo)
    // Since Android doesn't let us know if the user actually enabled it, we should only ask once.
    const hasPromptedAutostart = await AsyncStorage.getItem('hasPromptedAutostart');
    
    if (!hasPromptedAutostart) {
      if (lowerBrand.includes('samsung')) {
        await AsyncStorage.setItem('hasPromptedAutostart', 'true');
        return;
      }

      const powerManagerInfo = await notifee.getPowerManagerInfo();
      if (powerManagerInfo.activity) {
        Alert.alert(
          `Enable Autostart for your ${brand} 🚀`,
          `Your ${brand} device might aggressively restrict background apps to save battery.\n\nTo ensure you receive notifications on time, please allow this app to start in the background.\n\nIf you see an "Autostart" or "Background Activity" option in the next screen, please enable it.`,
          [
            {
              text: 'Open Settings',
              onPress: async () => {
                await AsyncStorage.setItem('hasPromptedAutostart', 'true');
                await notifee.openPowerManagerSettings();
              },
            },
            { 
              text: 'Skip / Not Applicable', 
              style: 'cancel',
              onPress: async () => {
                await AsyncStorage.setItem('hasPromptedAutostart', 'true');
              }
            },
          ],
          { cancelable: false }
        );
      }
    }
  } catch (err) {
    console.error('[Permissions] Error checking battery optimization:', err);
  }
};