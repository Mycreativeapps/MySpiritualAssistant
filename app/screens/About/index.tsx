import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
  RefreshControl,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  Text,
  Avatar,
  Button,
  Modal,
  Portal,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import Icon from '@react-native-vector-icons/material-icons';
import { useThemeColors } from '../../config/styles';
import { useUserStore } from '../../store';
import NavigationService from '../../navigation/NavigationService';
import createStyles from './styles';
import { uploadSingleFile } from '../../services/upload';
import { updateProfile } from '../../services/auth';
import BhaktiScoreCard from '../../components/Dashboard/BhaktiScoreCard';
import WeeklyProgress from '../../components/Dashboard/WeeklyProgress';
import { useFocusEffect } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import QRCode from 'react-native-qrcode-svg';
import Share from 'react-native-share';

const About: React.FC = () => {
  console.log('QRCode', QRCode);

  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const user = useUserStore(state => state.user);
  const clearUser = useUserStore(state => state.clearUser);
  const updateUser = useUserStore(state => state.updateUser);

  const [refreshing, setRefreshing] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  const qrRef = useRef<any>(null);
  const {
    profileStats,
    scoreHistory,
    refreshProfile,
    fetchScoreHistory,
    loading,
  } = useUserStore();

  // Use useEffect for initial mount to be as fast as AdminDashboard
  useEffect(() => {
    refreshProfile();
    fetchScoreHistory();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshProfile(), fetchScoreHistory()]);
    setRefreshing(false);
  };

  const showQr = () => setQrVisible(true);
  const hideQr = () => setQrVisible(false);

  const handleShareQR = () => {
    if (qrRef.current) {
      setShareLoading(true);
      try {
        qrRef.current.toDataURL((data: string) => {
          if (!data || typeof data !== 'string') {
            console.error('QR data missing or invalid');
            setShareLoading(false);
            return;
          }

          const cleanBase64 = data.includes(',') ? data.split(',')[1] : data;
          const finalUrl = `data:image/png;base64,${cleanBase64.replace(
            /\s/g,
            '',
          )}`;

          const shareOptions = {
            title: 'My Profile QR',
            message: 'Check out my profile QR code!',
            url: finalUrl,
            type: 'image/png',
            filename: 'iskcon_qr',
            failOnCancel: false,
            useInternalStorage: true,
          };

          Share.open(shareOptions)
            .then(res => {
              console.log('Share success:', res);
            })
            .catch(err => {
              const isDismissed =
                err?.dismissedAction ||
                err?.message === 'CANCELED' ||
                err?.message === 'User did not share';

              if (!isDismissed) {
                console.log('Actual Share error:', err);
              }
            })
            .finally(() => {
              setShareLoading(false);
            });
        });
      } catch (error) {
        console.error('Error downloading QR:', error);
        setShareLoading(false);
      }
    }
  };

  const userDataString = useMemo(() => {
    if (!user) return '';
    return JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone_number,
      gender: user.gender,
    });
  }, [user]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: () => {
          clearUser();
          NavigationService.replace('Auth', { screen: 'Login' });
        },
        style: 'destructive',
      },
    ]);
  };

  const handleEditProfileImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, async response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
        return;
      }

      if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', response.errorMessage || 'Failed to select image');
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        if (!asset.uri) {
          Alert.alert('Error', 'Image path is invalid');
          return;
        }

        setUploadLoading(true);
        try {
          // Create FormData for Multipart upload
          const formData = new FormData();
          const name = asset.fileName || `profile_${Date.now()}.jpg`;
          const type = asset.type || 'image/jpeg';
          
          formData.append('file', {
            uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
            type,
            name,
          } as any);

          console.log('Uploading image to S3...');
          const uploadRes = await uploadSingleFile(formData);
          
          if (uploadRes.data && uploadRes.data.success) {
            const s3Url = uploadRes.data.data.url;
            console.log('S3 Upload Success. URL:', s3Url);

            // Update profile url in backend DB
            const updateRes = await updateProfile({ profile_url: s3Url });

            if (updateRes.data && updateRes.data.success) {
              // Update local Zustand state to re-render avatar
              updateUser({ profile_url: s3Url });
              Alert.alert('Success', 'Profile picture updated successfully!');
            } else {
              throw new Error(updateRes.data.message || 'Failed to update profile url in database');
            }
          } else {
            throw new Error(uploadRes.data.message || 'Failed to upload file');
          }
        } catch (error: any) {
          console.error('Image Upload Error:', error);
          const errorMsg = error.response?.data?.message || error.message || 'Internal error occurred';
          Alert.alert('Upload Failed', errorMsg);
        } finally {
          setUploadLoading(false);
        }
      }
    });
  };

  const userInitials = useMemo(() => {
    if (!user?.name) return 'U';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  }, [user?.name]);

  const maskEmail = (email: string) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (name.length <= 2) return email;
    return `${name.substring(0, 2)}${'*'.repeat(name.length - 2)}@${domain}`;
  };

  const maskPhone = (phone: string) => {
    if (!phone) return '';
    // Expected format like +918667688987
    if (phone.length <= 8) return phone;
    const start = phone.substring(0, 5);
    const end = phone.substring(phone.length - 3);
    const middleLength = phone.length - start.length - end.length;
    return `${start}${'*'.repeat(middleLength)}${end}`;
  };

  const InfoRow = ({
    icon,
    label,
    value,
    isMasked = false,
  }: {
    icon: string;
    label: string;
    value: string;
    isMasked?: boolean;
  }) => (
    <View style={styles.infoRow}>
      <View style={styles.iconWrapper}>
        <Icon name={icon as any} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>
          {isMasked ? value : value || 'Not provided'}
        </Text>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1 }}
      bounces={true}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {user?.profile_url ? (
            <Avatar.Image
              size={100}
              source={{ uri: user.profile_url }}
              style={styles.avatar}
            />
          ) : (
            <Avatar.Text
              size={100}
              label={userInitials}
              style={styles.avatar}
              labelStyle={{ fontSize: 40, fontWeight: 'bold' }}
            />
          )}

          {uploadLoading && (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderRadius: 50,
                  justifyContent: 'center',
                  alignItems: 'center',
                },
              ]}
            >
              <ActivityIndicator size="small" color="white" />
            </View>
          )}

          <Pressable
            style={styles.editButton}
            onPress={handleEditProfileImage}
            disabled={uploadLoading}
          >
            <Icon name="edit" size={20} color={colors.primary} />
          </Pressable>
          <Pressable style={styles.qrButton} onPress={showQr}>
            <Icon name="qr-code-2" size={20} color={colors.primary} />
          </Pressable>
        </View>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>
          {user?.email ? maskEmail(user.email) : 'email@example.com'}
        </Text>

        <Portal>
          <Modal
            visible={qrVisible}
            onDismiss={hideQr}
            contentContainerStyle={styles.modalContainer}
          >
            {qrVisible && (
              <View style={styles.modalContent}>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={hideQr}
                  style={{ position: 'absolute', right: 8, top: 8, zIndex: 1 }}
                  iconColor={colors.primary}
                />
                <Text style={styles.qrTitle}>My Profile QR</Text>
                <Text style={styles.qrSubtitle}>
                  Scan this to get my profile details
                </Text>

                <View
                  style={{
                    padding: 8,
                    backgroundColor: 'white',
                    borderRadius: 16,
                  }}
                >
                  <QRCode
                    value={userDataString || 'No data'}
                    size={250}
                    color={colors.primary}
                    backgroundColor="white"
                    getRef={ref => (qrRef.current = ref)}
                    quietZone={20}
                  />
                </View>

                <Button
                  mode="contained"
                  onPress={handleShareQR}
                  loading={shareLoading}
                  disabled={shareLoading}
                  style={{ marginTop: 24, borderRadius: 12, width: '100%' }}
                  buttonColor={colors.primary}
                  icon="share"
                >
                  Share QR
                </Button>
              </View>
            )}
          </Modal>
        </Portal>
      </View>

      <View style={styles.content}>
        {/* Dashboard Section - Stats load as they become available */}
        <View style={{ position: 'relative' }}>
          {loading && !profileStats && (
            <View
              style={{
                position: 'absolute',
                top: 20,
                left: 0,
                right: 0,
                zIndex: 1,
                alignItems: 'center',
              }}
            >
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
          {/* <BhaktiScoreCard lifetimeScore={profileStats?.lifetime_score || 0} />
          <WeeklyProgress history={scoreHistory || []} /> */}
        </View>

        {/* Account Details Section - Always shown immediately like Admin cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <View style={styles.infoCard}>
            <Pressable
              onPress={() => NavigationService.navigate('MenteesList')}
              style={({ pressed }) => [
                {
                  backgroundColor: pressed
                    ? colors.primary + '10'
                    : 'transparent',
                  padding: 12,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: colors.primary + '20',
                },
              ]}
            >
              <View
                style={{
                  backgroundColor: colors.primary + '10',
                  padding: 8,
                  borderRadius: 10,
                }}
              >
                <Icon name="people" size={24} color={colors.primary} />
              </View>
              <Text
                style={{
                  marginLeft: 12,
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: colors.text,
                  flex: 1,
                }}
              >
                My Mentees
              </Text>
              <Icon name="chevron-right" size={24} color={colors.primary} />
            </Pressable>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ width: '48%', marginBottom: 12 }}>
                <InfoRow icon="person" label="Name" value={user?.name || ''} />
              </View>
              <View style={{ width: '48%', marginBottom: 12 }}>
                <InfoRow
                  icon="person-outline"
                  label="Gender"
                  value={
                    user?.gender
                      ? `${user.gender === 'male' ? 'Prabhu' : 'Mathaji'}`
                      : 'Not provided'
                  }
                />
              </View>
              <View style={{ width: '100%', marginBottom: 12 }}>
                <InfoRow
                  icon="email"
                  label="Email"
                  value={maskEmail(user?.email || '')}
                  isMasked={true}
                />
              </View>
              <View style={{ width: '100%' }}>
                <InfoRow
                  icon="phone"
                  label="Phone"
                  value={maskPhone(user?.phone_number || '')}
                  isMasked={true}
                />
              </View>
            </View>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            marginTop: 12,
            marginBottom: 24,
          }}
        >
          {/* <Button
            mode="contained"
            onPress={async () => {
              const api = (await import('../../services/Config')).default;
              try {
                const response = await api.post('/auth/test-notification');
                if (response.data.success) {
                  Alert.alert('Sent', 'A test notification has been sent');
                }
              } catch (error: any) {
                Alert.alert(
                  'Error',
                  error.response?.data?.message || 'Failed to send notify',
                );
              }
            }}
            style={{
              backgroundColor: colors.primary,
              flex: 1,
              borderRadius: 12,
            }}
            labelStyle={{ color: 'white', fontSize: 13, fontWeight: 'bold' }}
            icon="notifications-active"
          >
            Test Notify
          </Button> */}

          <Button
            mode="outlined"
            onPress={handleLogout}
            style={{ borderColor: colors.error, flex: 1, borderRadius: 12 }}
            labelStyle={{
              color: colors.error,
              fontSize: 13,
              fontWeight: 'bold',
            }}
            icon="logout"
          >
            Logout
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

export default About;
