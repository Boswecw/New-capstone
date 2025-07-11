// client/src/contexts/AuthContext.js - FIXED FOR VITE
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ FIXED: Use safe environment variable access
  const API_BASE_URL = (() => {
    try {
      // Try to import the environment config
      const { API_BASE_URL: configUrl } = require('../config/environment');
      return configUrl;
    } catch {
      // Fallback if config not available
      try {
        if (typeof import.meta !== 'undefined' && import.meta.env) {
          return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        }
      } catch {
        // Final fallback
        return 'http://localhost:5000/api';
      }
    }
  })();
  
  console.log('🔧 AuthContext API_BASE_URL:', API_BASE_URL); // Debug logging

  // Memoized function to validate token
  const validateToken = useCallback(async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      return null;
    }
  }, [API_BASE_URL]);

  // Check authentication status on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Validate token by fetching user profile
          const userData = await validateToken(token);
          
          if (userData) {
            setUser(userData);
            console.log('🎯 Auth restored - User:', userData.name, 'Role:', userData.role);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('token');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [validateToken]);

  // Debug logging for user state changes
  useEffect(() => {
    console.log('🎯 CURRENT USER STATE:', user);
    if (user) {
      console.log('🎯 CURRENT USER ROLE:', user.role);
      console.log('🎯 IS ADMIN?', user.role === 'admin');
    }
  }, [user]);

  const login = async (credentials) => {
    try {
      // Make sure we're using email/password format expected by backend
      const loginData = {
        email: credentials.email || credentials.username, // Support both formats
        password: credentials.password
      };

      console.log('🔐 Attempting login to:', `${API_BASE_URL}/users/login`);
      console.log('Login data being sent:', loginData);

      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      // ✅ IMPROVED: Better error handling for non-JSON responses
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        console.error('Response status:', response.status);
        console.error('Response statusText:', response.statusText);
        throw new Error(`Server returned invalid response (${response.status}). Please check your connection and try again.`);
      }

      if (response.ok && data.success) {
        // Store token and user data
        localStorage.setItem('token', data.data.token);
        setUser(data.data.user);
        
        // Debug logging
        console.log('🎯 LOGIN SUCCESS - User data:', data.data.user);
        console.log('🎯 LOGIN SUCCESS - User role:', data.data.user.role);
        
        console.log('✅ Login successful:', data.message);
        return {
          success: true,
          user: data.data.user,
          token: data.data.token,
          message: data.message
        };
      } else {
        // Login failed
        const errorMessage = data.message || 'Login failed';
        console.error('❌ Login failed:', errorMessage);
        
        // ✅ IMPROVED: Show detailed validation errors if available
        if (data.errors && Array.isArray(data.errors)) {
          const detailedErrors = data.errors.map(err => `${err.field}: ${err.message}`).join(', ');
          console.error('📋 Login validation details:', detailedErrors);
          throw new Error(`Login failed: ${detailedErrors}`);
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Login error:', error);
      // Re-throw with more specific message
      throw new Error(error.message || 'Network error during login');
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 Attempting registration to:', `${API_BASE_URL}/users/register`);

      // ✅ FIX: Transform frontend data to match backend expectations
      const requestData = {
        // Combine firstName and lastName into name, or use existing name field
        name: userData.firstName && userData.lastName 
          ? `${userData.firstName} ${userData.lastName}`
          : userData.name || '',
        email: userData.email,
        password: userData.password,
        ...(userData.phone && { phone: userData.phone }),
        ...(userData.address && { address: userData.address }),
        role: 'user' // Default role for registration
      };

      console.log('📤 Registration data being sent:', requestData);

      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      // ✅ IMPROVED: Better error handling for non-JSON responses
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        console.error('Response status:', response.status);
        console.error('Response statusText:', response.statusText);
        throw new Error(`Server returned invalid response (${response.status}). Please check your connection and try again.`);
      }

      if (response.ok && data.success) {
        console.log('✅ Registration successful:', data.message);
        
        // Auto-login after successful registration
        if (data.data && data.data.token) {
          localStorage.setItem('token', data.data.token);
          setUser(data.data.user);
        }
        
        return {
          success: true,
          user: data.data?.user,
          token: data.data?.token,
          message: data.message
        };
      } else {
        // Registration failed
        const errorMessage = data.message || 'Registration failed';
        console.error('❌ Registration failed:', errorMessage);
        
        // ✅ IMPROVED: Show detailed validation errors if available
        if (data.errors && Array.isArray(data.errors)) {
          const detailedErrors = data.errors.map(err => `${err.field}: ${err.message}`).join(', ');
          console.error('📋 Registration validation details:', detailedErrors);
          throw new Error(`Registration failed: ${detailedErrors}`);
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Registration error:', error);
      // Re-throw with more specific message
      throw new Error(error.message || 'Network error during registration');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    console.log('🚪 User logged out');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;