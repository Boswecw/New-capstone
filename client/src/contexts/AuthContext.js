// client/src/contexts/AuthContext.js - FIXED VERSION
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  console.log('🔧 Environment:', process.env.NODE_ENV);
  console.log('🔧 API_BASE_URL:', process.env.REACT_APP_API_URL);

  // Logout function - useCallback to make it stable
  const logout = React.useCallback(() => {
    console.log('🚪 User logged out');
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
    // Remove auth header
    delete api.defaults.headers.common['Authorization'];
  }, []);

  // FIXED: Check auth status with proper response format handling
  const checkAuthStatus = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('📝 No token found - user not authenticated');
        setLoading(false);
        return;
      }

      console.log('🎯 Checking auth status...');
      console.log('🔐 development Request: GET /auth/me');

      // Set auth header for this request
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const response = await api.get('/auth/me');
      console.log('🔍 Auth response data:', response.data);
      
      // FIXED: Handle both response formats
      let userData = null;
      
      if (response.data.success && response.data.user) {
        // Format: { success: true, user: {...} }
        userData = response.data.user;
      } else if (response.data.success && response.data.data) {
        // Format: { success: true, data: {...} }
        userData = response.data.data;
      } else {
        console.error('❌ Invalid auth response format:', response.data);
        throw new Error('Invalid profile response format');
      }

      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        console.log('✅ Auth check successful:', userData.name, 'Role:', userData.role);
      } else {
        throw new Error('No user data in response');
      }
      
    } catch (error) {
      console.error('❌ Auth check failed:', error.message);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        console.log('🚪 401 Error - Token invalid or expired');
        logout();
      } else if (error.response?.status === 404) {
        console.log('🚪 404 Error - User not found');
        logout();
      } else {
        console.error('❌ Unexpected auth error:', error);
        // Don't logout on network errors, just set loading to false
        logout(); // For now, logout on any error to be safe
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // Register function
  const register = React.useCallback(async (userData) => {
    try {
      console.log('📝 Attempting registration...');
      
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success && response.data.token) {
        const { user: newUser, token } = response.data;
        
        // Store token
        localStorage.setItem('token', token);
        
        // Set auth header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Update state
        setUser(newUser);
        setIsAuthenticated(true);
        setLoading(false);
        
        console.log('✅ Registration successful:', newUser.name);
        return { success: true, user: newUser };
      } else {
        throw new Error(response.data?.message || 'Invalid response format');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Registration failed',
        errors: error.response?.data?.errors || []
      };
    }
  }, []);

  // Login function with flexible parameter handling
  const login = React.useCallback(async (emailOrCredentials, password, rememberMe) => {
    try {
      console.log('🔐 Attempting login...');
      
      // Handle both formats: login(email, password) and login({email, password})
      let credentials;
      if (typeof emailOrCredentials === 'string') {
        credentials = { email: emailOrCredentials, password, rememberMe };
      } else {
        credentials = emailOrCredentials;
      }
      
      const response = await api.post('/auth/login', credentials);
      
      if (response.data.success && response.data.token) {
        const { user: userData, token } = response.data;
        
        // Store token
        localStorage.setItem('token', token);
        
        // Set auth header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Update state
        setUser(userData);
        setIsAuthenticated(true);
        setLoading(false);
        
        console.log('✅ Login successful:', userData.name);
        return { success: true, user: userData };
      } else {
        throw new Error(response.data?.message || 'Invalid response format');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      logout();
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Login failed' 
      };
    }
  }, [logout]);

  // Update profile function
  const updateProfile = React.useCallback(async (profileData) => {
    try {
      console.log('📝 Updating profile...');
      const response = await api.put('/auth/profile', profileData);
      
      if (response.data.success) {
        // Handle both response formats
        const updatedUser = response.data.data || response.data.user;
        setUser(updatedUser);
        console.log('✅ Profile updated successfully');
        return { success: true, user: updatedUser };
      } else {
        throw new Error(response.data?.message || 'Update failed');
      }
    } catch (error) {
      console.error('❌ Profile update error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Profile update failed'
      };
    }
  }, []);

  // Change password function
  const changePassword = React.useCallback(async (passwordData) => {
    try {
      console.log('🔐 Changing password...');
      const response = await api.post('/auth/change-password', passwordData);
      
      if (response.data.success) {
        console.log('✅ Password changed successfully');
        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data?.message || 'Password change failed');
      }
    } catch (error) {
      console.error('❌ Password change error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Password change failed'
      };
    }
  }, []);

  // Initialize authentication on mount
  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      if (isMounted) {
        await checkAuthStatus();
      }
    };

    initAuth();
    
    return () => {
      isMounted = false;
    };
  }, [checkAuthStatus]);

  // Set up auth header when user changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && user) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [user]);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};