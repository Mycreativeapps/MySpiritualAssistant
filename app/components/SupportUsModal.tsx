import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Portal, Modal, IconButton, Button, Card, useTheme, TextInput, ActivityIndicator } from 'react-native-paper';
import Clipboard from '@react-native-clipboard/clipboard';
import Icon from '@react-native-vector-icons/material-icons';
import { useThemeColors } from '../config/styles';
import { useUserStore } from '../store/userStore';
import { useAppStore } from '../store/appStore';
import settingsService from '../services/settings';

interface SupportUsModalProps {
  visible: boolean;
  onDismiss: () => void;
}

const DEFAULT_DONATION_DETAILS = [
  {
    id: 'upi-india',
    icon: 'account-balance-wallet',
    name: 'UPI Transfer',
    sub: 'PhonePe · GPay · Paytm · Any UPI App',
    details: [
      { label: 'Name', value: 'Harsha Kumar' },
      { label: 'UPI Number', value: '8754035972' },
    ],
  },
  {
    id: 'bank-india',
    icon: 'account-balance',
    name: 'Bank Transfer',
    sub: 'NEFT / RTGS / IMPS',
    details: [
      { label: 'Account Name', value: 'Harsha Kumar' },
      { label: 'Account No.', value: '16404100000260' },
      { label: 'IFSC Code', value: 'FDRL0001640' },
      { label: 'Bank', value: 'Federal Bank' },
    ],
  },
];

const SupportUsModal: React.FC<SupportUsModalProps> = ({ visible, onDismiss }) => {
  const colors = useThemeColors();
  const theme = useTheme();
  const user = useUserStore((state) => state.user);
  const featurePermissions = useAppStore((state) => state.featurePermissions);

  const [donationDetails, setDonationDetails] = useState<any[]>(DEFAULT_DONATION_DETAILS);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const isAdmin = featurePermissions?.edit_support_us?.includes(user?.id || '');

  useEffect(() => {
    if (visible) {
      fetchDonationDetails();
      setIsEditing(false);
    }
  }, [visible]);

  const fetchDonationDetails = async () => {
    setLoading(true);
    try {
      const res = await settingsService.getSetting('donation_details');
      if (res.data?.success && res.data?.data) {
        setDonationDetails(res.data.data);
      }
    } catch (e) {
      console.log('Error fetching donation details', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await settingsService.updateSetting('donation_details', donationDetails);
      if (res.data?.success) {
        Alert.alert('Success', 'Donation details updated successfully!');
        setIsEditing(false);
      } else {
        Alert.alert('Error', 'Failed to update donation details.');
      }
    } catch (e) {
      console.log('Error updating donation details', e);
      Alert.alert('Error', 'Failed to update donation details.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', `${label} has been copied to clipboard.`);
  };

  const handleDetailChange = (methodIndex: number, detailIndex: number, newValue: string) => {
    const updatedDetails = [...donationDetails];
    updatedDetails[methodIndex].details[detailIndex].value = newValue;
    setDonationDetails(updatedDetails);
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        theme={{ colors: { backdrop: 'rgba(0, 0, 0, 0.85)' } }}
        contentContainerStyle={[styles.modalContainer, { backgroundColor: colors.background }]}
      >
        <IconButton
          icon="close"
          size={24}
          onPress={onDismiss}
          style={styles.closeButton}
          iconColor={colors.primary}
        />
        
        {isAdmin && !isEditing && (
          <IconButton
            icon="edit"
            size={24}
            onPress={() => setIsEditing(true)}
            style={styles.editButton}
            iconColor={colors.primary}
          />
        )}
        
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Icon name="volunteer-activism" size={40} color={colors.primary} style={{ marginBottom: 12 }} />
            <Text style={[styles.title, { color: colors.text }]}>Support Us</Text>
            <Text style={[styles.description, { color: colors.text , opacity: 0.5}]}>Spiritual Health Coach is an effort to combine timeless wisdom with modern technology. Small daily improvements create lifelong transformation.</Text>
            <Text style={[styles.description, { color: colors.text, fontSize : 13,  fontWeight: 'bold' }]}>Kindly share your contribution to below account.</Text>
          </View>

          {loading ? (
             <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
          ) : (
            <>
              {donationDetails.map((method, methodIndex) => (
                <Card key={method.id} style={[styles.card, { backgroundColor: colors.surface }]} elevation={2}>
                  <Card.Title
                    title={method.name}
                    subtitle={method.sub}
                    titleStyle={{ fontWeight: 'bold', color: colors.text }}
                    subtitleStyle={{ color: colors.text + '99' }}
                    left={(props) => <Icon name={method.icon as any} size={props.size} color={colors.primary} />}
                  />
                  <Card.Content>
                    {method.details.map((detail: any, detailIndex: number) => (
                      <View key={detailIndex} style={styles.detailRow}>
                        <View style={styles.detailTextContainer}>
                          <Text style={[styles.detailLabel, { color: colors.text + '99' }]}>{detail.label}</Text>
                          {isEditing ? (
                            <TextInput
                               value={detail.value}
                               onChangeText={(text) => handleDetailChange(methodIndex, detailIndex, text)}
                               style={{ backgroundColor: colors.background, height: 40 }}
                               mode="outlined"
                               dense
                            />
                          ) : (
                            <Text style={[styles.detailValue, { color: colors.text }]}>{detail.value}</Text>
                          )}
                        </View>
                        {!isEditing && detail.label !== 'Bank' && (
                          <IconButton
                            icon="content-copy"
                            size={20}
                            iconColor={colors.primary}
                            onPress={() => handleCopy(detail.value, detail.label)}
                            style={styles.copyButton}
                          />
                        )}
                      </View>
                    ))}
                  </Card.Content>
                </Card>
              ))}

              {isEditing && (
                 <Button 
                    mode="contained" 
                    onPress={handleSave} 
                    loading={saving}
                    disabled={saving}
                    style={{ marginBottom: 16 }}
                 >
                    Save Details
                 </Button>
              )}
            </>
          )}

          <Text style={[styles.footerNote, { color: colors.text + '80' , fontSize : 12,  fontWeight: 'normal' }]}>Your contributions will help us cover the development/running costs of this application. </Text>
          <Text style={[styles.footerNote, { color: colors.text + '80' , fontSize : 13,  fontWeight: 'bold', marginTop: 10, marginBottom: 10, }]}>🙏 Hare Krishna! 🙏</Text>
        </ScrollView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    borderRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  closeButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    zIndex: 1,
  },
  editButton: {
    position: 'absolute',
    left: 8,
    top: 8,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.9,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  detailTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  copyButton: {
    margin: 0,
    backgroundColor: 'rgba(100, 100, 100, 0.1)',
  },
  footerNote: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SupportUsModal;
