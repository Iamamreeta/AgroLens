import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as ImageManipulator from 'expo-image-manipulator';
// Native uploader (fallback if standard upload fails).
let FileSystem;
try { FileSystem = require('expo-file-system/legacy'); }
catch (e) { FileSystem = require('expo-file-system'); }
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

// Shrink the photo before upload (the ML model only needs 256x256).
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

// Upload attempt 1: standard uploader.
const tryFetchUpload = async (url, uploadUri, token) => {
    const formData = new FormData();
    formData.append('image', {
        uri: uploadUri,
        type: 'image/jpeg',
        name: 'photo.jpg'
    });
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await fetch(url, { method: 'POST', headers, body: formData });
    let body = {};
    try { body = await response.json(); } catch {}
    return { status: response.status, body };
};

// Upload attempt 2: Expo's native uploader (fallback).
const tryNativeUpload = async (url, uploadUri, token) => {
    const uploadType =
        (FileSystem.FileSystemUploadType && FileSystem.FileSystemUploadType.MULTIPART) ?? 1;
    const res = await FileSystem.uploadAsync(url, uploadUri, {
        httpMethod: 'POST',
        uploadType: uploadType,
        fieldName: 'image',
        mimeType: 'image/jpeg',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    let body = {};
    try { body = JSON.parse(res.body); } catch {}
    return { status: res.status, body };
};

// Accepts a string URI OR an object like { uri, type, name } — HomeScreen passes the object.
export const predictDisease = async (imageInput) => {
    try {
        const rawUri = typeof imageInput === 'string' ? imageInput : (imageInput && imageInput.uri);
        if (!rawUri || typeof rawUri !== 'string') {
            return { success: false, error: 'No image selected' };
        }

        const token = await SecureStore.getItemAsync('auth_token');
        const uploadUri = await prepareImage(rawUri);
        console.log('Predicting with image:', uploadUri);

        const baseURL = await getApiBaseUrl();
        const url = `${baseURL}/predictions/predict`;

        let result;
        try {
            result = await tryFetchUpload(url, uploadUri, token);
            console.log('Upload method: fetch | status:', result.status);
        } catch (e1) {
            console.log('Standard upload failed (' + e1.message + '), trying native uploader...');
            result = await tryNativeUpload(url, uploadUri, token);
            console.log('Upload method: native | status:', result.status);
        }

        // Backend wraps the result: { success: true, data: {...} }
        const payload = (result.body && result.body.data) ? result.body.data : result.body;

        if (result.status >= 200 && result.status < 300) {
            return { success: true, prediction: payload };
        }
        return {
            success: false,
            error: (result.body && result.body.error) || `Prediction failed (status ${result.status})`
        };
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

        let body = {};
        try { body = await response.json(); } catch {}

        if (response.ok) {
            // Backend returns: { success: true, count, history: [...] }
            const list = Array.isArray(body) ? body : (body.history || body.data || []);
            return { success: true, history: list };
        }
        return { success: false, error: body.error || 'Failed to fetch', history: [] };
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

// Real endpoints — your backend supports these.
export const deletePrediction = async (id) => {
    try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) return { success: false, error: 'Not logged in' };

        const baseURL = await getApiBaseUrl();
        const response = await fetch(`${baseURL}/predictions/history/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) return { success: true };
        let body = {};
        try { body = await response.json(); } catch {}
        return { success: false, error: body.error || 'Delete failed' };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const clearHistory = async () => {
    try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) return { success: false, error: 'Not logged in' };

        const baseURL = await getApiBaseUrl();
        const response = await fetch(`${baseURL}/predictions/history`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) return { success: true };
        let body = {};
        try { body = await response.json(); } catch {}
        return { success: false, error: body.error || 'Clear failed' };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Not supported by the backend yet — honest messages instead of crashes.
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