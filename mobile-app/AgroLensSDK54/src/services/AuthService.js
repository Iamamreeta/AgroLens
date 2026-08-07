import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL as DEFAULT_API_URL, testConnection as baseTestConnection } from '../config/api';

const API_URL_KEY = 'api_base_url';
let cachedBaseURL = null;

export const getApiBaseUrl = async () => {
    if (cachedBaseURL) return cachedBaseURL;
    try {
        const saved = await AsyncStorage.getItem(API_URL_KEY);
        if (saved) {
            cachedBaseURL = saved;
            return saved;
        }
        cachedBaseURL = DEFAULT_API_URL;
        return DEFAULT_API_URL;
    } catch {
        cachedBaseURL = DEFAULT_API_URL;
        return DEFAULT_API_URL;
    }
};

export const setApiBaseUrl = async (url) => {
    await AsyncStorage.setItem(API_URL_KEY, url);
    cachedBaseURL = url;
};

export const testConnection = async () => {
    const base = await getApiBaseUrl();
    return baseTestConnection(base);
};

const buildHeaders = async (includeJson = false) => {
    const headers = {};
    if (includeJson) headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'application/json';
    try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch { }
    return headers;
};

const safeJson = async (res) => {
    try { return await res.json(); } catch { return {}; }
};

// ============================================
// AUTHENTICATION
// ============================================

