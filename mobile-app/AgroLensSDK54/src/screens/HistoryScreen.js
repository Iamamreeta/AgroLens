
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
      // Silent error for local storage
    }
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem('predictions');
      setHistory([]);
    } catch (error) {
      // Silent error for local storage
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => navigation.navigate('Results', { result: item })}
    >
      <View style={[styles.statusIconContainer, item.status === 'Healthy' ? styles.healthyIconContainer : styles.diseasedIconContainer]}>
        <Ionicons
          name={item.status === 'Healthy' ? 'leaf' : 'warning'}
          size={28}
          color="white"
        />
      </View>
      <View style={styles.historyInfo}>
        <Text style={styles.historyDisease}>{item.disease}</Text>
        <Text style={styles.historyDate}>{formatDate(item.timestamp)}</Text>
      </View>
      <View style={styles.historyRight}>
        <Text style={[styles.historyStatus, { color: item.status === 'Healthy' ? '#4caf50' : '#f44336' }]}>
          {item.status}
        </Text>
        <Text style={styles.historyConfidence}>{item.confidence}%</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a3a2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan History</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={clearHistory} style={styles.clearButton}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="document-text-outline" size={70} color="#b0bec5" />
          </View>
          <Text style={styles.emptyText}>No scans yet</Text>
          <Text style={styles.emptySubtext}>Start by scanning a tomato leaf</Text>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Ionicons name="camera-outline" size={24} color="white" />
            <Text style={styles.scanButtonText}>Scan Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a3a2a',
  },
  clearButton: {
    padding: 4,
  },
  clearText: {
    fontSize: 15,
    color: '#f44336',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  historyItem: {
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    gap: 14,
  },
  statusIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthyIconContainer: {
    backgroundColor: '#4caf50',
  },
  diseasedIconContainer: {
    backgroundColor: '#f44336',
  },
  historyInfo: {
    flex: 1,
  },
  historyDisease: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a3a2a',
  },
  historyDate: {
    fontSize: 13,
    color: '#78909c',
    marginTop: 4,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyConfidence: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1a3a2a',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eceff1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    color: '#1a3a2a',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#78909c',
    marginBottom: 30,
  },
  scanButton: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
});

