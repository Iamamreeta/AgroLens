import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  FlatList,
  Animated,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

import AppLogo from '../../assets/logo.png';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Welcome to AgroLens',
    description: 'Field Intelligence for Modern Agriculture',
  },
  {
    id: '2',
    icon: 'camera-outline',
    title: 'Scan Your Plants',
    description: 'Take a photo of tomato leaves to detect diseases instantly',
  },
  {
    id: '3',
    icon: 'medkit-outline',
    title: 'Get Results',
    description: 'Receive detailed analysis with symptoms and treatment plans',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    setCurrentIndex(viewableItems[0].index);
  }).current;

  const scrollTo = () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.replace('Login');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.slide}>
      {item.icon ? (
        <LinearGradient
          colors={['#2ecc71', '#27ae60']}
          style={styles.iconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon name={item.icon} size={70} color="white" />
        </LinearGradient>
      ) : (
        <Image source={AppLogo} style={styles.logo} resizeMode="contain" />  // ← USE LOGO
      )}
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideDescription}>{item.description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={{ flex: 1 }}>
        <FlatList
          data={slides}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={32}
          onViewableItemsChanged={viewableItemsChanged}
          ref={slidesRef}
        />

        <View style={styles.bottomContainer}>
          <View style={styles.dotsContainer}>
            {slides.map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === currentIndex ? '#2ecc71' : '#d5d5d5',
                    width: i === currentIndex ? 35 : 10,
                  },
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={scrollTo}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#2ecc71', '#27ae60']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>
                {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              <Icon
                name={currentIndex === slides.length - 1 ? 'arrow-forward' : 'arrow-forward-outline'}
                size={22}
                color="white"
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f9f5',
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  slideTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1a3a2a',
    textAlign: 'center',
    marginTop: 10,
  },
  slideDescription: {
    fontSize: 16,
    color: '#5a7a6a',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  bottomContainer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
  },
  button: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
});