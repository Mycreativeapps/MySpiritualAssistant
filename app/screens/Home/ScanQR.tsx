import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Camera } from 'react-native-camera-kit';
import RNQRGenerator from 'rn-qr-generator';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Text, IconButton, ActivityIndicator } from 'react-native-paper';
import Icon from '@react-native-vector-icons/material-icons';
import { useThemeColors } from '../../config/styles';
import NavigationService from '../../navigation/NavigationService';
import adminService from '../../services/admin';

const ScanQR: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const colors = useThemeColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);

  const mode = route.params?.mode;

  const processQRData = (qrData: string) => {
    try {
      const parsedData = JSON.parse(qrData);

      if (parsedData.id) {
        if (mode === 'promote_admin') {
          // handlePromoteAdmin(parsedData.id, parsedData.name);
          NavigationService.navigate('PersonDetails', {
            personData: { ...parsedData, func: 'promote_admin' },
          });
        } else if (parsedData.name) {
          NavigationService.navigate('PersonDetails', {
            personData: { ...parsedData, func: 'assign_mentor' },
          });
        } else {
          Alert.alert('Invalid QR', 'No user name found in QR data.');
        }
      } else {
        Alert.alert(
          'Invalid QR',
          'This QR code does not contain a valid user ID.',
        );
      }
    } catch {
      Alert.alert('Error', 'Failed to parse QR code data.');
    }
  };

  const handlePromoteAdmin = (userId: string, userName: string) => {
    Alert.alert(
      'Promote to Admin',
      `Are you sure you want to promote ${userName || 'this user'} to Admin?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Promote',
          onPress: async () => {
            setLoading(true);

            try {
              await adminService.updateUserRole(userId, 'admin');

              Alert.alert('Success', `${userName} is now an Admin`, [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch {
              Alert.alert('Error', 'Failed to promote user to Admin.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const onReadCode = (event: any) => {
    if (scanned) return;

    const code = event?.nativeEvent?.codeStringValue;

    if (code) {
      setScanned(true);
      processQRData(code);
    }
  };

  const handleGalleryUpload = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
      });

      const imageUri = result.assets[0].uri;
      if (!imageUri) return;

      setLoading(true);
      try {
        const detectionResult = await RNQRGenerator.detect({
          uri: imageUri,
        });

        if (detectionResult.values && detectionResult.values.length > 0) {
          setScanned(true);
          processQRData(detectionResult.values[0]);
        } else {
          Alert.alert('No QR Code', 'Could not detect a QR code in the selected image.');
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to read QR code from image.');
        console.error('QR Detection Error:', err);
      } finally {
        setLoading(false);
      }
    } catch {
      Alert.alert('Error', 'Failed to open gallery.');
    }
  };

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        scanBarcode={true}
        onReadCode={onReadCode}
        frameColor="transparent"
        onError={e => console.log('Camera error:', e.nativeEvent.errorMessage)}
      />

      <View style={styles.overlay}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-back"
            iconColor="white"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Scan QR Code</Text>
            <Text style={styles.headerSubTitle}>
              {mode === 'promote_admin'
                ? 'Scan QR to promote as Admin'
                : 'Choose your mentor'}
            </Text>
          </View>

          <View style={{ width: 48 }} />
        </View>

        <View style={styles.centerContainer}>
          {loading ? (
            <View style={styles.scanFrame}>
              <ActivityIndicator size={60} color={colors.success} />
              <Text style={styles.instructionText}>Processing...</Text>
            </View>
          ) : (
            <>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
              </View>

              <Text style={styles.instructionText}>
                Align QR code within the frame
              </Text>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={handleGalleryUpload}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Icon name="image" size={24} color="white" />
            </View>

            <Text style={styles.actionText}>Upload from Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 10,
  },

  headerContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  backButton: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  headerSubTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'normal',
  },

  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
    marginBottom: 30,
  },

  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.success,
    borderWidth: 4,
  },

  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },

  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },

  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },

  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },

  instructionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },

  footer: {
    paddingBottom: 60,
    alignItems: 'center',
  },

  galleryButton: {
    alignItems: 'center',
    padding: 10,
  },

  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 8,
  },

  actionText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ScanQR;
