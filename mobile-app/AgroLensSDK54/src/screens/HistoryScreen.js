import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getHistory as fetchHistory,
  deletePrediction as deleteOne,
  clearHistory as clearAll,
  getCurrentUser,
} from '../services/AuthService';

const STATUS_FILTERS = [
  { key: 'all', label: 'All', icon: 'filter-outline' },
  { key: 'Healthy', label: 'Healthy', icon: 'leaf' },
  { key: 'Diseased', label: 'Diseased', icon: 'bug-outline' },
  { key: 'Unknown', label: 'Unknown', icon: 'help-outline' },
];

const SORT_OPTIONS = [
  { key: 'created_at|DESC', label: 'Newest first' },
  { key: 'created_at|ASC', label: 'Oldest first' },
  { key: 'confidence|DESC', label: 'Highest confidence' },
  { key: 'confidence|ASC', label: 'Lowest confidence' },
];

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState(SORT_OPTIONS[0].key);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [user, setUser] = useState(null);
  const [showSortPicker, setShowSortPicker] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const loadHistory = useCallback(async () => {
    setErrorMsg(null);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      const [sortBy, sortDir] = sortKey.split('|');
      const r = await fetchHistory({
        search: search.trim(),
        status: statusFilter,
        sortBy,
        sortDir,
        limit: 200,
        offset: 0,
      });
      if (!r.success && (r.history || []).length === 0) {
        setErrorMsg(r.error || 'Using cached local history.');
      }
      setHistory(r.history || []);
    } catch (e) {
      setErrorMsg(e.message || 'Failed to load history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, sortKey]);

  useEffect(() => {
    setLoading(true);
    loadHistory();
  }, [loadHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const confirmDelete = (id) => {
    Alert.alert(
      'Delete this scan?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(id);
            try {
              const result = await deleteOne(id);
              if (result.success) {
                setHistory((prev) => prev.filter((p) => p.id !== id));
              } else {
                Alert.alert('Error', result.error || 'Failed to delete');
              }
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const confirmClearAll = () => {
    if (history.length === 0) return;
    Alert.alert(
      'Clear all history?',
      'This will delete every scan permanently for this account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const r = await clearAll();
              if (r.success) setHistory([]);
              else Alert.alert('Error', r.error || 'Failed to clear history');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const localFiltered = useMemo(() => {
    const arr = [...history];
    const s = search.trim().toLowerCase();
    if (s) {
      const matches = (t) => typeof t === 'string' && t.toLowerCase().includes(s);
      return arr.filter(
        (p) =>
          matches(p.disease) ||
          matches(p.disease_name) ||
          matches(p.status) ||
          matches(p.symptoms)
      );
    }
    return arr;
  }, [history, search]);

  const counts = useMemo(() => {
    const total = history.length;
    const healthy = history.filter((p) => p.status === 'Healthy').length;
    const diseased = history.filter((p) => p.status === 'Diseased').length;
    return { total, healthy, diseased };
  }, [history]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.historyItem}
      activeOpacity={0.75}
      onPress={() => navigation.navigate('Results', { result: item })}
    >
      <View
        style={[
          styles.statusIconContainer,
          item.status === 'Healthy' ? styles.healthyIconContainer : styles.diseasedIconContainer,
        ]}
      >
        <Ionicons
          name={item.status === 'Healthy' ? 'leaf' : 'warning'}
          size={28}
          color="white"
        />
      </View>
      <View style={styles.historyInfo}>
        <Text style={styles.historyDisease} numberOfLines={2}>
          {item.disease_name || item.disease || 'Unknown'}
        </Text>
        <Text style={styles.historyDate}>
          {formatDate(item.timestamp || item.created_at || item.prediction_date || Date.now())}
        </Text>
        <Text style={styles.historyDiseaseKey}>
          {item.disease}
          {item.prediction_date ? `  •  ${item.prediction_date} ${item.prediction_time || ''}` : ''}
        </Text>
      </View>
      <View style={styles.historyRight}>
        <Text style={[styles.historyStatus, { color: item.status === 'Healthy' ? '#2e7d32' : '#d32f2f' }]}>
          {item.status}
        </Text>
        <Text style={styles.historyConfidence}>{item.confidence}%</Text>
      </View>
      <View style={{ flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        {deletingId === item.id ? (
          <ActivityIndicator size="small" color="#d32f2f" />
        ) : (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              confirmDelete(item.id);
            }}
            style={styles.deleteBtn}
            hitSlop={8}
            accessibilityLabel="Delete prediction"
          >
            <Ionicons name="trash-outline" size={18} color="#e57373" />
          </TouchableOpacity>
        )}
        <Ionicons name="chevron-forward" size={20} color="#b0bec5" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a3a2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan History</Text>
        <TouchableOpacity onPress={confirmClearAll} style={styles.clearButton} disabled={history.length === 0}>
          <Text style={[styles.clearText, history.length === 0 && { opacity: 0.4 }]}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{counts.total}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={[styles.summaryItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#e0f2e9' }]}>
          <Text style={[styles.summaryValue, { color: '#2e7d32' }]}>{counts.healthy}</Text>
          <Text style={styles.summaryLabel}>Healthy</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#c62828' }]}>{counts.diseased}</Text>
          <Text style={styles.summaryLabel}>Diseased</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search-outline" size={18} color="#81c784" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by disease or status..."
            placeholderTextColor="#90a4ae"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={6}>
              <Ionicons name="close-circle" size={18} color="#b0bec5" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => setShowSortPicker((s) => !s)}
          style={[styles.sortButton, showSortPicker && { borderColor: '#2e7d32', backgroundColor: '#e8f5e9' }]}
        >
          <Ionicons name="swap-vertical-outline" size={18} color="#2e7d32" />
          <Text style={styles.sortButtonText}>Sort</Text>
        </TouchableOpacity>
      </View>

      {showSortPicker && (
        <View style={styles.sortPicker}>
          {SORT_OPTIONS.map((o) => (
            <TouchableOpacity
              key={o.key}
              style={[styles.sortOption, sortKey === o.key && styles.sortOptionActive]}
              onPress={() => {
                setSortKey(o.key);
                setShowSortPicker(false);
              }}
            >
              <Text style={[styles.sortOptionText, sortKey === o.key && { color: 'white' }]}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setStatusFilter(f.key)}
            style={[
              styles.filterChip,
              statusFilter === f.key && styles.filterChipActive,
            ]}
          >
            <Ionicons
              name={f.icon}
              size={14}
              color={statusFilter === f.key ? 'white' : f.key === 'Healthy' ? '#2e7d32' : f.key === 'Diseased' ? '#d32f2f' : '#455a64'}
            />
            <Text
              style={[
                styles.filterChipText,
                statusFilter === f.key && { color: 'white' },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {errorMsg ? (
        <View style={styles.errorBar}>
          <Ionicons name="cloud-offline-outline" size={18} color="#d84315" />
          <Text style={styles.errorBarText} numberOfLines={2}>{errorMsg}</Text>
        </View>
      ) : null}

      {loading && history.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={{ marginTop: 12, color: '#546e7a' }}>Loading history...</Text>
        </View>
      ) : localFiltered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="document-text-outline" size={70} color="#a5d6a7" />
          </View>
          <Text style={styles.emptyText}>
            {history.length === 0 ? 'No scans yet' : 'No matches for search'}
          </Text>
          <Text style={styles.emptySubtext}>
            {history.length === 0 ? 'Start by scanning a tomato leaf' : 'Try a different keyword or filter'}
          </Text>
          {!user && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={[styles.scanButton, { backgroundColor: '#1976d2', marginTop: 12 }]}
            >
              <Ionicons name="log-in-outline" size={20} color="white" />
              <Text style={styles.scanButtonText}>Sign in to sync history</Text>
            </TouchableOpacity>
          )}
          {history.length === 0 && (
            <TouchableOpacity style={styles.scanButton} onPress={() => navigation.navigate('Home')}>
              <Ionicons name="camera-outline" size={24} color="white" />
              <Text style={styles.scanButtonText}>Scan Now</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={localFiltered}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id || `${item.timestamp}-${item.disease}-${Math.random()}`)}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2e7d32"
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f9f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1a3a2a' },
  clearButton: { padding: 4 },
  clearText: { fontSize: 15, color: '#f44336', fontWeight: '600' },

  summaryBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    elevation: 2,
    marginBottom: 14,
  },
  summaryItem: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  summaryValue: { fontSize: 26, fontWeight: '800', color: '#1a3a2a' },
  summaryLabel: { fontSize: 12, color: '#78909c', marginTop: 4 },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: '#dcedc8',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 46,
    fontSize: 15,
    color: '#263238',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  sortButtonText: { fontSize: 14, fontWeight: '600', color: '#2e7d32' },
  sortPicker: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 6,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 1,
  },
  sortOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  sortOptionActive: { backgroundColor: '#2e7d32' },
  sortOptionText: { fontSize: 14, fontWeight: '600', color: '#455a64' },

  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0f2e9',
  },
  filterChipActive: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  filterChipText: { fontWeight: '600', fontSize: 13, color: '#2e7d32' },

  errorBar: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffe0b2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorBarText: { flex: 1, color: '#bf360c', fontSize: 13 },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },

  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  historyItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    gap: 12,
  },
  statusIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthyIconContainer: { backgroundColor: '#4caf50' },
  diseasedIconContainer: { backgroundColor: '#f44336' },
  historyInfo: { flex: 1, minWidth: 0 },
  historyDisease: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a3a2a',
  },
  historyDiseaseKey: {
    fontSize: 12,
    color: '#90a4ae',
    marginTop: 4,
  },
  historyDate: {
    fontSize: 13,
    color: '#78909c',
    marginTop: 4,
  },
  historyRight: { alignItems: 'flex-end', minWidth: 70 },
  historyStatus: { fontSize: 13, fontWeight: '700' },
  historyConfidence: { fontSize: 18, fontWeight: '800', color: '#1a3a2a', marginTop: 2 },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffebee',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e8f5e9',
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
    marginBottom: 16,
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
