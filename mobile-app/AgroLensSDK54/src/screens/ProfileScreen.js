import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getCurrentUser,
  logout,
  changePassword,
  deleteAccount,
} from '../services/AuthService';
import AppLogo from '../../assets/logo.png';

const SECTION_PADDING = 20;

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cp, setCp] = useState({ current: '', new1: '', new2: '' });
  const [deletePw, setDeletePw] = useState('');
  const [toast, setToast] = useState(null);

  const loadAll = useCallback(async () => {
    setToast(null);
    try {
      const u = await getCurrentUser();
      setUser(u);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
  };

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          const result = await logout();
          if (result.success) {
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          } else {
            Alert.alert('Error', result.error);
          }
        },
      },
    ]);
  };

  const submitPassword = async () => {
    if (!cp.current || !cp.new1 || !cp.new2) {
      showToast('Please fill all password fields', 'error');
      return;
    }
    if (cp.new1 !== cp.new2) {
      showToast('New passwords do not match', 'error');
      return;
    }
    setProcessing(true);
    const r = await changePassword(cp.current, cp.new1);
    setProcessing(false);
    if (r.success) {
      setCp({ current: '', new1: '', new2: '' });
      setPasswordModal(false);
      showToast('Password updated successfully', 'success');
    } else {
      showToast(r.error || 'Could not update password', 'error');
    }
  };

  const submitDelete = async () => {
    if (!deletePw) {
      showToast('Enter your password to confirm', 'error');
      return;
    }
    Alert.alert(
      'Delete account permanently?',
      'This will delete your account and all scans forever.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            const r = await deleteAccount(deletePw);
            setProcessing(false);
            if (r.success) {
              setDeleteModal(false);
              setDeletePw('');
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            } else {
              showToast(r.error || 'Could not delete account', 'error');
            }
          },
        },
      ]
    );
  };

  const initials = (user?.name || 'F').split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a3a2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          onPress={() => setSettingsModal(true)}
          style={styles.settingsButton}
          hitSlop={8}
          accessibilityLabel="Settings"
        >
          <Ionicons name="settings-outline" size={22} color="#1a3a2a" />
        </TouchableOpacity>
      </View>

      {toast && (
        <View style={[styles.toast, toast.type === 'error' && styles.toastError, toast.type === 'success' && styles.toastSuccess]}>
          <Ionicons
            name={toast.type === 'success' ? 'checkmark-circle' : toast.type === 'error' ? 'alert-circle' : 'information-circle'}
            size={18}
            color="white"
          />
          <Text style={styles.toastText}>{toast.msg}</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2e7d32" />
        }
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {user?.profile_picture_url ? (
              <Image source={{ uri: user.profile_picture_url }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#c8e6c9', justifyContent: 'center', alignItems: 'center' }]}>
                <Image source={AppLogo} style={{ width: 56, height: 56 }} resizeMode="contain" />
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#2e7d32', marginTop: 4 }}>
                  {initials}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.profileName}>{user?.name || 'Guest Farmer'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'Sign in to sync your scans'}</Text>
          
          {!user && (
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
              <TouchableOpacity
                style={[styles.actionOutline, { borderColor: '#2e7d32' }]}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={{ color: '#2e7d32', fontWeight: '700' }}>Log In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionPrimary]}
                onPress={() => navigation.navigate('Signup')}
              >
                <LinearGradient colors={['#2ecc71', '#27ae60']} style={{ paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 }}>
                  <Text style={{ color: 'white', fontWeight: '700' }}>Create Account</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {loading && !user ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color="#2e7d32" />
          </View>
        ) : (
          <>
            <View style={styles.menuCard}>
              <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('History')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#e3f2fd' }]}>
                  <Ionicons name="time-outline" size={24} color="#2196f3" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuText}>Scan History</Text>
                  <Text style={styles.menuSubtext}>View, search, and manage your scans</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#b0bec5" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setCp({ current: '', new1: '', new2: '' });
                  setPasswordModal(true);
                }}
                disabled={!user}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: '#fff3e0' }]}>
                  <Ionicons name="lock-closed-outline" size={24} color="#ff9800" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuText}>Change Password</Text>
                  <Text style={styles.menuSubtext}>Keep your account secure</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#b0bec5" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setSettingsModal(true)}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: '#f3e5f5' }]}>
                  <Ionicons name="settings-outline" size={24} color="#9c27b0" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuText}>Settings</Text>
                  <Text style={styles.menuSubtext}>App preferences & tools</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#b0bec5" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => Alert.alert('About AgroLens', 'AgroLens v1.0.0\n\nTomato leaf disease detection powered by VGG16 + SVM.')}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: '#e0f7fa' }]}>
                  <Ionicons name="information-circle-outline" size={24} color="#00838f" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuText}>About AgroLens</Text>
                  <Text style={styles.menuSubtext}>App version 1.0.0</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#b0bec5" />
              </TouchableOpacity>
            </View>

            {user && (
              <TouchableOpacity style={styles.dangerButton} onPress={() => {
                setDeletePw('');
                setDeleteModal(true);
              }}>
                <Ionicons name="trash-outline" size={22} color="#d32f2f" />
                <Text style={styles.dangerButtonText}>Delete Account</Text>
              </TouchableOpacity>
            )}

            {user && (
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#f44336" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>AgroLens v1.0.0</Text>
          <Text style={styles.footerSub}>Detect • Diagnose • Defend</Text>
        </View>
      </ScrollView>

      <Modal
        visible={passwordModal}
        animationType="slide"
        transparent
        onRequestClose={() => setPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="lock-closed-outline" size={26} color="#2e7d32" />
              <Text style={styles.modalTitle}>Change Password</Text>
            </View>

            <Text style={styles.fieldLabel}>Current Password</Text>
            <TextInput
              value={cp.current}
              onChangeText={(t) => setCp((s) => ({ ...s, current: t }))}
              secureTextEntry
              style={styles.field}
              placeholder="••••••••"
              placeholderTextColor="#90a4ae"
            />
            <Text style={styles.fieldLabel}>New Password (8+ chars, 1 upper, 1 lower, 1 digit)</Text>
            <TextInput
              value={cp.new1}
              onChangeText={(t) => setCp((s) => ({ ...s, new1: t }))}
              secureTextEntry
              style={styles.field}
              placeholder="••••••••"
              placeholderTextColor="#90a4ae"
            />
            <Text style={styles.fieldLabel}>Confirm New Password</Text>
            <TextInput
              value={cp.new2}
              onChangeText={(t) => setCp((s) => ({ ...s, new2: t }))}
              secureTextEntry
              style={styles.field}
              placeholder="••••••••"
              placeholderTextColor="#90a4ae"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSecondary]}
                onPress={() => setPasswordModal(false)}
                disabled={processing}
              >
                <Text style={styles.modalSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalPrimary]}
                onPress={submitPassword}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.modalPrimaryText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={deleteModal}
        animationType="slide"
        transparent
        onRequestClose={() => setDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { borderTopColor: '#ef5350' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="trash-outline" size={26} color="#d32f2f" />
              <Text style={[styles.modalTitle, { color: '#b71c1c' }]}>Delete Your Account</Text>
            </View>
            <Text style={{ color: '#455a64', lineHeight: 22, marginBottom: 16 }}>
              This permanently deletes your AgroLens account and all prediction history. This cannot be undone.
            </Text>
            <Text style={styles.fieldLabel}>Enter your password to confirm</Text>
            <TextInput
              value={deletePw}
              onChangeText={setDeletePw}
              secureTextEntry
              style={styles.field}
              placeholder="••••••••"
              placeholderTextColor="#90a4ae"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSecondary]}
                onPress={() => setDeleteModal(false)}
                disabled={processing}
              >
                <Text style={styles.modalSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#e53935' }]}
                onPress={submitDelete}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={[styles.modalPrimaryText]}>Delete Permanently</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={settingsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Ionicons name="settings-outline" size={26} color="#2e7d32" />
              <Text style={styles.modalTitle}>Settings</Text>
            </View>
            <View style={{ paddingVertical: 10, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#e8f5e9' }]}>
                  <Ionicons name="cloud-done-outline" size={20} color="#2e7d32" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuText}>Cloud Sync</Text>
                  <Text style={styles.menuSubtext}>
                    {user ? 'Your scans sync with the AgroLens API.' : 'Sign in to sync predictions.'}
                  </Text>
                </View>
                <Ionicons
                  name={user ? 'checkmark-circle' : 'cloud-offline-outline'}
                  size={22}
                  color={user ? '#2e7d32' : '#90a4ae'}
                />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#e3f2fd' }]}>
                  <Ionicons name="analytics-outline" size={20} color="#1976d2" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuText}>Local cache</Text>
                  <Text style={styles.menuSubtext}>
                    Your recent scans are kept on-device for offline viewing.
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#fff3e0' }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#ef6c00" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuText}>Privacy</Text>
                  <Text style={styles.menuSubtext}>
                    Photos are processed server-side and deleted after inference.
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalPrimary, { flex: 1 }]}
                onPress={() => setSettingsModal(false)}
              >
                <Text style={styles.modalPrimaryText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f9f5' },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SECTION_PADDING,
    paddingTop: 10,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1a3a2a' },
  settingsButton: { padding: 8 },

  toast: {
    position: 'absolute',
    top: 70,
    left: 20,
    right: 20,
    zIndex: 20,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#37474f',
    elevation: 4,
  },
  toastError: { backgroundColor: '#c62828' },
  toastSuccess: { backgroundColor: '#2e7d32' },
  toastText: { color: 'white', fontWeight: '600', flex: 1 },

  profileCard: {
    backgroundColor: 'white',
    margin: SECTION_PADDING,
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
    overflow: 'hidden',
  },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  profileName: { fontSize: 22, fontWeight: '800', color: '#1a3a2a' },
  profileEmail: { fontSize: 15, color: '#78909c', marginTop: 6 },

  menuCard: {
    backgroundColor: 'white',
    marginHorizontal: SECTION_PADDING,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    marginBottom: SECTION_PADDING,
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
  menuTextContainer: { flex: 1 },
  menuText: { fontSize: 16, fontWeight: '600', color: '#1a3a2a' },
  menuSubtext: { fontSize: 13, color: '#78909c', marginTop: 2 },

  actionOutline: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  actionPrimary: { borderRadius: 12, overflow: 'hidden' },

  logoutButton: {
    backgroundColor: 'white',
    marginHorizontal: SECTION_PADDING,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 2,
    marginBottom: 12,
  },
  logoutText: {
    color: '#f44336',
    fontSize: 17,
    fontWeight: '700',
  },
  dangerButton: {
    backgroundColor: '#ffebee',
    marginHorizontal: SECTION_PADDING,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 1,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ef9a9a',
  },
  dangerButtonText: {
    color: '#c62828',
    fontSize: 16,
    fontWeight: '700',
  },

  footer: { alignItems: 'center', paddingTop: 10 },
  footerText: { fontSize: 14, color: '#607d8b', fontWeight: '700' },
  footerSub: { fontSize: 12, color: '#90a4ae', marginTop: 4, letterSpacing: 0.4 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(27, 48, 35, 0.55)',
    padding: SECTION_PADDING,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: SECTION_PADDING,
    borderTopWidth: 4,
    borderTopColor: '#2e7d32',
    elevation: 10,
  },
  modalTitle: { fontSize: 19, fontWeight: '800', color: '#1a3a2a', marginLeft: 8 },
  fieldLabel: { fontSize: 12, color: '#546e7a', fontWeight: '700', marginTop: 12, marginBottom: 6, letterSpacing: 0.3 },
  field: {
    borderWidth: 1,
    borderColor: '#cfd8dc',
    backgroundColor: '#fafafa',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#263238',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 22 },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  modalSecondary: { backgroundColor: '#eceff1' },
  modalPrimary: { backgroundColor: '#2e7d32' },
  modalSecondaryText: { color: '#455a64', fontWeight: '700' },
  modalPrimaryText: { color: 'white', fontWeight: '700' },
});