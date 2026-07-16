
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppLogo from '../../assets/logo.png';
import API_URL from '../config/api';
import { updateUserStats, getCurrentUser } from '../services/AuthService';

export default function HomeScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [recentScan, setRecentScan] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required.');
      }
    })();
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadRecentScan(), loadUser()]);
  }

  const loadUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  }

  const loadRecentScan = async () => {
    try {
      const saved = await AsyncStorage.getItem('predictions');
      if (saved) {
        const history = JSON.parse(saved);
        if (history.length > 0) {
          setRecentScan(history[0]);
        }
      }
    } catch (error) {
      // Silent error for local storage
    }
  };

  useEffect(() => {
    if (result) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [result]);

  const takePhoto = async () => {
    try {
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setImage(res.assets[0]);
        setResult(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setImage(res.assets[0]);
        setResult(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const detectDisease = async () => {
    if (!image) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', {
        uri: image.uri,
        type: image.mimeType || image.type || 'image/jpeg',
        name: image.fileName || 'photo.jpg',
      });

      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        body: formData,
        headers: {
  'ngrok-skip-browser-warning': 'true',
  'Bypass-Tunnel-Reminder': 'true',
  'Accept': 'application/json',
},
      });

      const json = await response.json();

      if (json.success) {
        const prediction = json.data;
        const predictionWithMeta = {
          ...prediction,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
        };
        setResult(predictionWithMeta);
        setRecentScan(predictionWithMeta);

        if (prediction.is_leaf !== false) {
          try {
            const existingHistory = await AsyncStorage.getItem('predictions');
            const history = existingHistory ? JSON.parse(existingHistory) : [];
            const updatedHistory = [predictionWithMeta, ...history].slice(0, 50);
            await AsyncStorage.setItem('predictions', JSON.stringify(updatedHistory));
            await updateUserStats(prediction);
          } catch (error) {
            // Silent error for local storage
          }
        }

        if (prediction.is_leaf === false) {
          Alert.alert(
            'Not a Tomato Leaf',
            'Please upload a clear photo of a tomato leaf for accurate disease detection.',
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert('Error', json.error || 'Prediction failed');
      }
    } catch (error) {
      Alert.alert(
        'Connection Error',
        `Could not reach the server.\n\nPlease check if backend and FastAPI are running.`
      );
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setResult(null);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.headerRow}>
              <Image source={AppLogo} style={styles.logoSmall} resizeMode="contain" />
              <Text style={styles.headerTitle}>AgroLens</Text>
            </View>
            <Text style={styles.headerSubtitle}>Tomato Disease Detection</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle-outline" size={36} color="#1a3a2a" />
          </TouchableOpacity>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            {user?.name ? `${getGreeting()}, ${user.name}!` : `${getGreeting()}!`}
          </Text>
          <Text style={styles.welcomeText}>Scan tomato leaves for instant disease analysis</Text>
        </View>

        {/* Scan Card */}
        <View style={styles.scanCard}>
          <LinearGradient
            colors={['#1a3a2a', '#2c3e50']}
            style={styles.scanGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {image ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                <TouchableOpacity onPress={clearImage} style={styles.clearImageBtn}>
                  <Ionicons name="close-outline" size={24} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.placeholderBox}>
                <Ionicons name="leaf-outline" size={50} color="#8aaa9a" />
                <Text style={styles.placeholderText}>Select a leaf image</Text>
              </View>
            )}

            <View style={styles.scanButtons}>
              <TouchableOpacity style={[styles.scanBtn, styles.cameraBtn]} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={24} color="white" />
                <Text style={styles.scanBtnText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.scanBtn, styles.galleryBtn]} onPress={pickImage}>
                <Ionicons name="images-outline" size={24} color="white" />
                <Text style={styles.scanBtnText}>Gallery</Text>
              </TouchableOpacity>
            </View>

            {image && (
              <TouchableOpacity
                style={[styles.detectBtn, loading && styles.detectBtnDisabled]}
                onPress={detectDisease}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#2ecc71', '#27ae60']}
                  style={styles.detectGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <>
                      <ActivityIndicator color="white" size="small" />
                      <Text style={styles.detectBtnText}> Analyzing...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="scan-outline" size={24} color="white" />
                      <Text style={styles.detectBtnText}> Detect Disease</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>

        {/* Result Card */}
        {result && (
          <Animated.View style={[styles.resultCard, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={
                !result.is_leaf ? ['#e67e22', '#f39c12'] :
                result.status === 'Healthy' ? ['#27ae60', '#2ecc71'] : ['#e74c3c', '#f39c12']
              }
              style={styles.resultHeaderGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.resultHeader}>
                <Ionicons
                  name={
                    !result.is_leaf ? 'warning-outline' :
                    result.status === 'Healthy' ? 'checkmark-circle' : 'alert-circle'
                  }
                  size={32}
                  color="white"
                />
                <Text style={styles.resultHeaderText}>
                  {!result.is_leaf ? 'Not a Leaf' :
                   result.status === 'Healthy' ? 'Healthy Plant' : 'Disease Detected'}
                </Text>
              </View>
            </LinearGradient>

            <View style={styles.resultBody}>
              {!result.is_leaf ? (
                <View style={styles.notLeafContainer}>
                  <Ionicons name="leaf-outline" size={60} color="#e67e22" />
                  <Text style={styles.notLeafTitle}>Not a Tomato Leaf!</Text>
                  <Text style={styles.notLeafSub}>
                    Please upload a clear photo of a tomato leaf.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Disease</Text>
                    <Text style={styles.resultDisease}>{result.disease}</Text>
                  </View>

                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Confidence</Text>
                    <View style={styles.confidenceContainer}>
                      <View style={styles.confidenceBar}>
                        <View
                          style={[
                            styles.confidenceFill,
                            {
                              width: `${result.confidence}%`,
                              backgroundColor: result.confidence > 70 ? '#2ecc71' : '#f39c12'
                            }
                          ]}
                        />
                      </View>
                      <Text style={styles.confidenceText}>{result.confidence}%</Text>
                    </View>
                  </View>
                </>
              )}

              <View style={styles.resultActions}>
                {result.is_leaf && (
                  <TouchableOpacity
                    style={styles.viewDetailsBtn}
                    onPress={() => navigation.navigate('Results', { result })}
                  >
                    <LinearGradient
                      colors={['#2ecc71', '#27ae60']}
                      style={styles.viewDetailsGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.viewDetailsText}>View Full Details</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.closeResultBtn}
                  onPress={() => {
                    setResult(null);
                  }}
                >
                  <Ionicons name="close-outline" size={20} color="#5a7a6a" />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Recent Scan */}
        {recentScan && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Scan</Text>
              <TouchableOpacity onPress={() => navigation.navigate('History')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.recentCard} onPress={() => navigation.navigate('Results', { result: recentScan })}>
              <View style={[styles.statusBadge, recentScan.status === 'Healthy' ? styles.healthyBadge : styles.diseasedBadge]}>
                <Text style={styles.statusBadgeText}>{recentScan.status}</Text>
              </View>
              <View style={styles.recentInfo}>
                <Text style={styles.recentDisease}>{recentScan.disease}</Text>
                <Text style={styles.recentDate}>{new Date(recentScan.timestamp).toLocaleString()}</Text>
              </View>
              <Text style={styles.recentConfidence}>{recentScan.confidence}%</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Access Cards */}
        <View style={styles.quickAccessSection}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('History')}
          >
            <View style={[styles.quickIconContainer, { backgroundColor: '#e3f2fd' }]}>
              <Ionicons name="time-outline" size={28} color="#2196f3" />
            </View>
            <Text style={styles.quickTitle}>History</Text>
            <Text style={styles.quickSubtitle}>View past scans</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={[styles.quickIconContainer, { backgroundColor: '#e8f5e9' }]}>
              <Ionicons name="person-outline" size={28} color="#4caf50" />
            </View>
            <Text style={styles.quickTitle}>Profile</Text>
            <Text style={styles.quickSubtitle}>View your stats</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f9f5' },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  logoSmall: { width: 36, height: 36, marginRight: 10 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#1a3a2a' },
  headerSubtitle: { fontSize: 14, color: '#5a7a6a', marginTop: 4 },
  profileButton: { padding: 4 },

  welcomeSection: { paddingHorizontal: 20, marginBottom: 20 },
  welcomeTitle: { fontSize: 22, fontWeight: '700', color: '#1a3a2a', marginBottom: 4 },
  welcomeText: { fontSize: 15, color: '#5a7a6a' },

  scanCard: { marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', elevation: 10, marginBottom: 20 },
  scanGradient: { padding: 24, alignItems: 'center' },
  imagePreviewContainer: { position: 'relative', width: '100%', marginBottom: 16 },
  imagePreview: { width: '100%', height: 200, borderRadius: 14, backgroundColor: '#2c3e50' },
  clearImageBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 18, padding: 6 },
  placeholderBox: { width: '100%', height: 120, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  placeholderText: { color: '#8aaa9a', fontSize: 15, marginTop: 10 },
  scanButtons: { flexDirection: 'row', width: '100%', gap: 12, marginBottom: 16 },
  scanBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  cameraBtn: { backgroundColor: 'rgba(255,255,255,0.2)' },
  galleryBtn: { backgroundColor: 'rgba(255,255,255,0.15)' },
  scanBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  detectBtn: { borderRadius: 14, overflow: 'hidden', width: '100%' },
  detectBtnDisabled: { opacity: 0.6 },
  detectGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  detectBtnText: { color: 'white', fontSize: 18, fontWeight: '700' },

  resultCard: { marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', elevation: 5, marginBottom: 20 },
  resultHeaderGradient: { padding: 18 },
  resultHeader: { flexDirection: 'row', alignItems: 'center' },
  resultHeaderText: { color: 'white', fontSize: 20, fontWeight: '700', marginLeft: 10 },
  resultBody: { backgroundColor: 'white', padding: 18 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f4f0' },
  resultLabel: { fontSize: 15, color: '#5a7a6a', fontWeight: '500' },
  resultDisease: { fontSize: 17, fontWeight: '700', color: '#1a3a2a' },

  notLeafContainer: { alignItems: 'center', paddingVertical: 20 },
  notLeafTitle: { fontSize: 20, fontWeight: '700', color: '#e67e22', marginTop: 12 },
  notLeafSub: { fontSize: 15, color: '#5a7a6a', textAlign: 'center', marginTop: 6 },

  confidenceContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 16 },
  confidenceBar: { flex: 1, height: 8, backgroundColor: '#ecf0ec', borderRadius: 4, overflow: 'hidden', marginRight: 12 },
  confidenceFill: { height: '100%', borderRadius: 4 },
  confidenceText: { fontSize: 15, fontWeight: '700', color: '#1a3a2a', minWidth: 50, textAlign: 'right' },
  resultActions: { flexDirection: 'row', marginTop: 16, gap: 12 },
  viewDetailsBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  viewDetailsGradient: { paddingVertical: 14, alignItems: 'center' },
  viewDetailsText: { color: 'white', fontSize: 15, fontWeight: '600' },
  closeResultBtn: { backgroundColor: '#f0f4f0', borderRadius: 12, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 14 },

  recentSection: { marginHorizontal: 20, marginBottom: 20 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a3a2a' },
  viewAllText: { fontSize: 14, color: '#2ecc71', fontWeight: '600' },
  recentCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 2
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  healthyBadge: { backgroundColor: '#d5f5e3' },
  diseasedBadge: { backgroundColor: '#fadbd8' },
  statusBadgeText: { fontSize: 12, fontWeight: '700', color: '#1a3a2a' },
  recentInfo: { flex: 1 },
  recentDisease: { fontSize: 16, fontWeight: '600', color: '#1a3a2a' },
  recentDate: { fontSize: 12, color: '#95a5a6', marginTop: 2 },
  recentConfidence: { fontSize: 18, fontWeight: '700', color: '#1a3a2a' },

  quickAccessSection: { marginHorizontal: 20, flexDirection: 'row', gap: 12 },
  quickCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    elevation: 2
  },
  quickIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  quickTitle: { fontSize: 16, fontWeight: '700', color: '#1a3a2a', marginBottom: 4 },
  quickSubtitle: { fontSize: 13, color: '#95a5a6' },
});

