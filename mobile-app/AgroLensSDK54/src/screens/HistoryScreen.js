import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const saved = await AsyncStorage.getItem('predictions');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Error loading history:', error);
    }
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem('predictions');
      setHistory([]);
    } catch (error) {
      console.log('Error clearing history:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyInfo}>
        <Text style={styles.historyDisease}>{item.disease}</Text>
        <Text style={styles.historyDate}>{formatDate(item.timestamp)}</Text>
      </View>
      <View style={styles.historyRight}>
        <Text style={[styles.historyStatus, { color: item.status === 'Healthy' ? '#27ae60' : '#e74c3c' }]}>
          {item.status === 'Healthy' ? '✅' : '⚠️'} {item.status}
        </Text>
        <Text style={styles.historyConfidence}>{item.confidence.toFixed(1)}%</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={24} color="#2ecc71" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📋 History</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={clearHistory}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={60} color="#95a5a6" />
          <Text style={styles.emptyText}>No predictions yet</Text>
          <Text style={styles.emptySubtext}>Scan a leaf to get started</Text>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => navigation.navigate('Home')}  // ✅ Changed from 'Scan' to 'Home'
          >
            <Ionicons name="leaf-outline" size={22} color="white" />
            <Text style={styles.scanButtonText}> Go to Home</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a3a2a',
  },
  clearText: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
  },
  historyItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  historyInfo: {
    flex: 1,
  },
  historyDisease: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a3a2a',
  },
  historyDate: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  historyConfidence: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#1a3a2a',
    fontWeight: '500',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 4,
  },
  scanButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});