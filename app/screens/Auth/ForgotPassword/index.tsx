import React, { useState, useMemo, useEffect } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useThemeColors } from '../../../config/styles';
import {
  forgotPassword,
  verifyOTP,
  resetPassword,
} from '../../../services/auth';
import NavigationService from '../../../navigation/NavigationService';
import createStyles from './styles';
import { Notifier, NotifierComponents } from 'react-native-notifier';

type ForgotPasswordParamList = {
  ForgotPassword: {
    initialEmail?: string;
  };
};

const ForgotPassword: React.FC = () => {
  const route =
    useRoute<RouteProp<ForgotPasswordParamList, 'ForgotPassword'>>();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (route.params?.initialEmail) {
      setEmail(route.params.initialEmail);
      setStep(2);
    }
  }, [route.params?.initialEmail]);

  const [errors, setErrors] = useState({
    email: '',
    otp: '',
    password: '',
    confirmPassword: '',
  });

  const validateEmail = () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrors({ ...errors, email: 'Valid email is required' });
      return false;
    }
    setErrors({ ...errors, email: '' });
    return true;
  };

  const handleRequestOTP = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    try {
      const response = await forgotPassword(email);
      if (response.data.success) {
        setStep(2);
        Notifier.showNotification({
          title: 'OTP Sent',
          description: 'Password reset code sent to your email.',
          Component: NotifierComponents.Alert,
          componentProps: { alertType: 'success' },
        });
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Email not found or error occurred';
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
      return;
    }

    setLoading(true);
    try {
      const response = await verifyOTP(email, otp);
      if (response.data.success) {
        setStep(3);
        Notifier.showNotification({
          title: 'Verified!',
          description: 'Code verified. You can now reset your password.',
          Component: NotifierComponents.Alert,
          componentProps: { alertType: 'success' },
        });
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid or expired OTP';
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

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      setErrors({
        ...errors,
        password: 'Password must be at least 6 characters',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrors({ ...errors, confirmPassword: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword({
        email,
        otp,
        password: newPassword,
      });
      if (response.data.success) {
        Notifier.showNotification({
          title: 'Success!',
          description:
            'Password reset successfully. Please login with your new password.',
          Component: NotifierComponents.Alert,
          componentProps: { alertType: 'success' },
        });
        NavigationService.navigate('Login');
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Failed to reset password';
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
          <Text style={styles.title}>
            {step === 1
              ? 'Forgot Password'
              : step === 2
              ? 'Verify OTP'
              : 'Reset Password'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? 'Enter your registered email to receive a password reset code.'
              : step === 2
              ? `Verification code sent to ${email}`
              : 'Create a new secure password for your account.'}
          </Text>
        </View>

        <View style={styles.form}>
          {step === 1 && (
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
              <Button
                mode="contained"
                onPress={handleRequestOTP}
                loading={loading}
                disabled={loading || !email}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
              >
                Send Reset Code
              </Button>
            </View>
          )}

          {step === 2 && (
            <View style={styles.otpContainer}>
              <TextInput
                label="6-Digit Code"
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
                Verify & Continue
              </Button>
              <Button
                mode="text"
                onPress={handleRequestOTP}
                disabled={loading}
                style={{ marginTop: 8 }}
              >
                Resend Code
              </Button>
            </View>
          )}

          {step === 3 && (
            <View>
              <TextInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
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

              <TextInput
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                secureTextEntry={!showPassword}
                style={styles.input}
                error={!!errors.confirmPassword}
                left={<TextInput.Icon icon="lock-check" />}
              />
              <HelperText type="error" visible={!!errors.confirmPassword}>
                {errors.confirmPassword}
              </HelperText>

              <Button
                mode="contained"
                onPress={handleResetPassword}
                loading={loading}
                disabled={loading}
                style={styles.resetButton}
                labelStyle={{ fontWeight: 'bold' }}
              >
                Reset Password
              </Button>
            </View>
          )}

          <View style={styles.footerLink}>
            <Text
              style={styles.footerText}
              onPress={() => NavigationService.goBack()}
            >
              Back to Login
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPassword;
