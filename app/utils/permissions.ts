import { PermissionsAndroid, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';

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
    const permissions = [
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ];

    // Android 13 (API 33) and above require explicit POST_NOTIFICATIONS permission
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      permissions.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }

    // Android 12 (API 31) and above require SCHEDULE_EXACT_ALARM for exact notifications
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      permissions.push('android.permission.SCHEDULE_EXACT_ALARM');
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
      exactAlarm: (Platform.OS === 'android' && Platform.Version >= 31)
        ? granted['android.permission.SCHEDULE_EXACT_ALARM'] === PermissionsAndroid.RESULTS.GRANTED
        : true,
    };

    console.log('[Permissions] Final results:', result);
    return result;
  } catch (err) {
    console.warn('[Permissions] Error requesting multiple permissions:', err);
    return null;
  }
};
