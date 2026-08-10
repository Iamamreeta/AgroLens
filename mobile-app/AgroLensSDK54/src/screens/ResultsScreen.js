import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const FALLBACK_INFO = {
  Early_blight: {
    severity: 'High',
    description: 'Fungal disease caused by Alternaria solani, appearing as target-like concentric rings on lower leaves.',
    symptoms: ['Brown to black spots with concentric rings', 'Yellowing tissue around lesions', 'Defoliation from bottom-up'],
    causes: ['Fungal spores overwintering on debris', 'Humid warm conditions + overhead watering'],
    treatment: ['Remove infected leaves', 'Apply copper or chlorothalonil fungicide every 7 days', 'Mulch soil'],
    prevention: ['Crop rotation 2-3 years', 'Drip irrigation', 'Resistant cultivars'],
  },
  Late_blight: {
    severity: 'Critical',
    description: 'Devastating oomycete (Phytophthora infestans) that blights entire plants during cool, wet periods.',
    symptoms: ['Water-soaked dark lesions that expand rapidly', 'White mold on undersides at night', 'Black stem girdling'],
    causes: ['Cool moist conditions 10-20 C', 'Wind-blown sporangia + infected transplants'],
    treatment: ['Remove infected plants', 'Protectant fungicide chlorothalonil + mefenoxam', 'Stop overhead irrigation'],
    prevention: ['Resistant varieties', 'Adequate spacing and ventilation', 'Certified transplants'],
  },
  Healthy: {
    severity: 'None',
    description: 'No disease detected. Maintain regular watering, scouting, and fertility programs.',
    symptoms: ['Uniformly green leaves', 'No spots or discoloration', 'Strong turgor and growth'],
    causes: ['No pathogen detected'],
    treatment: ['Continue good growing practices', 'Weekly scouting'],
    prevention: ['Crop rotation', 'Mulch at base', 'Fertilize monthly'],
  },
  Leaf_mold: {
    severity: 'Medium',
    description: 'Passalora fulva fungal mold growing in warm, humid, poorly ventilated environments.',
    symptoms: ['Yellow spots on upper leaf surface', 'Olive velvety mold on undersides', 'Curling leaves, defoliation'],
    causes: ['High humidity > 85% + poor airflow'],
    treatment: ['Prune and thin canopy', 'Ventilation and dehumidification', 'Sulfur or copper sprays'],
    prevention: ['Resistant Cf-gene cultivars', 'Sanitize greenhouse surfaces'],
  },
};

const SEVERITY_COLORS = {
  None: ['#2e7d32', '#66bb6a'],
  Low: ['#558b2f', '#9ccc65'],
  Medium: ['#f9a825', '#fbc02d'],
  High: ['#ef6c00', '#fb8c00'],
  Critical: ['#c62828', '#e53935'],
};

const splitList = (raw) => {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string' && raw.length) {
    return raw
      .split(/\n+|(?<=[.!?])\s+|\s*[-*•]\s*/g)
      .map((s) => s.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean);
  }
  return [];
};

