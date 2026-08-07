import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as ImageManipulator from 'expo-image-manipulator';
import { API_BASE_URL as DEFAULT_API_URL } from '../config/api';

// Always use the URL from src/config/api.js — no saved overrides.
export const getApiBaseUrl = async () => {
    return DEFAULT_API_URL;
};

export const setApiBaseUrl = async () => {
    return { success: true };
};

// ============================================
// 🔐 AUTH
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

// Shrink the photo before upload: faster on slow connections,
// avoids upload-size failures, and guarantees a clean file:// path.
// The ML model only needs 256x256, so nothing important is lost.
const prepareImage = async (uri) => {
    try {
        const cleanUri = uri.startsWith('/') ? `file://${uri}` : uri;
        const result = await ImageManipulator.manipulateAsync(
            cleanUri,
            [{ resize: { width: 800 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        return result.uri;
    } catch (e) {
        console.warn('Image compress failed, using original:', e.message);
        return uri;
    }
};

export const predictDisease = async (imageUri) => {
    try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) return { success: false, error: 'Not logged in' };

        const uploadUri = await prepareImage(imageUri);
        console.log('Predicting with image:', uploadUri);

        const baseURL = await getApiBaseUrl();
        const formData = new FormData();
        formData.append('image', {
            uri: uploadUri,
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
        } else {
            let message = 'Prediction failed';
            try {
                const err = await response.json();
                message = err.error || message;
            } catch {}
            return { success: false, error: message };
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
        const response = await fetch(`${baseURL}/predictions/history`, {
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

// The predict endpoint already saves history on the server.
export const savePrediction = async () => {
    return { success: true };
};

// Stats come from the server (/auth/stats); nothing extra to update locally.
export const updateUserStats = async () => {
    return { success: true };
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

// Not supported by the backend yet — return honest messages instead of crashing.
export const deletePrediction = async () => {
    return { success: false, error: 'Delete is not available yet' };
};

export const clearHistory = async () => {
    return { success: false, error: 'Clear history is not available yet' };
};

export const changePassword = async () => {
    return { success: false, error: 'Password change is not available yet' };
};

export const deleteAccount = async () => {
    return { success: false, error: 'Account deletion is not available yet' };
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