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
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppLogo from '../../assets/logo.png';
import API_URL from '../config/api';
import { updateUserStats } from '../services/AuthService';

// ── Backend URL from centralized config ─────────────────────────

export default function HomeScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [plantHealth, setPlantHealth] = useState(85);
  const [result, setResult] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isLeaf, setIsLeaf] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required.');
      }
    })();
  }, []);

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
        setIsLeaf(null);
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
        setIsLeaf(null);
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
    setIsLeaf(null);

    try {
      const formData = new FormData();
      formData.append('image', {
        uri: image.uri,
        type: image.mimeType || image.type || 'image/jpeg',
        name: image.fileName || 'photo.jpg',
      });

      console.log('📤 Sending to:', `${API_URL}/predict`);

      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        body: formData,
        headers: {
  'ngrok-skip-browser-warning': 'true',
  'Bypass-Tunnel-Reminder': 'true',
  'Accept': 'application/json',
},
      });

      console.log('✅ HTTP status:', response.status);
      const json = await response.json();
      console.log('✅ Response:', JSON.stringify(json));

      if (json.success) {
        const prediction = json.data;
        // Add id and timestamp for history
        const predictionWithMeta = {
          ...prediction,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
        };
        setResult(predictionWithMeta);
        setIsLeaf(prediction.is_leaf !== undefined ? prediction.is_leaf : true);

        if (prediction.is_leaf !== false) {
          // Save to AsyncStorage history
          try {
            const existingHistory = await AsyncStorage.getItem('predictions');
            const history = existingHistory ? JSON.parse(existingHistory) : [];
            const updatedHistory = [predictionWithMeta, ...history].slice(0, 50); // Keep last 50
            await AsyncStorage.setItem('predictions', JSON.stringify(updatedHistory));
            // Update user stats
            await updateUserStats(prediction);
          } catch (error) {
            console.error('Error saving prediction:', error);
          }
        }

        if (prediction.is_leaf === false) {
          Alert.alert(
            '⚠️ Not a Tomato Leaf!',
            'Please upload a clear photo of a tomato leaf for accurate disease detection.',
            [{ text: 'OK' }]
          );
        }
        setPlantHealth(prediction.status === 'Healthy' ? 95 : 65);
      } else {
        Alert.alert('Error', json.error || 'Prediction failed');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      Alert.alert(
        'Connection Error',
        `Could not reach the server.\n\n${error.message}\n\nCheck:\n1. Backend running (port 3000)\n2. FastAPI running (port 5001)\n3. Tunnel running & URL correct`
      );
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setResult(null);
    setIsLeaf(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.headerRow}>
              <Image source={AppLogo} style={styles.logoSmall} resizeMode="contain" />
              <Text style={styles.headerTitle}> AgroLens</Text>
            </View>
            <Text style={styles.headerSubtitle}>Tomato (Solanum lycopersicum)</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle-outline" size={36} color="#1a3a2a" />
          </TouchableOpacity>
        </View>

        {/* Scan Card */}
        <View style={styles.scanCard}>
          <LinearGradient
            colors={['#1a3a2a', '#2c3e50']}
            style={styles.scanGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.scanCardTitle}>📸 Tap to Analyze</Text>
            <Text style={styles.scanCardSub}>
              Align leaf clearly in the center for best results
            </Text>

            {image ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                <TouchableOpacity onPress={clearImage} style={styles.clearImageBtn}>
                  <Ionicons name="close-outline" size={20} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.placeholderBox}>
                <Ionicons name="leaf-outline" size={40} color="#8aaa9a" />
                <Text style={styles.placeholderText}>No image selected</Text>
              </View>
            )}

            <View style={styles.scanButtons}>
              <TouchableOpacity style={[styles.scanBtn, styles.cameraBtn]} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={20} color="white" />
                <Text style={styles.scanBtnText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.scanBtn, styles.galleryBtn]} onPress={pickImage}>
                <Ionicons name="images-outline" size={20} color="white" />
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
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Ionicons name="scan-outline" size={20} color="white" />
                      <Text style={styles.detectBtnText}> Detect Disease</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            <View style={styles.proTip}>
              <Ionicons name="bulb-outline" size={14} color="#8aaa9a" />
              <Text style={styles.proTipText}>
                Pro Tip: Natural morning light provides the highest accuracy.
              </Text>
            </View>
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
                  {!result.is_leaf ? '⚠️ Not a Leaf' :
                   result.status === 'Healthy' ? '✅ Healthy Plant' : '⚠️ Disease Detected'}
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
                      <Text style={styles.viewDetailsText}>View Full Details →</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.closeResultBtn}
                  onPress={() => {
                    setResult(null);
                    setIsLeaf(null);
                  }}
                >
                  <Text style={styles.closeResultText}>✕ Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Plant Health */}
        <View style={styles.healthCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pulse-outline" size={22} color="#2ecc71" />
            <Text style={styles.sectionTitle}> Plant Health</Text>
          </View>
          <View style={styles.healthRow}>
            <Text style={styles.healthPercentage}>{plantHealth}%</Text>
            <View style={styles.healthBar}>
              <View
                style={[
                  styles.healthFill,
                  { width: `${plantHealth}%` },
                  { backgroundColor: plantHealth > 70 ? '#2ecc71' : '#f39c12' },
                ]}
              />
            </View>
          </View>
          <Text style={styles.healthDescription}>
            Primary systems are functioning optimally with minor localized stress
            detected in foliar tissues.
          </Text>
        </View>

        {/* Issues Found */}
        <View style={styles.issuesCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning-outline" size={22} color="#e67e22" />
            <Text style={styles.sectionTitle}> Issues Found</Text>
          </View>
          <View style={styles.issueItem}>
            <Text style={styles.issueTitle}>Nitrogen Deficiency (Low)</Text>
            <Text style={styles.issueDesc}>
              Spotted localized pest activity on the underside of the central leaf
              cluster.
            </Text>
          </View>
        </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home" size={28} color="#2ecc71" />
            <Text style={[styles.navText, styles.navActive]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('History')}
          >
            <Ionicons name="time-outline" size={28} color="#8a9a8a" />
            <Text style={styles.navText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-outline" size={28} color="#8a9a8a" />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f9f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  logoSmall: { width: 32, height: 32, marginRight: 8 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a3a2a' },
  headerSubtitle: { fontSize: 14, color: '#5a7a6a', fontStyle: 'italic', marginTop: 2 },
  profileButton: { padding: 4 },
  scanCard: { margin: 20, marginTop: 0, borderRadius: 20, overflow: 'hidden', elevation: 10 },
  scanGradient: { padding: 25, alignItems: 'center' },
  scanCardTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  scanCardSub: { fontSize: 14, color: '#8aaa9a', textAlign: 'center', marginTop: 4 },
  imagePreviewContainer: { position: 'relative', width: '100%', marginTop: 15 },
  imagePreview: { width: '100%', height: 180, borderRadius: 12, backgroundColor: '#2c3e50' },
  clearImageBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 15, padding: 4 },
  placeholderBox: { width: '100%', height: 100, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  placeholderText: { color: '#8aaa9a', fontSize: 14, marginTop: 8 },
  scanButtons: { flexDirection: 'row', marginTop: 15, gap: 12 },
  scanBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, gap: 8 },
  cameraBtn: { backgroundColor: 'rgba(255,255,255,0.2)' },
  galleryBtn: { backgroundColor: 'rgba(255,255,255,0.15)' },
  scanBtnText: { color: 'white', fontSize: 14, fontWeight: '500' },
  detectBtn: { borderRadius: 10, overflow: 'hidden', marginTop: 15, width: '100%' },
  detectBtnDisabled: { opacity: 0.6 },
  detectGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  detectBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  proTip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 10, marginTop: 15, gap: 8 },
  proTipText: { flex: 1, fontSize: 12, color: '#8aaa9a', lineHeight: 16 },

  resultCard: { margin: 20, marginTop: 0, borderRadius: 16, overflow: 'hidden', elevation: 5 },
  resultHeaderGradient: { padding: 16 },
  resultHeader: { flexDirection: 'row', alignItems: 'center' },
  resultHeaderText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  resultBody: { backgroundColor: 'white', padding: 16 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f4f0' },
  resultLabel: { fontSize: 14, color: '#5a7a6a' },
  resultDisease: { fontSize: 16, fontWeight: 'bold', color: '#1a3a2a' },

  notLeafContainer: { alignItems: 'center', paddingVertical: 16 },
  notLeafTitle: { fontSize: 20, fontWeight: 'bold', color: '#e67e22', marginTop: 10 },
  notLeafSub: { fontSize: 14, color: '#5a7a6a', textAlign: 'center', marginTop: 4 },

  confidenceContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 20 },
  confidenceBar: { flex: 1, height: 6, backgroundColor: '#ecf0ec', borderRadius: 3, overflow: 'hidden', marginRight: 10 },
  confidenceFill: { height: '100%', borderRadius: 3 },
  confidenceText: { fontSize: 14, fontWeight: '600', color: '#1a3a2a', minWidth: 45, textAlign: 'right' },
  resultActions: { flexDirection: 'row', marginTop: 12, gap: 10 },
  viewDetailsBtn: { flex: 2, borderRadius: 10, overflow: 'hidden' },
  viewDetailsGradient: { paddingVertical: 10, alignItems: 'center' },
  viewDetailsText: { color: 'white', fontSize: 14, fontWeight: '600' },
  closeResultBtn: { flex: 1, backgroundColor: '#ecf0ec', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  closeResultText: { color: '#5a7a6a', fontSize: 14, fontWeight: '500' },

  healthCard: { backgroundColor: 'white', margin: 20, marginTop: 0, padding: 20, borderRadius: 16, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a3a2a', marginLeft: 8 },
  healthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  healthPercentage: { fontSize: 24, fontWeight: 'bold', color: '#1a3a2a', marginRight: 15 },
  healthBar: { flex: 1, height: 10, backgroundColor: '#ecf0ec', borderRadius: 5, overflow: 'hidden' },
  healthFill: { height: '100%', borderRadius: 5 },
  healthDescription: { fontSize: 14, color: '#5a7a6a', lineHeight: 20 },
  issuesCard: { backgroundColor: 'white', margin: 20, marginTop: 0, padding: 20, borderRadius: 16, elevation: 2 },
  issueItem: { backgroundColor: '#fdf5f0', padding: 15, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: '#e67e22' },
  issueTitle: { fontWeight: 'bold', color: '#1a3a2a' },
  issueDesc: { fontSize: 13, color: '#5a7a6a', marginTop: 4 },
  bottomNav: { flexDirection: 'row', backgroundColor: 'white', padding: 10, borderRadius: 20, margin: 20, elevation: 5, justifyContent: 'space-around' },
  navItem: { alignItems: 'center', padding: 10 },
  navText: { fontSize: 12, color: '#8a9a8a', marginTop: 4 },
  navActive: { color: '#2ecc71' },
});