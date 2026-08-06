import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL as DEFAULT_API_URL } from '../config/api';

const API_URL_KEY = 'api_base_url';

// ============================================
// 📦 API URL Helpers
// ============================================

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
// 🔐 AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Sign Up - Create user in PostgreSQL
 */
export const signUp = async (name, email, password) => {
    try {
        const baseURL = await getApiBaseUrl();
        const response = await fetch(`${baseURL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
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

/**
 * Login - Authenticate via PostgreSQL
 */
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

/**
 * Logout - Remove JWT token
 */
export const logout = async () => {
    try {
        await SecureStore.deleteItemAsync('auth_token');
        await AsyncStorage.removeItem('user_data');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Get Current User - From PostgreSQL via JWT
 */
export const getCurrentUser = async () => {
    try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) {
            // Try local fallback
            const userJson = await AsyncStorage.getItem('user_data');
            return userJson ? JSON.parse(userJson) : null;
        }

        const baseURL = await getApiBaseUrl();
        const response = await fetch(`${baseURL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
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
        // Fallback to cached user data
        try {
            const userJson = await AsyncStorage.getItem('user_data');
            return userJson ? JSON.parse(userJson) : null;
        } catch {
            return null;
        }
    }
};

/**
 * Check if user is logged in
 */
export const isLoggedIn = async () => {
    const user = await getCurrentUser();
    return user !== null;
};

/**
 * Save prediction to PostgreSQL
 */
export const savePrediction = async (prediction) => {
    try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) {
            return { success: false, error: 'Not logged in' };
        }

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

/**
 * Get all predictions from PostgreSQL
 */
export const getPredictions = async () => {
    try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) {
            return { success: false, error: 'Not logged in', predictions: [] };
        }

        const baseURL = await getApiBaseUrl();
        const response = await fetch(`${baseURL}/predictions`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            return { 
                success: true, 
                predictions: data.predictions || data 
            };
        } else {
            return { success: false, error: 'Failed to fetch', predictions: [] };
        }
    } catch (error) {
        console.error('Get predictions error:', error);
        return { success: false, error: error.message, predictions: [] };
    }
};

/**
 * Delete prediction from PostgreSQL
 */
export const deletePrediction = async (predictionId) => {
    try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) {
            return { success: false, error: 'Not logged in' };
        }

        const baseURL = await getApiBaseUrl();
        const response = await fetch(`${baseURL}/predictions/${predictionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            return { success: true };
        } else {
            const error = await response.json();
            return { success: false, error: error.error || 'Failed to delete' };
        }
    } catch (error) {
        console.error('Delete prediction error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get user statistics from PostgreSQL
 */
export const getUserStats = async () => {
    try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) {
            return { success: false, error: 'Not logged in' };
        }

        const baseURL = await getApiBaseUrl();
        const response = await fetch(`${baseURL}/users/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
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

/**
 * Clear all data (for testing)
 */
export const clearAllData = async () => {
    try {
        await SecureStore.deleteItemAsync('auth_token');
        await AsyncStorage.clear();
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};