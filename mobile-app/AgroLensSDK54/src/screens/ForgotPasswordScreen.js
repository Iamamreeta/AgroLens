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
import { forgotPassword } from '../services/AuthService';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const validateEmail = (e) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(e).trim().toLowerCase());
  };

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    if (!validateEmail(trimmed)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    const result = await forgotPassword(trimmed);
    setLoading(false);

    if (result.success) {
      setSent(true);
    } else {
      Alert.alert('Request Failed', result.error || 'Unable to send reset email. Please try again.');
    }
  };

  const handleProceedToReset = () => {
    navigation.navigate('ResetPassword');
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f9f5" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.successContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back-outline" size={24} color="#2ecc71" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.successIconWrap}>
            <LinearGradient
              colors={['#2ecc71', '#27ae60']}
              style={styles.successIconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="mail-unread-outline" size={60} color="white" />
            </LinearGradient>
          </View>

          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successSubtitle}>
            We have sent password reset instructions to{'\n'}
            <Text style={{ fontWeight: '700', color: '#1a3a2a' }}>{email.trim()}</Text>
          </Text>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#1976d2" />
            <Text style={styles.infoText}>
              If you do not receive an email within a few minutes, check your spam folder or
              ensure the email address is correct.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleProceedToReset}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#2ecc71', '#27ae60']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="create-outline" size={22} color="white" />
              <Text style={styles.buttonText}> I Have a Reset Code</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              setSent(false);
              setEmail('');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Use a Different Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back-outline" size={18} color="#2ecc71" />
            <Text style={styles.linkText}>Back to Login</Text>
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
                colors={['#e67e22', '#f39c12']}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="lock-open-outline" size={44} color="white" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>
              Enter your email and we will send you a secure reset code.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#95a5a6" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="hari@farm.com"
                  placeholderTextColor="#95a5a6"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
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
                    <Ionicons name="paper-plane-outline" size={22} color="white" />
                    <Text style={styles.buttonText}> Send Reset Code</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.altButton}
              onPress={() => navigation.navigate('ResetPassword')}
              activeOpacity={0.7}
            >
              <Ionicons name="key-outline" size={18} color="#2ecc71" />
              <Text style={styles.altButtonText}> I already have a reset code</Text>
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

  headerSection: { alignItems: 'center', marginBottom: 32, marginTop: 8 },
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
  inputGroup: { marginBottom: 20 },
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

  button: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
    marginTop: 4,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '700', marginLeft: 8 },

  altButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 14,
  },
  altButtonText: { color: '#2ecc71', fontSize: 15, fontWeight: '600' },

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
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#bbdefb',
    borderRadius: 14,
    padding: 14,
    marginBottom: 28,
  },
  infoText: { flex: 1, color: '#0d47a1', fontSize: 13, lineHeight: 20 },

  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  secondaryButtonText: { color: '#5a7a6a', fontSize: 15, fontWeight: '600' },

  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    gap: 6,
  },
  linkText: { color: '#2ecc71', fontSize: 15, fontWeight: '600' },
});
