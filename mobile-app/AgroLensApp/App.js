import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  View,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// API Configuration - CHANGE THIS TO YOUR IP
const API_URL = Platform.select({
  android: 'http://10.0.2.2:3000/api',
  ios: 'http://localhost:3000/api',
  default: 'http://10.0.2.2:3000/api',
});

const App = () => {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required');
      }
      loadHistory();
    })();
  }, []);

  const loadHistory = async () => {
    try {
      const saved = await AsyncStorage.getItem('predictions');
      if (saved) setHistory(JSON.parse(saved));
    } catch (error) {
      console.log('Error loading history:', error);
    }
  };

  const saveToHistory = async (prediction) => {
    const newItem = {
      id: Date.now().toString(),
      disease: prediction.disease,
      confidence: prediction.confidence,
      status: prediction.status,
      timestamp: new Date().toISOString(),
    };
    const updated = [newItem, ...history].slice(0, 10);
    setHistory(updated);
    await AsyncStorage.setItem('predictions', JSON.stringify(updated));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0]);
      setResult(null);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0]);
      setResult(null);
    }
  };

  const predictDisease = async () => {
    if (!image) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('image', {
      uri: image.uri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    });

    try {
      console.log('📤 Sending to backend...');
      const response = await axios.post(`${API_URL}/predict`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });

      console.log('✅ Response:', response.data);

      if (response.data.success) {
        setResult(response.data.data);
        await saveToHistory(response.data.data);
      } else {
        Alert.alert('Error', 'Prediction failed');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      Alert.alert(
        'Connection Error',
        'Could not connect to backend.\n\nMake sure:\n1. Backend is running on port 3000\n2. FastAPI is running on port 5001\n3. Phone and computer are on same network'
      );
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setImage(null);
    setResult(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>🌿 AgroLens</Text>
          <Text style={styles.subtitle}>Tomato Disease Detection</Text>
        </View>

        {image && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image.uri }} style={styles.image} />
            <TouchableOpacity onPress={clearAll} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, styles.cameraButton]} onPress={takePhoto}>
            <Text style={styles.buttonText}>📸 Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.galleryButton]} onPress={pickImage}>
            <Text style={styles.buttonText}>🖼️ Gallery</Text>
          </TouchableOpacity>
        </View>

        {image && (
          <TouchableOpacity
            style={[styles.detectButton, loading && styles.detectButtonDisabled]}
            onPress={predictDisease}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.detectButtonText}>🔍 Detect Disease</Text>
            )}
          </TouchableOpacity>
        )}

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>📊 Detection Result</Text>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Status:</Text>
              <Text
                style={[
                  styles.resultValue,
                  result.status === 'Healthy' ? styles.healthyText : styles.diseasedText,
                ]}
              >
                {result.status}
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Disease:</Text>
              <Text style={styles.resultValue}>{result.disease}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Confidence:</Text>
              <Text style={styles.resultValue}>{result.confidence}%</Text>
            </View>

            {result.probabilities && (
              <View style={styles.probabilityContainer}>
                <Text style={styles.probabilityTitle}>All Probabilities:</Text>
                {Object.entries(result.probabilities).map(([key, value]) => (
                  <View key={key} style={styles.probabilityRow}>
                    <Text style={styles.probabilityLabel}>{key}:</Text>
                    <View style={styles.probabilityBar}>
                      <View
                        style={[
                          styles.probabilityFill,
                          { width: `${value}%` },
                          { backgroundColor: key === result.disease ? '#2ecc71' : '#ecf0f1' },
                        ]}
                      />
                    </View>
                    <Text style={styles.probabilityValue}>{value.toFixed(1)}%</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {history.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>📋 Recent Predictions</Text>
            {history.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <Text style={styles.historyDisease}>{item.disease}</Text>
                <Text
                  style={[
                    styles.historyStatus,
                    { color: item.status === 'Healthy' ? '#27ae60' : '#e74c3c' },
                  ]}
                >
                  {item.status}
                </Text>
                <Text style={styles.historyConfidence}>{item.confidence}%</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 4,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#ecf0f1',
  },
  clearButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cameraButton: {
    backgroundColor: '#2c3e50',
  },
  galleryButton: {
    backgroundColor: '#34495e',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  detectButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  detectButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  detectButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  resultLabel: {
    fontSize: 15,
    color: '#7f8c8d',
  },
  resultValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
  healthyText: {
    color: '#27ae60',
  },
  diseasedText: {
    color: '#e74c3c',
  },
  probabilityContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  probabilityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  probabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  probabilityLabel: {
    width: 90,
    fontSize: 12,
    color: '#7f8c8d',
  },
  probabilityBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    marginHorizontal: 8,
  },
  probabilityFill: {
    height: '100%',
    borderRadius: 3,
  },
  probabilityValue: {
    width: 50,
    fontSize: 12,
    color: '#2c3e50',
    textAlign: 'right',
  },
  historyContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  historyDisease: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    flex: 1,
  },
  historyStatus: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 10,
  },
  historyConfidence: {
    fontSize: 14,
    color: '#7f8c8d',
  },
});

export default App;