import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../config/api';

const TOKEN_KEY = 'auth_token';
const REFRESH_KEY = 'auth_refresh';
const USER_KEY = 'auth_user';

class AuthService {
  async _getApi() {
    const base = await getApiBaseUrl();
    return base.replace(/\/$/, '');
  }

  async _request(path, { method = 'GET', body, headers = {}, auth = true, timeout = 15000 } = {}) {
    const api = await this._getApi();
    const url = `${api}${path}`;
    const hdrs = { Accept: 'application/json', ...headers };
    if (body instanceof FormData) {
      // React Native / Expo will set Content-Type multipart/form-data automatically
    } else if (body !== undefined && body !== null) {
      hdrs['Content-Type'] = 'application/json';
    }
    if (auth) {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) hdrs.Authorization = `Bearer ${token}`;
    }
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeout) : null;
    try {
      const res = await fetch(url, {
        method,
        headers: hdrs,
        body: body instanceof FormData ? body : (body !== undefined && body !== null ? JSON.stringify(body) : undefined),
        signal: controller ? controller.signal : undefined,
      });
      if (timer) clearTimeout(timer);
      let payload = null;
      try { payload = await res.json(); } catch (_e) { payload = null; }
      if (!res.ok) {
        const msg =
          (payload && (payload.message || payload.error)) ||
          `Request failed with status ${res.status}`;
        const err = new Error(msg);
        err.status = res.status;
        err.payload = payload;
        throw err;
      }
      return { ok: true, status: res.status, data: payload || {} };
    } catch (e) {
      if (timer) clearTimeout(timer);
      if (e && e.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      throw e;
    }
  }

  async _persistTokensAndUser(token, refreshToken, user) {
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    if (refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
    if (user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  async _clearStored() {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
  }

  async signUp(name, email, password) {
    try {
      const r = await this._request('/auth/signup', {
        method: 'POST',
        body: { name, email, password, confirmPassword: password },
        auth: false,
      });
      const payload = r.data || {};
      const user = payload.user || null;
      await this._persistTokensAndUser(payload.token, payload.refreshToken, user);
      return { success: true, user, token: payload.token, message: payload.message };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async login(email, password) {
    try {
      const r = await this._request('/auth/login', {
        method: 'POST',
        body: { email, password },
        auth: false,
      });
      const payload = r.data || {};
      const user = payload.user || null;
      await this._persistTokensAndUser(payload.token, payload.refreshToken, user);
      return { success: true, user, token: payload.token, message: payload.message };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async logout() {
    try {
      await this._request('/auth/logout', { method: 'POST', auth: true }).catch(() => null);
    } finally {
      await this._clearStored();
    }
    return { success: true };
  }

  async refreshIfNeeded() {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) return false;
    try {
      const payloadB64 = token.split('.')[1];
      if (payloadB64) {
        const decoded = JSON.parse(atob(payloadB64));
        if (decoded.exp && decoded.exp > (Date.now() / 1000) + 60) {
          return true;
        }
      }
    } catch (_) {}
    const refresh = await SecureStore.getItemAsync(REFRESH_KEY);
    if (!refresh) return false;
    try {
      const r = await this._request('/auth/refresh', { method: 'POST', body: { refreshToken: refresh }, auth: false });
      const payload = r.data || {};
      await this._persistTokensAndUser(payload.token, payload.refreshToken, payload.user || null);
      return true;
    } catch (_e) {
      await this._clearStored();
      return false;
    }
  }

  async getCurrentUser() {
    try {
      const ok = await this.refreshIfNeeded();
      if (!ok) return null;
      const r = await this._request('/auth/me', { method: 'GET' });
      const payload = r.data || {};
      const user = payload.user || null;
      if (user) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
        return user;
      }
      const cached = await AsyncStorage.getItem(USER_KEY);
      if (cached) return JSON.parse(cached);
      return null;
    } catch (_e) {
      try {
        const cached = await AsyncStorage.getItem(USER_KEY);
        if (cached) return JSON.parse(cached);
      } catch (_) {}
      return null;
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      const r = await this._request('/auth/change-password', {
        method: 'POST',
        body: {
          currentPassword,
          newPassword,
          confirmNewPassword: newPassword,
        },
      });
      const payload = r.data || {};
      await this._persistTokensAndUser(payload.token, payload.refreshToken, null);
      return { success: true, message: payload.message };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async deleteAccount(password) {
    try {
      await this._request('/auth/account', { method: 'DELETE', body: { password } });
      await this._clearStored();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async predictDisease({ uri, type, name }) {
    const api = await this._getApi();
    const url = `${api}/predict`;
    const data = new FormData();
    data.append('file', {
      uri,
      type: type || 'image/jpeg',
      name: name || `image-${Date.now()}.jpg`,
    });
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const hdrs = {
      Accept: 'application/json',
    };
    if (token) hdrs.Authorization = `Bearer ${token}`;
    hdrs['ngrok-skip-browser-warning'] = '1';
    hdrs['Bypass-Tunnel-Reminder'] = '1';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: hdrs,
        body: data,
        signal: controller.signal,
      });
      clearTimeout(timer);
      let payload;
      try { payload = await res.json(); } catch (_e) {
        const text = await res.text().catch(() => '');
        try { payload = JSON.parse(text); } catch (_) { payload = { success: false, error: 'Invalid response from server', raw: text }; }
      }
      if (!res.ok || !payload?.success) {
        return { success: false, error: payload?.error || `Request failed with status ${res.status}`, raw: payload };
      }
      const prediction = payload.data || null;
      if (prediction) {
        try {
          const prev = await AsyncStorage.getItem('predictions').then((v) => v ? JSON.parse(v) : []).catch(() => []);
          const next = [prediction, ...prev].slice(0, 100);
          await AsyncStorage.setItem('predictions', JSON.stringify(next));
        } catch (_) {}
      }
      return { success: true, prediction, raw: payload };
    } catch (e) {
      clearTimeout(timer);
      if (e && e.name === 'AbortError') {
        return { success: false, error: 'Prediction request timed out. Please try again.' };
      }
      return { success: false, error: e.message };
    }
  }

  async updateUserStats(prediction) {
    if (!prediction) return { success: false, error: 'No prediction provided' };
    const user = await this.getCurrentUser();
    if (!user) return { success: false, error: 'Not logged in' };
    try {
      const prev = await AsyncStorage.getItem('predictions').then((v) => v ? JSON.parse(v) : []).catch(() => []);
      const exists = prev.find((p) => p.id && p.id === prediction.id);
      if (!exists) {
        await AsyncStorage.setItem('predictions', JSON.stringify([prediction, ...prev].slice(0, 100)));
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async getHistory({ search = '', status = 'all', sortBy = 'created_at', sortDir = 'DESC', limit = 100, offset = 0 } = {}) {
    try {
      const qs = new URLSearchParams();
      if (search) qs.append('search', search);
      if (status && status !== 'all') qs.append('status', status);
      if (sortBy) qs.append('sortBy', sortBy);
      if (sortDir) qs.append('sortDir', sortDir);
      qs.append('limit', String(limit));
      qs.append('offset', String(offset));
      const r = await this._request(`/history?${qs.toString()}`, { method: 'GET', timeout: 15000 });
      const payload = r.data || {};
      const history = payload.history || [];
      try {
        await AsyncStorage.setItem('predictions', JSON.stringify(history.slice(0, 200)));
      } catch (_) {}
      return { success: true, history, count: payload.count || history.length };
    } catch (e) {
      try {
        const cached = await AsyncStorage.getItem('predictions');
        const arr = cached ? JSON.parse(cached) : [];
        return { success: false, error: e.message, history: arr, count: arr.length };
      } catch (_) {
        return { success: false, error: e.message, history: [], count: 0 };
      }
    }
  }

  async deletePrediction(predictionId) {
    try {
      await this._request(`/history/${encodeURIComponent(predictionId)}`, { method: 'DELETE' });
      try {
        const cached = await AsyncStorage.getItem('predictions').then((v) => v ? JSON.parse(v) : []).catch(() => []);
        const next = cached.filter((p) => p.id !== predictionId);
        await AsyncStorage.setItem('predictions', JSON.stringify(next));
      } catch (_) {}
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async clearHistory() {
    try {
      await this._request('/history', { method: 'DELETE' });
      try {
        await AsyncStorage.removeItem('predictions');
      } catch (_) {}
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async getUserStats() {
    try {
      const r = await this._request('/auth/stats', { method: 'GET', timeout: 15000 });
      return { success: true, stats: (r.data || {}).data || r.data || {} };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async isOfflineSafe() {
    try {
      const cachedUser = await AsyncStorage.getItem(USER_KEY);
      const cachedPreds = await AsyncStorage.getItem('predictions');
      return !!(cachedUser || cachedPreds);
    } catch (_) {
      return false;
    }
  }

  async clearAllData() {
    await this._clearStored();
    try { await AsyncStorage.removeItem('predictions'); } catch (_) {}
    return { success: true };
  }
}

const instance = new AuthService();

export const signUp = (name, email, password) => instance.signUp(name, email, password);
export const login = (email, password) => instance.login(email, password);
export const logout = () => instance.logout();
export const getCurrentUser = () => instance.getCurrentUser();
export const changePassword = (a, b) => instance.changePassword(a, b);
export const deleteAccount = (p) => instance.deleteAccount(p);
export const predictDisease = (opts) => instance.predictDisease(opts);
export const updateUserStats = (p) => instance.updateUserStats(p);
export const getHistory = (opts) => instance.getHistory(opts);
export const deletePrediction = (id) => instance.deletePrediction(id);
export const clearHistory = () => instance.clearHistory();
export const getUserStats = () => instance.getUserStats();
export const isLoggedIn = async () => !!(await instance.getCurrentUser());
export const clearAllData = () => instance.clearAllData();

export default instance;
