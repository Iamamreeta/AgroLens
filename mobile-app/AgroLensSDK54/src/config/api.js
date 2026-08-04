import { Platform } from 'react-native';

// Configured for different environments
const API_CONFIG = {
  android: 'http://172.20.10.6:3000/api',
  ios: 'http://172.20.10.6:3000/api',
  default: 'http://172.20.10.6:3000/api',
};

// Select the appropriate API URL based on platform
export const API_URL = Platform.select({
  android: API_CONFIG.android,
  ios: API_CONFIG.ios,
  default: API_CONFIG.default,
});

export default API_URL;
