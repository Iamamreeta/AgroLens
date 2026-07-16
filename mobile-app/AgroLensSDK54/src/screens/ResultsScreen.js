import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
const DISEASE_INFO = {
  'Early_blight': {
    name: 'Early Blight',
    severity: 'High',
    symptoms: [
      'Dark brown to black spots on leaves',
      'Concentric rings on lesions',
      'Yellowing of leaf tissue',
      'Spots appear on older leaves first'
    ],
    mitigation: [
      'Apply organic fungicide (copper-based)',
      'Water at base of plant, avoid wetting leaves',
      'Remove infected leaves immediately',
      'Rotate crops every 2-3 years',
      'Add compost to improve soil health'
    ],
    description: 'Early blight is caused by the fungus Alternaria solani. It spreads through wind, water, and infected plant debris.'
  },
  'Late_blight': {
    name: 'Late Blight',
    severity: 'Critical',
    symptoms: [
      'Water-soaked spots on leaves',
      'White fuzzy growth on leaf undersides',
      'Brown-black lesions on stems',
      'Rapid wilting and death of plant'
    ],
    mitigation: [
      'Apply fungicide immediately (chlorothalonil)',
      'Remove and destroy infected plants',
      'Use disease-resistant varieties',
      'Improve air circulation between plants',
      'Apply copper-based sprays weekly'
    ],
    description: 'Late blight is caused by Phytophthora infestans. It spreads rapidly and can destroy entire crops.'
  },
  'Healthy': {
    name: 'Healthy',
    severity: 'None',
    symptoms: [
      'Vibrant green leaves',
      'No spots or lesions',
      'Strong stem structure',
      'Healthy fruit production'
    ],
    mitigation: [
      'Continue good farming practices',
      'Water regularly at base',
      'Apply balanced fertilizer',
      'Monitor weekly for early signs',
      'Maintain proper spacing between plants'
    ],
    description: 'Your plant is healthy! Continue proper care to maintain this condition.'
  },
  'Leaf_mold': {
    name: 'Leaf Mold',
    severity: 'Medium',
    symptoms: [
      'Yellow spots on upper leaf surface',
      'Gray-mold growth on leaf underside',
      'Leaves turn brown and die',
      'Spread in high humidity'
    ],
    mitigation: [
      'Apply organic fungicide (sulfur-based)',
      'Improve airflow with pruning',
      'Remove infected leaves',
      'Water in morning to reduce humidity',
      'Rotate crops annually'
    ],
    description: 'Leaf mold is caused by Passalora fulva. It thrives in warm, humid conditions with poor airflow.'
  }
};

export default function ResultsScreen({ navigation, route }) {
  const { result } = route.params || { result: null };
  
  if (!result) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={60} color="#e74c3c" />
          <Text style={styles.errorText}>No results found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const info = DISEASE_INFO[result.disease] || DISEASE_INFO['Healthy'];
  const isHealthy = result.status === 'Healthy';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back-outline" size={24} color="#2ecc71" />
            <Text style={styles.backText}> Back</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Icon name="document-text-outline" size={24} color="#1a3a2a" />
            <Text style={styles.headerTitle}> Results</Text>
          </View>
          <View style={{ width: 70 }} />
        </View>

        <View style={[styles.statusCard, isHealthy ? styles.healthyCard : styles.diseasedCard]}>
          <Icon name={isHealthy ? "checkmark-circle" : "alert-circle"} size={50} color={isHealthy ? "#27ae60" : "#e74c3c"} />
          <Text style={styles.statusText}>{result.status}</Text>
          <Text style={styles.diseaseName}>{info.name}</Text>
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceLabel}>Confidence</Text>
            <Text style={styles.confidenceValue}>{result.confidence}%</Text>
          </View>
        </View>

        {!isHealthy && (
          <View style={styles.severityCard}>
            <Icon name="warning-outline" size={22} color="#e67e22" />
            <Text style={styles.severityTitle}> Severity Level</Text>
            <Text style={[
              styles.severityLevel,
              info.severity === 'Critical' ? styles.severityCritical :
              info.severity === 'High' ? styles.severityHigh :
              styles.severityMedium
            ]}>
              {info.severity}
            </Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <Icon name="information-circle-outline" size={22} color="#3498db" />
            <Text style={styles.sectionTitle}> About This Disease</Text>
          </View>
          <Text style={styles.description}>{info.description}</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <Icon name="list-outline" size={22} color="#e74c3c" />
            <Text style={styles.sectionTitle}> Symptoms</Text>
          </View>
          {info.symptoms.map((symptom, index) => (
            <View key={index} style={styles.listItem}>
              <Icon name="ellipse" size={8} color="#e74c3c" style={styles.bullet} />
              <Text style={styles.listText}>{symptom}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.infoCard, styles.mitigationCard]}>
          <View style={styles.sectionHeader}>
            <Icon name="medkit-outline" size={22} color="#2ecc71" />
            <Text style={styles.sectionTitle}> Mitigation Methods</Text>
          </View>
          {info.mitigation.map((method, index) => (
            <View key={index} style={styles.listItem}>
              <Icon name="checkmark-circle" size={18} color="#2ecc71" style={styles.mitigationBullet} />
              <Text style={styles.mitigationText}>{method}</Text>
            </View>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => navigation.navigate('Home')}
          >
            <Icon name="scan-outline" size={22} color="white" />
            <Text style={styles.primaryButtonText}> Scan Another</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.navigate('Home')}
          >
            <Icon name="home-outline" size={22} color="#2ecc71" />
            <Text style={styles.secondaryButtonText}> Go Home</Text>
          </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: '#2ecc71',
    fontWeight: '500',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a3a2a',
  },
  statusCard: {
    margin: 20,
    marginTop: 0,
    padding: 25,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 3,
  },
  healthyCard: {
    backgroundColor: '#d5f5e3',
  },
  diseasedCard: {
    backgroundColor: '#fadbd8',
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  diseaseName: {
    fontSize: 18,
    color: '#1a3a2a',
    marginTop: 4,
  },
  confidenceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#5a7a6a',
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a3a2a',
  },
  severityCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  severityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a3a2a',
    marginLeft: 8,
    flex: 1,
  },
  severityLevel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  severityCritical: {
    color: '#e74c3c',
  },
  severityHigh: {
    color: '#e67e22',
  },
  severityMedium: {
    color: '#f39c12',
  },
  infoCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a3a2a',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#5a7a6a',
    lineHeight: 20,
  },
  listItem: {
    flexDirection: 'row',
    paddingVertical: 4,
    alignItems: 'flex-start',
  },
  bullet: {
    marginRight: 10,
    marginTop: 6,
  },
  listText: {
    fontSize: 14,
    color: '#5a7a6a',
    flex: 1,
  },
  mitigationCard: {
    backgroundColor: '#eafaf1',
    borderWidth: 1,
    borderColor: '#2ecc71',
  },
  mitigationBullet: {
    marginRight: 8,
    marginTop: 2,
  },
  mitigationText: {
    fontSize: 14,
    color: '#1a3a2a',
    flex: 1,
  },
  buttonContainer: {
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#2ecc71',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#2ecc71',
  },
  secondaryButtonText: {
    color: '#2ecc71',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    marginTop: 10,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#2ecc71',
    padding: 14,
    borderRadius: 12,
    paddingHorizontal: 30,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});