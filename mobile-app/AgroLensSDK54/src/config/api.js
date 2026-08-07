import { Platform } from 'react-native';

const PRODUCTION_API = 'https://agrolens-ti0t.onrender.com/api';
const PRODUCTION_ML = 'https://agrolens-ml.onrender.com';

const DEV_LOCALHOST_ANDROID = 'http://10.0.2.2:3000/api';
const DEV_LOCALHOST_IOS = 'http://localhost:3000/api';
const DEV_LOCAL_ML = 'http://10.0.2.2:5001';

const ENV = __DEV__ ? 'development' : 'production';

const getDefaultBaseUrl = () => {
  if (ENV === 'production') return PRODUCTION_API;
  if (Platform.OS === 'android') return DEV_LOCALHOST_ANDROID;
  return DEV_LOCALHOST_IOS;
};

export const API_BASE_URL = getDefaultBaseUrl();
export const ML_BASE_URL = ENV === 'production' ? PRODUCTION_ML : DEV_LOCAL_ML;
export const APP_ENV = ENV;

export const getApiBaseUrlSync = () => API_BASE_URL;
export const getMlBaseUrlSync = () => ML_BASE_URL;

export const testConnection = async (baseUrlOverride = null) => {
  const base = baseUrlOverride || API_BASE_URL;
  const root = base.endsWith('/api') ? base.slice(0, -4) : base.replace(/\/api\/?$/, '');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(root + '/api', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: true, status: res.status, timestamp: body?.timestamp, base };
    }
    return { ok: false, status: res.status, base };
  } catch (err) {
    return { ok: false, error: err?.message || 'Unknown error', base };
  }
};

export default API_BASE_URL;
