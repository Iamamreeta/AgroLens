import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// 📱 SIMPLE LOCAL AUTHENTICATION
// ============================================

const USERS_KEY = '@agrolens_users';
const CURRENT_USER_KEY = '@agrolens_current_user';

// ============================================
// 📂 PRIVATE HELPER FUNCTIONS
// ============================================

// Get all users
const getUsers = async () => {
  try {
    const usersJson = await AsyncStorage.getItem(USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

// Save users
const saveUsers = async (users) => {
  try {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users:', error);
  }
};

// ============================================
// 🔐 AUTH FUNCTIONS
// ============================================

/**
 * Sign Up - Create a new user account
 * @param {string} name - User's full name
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Object} { success, user, error }
 */
export const signUp = async (name, email, password) => {
  try {
    const users = await getUsers();
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'User already exists with this email' };
    }
    
    // Create new user
    const newUser = {
      id: Date.now().toString(),
      name: name,
      email: email,
      password: password,
      createdAt: new Date().toISOString(),
      totalScans: 0,
      healthyPlants: 0,
      diseasedPlants: 0
    };
    
    users.push(newUser);
    await saveUsers(users);
    
    // Auto login after signup
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    
    return { success: true, user: newUser };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Login - Authenticate user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Object} { success, user, error }
 */
export const login = async (email, password) => {
  try {
    const users = await getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Logout - Sign out current user
 * @returns {Object} { success, error }
 */
export const logout = async () => {
  try {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get current logged in user
 * @returns {Object|null} User object or null
 */
export const getCurrentUser = async () => {
  try {
    const userJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Check if user is logged in
 * @returns {boolean} True if logged in
 */
export const isLoggedIn = async () => {
  const user = await getCurrentUser();
  return user !== null;
};

/**
 * Update user stats after a scan
 * @param {Object} prediction - Prediction result
 * @returns {Object} { success, user, error }
 */
export const updateUserStats = async (prediction) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { success: false, error: 'No user logged in' };
    
    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex === -1) return { success: false, error: 'User not found' };
    
    const isHealthy = prediction.status === 'Healthy';
    users[userIndex].totalScans = (users[userIndex].totalScans || 0) + 1;
    users[userIndex].healthyPlants = (users[userIndex].healthyPlants || 0) + (isHealthy ? 1 : 0);
    users[userIndex].diseasedPlants = (users[userIndex].diseasedPlants || 0) + (isHealthy ? 0 : 1);
    
    await saveUsers(users);
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(users[userIndex]));
    
    return { success: true, user: users[userIndex] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Clear all user data (for testing)
 */
export const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};