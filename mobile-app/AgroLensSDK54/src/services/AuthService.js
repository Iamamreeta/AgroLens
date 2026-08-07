import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL as DEFAULT_API_URL } from '../config/api';

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

// ============================================
// 🔐 AUTHENTICATION
// ============================================

export const signUp = async (name, email, password) => {
    try {
        const baseURL = await getApiBaseUrl();
        const response = await fetch(`${baseURL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, confirmPassword: password })
        });
        const data = await response.json();
        if (response.ok) {
            await SecureStore.setItemAsync('auth_token', data.token);
            await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
            return { success: true, user: data.user };
        } else {
            return { success: false, error: data.error || 'Signup failed' };
        }
    } catch (error) {
        console.error('Signup error:', error);
        return { success: false, error: error.message };
    }
};

export const login = async (email, password) => {
    try {
        const baseURL = await getApiBaseUrl();
        const response = await fetch(`${baseURL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
            await SecureStore.setItemAsync('auth_token', data.token);
            await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
            return { success: true, user: data.user };
        } else {
            return { success: false, error: data.error || 'Invalid credentials' };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
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

export const getCurrentUser = async () => {
    try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) {
            const userJson = await AsyncStorage.getItem('user_data');
            return userJson ? JSON.parse(userJson) : null;
        }
        const baseURL = await getApiBaseUrl();
        const response = await fetch(`${baseURL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            const user = data.user || data;
            await AsyncStorage.setItem('user_data', JSON.stringify(user));
            return user;
        } else {
            await SecureStore.deleteItemAsync('auth_token');
            await AsyncStorage.removeItem('user_data');
            return null;
        }
    } catch (error) {
        console.error('Get user error:', error);
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

// ============================================
// 📊 PREDICTIONS & HISTORY
// ============================================

export const predictDisease = async (imageUri) => {
    try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) return { success: false, error: 'Not logged in' };

        const baseURL = await getApiBaseUrl();
        const formData = new FormData();
        formData.append('image', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'photo.jpg'
        });

        const response = await fetch(`${baseURL}/predict`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            return { success: true, prediction: data };
        } else {
            const error = await response.json();
            return { success: false, error: error.error || 'Prediction failed' };
        }
    } catch (error) {
        console.error('Predict error:', error);
        return { success: false, error: error.message };
    }
};

export const getHistory = async () => {
    try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) return { success: false, error: 'Not logged in', history: [] };

        const baseURL = await getApiBaseUrl();
        const response = await fetch(`${baseURL}/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            return { success: true, history: data.predictions || data };
        } else {
            return { success: false, error: 'Failed to fetch', history: [] };
        }
    } catch (error) {
        console.error('Get history error:', error);
        return { success: false, error: error.message, history: [] };
    }
};

export const savePrediction = async (prediction) => {
    try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) return { success: false, error: 'Not logged in' };

        const baseURL = await getApiBaseUrl();
        const response = await fetch(`${baseURL}/predictions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(prediction)
        });

        if (response.ok) {
            const data = await response.json();
            return { success: true, prediction: data.prediction || data };
        } else {
            const error = await response.json();
            return { success: false, error: error.error || 'Failed to save' };
        }
    } catch (error) {
        console.error('Save prediction error:', error);
        return { success: false, error: error.message };
    }
};

export const getUserStats = async () => {
    try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) return { success: false, error: 'Not logged in' };

        const baseURL = await getApiBaseUrl();
        const response = await fetch(`${baseURL}/auth/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            return { success: true, stats: data };
        } else {
            return { success: false, error: 'Failed to fetch stats' };
        }
    } catch (error) {
        console.error('Get stats error:', error);
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