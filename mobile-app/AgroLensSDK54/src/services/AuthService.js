import * as SecureStore from 'expo-secure-store';

// ============================================
// 🌐 BACKEND API URL
// ============================================

const API_URL = 'http://localhost:3000/api';  // Local dev
// const API_URL = 'https://agrolens-api.onrender.com/api';  // Production

// ============================================
// 🔐 AUTHENTICATION FUNCTIONS (PostgreSQL Only)
// ============================================

/**
 * Sign Up - Create user in PostgreSQL
 */
export const signUp = async (name, email, password) => {
    try {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store JWT token securely
            await SecureStore.setItemAsync('auth_token', data.token);
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
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store JWT token securely
            await SecureStore.setItemAsync('auth_token', data.token);
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
        if (!token) return null;

        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            return data.user || data;
        } else {
            // Token invalid - clear it
            await SecureStore.deleteItemAsync('auth_token');
            return null;
        }
    } catch (error) {
        console.error('Get user error:', error);
        return null;
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

        const response = await fetch(`${API_URL}/predictions`, {
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

        const response = await fetch(`${API_URL}/predictions`, {
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

        const response = await fetch(`${API_URL}/predictions/${predictionId}`, {
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

        const response = await fetch(`${API_URL}/users/stats`, {
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

// ============================================
// 🧹 Clear Data (for testing)
// ============================================

export const clearAllData = async () => {
    try {
        await SecureStore.deleteItemAsync('auth_token');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};