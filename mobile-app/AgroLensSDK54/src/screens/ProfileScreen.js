
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser, logout } from '../services/AuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppLogo from '../../assets/logo.png';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [scanCount, setScanCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    try {
      const saved = await AsyncStorage.getItem('predictions');
      if (saved) {
        setScanCount(JSON.parse(saved).length);
      }
    } catch (error) {
      // Silent error for local storage
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            const result = await logout();
            if (result.success) {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } else {
              Alert.alert('Error', result.error);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a3a2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image source={AppLogo} style={styles.avatar} resizeMode="contain" />
          </View>
          <Text style={styles.profileName}>{user?.name || 'Farmer'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'user@agrolens.com'}</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{scanCount}</Text>
            <Text style={styles.statLabel}>Total Scans</Text>
          </View>
          <View style={[styles.statItem, styles.statDivider]}>
            <Text style={[styles.statValue, { color: '#4caf50' }]}>{user?.healthyPlants || 0}</Text>
            <Text style={styles.statLabel}>Healthy</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#f44336' }]}>{user?.diseasedPlants || 0}</Text>
            <Text style={styles.statLabel}>Diseased</Text>
          </View>
        </View>

        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('History')}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: '#e3f2fd' }]}>
              <Ionicons name="time-outline" size={24} color="#2196f3" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Scan History</Text>
              <Text style={styles.menuSubtext}>View all your previous scans</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#b0bec5" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#fff3e0' }]}>
              <Ionicons name="settings-outline" size={24} color="#ff9800" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Settings</Text>
              <Text style={styles.menuSubtext}>App preferences and configuration</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#b0bec5" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#f3e5f5' }]}>
              <Ionicons name="information-circle-outline" size={24} color="#9c27b0" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>About AgroLens</Text>
              <Text style={styles.menuSubtext}>App version 1.0.0</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#b0bec5" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#f44336" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>AgroLens v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f9f5',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a3a2a',
  },
  profileCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    paddingVertical: 30,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 2,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a3a2a',
  },
  profileEmail: {
    fontSize: 15,
    color: '#78909c',
    marginTop: 6,
  },
  statsCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    elevation: 2,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#eceff1',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a3a2a',
  },
  statLabel: {
    fontSize: 13,
    color: '#78909c',
    marginTop: 4,
  },
  menuCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#eceff1',
    gap: 14,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a3a2a',
  },
  menuSubtext: {
    fontSize: 13,
    color: '#78909c',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 2,
    marginBottom: 20,
  },
  logoutText: {
    color: '#f44336',
    fontSize: 17,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#90a4ae',
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#b0bec5',
    marginTop: 4,
  },
});

