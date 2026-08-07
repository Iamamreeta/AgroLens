import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { resetPassword } from '../services/AuthService';

export default function ResetPasswordScreen({ navigation }) {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const passwordMeetsRules = (p) => {
    if (!p || p.length < 8) return false;
    if (!/[A-Z]/.test(p)) return false;
    if (!/[a-z]/.test(p)) return false;
    if (!/[0-9]/.test(p)) return false;
    return true;
  };

  const normalizeToken = (t) => {
    return String(t || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  };

  const handleSubmit = async () => {
    const normToken = normalizeToken(token);
    if (!normToken) {
      Alert.alert('Missing Code', 'Please enter the reset code sent to your email.');
      return;
    }
    if (normToken.length < 4) {
      Alert.alert('Invalid Code', 'Reset code appears too short. Please check the email.');
      return;
    }
    if (!password) {
      Alert.alert('Missing Password', 'Please enter a new password.');
      return;
    }
    if (!passwordMeetsRules(password)) {
      Alert.alert(
        'Weak Password',
        'Password must be at least 8 characters and include uppercase, lowercase, and a digit.'
      );
      return;
    }
    if (password !== confirm) {
      Alert.alert('Password Mismatch', 'New passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await resetPassword(normToken, password);
    setLoading(false);

    if (result.success) {
      setDone(true);
    } else {
      Alert.alert('Reset Failed', result.error || 'Unable to reset password. The code may be expired or invalid.');
    }
  };

  if (done) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f9f5" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.successContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.successIconWrap}>
            <LinearGradient
              colors={['#2ecc71', '#27ae60']}
              style={styles.successIconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="shield-checkmark-outline" size={64} color="white" />
            </LinearGradient>
          </View>

          <Text style={styles.successTitle}>Password Updated</Text>
          <Text style={styles.successSubtitle}>
            Your password has been reset successfully. You can now sign in with your new password.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#2ecc71', '#27ae60']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="log-in-outline" size={22} color="white" />
              <Text style={styles.buttonText}> Continue to Login</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f9f5" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back-outline" size={24} color="#2ecc71" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#8e24aa', '#5e35b1']}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="key-outline" size={44} color="white" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter the reset code sent to your email and choose a secure new password.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reset Code</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="keypad-outline" size={20} color="#95a5a6" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.tokenInput]}
                  placeholder="AB-12-CD"
                  placeholderTextColor="#95a5a6"
                  value={token}
                  onChangeText={(t) => setToken(t)}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>
              <Text style={styles.hintText}>
                Example: the format looks like AB-12-CD (hyphens are optional)
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#95a5a6" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#95a5a6"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword((s) => !s)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#95a5a6"
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.hintText}>
                8+ characters, with uppercase, lowercase, and a digit.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#95a5a6" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#95a5a6"
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry={!showPassword}
                  autoCorrect={false}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#2ecc71', '#27ae60']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="refresh-outline" size={22} color="white" />
                    <Text style={styles.buttonText}> Reset Password</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Remembered your password?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}> Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f9f5' },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 10,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
  },
  backText: { fontSize: 16, color: '#2ecc71', fontWeight: '500', marginLeft: 4 },

  headerSection: { alignItems: 'center', marginBottom: 28, marginTop: 8 },
  iconContainer: { marginBottom: 18 },
  iconGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#1a3a2a' },
  subtitle: {
    fontSize: 15,
    color: '#5a7a6a',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    paddingHorizontal: 12,
  },

  form: { width: '100%' },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', color: '#1a3a2a', marginBottom: 6 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e8e0',
  },
  inputIcon: { paddingLeft: 14 },
  input: { flex: 1, padding: 14, fontSize: 16, color: '#1a3a2a' },
  tokenInput: { textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '600' },
  eyeIcon: { paddingRight: 14 },
  hintText: { fontSize: 12, color: '#78909c', marginTop: 6, paddingLeft: 2 },

  button: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
    marginTop: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '700', marginLeft: 8 },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: { color: '#5a7a6a' },
  loginLink: { color: '#2ecc71', fontWeight: '700' },

  successContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 10,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  successIconWrap: { alignItems: 'center', marginBottom: 24 },
  successIconContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a3a2a',
    textAlign: 'center',
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 15,
    color: '#5a7a6a',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
});