export default function ResultsScreen({ navigation, route }) {
  const result = route?.params?.result || null;

  const merged = useMemo(() => {
    if (!result) return null;
const key = (result.disease || 'Healthy').toLowerCase();
const fb = FALLBACK_INFO[key] || FALLBACK_INFO.Healthy;
    const description =
      (typeof result.description === 'string' && result.description.trim().length > 4
        ? result.description
        : null) || fb.description;
    const symptoms = splitList(result.symptoms).length > 0 ? splitList(result.symptoms) : fb.symptoms;
    const causes = splitList(result.causes).length > 0 ? splitList(result.causes) : fb.causes;
    const treatment = splitList(result.treatment).length > 0 ? splitList(result.treatment) : fb.treatment;
    const prevention = splitList(result.prevention).length > 0 ? splitList(result.prevention) : fb.prevention;
    const severity = (typeof result.severity === 'string' && result.severity.trim())
      ? result.severity.trim()
      : fb.severity;
    const diseaseName = result.disease_name || result.disease || 'Unknown';
    const confidence = Number(result.confidence) || 0;
    const isHealthy = (result.status || '').toLowerCase() === 'healthy';
    return {
      ...result,
      disease_name_display: diseaseName,
      description,
      symptoms,
      causes,
      treatment,
      prevention,
      severity,
      confidence,
      isHealthy,
    };
  }, [result]);

  if (!merged) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#1a3a2a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Results</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Icon name="alert-circle-outline" size={64} color="#90a4ae" />
          <Text style={{ marginTop: 16, color: '#546e7a', textAlign: 'center', fontSize: 16 }}>
            No result data available.
          </Text>
          <TouchableOpacity
            style={{ marginTop: 24, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: '#2ecc71' }}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>Go Scan</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const colors = SEVERITY_COLORS[merged.severity] || ['#558b2f', '#8bc34a'];
  const statusColors = merged.isHealthy
    ? ['#27ae60', '#2ecc71']
    : colors;

  const probabilities = merged.probabilities && typeof merged.probabilities === 'object' && !Array.isArray(merged.probabilities)
    ? Object.entries(merged.probabilities).sort((a, b) => Number(b[1]) - Number(a[1]))
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#1a3a2a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Results</Text>
          <View style={{ width: 24 }} />
        </View>

        <LinearGradient colors={statusColors} style={[styles.statusCard, merged.isHealthy ? styles.healthyCard : styles.diseasedCard]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Icon
            name={merged.isHealthy ? 'checkmark-circle' : 'warning'}
            size={56}
            color="white"
          />
          <Text style={styles.statusText}>{merged.status}</Text>
          <Text style={styles.diseaseName}>{merged.disease_name_display}</Text>
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceLabel}>Confidence</Text>
            <Text style={styles.confidenceValue}>{merged.confidence}%</Text>
          </View>
        </LinearGradient>

        {probabilities.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Icon name="analytics-outline" size={20} color="#2e7d32" />
              <Text style={styles.sectionTitle}>All Class Probabilities</Text>
            </View>
            {probabilities.map(([label, p]) => {
              const value = Number(p) || 0;
              const pct = Math.min(100, Math.max(0, value));
              return (
                <View key={label} style={{ marginTop: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 13, color: '#37474f', fontWeight: '600' }}>
                      {String(label).replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim()}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#455a64', fontWeight: '700' }}>{pct.toFixed(1)}%</Text>
                  </View>
                  <View style={styles.miniBarWrap}>
                    <View style={[styles.miniBarFill, { width: `${pct}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="document-text-outline" size={20} color="#1976d2" />
            <Text style={styles.sectionTitle}>About</Text>
          </View>
          <Text style={styles.paragraph}>{merged.description}</Text>

          <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
            <View style={styles.chipWrap}>
              <Text style={[styles.chipLabel, { color: colors[0] }]}>Severity</Text>
              <Text style={styles.chipValue}>{merged.severity}</Text>
            </View>
            <View style={styles.chipWrap}>
              <Text style={[styles.chipLabel, { color: '#2e7d32' }]}>Is Leaf</Text>
              <Text style={styles.chipValue}>{merged.is_leaf === false ? 'No' : 'Yes'}</Text>
            </View>
            {typeof merged.green_ratio === 'number' && (
              <View style={styles.chipWrap}>
                <Text style={[styles.chipLabel, { color: '#43a047' }]}>Green</Text>
                <Text style={styles.chipValue}>{(merged.green_ratio <= 1 ? merged.green_ratio * 100 : merged.green_ratio).toFixed(1)}%</Text>
              </View>
            )}
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={[styles.metaRow, { fontWeight: '600', color: '#37474f' }]}>Scanned on</Text>
            <Text style={styles.metaRow}>
              {new Date(merged.timestamp || merged.created_at || Date.now()).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="warning-outline" size={20} color="#ef6c00" />
            <Text style={styles.sectionTitle}>Symptoms</Text>
          </View>
          {merged.symptoms.length === 0 ? (
            <Text style={styles.paragraph}>No detailed symptoms available.</Text>
          ) : (
            merged.symptoms.map((s, i) => (
              <View key={`sym-${i}`} style={styles.bulletRow}>
                <Icon name="ellipse" size={8} color="#ef6c00" style={{ marginTop: 6 }} />
                <Text style={styles.bulletText}>{s}</Text>
              </View>
            ))
          )}
        </View>

        {!merged.isHealthy && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Icon name="bug-outline" size={20} color="#6d4c41" />
              <Text style={styles.sectionTitle}>Possible Causes</Text>
            </View>
            {merged.causes.length === 0 ? (
              <Text style={styles.paragraph}>Cause information not available.</Text>
            ) : (
              merged.causes.map((c, i) => (
                <View key={`c-${i}`} style={styles.bulletRow}>
                  <Icon name="ellipse" size={8} color="#6d4c41" style={{ marginTop: 6 }} />
                  <Text style={styles.bulletText}>{c}</Text>
                </View>
              ))
            )}
          </View>
        )}

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="medkit-outline" size={20} color="#c62828" />
            <Text style={styles.sectionTitle}>{merged.isHealthy ? 'Care Tips' : 'Treatment'}</Text>
          </View>
          {merged.treatment.length === 0 ? (
            <Text style={styles.paragraph}>No treatment guidance available.</Text>
          ) : (
            merged.treatment.map((t, i) => (
              <View key={`t-${i}`} style={styles.bulletRow}>
                <Icon name="checkmark-circle-outline" size={18} color="#2e7d32" style={{ marginTop: 2 }} />
                <Text style={styles.bulletText}>{t}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Icon name="shield-checkmark-outline" size={20} color="#2e7d32" />
            <Text style={styles.sectionTitle}>Prevention</Text>
          </View>
          {merged.prevention.length === 0 ? (
            <Text style={styles.paragraph}>No prevention guidance available.</Text>
          ) : (
            merged.prevention.map((p, i) => (
              <View key={`p-${i}`} style={styles.bulletRow}>
                <Icon name="shield-checkmark-outline" size={18} color="#1976d2" style={{ marginTop: 2 }} />
                <Text style={styles.bulletText}>{p}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.primaryButton, { flex: 1 }]}
            onPress={() => navigation.navigate('Home')}
          >
            <LinearGradient colors={['#2ecc71', '#27ae60']} style={styles.primaryButtonGradient}>
              <Icon name="scan-outline" size={20} color="white" />
              <Text style={styles.primaryButtonText}>New Scan</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f9f5' },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1a3a2a' },

  statusCard: {
    margin: 20,
    marginTop: 0,
    paddingVertical: 30,
    paddingHorizontal: 24,
    borderRadius: 22,
    alignItems: 'center',
    elevation: 8,
  },
  healthyCard: {},
  diseasedCard: {},
  statusText: { color: 'white', fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 4 },
  diseaseName: { color: 'white', fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
  confidenceContainer: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  confidenceLabel: { color: 'white', opacity: 0.9, fontSize: 14, fontWeight: '600' },
  confidenceValue: { color: 'white', fontSize: 22, fontWeight: '800' },

  sectionCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 0,
    marginBottom: 18,
    padding: 20,
    borderRadius: 18,
    elevation: 2,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a3a2a' },
  paragraph: { fontSize: 15, lineHeight: 22, color: '#455a64' },
  bulletRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  bulletText: { flex: 1, fontSize: 15, lineHeight: 22, color: '#37474f' },
  chipWrap: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#f1f8e9',
    borderRadius: 12,
  },
  chipLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  chipValue: { fontSize: 14, fontWeight: '800', color: '#1a3a2a', marginTop: 2 },
  metaRow: { fontSize: 14, color: '#607d8b', lineHeight: 20 },

  miniBarWrap: { width: '100%', height: 6, backgroundColor: '#eceff1', borderRadius: 3, overflow: 'hidden' },
  miniBarFill: { height: '100%', backgroundColor: '#66bb6a', borderRadius: 3 },

  actionRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 6 },
  primaryButton: { borderRadius: 14, overflow: 'hidden' },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#c8e6c9',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  secondaryButtonText: { color: '#2e7d32', fontSize: 16, fontWeight: '700' },
});
