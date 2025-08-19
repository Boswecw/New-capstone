// client/src/contexts/AuthContext.js
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
  }, []);

  // Register function - useCallback for performance
  const register = React.useCallback(async (userData) => {
    try {
      console.log('📝 Attempting registration...');
      
      // Ensure username is included if not provided
      const registrationData = {
        ...userData,
        username: userData.username || userData.email?.split('@')[0] || 'user'
      };
      
      const response = await api.post('/auth/register', registrationData);
      
      if (response.data.success && response.data.token) {
        // Format from your backend: { success: true, token: "...", user: {...} }
        const { user: newUser, token } = response.data;
        
        // Store token
        localStorage.setItem('token', token);
        
        // Update state
        setUser(newUser);
        setIsAuthenticated(true);
        setLoading(false);
        
        console.log('✅ Registration successful:', newUser.name);
        return { success: true, user: newUser };
      } else if (response.data.success && response.data.data?.token) {
        // Alternative format: { success: true, data: { token: "...", user: {...} } }
        const { user: newUser, token } = response.data.data;
        
        // Store token
        localStorage.setItem('token', token);
        
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

  // Login function - useCallback for performance
  const login = React.useCallback(async (credentials) => {
    try {
      console.log('🔐 Attempting login...');
      const response = await api.post('/auth/login', credentials);
      
      if (response.data.success && response.data.token) {
        // Format from your backend: { success: true, token: "...", user: {...} }
        const { user: userData, token } = response.data;
        
        // Store token
        localStorage.setItem('token', token);
        
        // Update state
        setUser(userData);
        setIsAuthenticated(true);
        setLoading(false);
        
        console.log('✅ Login successful:', userData.name);
        return { success: true, user: userData };
      } else if (response.data.success && response.data.data?.token) {
        // Alternative format: { success: true, data: { token: "...", user: {...} } }
        const { user: userData, token } = response.data.data;
        
        // Store token
        localStorage.setItem('token', token);
        
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

  // Check auth on mount with cleanup - useCallback to satisfy ESLint
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

      const response = await api.get('/auth/me');
      
      if (response.data.success && response.data.user) {
        // Format: { success: true, user: {...} }
        setUser(response.data.user);
        setIsAuthenticated(true);
        console.log('✅ Auth check successful:', response.data.user.name);
      } else if (response.data.success && response.data.data) {
        // Alternative format: { success: true, data: {...} }
        setUser(response.data.data);
        setIsAuthenticated(true);
        console.log('✅ Auth check successful:', response.data.data.name);
      } else {
        throw new Error('Invalid profile response');
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
        setLoading(false);
      }
    } finally {
      setLoading(false);
    }
  }, [logout]); // Include logout as dependency since it's used inside

  // Update profile function
  const updateProfile = React.useCallback(async (profileData) => {
    try {
      console.log('📝 Updating profile...');
      const response = await api.put('/users/profile', profileData);
      
      if (response.data.success) {
        setUser(response.data.data);
        console.log('✅ Profile updated successfully');
        return { success: true, user: response.data.data };
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
      const response = await api.put('/users/change-password', passwordData);
      
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

  // Check auth on mount with cleanup
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
  }, [checkAuthStatus]); // Now includes checkAuthStatus as dependency

  // Add token to API requests
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
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