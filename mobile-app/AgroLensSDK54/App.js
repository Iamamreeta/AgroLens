import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { getCurrentUser, getApiBaseUrl } from './src/services/AuthService';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';

const Stack = createStackNavigator();

function SplashScreen() {
  return (
    <View style={styles.splash}>
      <Text style={styles.splashTitle}>AgroLens</Text>
      <Text style={styles.splashSub}>Preparing your tomato health assistant...</Text>
      <ActivityIndicator size="large" color="#2e7d32" style={{ marginTop: 24 }} />
    </View>
  );
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState('Onboarding');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        getApiBaseUrl().catch(() => null);
        const user = await getCurrentUser();
        setInitialRoute(user ? 'Home' : 'Onboarding');
      } catch (error) {
        console.error('App init error:', error);
        setInitialRoute('Onboarding');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SplashScreen />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: '#f5f9f5' },
            }}
          >
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Results" component={ResultsScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#f5f9f5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  splashTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#2e7d32',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  splashSub: {
    fontSize: 16,
    color: '#558b2f',
  },
});
