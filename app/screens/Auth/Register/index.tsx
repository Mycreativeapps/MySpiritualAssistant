import React, { useState, useMemo } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  HelperText,
  useTheme,
} from 'react-native-paper';
import { useThemeColors } from '../../../config/styles';
import { register, sendOTP, verifyOTP } from '../../../services/auth';
import { getFCMToken } from '../../../services/firebaseService';
import NavigationService from '../../../navigation/NavigationService';
import createStyles from './styles';
import { Notifier, NotifierComponents } from 'react-native-notifier';
import { useUserStore, useTaskStore } from '../../../store';

const Register: React.FC = () => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const theme = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [gender, setGender] = useState('male');
  const [yearOfBirth, setYearOfBirth] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    otp: '',
    yearOfBirth: '',
  });

  const validateEmail = () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrors({ ...errors, email: 'Valid email is required' });
      return false;
    }
    setErrors({ ...errors, email: '' });
    return true;
  };

  const validateAll = () => {
    let valid = true;
    const newErrors = { name: '', email: '', phone: '', password: '', otp: '', yearOfBirth: '' };

    if (!name || name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
      valid = false;
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Valid email is required';
      valid = false;
    }

    if (!phone || phone.length < 10) {
      newErrors.phone = 'Valid phone number is required';
      valid = false;
    }

    if (!password || password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }

    if (!yearOfBirth || yearOfBirth.length !== 4 || isNaN(Number(yearOfBirth))) {
      newErrors.yearOfBirth = 'Valid 4-digit year of birth is required';
      valid = false;
    } else {
      const yob = Number(yearOfBirth);
      const currentYear = new Date().getFullYear();
      if (yob < 1900 || yob > currentYear) {
        newErrors.yearOfBirth = `Year must be between 1900 and ${currentYear}`;
        valid = false;
      }
    }

    if (!isVerified) {
      Notifier.showNotification({
        title: 'Email Not Verified',
        description: 'Please verify your email address first.',
        Component: NotifierComponents.Alert,
        componentProps: { alertType: 'error' },
      });
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSendOTP = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    try {
      const response = await sendOTP(email);
      if (response.data.success) {
        setOtpSent(true);
        Notifier.showNotification({
          title: 'OTP Sent',
          description:
            response.data.message || 'Verification code sent to your email.',
          Component: NotifierComponents.Alert,
          componentProps: { alertType: 'success' },
        });
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'Error sending OTP';
      Notifier.showNotification({
        title: 'Error',
        description: message,
        Component: NotifierComponents.Alert,
        componentProps: { alertType: 'error' },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      setErrors({ ...errors, otp: 'Enter 6-digit OTP' });
      setOtp('');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyOTP(email, otp);
      if (response.data.success) {
        setIsVerified(true);
        setOtpSent(false);
        Notifier.showNotification({
          title: 'Verified!',
          description: 'Email verified successfully.',
          Component: NotifierComponents.Alert,
          componentProps: { alertType: 'success' },
        });
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'Invalid OTP';
      Notifier.showNotification({
        title: 'Error',
        description: message,
        Component: NotifierComponents.Alert,
        componentProps: { alertType: 'error' },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateAll()) return;

    setLoading(true);
    try {
      const fcm_token = await getFCMToken();
      const response = await register({
        name,
        email,
        phone_number: `${countryCode}${phone}`,
        password,
        gender,
        year_of_birth: Number(yearOfBirth),
        timezone:
          Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
        fcm_token: fcm_token || null,
      });
      const result = response.data;

      if (result.success) {
        const { accessToken, refreshToken, user } = result.data;
        useTaskStore.getState().resetTasks();
        useUserStore.getState().setUser({
          ...user,
          token: accessToken,
          refreshToken: refreshToken,
        });

        Notifier.showNotification({
          title: 'Success!',
          description: result.message || 'Account created successfully.',
          Component: NotifierComponents.Alert,
          componentProps: { alertType: 'success' },
        });
        NavigationService.replace('MainApp', { screen: 'Home' });
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred';
      Notifier.showNotification({
        title: 'Registration Error',
        description: message,
        Component: NotifierComponents.Alert,
        componentProps: { alertType: 'error' },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Start your spiritual journey today
          </Text>
        </View>

        <View style={styles.form}>
          {!isVerified ? (
            /* STEP 1: Email Verification */
            <View>
              <TextInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                error={!!errors.email}
                left={<TextInput.Icon icon="email" />}
              />
              <HelperText type="error" visible={!!errors.email}>
                {errors.email}
              </HelperText>

              {otpSent ? (
                <View style={{ marginTop: 8 }}>
                  <TextInput
                    label="Enter OTP"
                    value={otp}
                    onChangeText={setOtp}
                    mode="outlined"
                    keyboardType="number-pad"
                    maxLength={6}
                    style={styles.input}
                    error={!!errors.otp}
                  />
                  <HelperText type="error" visible={!!errors.otp}>
                    {errors.otp}
                  </HelperText>
                  <Button
                    mode="contained"
                    onPress={handleVerifyOTP}
                    loading={loading}
                    disabled={loading || otp.length < 6}
                    style={styles.actionButton}
                    contentStyle={styles.actionButtonContent}
                  >
                    Verify Code
                  </Button>
                  <Button
                    mode="text"
                    onPress={handleSendOTP}
                    disabled={loading}
                    style={{ marginTop: 8 }}
                  >
                    Resend Code
                  </Button>
                </View>
              ) : (
                <Button
                  mode="contained"
                  onPress={handleSendOTP}
                  loading={loading}
                  disabled={loading || !email}
                  style={styles.actionButton}
                  contentStyle={styles.actionButtonContent}
                >
                  Send Verification Code
                </Button>
              )}
            </View>
          ) : (
            /* STEP 2: Profile Details */
            <View>
              <TextInput
                label="Email Address"
                value={email}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="email" />}
                disabled
              />

              <TextInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
                error={!!errors.name}
                left={<TextInput.Icon icon="person" />}
              />
              <HelperText type="error" visible={!!errors.name}>
                {errors.name}
              </HelperText>

              <View style={styles.phoneRow}>
                <TextInput
                  label="Code"
                  value={countryCode}
                  onChangeText={setCountryCode}
                  mode="outlined"
                  keyboardType="phone-pad"
                  style={styles.countryCodeInput}
                  maxLength={5}
                />
                <TextInput
                  label="Phone Number"
                  value={phone}
                  onChangeText={setPhone}
                  mode="outlined"
                  keyboardType="phone-pad"
                  style={styles.phoneInput}
                  error={!!errors.phone}
                  left={<TextInput.Icon icon="phone" />}
                  maxLength={10}
                />
              </View>
              <HelperText type="error" visible={!!errors.phone}>
                {errors.phone}
              </HelperText>

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={!showPassword}
                style={styles.input}
                error={!!errors.password}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'visibility-off' : 'visibility'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />
              <HelperText type="error" visible={!!errors.password}>
                {errors.password}
              </HelperText>

              <Text style={{ marginTop: 12, marginBottom: 8, color: colors.text, fontWeight: '600' }}>Gender</Text>
              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                <Button 
                  mode={gender === 'male' ? 'contained' : 'outlined'} 
                  onPress={() => setGender('male')} 
                  style={{ flex: 1, marginRight: 4, borderRadius: 8 }}
                >
                  Male
                </Button>
                <Button 
                  mode={gender === 'female' ? 'contained' : 'outlined'} 
                  onPress={() => setGender('female')} 
                  style={{ flex: 1, marginHorizontal: 4, borderRadius: 8 }}
                >
                  Female
                </Button>
                <Button 
                  mode={gender === 'other' ? 'contained' : 'outlined'} 
                  onPress={() => setGender('other')} 
                  style={{ flex: 1, marginLeft: 4, borderRadius: 8 }}
                >
                  Other
                </Button>
              </View>

              <TextInput
                label="Year of Birth"
                value={yearOfBirth}
                onChangeText={setYearOfBirth}
                mode="outlined"
                keyboardType="number-pad"
                maxLength={4}
                style={styles.input}
                error={!!errors.yearOfBirth}
                left={<TextInput.Icon icon="calendar-today" />}
              />
              <HelperText type="error" visible={!!errors.yearOfBirth}>
                {errors.yearOfBirth}
              </HelperText>

              <Button
                mode="contained"
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                style={styles.registerButton}
                labelStyle={styles.registerButtonLabel}
              >
                Complete Registration
              </Button>

              <Button
                mode="text"
                onPress={() => setIsVerified(false)}
                disabled={loading}
                style={{ marginTop: 8 }}
              >
                Change Email
              </Button>
            </View>
          )}

          <View style={styles.footerLink}>
            <Text
              style={styles.footerText}
              onPress={() => NavigationService.goBack()}
            >
              Already have an account? Sign In
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Register;
