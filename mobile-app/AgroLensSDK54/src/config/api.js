import { Platform } from 'react-native';

// Configured for different environments
const API_CONFIG = {
 
  android: 'http://192.168.7.176:3000/api',
  // For iOS Simulator: localhost works
  ios: 'http://localhost:3000/api',
  // For physical device: use your computer's local IP (e.g., http://192.168.1.100:3000/api)
  default: 'http://192.168.7.176:3000/api',
};

// Select the appropriate API URL based on platform
export const API_URL = Platform.select({
  android: API_CONFIG.android,
  ios: API_CONFIG.ios,
  default: API_CONFIG.default,
});

export default API_URL;
