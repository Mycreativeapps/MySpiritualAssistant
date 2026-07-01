import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Portal, Modal, Text, TextInput, Button, IconButton, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { useThemeColors } from '../../config/styles';
import { updateProfile } from '../../services/auth';
import { useUserStore } from '../../store';

interface EditProfileModalProps {
  visible: boolean;
  onDismiss: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onDismiss }) => {
  const colors = useThemeColors();
  const { user, refreshProfile } = useUserStore();

  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [yearOfBirth, setYearOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setIsReady(true), 150);
      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
    }
  }, [visible]);

  useEffect(() => {
    if (visible && user) {
      setName(user.name || '');
      setGender(user.gender || '');
      setYearOfBirth(user.year_of_birth ? String(user.year_of_birth) : '');
      setPhoneNumber(user.phone_number || '');
    }
  }, [visible, user]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Mobile number cannot be empty.');
      return;
    }

    const yob = parseInt(yearOfBirth, 10);
    const currentYear = new Date().getFullYear();
    if (!yob || isNaN(yob) || yob < 1900 || yob > currentYear) {
      Alert.alert('Validation Error', 'Please enter a valid 4-digit Year of Birth to update your profile.');
      return;
    }

    setLoading(true);
    try {
      const response = await updateProfile({
        name: name.trim(),
        gender,
        year_of_birth: yob,
        phone_number: phoneNumber.trim(),
      });

      if (response.data.success) {
        await refreshProfile();
        onDismiss();
        Alert.alert('Success', 'Profile updated successfully.');
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update profile.');
      }
    } catch (error: any) {
      console.error('Update Profile Error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modalContainer, { backgroundColor: colors.surface }]}
      >
        {!isReady ? (
          <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            <IconButton
              icon="close"
              size={24}
              onPress={onDismiss}
              style={styles.closeButton}
              iconColor={colors.primary}
            />
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.title, { color: colors.primary }]}>Edit Profile</Text>
              <TextInput
                label="Name"
                value={name}
                onChangeText={setName}
                keyboardType="visible-password"
                autoComplete="off"
                mode="outlined"
                style={[styles.input, { backgroundColor: colors.surface }]}
                textColor={colors.text}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />

              <TextInput
                label="Mobile Number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                mode="outlined"
                style={[styles.input, { backgroundColor: colors.surface }]}
                textColor={colors.text}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />

              <Text style={[styles.label, { color: colors.subtext }]}>Gender</Text>
              <SegmentedButtons
                value={gender}
                onValueChange={setGender}
                buttons={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]}
                style={styles.segmentedButtons}
                theme={{ colors: { secondaryContainer: colors.primary + '20', onSecondaryContainer: colors.primary } }}
              />

              <TextInput
                label="Year of Birth"
                value={yearOfBirth}
                onChangeText={setYearOfBirth}
                keyboardType="numeric"
                maxLength={4}
                mode="outlined"
                style={[styles.input, { backgroundColor: colors.surface }]}
                textColor={colors.text}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />

              <Button
                mode="contained"
                onPress={handleSave}
                loading={loading}
                disabled={loading}
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
              >
                Save Changes
              </Button>
            </ScrollView>
          </>
        )}
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    borderRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    zIndex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  segmentedButtons: {
    marginBottom: 20,
  },
  saveButton: {
    marginTop: 10,
    borderRadius: 8,
    paddingVertical: 4,
  },
});

export default EditProfileModal;
