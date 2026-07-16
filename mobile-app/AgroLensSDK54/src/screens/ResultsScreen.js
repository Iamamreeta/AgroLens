
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

  if (result) {
    const info = DISEASE_INFO[result.disease] || DISEASE_INFO['Healthy'];
    const isHealthy = result.status === 'Healthy';

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

          <View style={[styles.statusCard, isHealthy ? styles.healthyCard : styles.diseasedCard]}>
            <Icon
              name={isHealthy ? 'checkmark-circle' : 'warning'}
              size={56}
              color="white"
            />
            <Text style={styles.statusText}>{result.status}</Text>
            <Text style={styles.diseaseName}>{info.name}</Text>
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceLabel}>Confidence</Text>
              <Text style={styles.confidenceValue}>{result.confidence}%</Text>
            </View>
          </View>

          {!isHealthy && (
            <View style={styles.severityCard}>
              <Icon
              name="alert-circle-outline"
              size={22}
              color={
                info.severity === 'Critical'
                  ? '#d32f2f'
                  : info.severity === 'High'
                  ? '#f57c00'
                  : '#f9a825'
              }
            />
            <Text style={styles.severityTitle}> Severity Level</Text>
            <View style={styles.severityBadge}>
              <Text
                style={[
                  styles.severityLevel,
                  {
                    color:
                      info.severity === 'Critical'
                        ? '#d32f2f'
                        : info.severity === 'High'
                        ? '#f57c00'
                        : '#f9a825'
                  }
                ]}
              >
                {info.severity}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.infoCard}>
            <View style={styles.sectionHeader}>
              <Icon name="information-circle-outline" size={24} color="#2196f3" />
              <Text style={styles.sectionTitle}> About</Text>
            </View>
            <Text style={styles.description}>{info.description}</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.sectionHeader}>
              <Icon name="list-outline" size={24} color="#f44336" />
              <Text style={styles.sectionTitle}> Symptoms</Text>
            </View>
            {info.symptoms.map((symptom, index) => (
              <View key={index} style={styles.listItem}>
                <Icon name="ellipse" size={6} color="#f44336" style={styles.bullet} />
                <Text style={styles.listText}>{symptom}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.infoCard, styles.mitigationCard]}>
            <View style={styles.sectionHeader}>
              <Icon name="medkit-outline" size={24} color="#4caf50" />
              <Text style={styles.sectionTitle}> Care Tips</Text>
            </View>
            {info.mitigation.map((method, index) => (
              <View key={index} style={styles.listItem}>
                <Icon name="checkmark-circle" size={18} color="#4caf50" style={styles.mitigationBullet} />
                <Text style={styles.mitigationText}>{method}</Text>
              </View>
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => navigation.navigate('Home')}
            >
              <Icon name="camera-outline" size={24} color="white" />
              <Text style={styles.primaryButtonText}>Scan Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => navigation.navigate('Home')}
            >
              <Icon name="home-outline" size={24} color="#2ecc71" />
              <Text style={styles.secondaryButtonText}>Go Home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#1a3a2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Results</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={70} color="#f44336" />
        <Text style={styles.errorText}>No results found</Text>
        <TouchableOpacity
          style={styles.goBackButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f9f5',
  },
  scrollContent: {
    paddingBottom: 40,
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
  statusCard: {
    marginHorizontal: 20,
    marginTop: 0,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 3,
  },
  healthyCard: {
    backgroundColor: '#e8f5e9',
  },
  diseasedCard: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a3a2a',
    marginTop: 10,
  },
  diseaseName: {
    fontSize: 19,
    color: '#1a3a2a',
    marginTop: 4,
  },
  confidenceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  confidenceLabel: {
    fontSize: 15,
    color: '#78909c',
    fontWeight: '600',
  },
  confidenceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a3a2a',
  },
  severityCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  severityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a3a2a',
    marginLeft: 8,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fff3e0',
  },
  severityLevel: {
    fontSize: 15,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 18,
    borderRadius: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a3a2a',
    marginLeft: 8,
  },
  description: {
    fontSize: 15,
    color: '#546e7a',
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    marginRight: 12,
    marginTop: 7,
  },
  listText: {
    fontSize: 15,
    color: '#546e7a',
    flex: 1,
    lineHeight: 22,
  },
  mitigationCard: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#a5d6a7',
  },
  mitigationBullet: {
    marginRight: 10,
    marginTop: 2,
  },
  mitigationText: {
    fontSize: 15,
    color: '#1a3a2a',
    flex: 1,
    lineHeight: 22,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 14,
  },
  button: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#2ecc71',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#2ecc71',
  },
  secondaryButtonText: {
    color: '#2ecc71',
    fontSize: 17,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 20,
    color: '#f44336',
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 30,
  },
  goBackButton: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 14,
  },
  goBackButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
});