export const signUp = async (name, email, password) => {
    try {
        const baseURL = await getApiBaseUrl();
        const response = await fetch(`${baseURL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ name, email, password, confirmPassword: password })
        });
        const data = await safeJson(response);
        if (response.ok) {
            if (data.token) await SecureStore.setItemAsync('auth_token', data.token);
            const user = data.user || data.data || data;
            if (user) await AsyncStorage.setItem('user_data', JSON.stringify(user));
            return { success: true, user };
        } else {
            return { success: false, error: data.error || data.message || 'Signup failed' };
        }
    } catch (error) {
        console.error('[Auth] Signup error:', error);
        return { success: false, error: error.message || 'Network error' };
    }
};

export const login = async (email, password) => {
    try {
        const baseURL = await getApiBaseUrl();
        const response = await fetch(`${baseURL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await safeJson(response);
        if (response.ok) {
            if (data.token) await SecureStore.setItemAsync('auth_token', data.token);
            const user = data.user || data.data || data;
            if (user) await AsyncStorage.setItem('user_data', JSON.stringify(user));
            return { success: true, user };
        } else {
            return { success: false, error: data.error || data.message || 'Invalid credentials' };
        }
    } catch (error) {
        console.error('[Auth] Login error:', error);
        return { success: false, error: error.message || 'Network error' };
    }
};

export const logout = async () => {
    try {
        await SecureStore.deleteItemAsync('auth_token');
        await AsyncStorage.removeItem('user_data');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const refreshToken = async () => {
    try {
        const baseURL = await getApiBaseUrl();
        const headers = await buildHeaders(true);
        const response = await fetch(`${baseURL}/auth/refresh`, {
            method: 'POST',
            headers
        });
        const data = await safeJson(response);
        if (response.ok && data.token) {
            await SecureStore.setItemAsync('auth_token', data.token);
            return { success: true, token: data.token };
        }
        return { success: false, error: data.error || 'Refresh failed' };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getCurrentUser = async () => {
    try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) {
            try {
                const userJson = await AsyncStorage.getItem('user_data');
                return userJson ? JSON.parse(userJson) : null;
            } catch { return null; }
        }
        const baseURL = await getApiBaseUrl();
        const headers = await buildHeaders();
        const response = await fetch(`${baseURL}/auth/me`, { headers });
        if (response.ok) {
            const data = await safeJson(response);
            const user = data.user || data.data || data;
            if (user) await AsyncStorage.setItem('user_data', JSON.stringify(user));
            return user;
        } else if (response.status === 401) {
            await SecureStore.deleteItemAsync('auth_token');
            await AsyncStorage.removeItem('user_data');
            return null;
        } else {
            try {
                const userJson = await AsyncStorage.getItem('user_data');
                return userJson ? JSON.parse(userJson) : null;
            } catch { return null; }
        }
    } catch (error) {
        console.error('[Auth] Get user error:', error);
        try {
            const userJson = await AsyncStorage.getItem('user_data');
            return userJson ? JSON.parse(userJson) : null;
        } catch { return null; }
    }
};

export const isLoggedIn = async () => {
    const user = await getCurrentUser();
    return user !== null;
};

export const changePassword = async (currentPassword, newPassword) => {
    try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) return { success: false, error: 'Not logged in' };
        const baseURL = await getApiBaseUrl();
        const response = await fetch(`${baseURL}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword: newPassword })
        });
        const data = await safeJson(response);
        if (response.ok) return { success: true };
        return { success: false, error: data.error || data.message || 'Password change failed' };
    } catch (error) {
        console.error('[Auth] Change password error:', error);
        return { success: false, error: error.message || 'Network error' };
    }
};

export const deleteAccount = async (password) => {
    try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) return { success: false, error: 'Not logged in' };
        const baseURL = await getApiBaseUrl();
        const response = await fetch(`${baseURL}/auth/delete-account`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ password })
        });
        const data = await safeJson(response);
        if (response.ok) {
            await SecureStore.deleteItemAsync('auth_token');
            await AsyncStorage.clear();
            return { success: true };
        }
        return { success: false, error: data.error || data.message || 'Account deletion failed' };
    } catch (error) {
        console.error('[Auth] Delete account error:', error);
        return { success: false, error: error.message || 'Network error' };
    }
};

// ============================================
// PASSWORD RESET
// ============================================

export const forgotPassword = async (email) => {
    try {
        const baseURL = await getApiBaseUrl();
        const response = await fetch(`${baseURL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await safeJson(response);
        if (response.ok) return { success: true, message: data.message || 'Reset email sent' };
        return { success: false, error: data.error || data.message || 'Failed to send reset email' };
    } catch (error) {
        console.error('[Auth] Forgot password error:', error);
        return { success: false, error: error.message || 'Network error' };
    }
};

export const resetPassword = async (token, newPassword) => {
    try {
        const baseURL = await getApiBaseUrl();
        const response = await fetch(`${baseURL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ token, newPassword, confirmNewPassword: newPassword })
        });
        const data = await safeJson(response);
        if (response.ok) return { success: true, message: data.message || 'Password reset successfully' };
        return { success: false, error: data.error || data.message || 'Password reset failed' };
    } catch (error) {
        console.error('[Auth] Reset password error:', error);
        return { success: false, error: error.message || 'Network error' };
    }
};

// ============================================
// PREDICTIONS & HISTORY
// ============================================

export const predictDisease = async (imageInput) => {
    try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) return { success: false, error: 'Not logged in' };

        const baseURL = await getApiBaseUrl();
        const formData = new FormData();

        let uri, type, name;
        if (typeof imageInput === 'string') {
            uri = imageInput;
            type = 'image/jpeg';
            name = `photo-${Date.now()}.jpg`;
        } else if (imageInput && typeof imageInput === 'object') {
            uri = imageInput.uri;
            type = imageInput.type || imageInput.mimeType || 'image/jpeg';
            name = imageInput.name || imageInput.fileName || `photo-${Date.now()}.jpg`;
        } else {
            return { success: false, error: 'Invalid image input' };
        }

        formData.append('image', {
            uri,
            type,
            name,
        });

        console.log('[Predict] POST ->', `${baseURL}/predict`);
        console.log('[Predict] Form fields: uri=', uri, 'type=', type, 'name=', name);

        const response = await fetch(`${baseURL}/predict`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        console.log('[Predict] Response status:', response.status, response.statusText);

        const rawText = await response.text();
        console.log('[Predict] Raw response (first 500 chars):', rawText.slice(0, 500));

        let data;
        try { data = JSON.parse(rawText); } catch (parseErr) {
            console.error('[Predict] JSON parse error:', parseErr.message);
            return { success: false, error: 'Invalid server response' };
        }

        if (response.ok) {
            const prediction = data.data || data.prediction || data;
            return { success: true, prediction };
        } else {
            return { success: false, error: data.error || data.message || 'Prediction failed' };
        }
    } catch (error) {
        console.error('[Predict] Fatal error:', error);
        return { success: false, error: error.message || 'Network request failed' };
    }
};

export const getHistory = async (params = {}) => {
    try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) return { success: false, error: 'Not logged in', history: [] };

        const baseURL = await getApiBaseUrl();
        const qs = new URLSearchParams();
        if (params.limit) qs.append('limit', String(params.limit));
        if (params.offset) qs.append('offset', String(params.offset));
        if (params.search) qs.append('search', String(params.search));
        if (params.status && params.status !== 'all') qs.append('status', String(params.status));
        if (params.sortBy) qs.append('sortBy', String(params.sortBy));
        if (params.sortDir) qs.append('sortDir', String(params.sortDir));

        const url = `${baseURL}/history` + (qs.toString() ? `?${qs.toString()}` : '');
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await safeJson(response);
        if (response.ok) {
            const history = data.predictions || data.data || data.history || (Array.isArray(data) ? data : []);
            return { success: true, history, count: data.count || history.length };
        } else {
            return { success: false, error: data.error || 'Failed to fetch', history: [] };
        }
    } catch (error) {
        console.error('[History] Get error:', error);
        return { success: false, error: error.message, history: [] };
    }
};

export const deletePrediction = async (id) => {
    try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) return { success: false, error: 'Not logged in' };

        const baseURL = await getApiBaseUrl();
        const response = await fetch(`${baseURL}/history/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });
        const data = await safeJson(response);
        if (response.ok) return { success: true };
        return { success: false, error: data.error || data.message || 'Failed to delete' };
    } catch (error) {
        console.error('[History] Delete error:', error);
        return { success: false, error: error.message };
    }
};

export const clearHistory = async () => {
    try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) return { success: false, error: 'Not logged in' };

        const baseURL = await getApiBaseUrl();
        const response = await fetch(`${baseURL}/history`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });
        const data = await safeJson(response);
        if (response.ok) return { success: true };
        return { success: false, error: data.error || data.message || 'Failed to clear history' };
    } catch (error) {
        console.error('[History] Clear error:', error);
        return { success: false, error: error.message };
    }
};

export const savePrediction = async (prediction) => {
    return { success: true, prediction };
};

export const updateUserStats = async (_prediction) => {
    return { success: true };
};

// ============================================
// STATISTICS
// ============================================

export const getUserStats = async () => {
    try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) return { success: false, error: 'Not logged in' };

        const baseURL = await getApiBaseUrl();
        const response = await fetch(`${baseURL}/auth/stats`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await safeJson(response);
        if (response.ok) {
            const stats = data.stats || data.data || data;
            return { success: true, stats };
        } else {
            return { success: false, error: data.error || 'Failed to fetch stats' };
        }
    } catch (error) {
        console.error('[Stats] Get error:', error);
        return { success: false, error: error.message };
    }
};

export const clearAllData = async () => {
    try {
        await SecureStore.deleteItemAsync('auth_token');
        await AsyncStorage.clear();
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};
