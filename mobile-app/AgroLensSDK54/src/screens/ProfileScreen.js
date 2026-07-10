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
import AppLogo from '../../assets/logo.png';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
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
              // ✅ RESET navigation to Login (clears all screens)
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={24} color="#2ecc71" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <Image source={AppLogo} style={styles.avatar} resizeMode="contain" />
          <Text style={styles.profileName}>{user?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="stats-chart-outline" size={22} color="#3498db" />
            <Text style={styles.statsTitle}> Statistics</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="scan-outline" size={28} color="#3498db" />
              <Text style={styles.statValue}>{user?.totalScans || 0}</Text>
              <Text style={styles.statLabel}>Scans</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={28} color="#27ae60" />
              <Text style={[styles.statValue, styles.statHealthy]}>{user?.healthyPlants || 0}</Text>
              <Text style={styles.statLabel}>Healthy</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="alert-circle" size={28} color="#e74c3c" />
              <Text style={[styles.statValue, styles.statDiseased]}>{user?.diseasedPlants || 0}</Text>
              <Text style={styles.statLabel}>Diseased</Text>
            </View>
          </View>
        </View>

        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="leaf-outline" size={22} color="#2ecc71" />
            <Text style={styles.menuText}>My Plants</Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#95a5a6" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="time-outline" size={22} color="#3498db" />
            <Text style={styles.menuText}>Scan History</Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#95a5a6" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings-outline" size={22} color="#7f8c8d" />
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#95a5a6" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={22} color="#e74c3c" />
            <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#95a5a6" />
          </TouchableOpacity>
        </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a3a2a',
  },
  profileCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a3a2a',
  },
  profileEmail: {
    fontSize: 14,
    color: '#5a7a6a',
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a3a2a',
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a3a2a',
    marginTop: 4,
  },
  statHealthy: {
    color: '#27ae60',
  },
  statDiseased: {
    color: '#e74c3c',
  },
  statLabel: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 2,
  },
  menuCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    elevation: 2,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4f0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#1a3a2a',
    marginLeft: 12,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#e74c3c',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#95a5a6',
  },
});