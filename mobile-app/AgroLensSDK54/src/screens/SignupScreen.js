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
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { signUp } from '../services/AuthService';
import AppLogo from '../../assets/logo.png';

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!agree) {
      Alert.alert('Error', 'Please agree to Terms and Privacy Policy');
      return;
    }

    setLoading(true);
    const result = await signUp(name, email, password);
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Account created successfully!');
      navigation.replace('Home');
    } else {
      Alert.alert('Signup Failed', result.error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Icon name="arrow-back-outline" size={24} color="#2ecc71" />
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <Image source={AppLogo} style={styles.logo} resizeMode="contain" />
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Start your farming journey</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <Icon name="person-outline" size={20} color="#95a5a6" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Hari Krishna"
                    placeholderTextColor="#95a5a6"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <Icon name="mail-outline" size={20} color="#95a5a6" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="hari@example.com"
                    placeholderTextColor="#95a5a6"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputContainer}>
                  <Icon name="lock-closed-outline" size={20} color="#95a5a6" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="********"
                    placeholderTextColor="#95a5a6"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Icon 
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'} 
                      size={20} 
                      color="#95a5a6" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputContainer}>
                  <Icon name="lock-closed-outline" size={20} color="#95a5a6" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="********"
                    placeholderTextColor="#95a5a6"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.termsRow} onPress={() => setAgree(!agree)}>
                <View style={[styles.checkbox, agree && styles.checkboxActive]} />
                <Text style={styles.termsText}>
                  By creating an account, you agree to our Terms of Service and Privacy Policy.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signupButton}
                onPress={handleSignup}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#2ecc71', '#27ae60']}
                  style={styles.signupGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Icon name="person-add-outline" size={22} color="white" />
                      <Text style={styles.signupButtonText}> Create Account</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.loginRow}>
                <Text style={styles.loginText}>Already have an account?</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Text style={styles.loginLink}> Log In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f9f5',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 30,
    paddingTop: 10,
  },
  backButton: {
    marginBottom: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a3a2a',
  },
  subtitle: {
    fontSize: 14,
    color: '#5a7a6a',
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a3a2a',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e8e0',
  },
  inputIcon: {
    paddingLeft: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#1a3a2a',
  },
  eyeIcon: {
    paddingRight: 14,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d5d5d5',
    marginRight: 10,
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: '#2ecc71',
    borderColor: '#2ecc71',
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: '#5a7a6a',
    lineHeight: 18,
  },
  signupButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    marginTop: 10,
  },
  signupGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginText: {
    color: '#5a7a6a',
  },
  loginLink: {
    color: '#2ecc71',
    fontWeight: 'bold',
  },
});