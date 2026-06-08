import React, { useState, useMemo } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  HelperText,
  useTheme,
} from 'react-native-paper';
import { useThemeColors } from '../../../config/styles';
import { login, syncTimezone } from '../../../services/auth';
import { getFCMToken } from '../../../services/firebaseService';
import NavigationService from '../../../navigation/NavigationService';
import createStyles from './styles';
import { useUserStore } from '../../../store';
import { Notifier, NotifierComponents } from 'react-native-notifier';
import { Logo } from '../../../assets/images/exports';

const Login: React.FC = () => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  const validate = () => {
    let valid = true;
    const newErrors = { email: '', password: '' };

    if (!email) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      valid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleLogin = async (forceLogin: boolean = false) => {
    if (!validate()) return;

    setLoading(true);
    try {
      const fcm_token = await getFCMToken();
      const response = await login(
        email,
        password,
        fcm_token || undefined,
        forceLogin,
      );
      const result = response.data;

      if (result.success) {
        // Correctly extract and store token + user data
        const { accessToken, refreshToken, user } = result.data;
        useUserStore.getState().setUser({
          ...user,
          token: accessToken,
          refreshToken: refreshToken,
        });

        // Sync timezone according to current device
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) {
          syncTimezone(tz).catch(err =>
            console.error('Failed to sync timezone on login:', err),
          );
        }

        Notifier.showNotification({
          title: 'Welcome Back!',
          description: result.message || 'Login successful.',
          Component: NotifierComponents.Alert,
          componentProps: {
            alertType: 'success',
          },
        });
        NavigationService.replace('MainApp', { screen: 'Home' });
      }
    } catch (error: any) {
      console.log('From login page', error);

      // --- Logic for Single Session Force Logout ---
      if (error.response?.data?.message === 'SESSION_ALREADY_ACTIVE') {
        setLoading(false);
        Alert.alert(
          'Login Alert',
          'You are already logged in on another device. Do you want to logout from all other devices and login here?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Logout & Login Here',
              onPress: () => handleLogin(true),
              style: 'destructive',
            },
          ],
        );
        return;
      }

      // Extract specific error message from server JSON
      const message =
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred';
      console.log('Login Error Response:', message);

      Notifier.showNotification({
        title: 'Login Error',
        description: message,
        Component: NotifierComponents.Alert,
        componentProps: {
          alertType: 'error',
        },
      });
    } finally {
      if (!loading) setLoading(false);
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
          <View style={styles.logoBadge}>
            <Image source={Logo} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.title}>My Spiritual Assistant</Text>
          <Text style={styles.subtitle}>Sign in to continue your journey</Text>
        </View>

        <View style={styles.form}>
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
          </View>

          <View>
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
          </View>

          <Button
            mode="contained"
            onPress={() => handleLogin()}
            loading={loading}
            disabled={loading}
            style={styles.loginButton}
            labelStyle={styles.loginButtonLabel}
          >
            Sign In
          </Button>

          <View style={styles.footerLink}>
            <Text
              style={styles.forgotPasswordText}
              onPress={() => NavigationService.navigate('ForgotPassword')}
            >
              Forgot Password?
            </Text>
            <Text
              style={[styles.footerText, { marginTop: 12 }]}
              onPress={() => NavigationService.navigate('Register')}
            >
              Don't have an account? Sign Up
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;
