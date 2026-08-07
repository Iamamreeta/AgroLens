import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL as DEFAULT_API_URL } from '../config/api';

export const getApiBaseUrl = async () => {
    return DEFAULT_API_URL;
};

export const setApiBaseUrl = async (url) => {
    await AsyncStorage.setItem('api_base_url', url);
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
        }
        return { success: false, error: data.error || 'Signup failed' };
    } catch (error) {
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
        }
        return { success: false, error: data.error || 'Invalid credentials' };
    } catch (error) {
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
        }
        await SecureStore.deleteItemAsync('auth_token');
        await AsyncStorage.removeItem('user_data');
        return null;
    } catch (error) {
        try {
            const userJson = await AsyncStorage.getItem('user_data');
            return userJson ? JSON.parse(userJson) : null;
        } catch {
            return null;
        }
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
        console.log('🔍 Prediction URL:', `${baseURL}/predictions/predict`);
        
        const formData = new FormData();
        formData.append('image', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'photo.jpg'
        });

        const response = await fetch(`${baseURL}/predictions/predict`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            return { success: true, prediction: data };
        }
        const error = await response.json();
        return { success: false, error: error.error || 'Prediction failed' };
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
        const response = await fetch(`${baseURL}/predictions/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            return { success: true, history: data.predictions || data };
        }
        return { success: false, error: 'Failed to fetch', history: [] };
    } catch (error) {
        console.error('History error:', error);
        return { success: false, error: error.message, history: [] };
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
        }
        return { success: false, error: 'Failed to fetch stats' };
    } catch (error) {
        console.error('Stats error:', error);
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