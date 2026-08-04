import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROD_API_URL = 'https://agrolens-api.onrender.com/api';
const API_CACHE_KEY = 'agrolens.apiBaseUrl.v1';
const OVERRIDE_KEY = 'agrolens.apiOverride.v1';

const DEFAULT_PORTS = {
  dev: 3000,
  ml: 5001,
};

const isAndroid = Platform.OS === 'android';
const isIOS = Platform.OS === 'ios';
const isWeb = Platform.OS === 'web';

const isProduction = () => {
  return (
    (Constants.expoConfig && Constants.expoConfig.releaseChannel === 'production') ||
    __DEV__ !== true
  );
};

const parseDebuggerHost = (debuggerHost) => {
  if (!debuggerHost || typeof debuggerHost !== 'string') return null;
  const [host] = debuggerHost.split(':');
  if (!host) return null;
  return host;
};

const getMetroHost = () => {
  try {
    const expo = Constants;
    const manifest2 = expo.manifest2 || expo.manifest || {};
    const debuggerHost =
      manifest2?.debuggerHost ||
      manifest2?.developer?.tool ||
      (expo.expoConfig && expo.expoConfig.hostUri);
    if (debuggerHost) return parseDebuggerHost(debuggerHost);
    return null;
  } catch (_e) {
    return null;
  }
};

const tryAndroidEmulatorLocal = async (host, port, path, timeoutMs = 1500) => {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`http://${host}:${port}${path}`, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(id);
    if (res.ok) return true;
    return false;
  } catch (_e) {
    return false;
  }
};

const detectBaseUrl = async () => {
  if (isProduction()) return PROD_API_URL;

  try {
    const override = await AsyncStorage.getItem(OVERRIDE_KEY);
    if (override && typeof override === 'string' && override.length > 5) {
      return override.replace(/\/$/, '');
    }
  } catch (_e) {
    // ignore
  }

  const metroHost = getMetroHost();
  const candidates = [];

  if (isWeb) {
    if (typeof window !== 'undefined') {
      const loc = window.location;
      candidates.push(`${loc.protocol}//${loc.host}/api`);
    }
  }

  if (metroHost) {
    candidates.push(`http://${metroHost}:${DEFAULT_PORTS.dev}/api`);
  }

  if (isAndroid) {
    candidates.push(`http://10.0.2.2:${DEFAULT_PORTS.dev}/api`);
    candidates.push(`http://10.0.3.2:${DEFAULT_PORTS.dev}/api`);
  }

  if (isIOS) {
    candidates.push(`http://localhost:${DEFAULT_PORTS.dev}/api`);
    candidates.push(`http://127.0.0.1:${DEFAULT_PORTS.dev}/api`);
  }

  candidates.push(`http://localhost:${DEFAULT_PORTS.dev}/api`);

  const deduped = Array.from(new Set(candidates));

  for (const url of deduped) {
    let host = url;
    let path = '/health';
    try {
      const u = new URL(url);
      host = u.host;
      path = '/health';
    } catch (_) {
      host = url.replace(/^https?:\/\//, '').split('/')[0];
    }
    const [h, p] = host.split(':');
    const port = p ? parseInt(p, 10) : DEFAULT_PORTS.dev;
    const ok = await tryAndroidEmulatorLocal(h, port, path, 1500);
    if (ok) {
      try {
        await AsyncStorage.setItem(API_CACHE_KEY, url);
      } catch (_) {}
      return url;
    }
  }

  return deduped[deduped.length - 1] || PROD_API_URL;
};

let cachedBaseUrl = null;
let detectionPromise = null;

export const getApiBaseUrl = async (force = false) => {
  if (!force && cachedBaseUrl) return cachedBaseUrl;
  if (!force && detectionPromise) return detectionPromise;
  detectionPromise = (async () => {
    let cached = null;
    if (!force) {
      try {
        cached = await AsyncStorage.getItem(API_CACHE_KEY);
      } catch (_) {}
    }
    const detected = await detectBaseUrl();
    const finalUrl = (detected && detected.length > 0) ? detected : (cached || PROD_API_URL);
    cachedBaseUrl = finalUrl;
    try {
      await AsyncStorage.setItem(API_CACHE_KEY, finalUrl);
    } catch (_) {}
    return finalUrl;
  })();
  try {
    const res = await detectionPromise;
    return res;
  } finally {
    detectionPromise = null;
  }
};

export const setApiBaseUrlOverride = async (url) => {
  if (!url) {
    try { await AsyncStorage.removeItem(OVERRIDE_KEY); } catch (_) {}
    cachedBaseUrl = null;
    return getApiBaseUrl(true);
  }
  const clean = String(url).replace(/\/+$/, '');
  try {
    await AsyncStorage.setItem(OVERRIDE_KEY, clean);
    cachedBaseUrl = clean;
    return clean;
  } catch (_) {
    cachedBaseUrl = clean;
    return clean;
  }
};

export const testConnection = async (url) => {
  const target = url || await getApiBaseUrl();
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${target.replace(/\/$/, '')}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(id);
    const data = res.ok ? await res.json().catch(() => ({})) : null;
    return {
      ok: res.ok,
      status: res.status,
      url: target,
      data,
    };
  } catch (e) {
    return {
      ok: false,
      url: target,
      error: e.message,
    };
  }
};

export const getOfflineUrlFallback = () => PROD_API_URL;

export const API_URL = isAndroid
  ? 'http://10.0.2.2:3000/api'
  : isIOS
    ? 'http://localhost:3000/api'
    : 'http://localhost:3000/api';

export default API_URL;
