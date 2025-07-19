// client/src/contexts/AuthContext.js - FIXED API URL
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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

  // ✅ FIXED: Use the same backend URL as main API
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://new-capstone.onrender.com/api'  // ✅ Same as main API
    : 'http://localhost:5000/api';

  console.log('🔧 AuthContext API_BASE_URL:', API_BASE_URL);

  // Create axios instance for auth
  const authAPI = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    withCredentials: false  // ✅ Consistent with main API
  });

  // Request interceptor
  authAPI.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log(`🔐 Auth API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error('❌ Auth Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  authAPI.interceptors.response.use(
    (response) => {
      console.log(`✅ Auth API Response: ${response.status} ${response.config.url}`);
      return response;
    },
    (error) => {
      console.error('❌ Auth API Error:', error);
      
      // Handle 401 errors
      if (error.response?.status === 401) {
        console.log('🚪 401 Error - Logging out user');
        logout();
      }
      
      return Promise.reject(error);
    }
  );

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      console.log('🎯 Checking auth status...');
      const response = await authAPI.get('/users/profile');
      
      if (response.data?.success) {
        setUser(response.data.data);
        setIsAuthenticated(true);
        console.log('✅ User authenticated:', response.data.data?.email);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      // Clear invalid token
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login...');
      const response = await authAPI.post('/users/login', { email, password });
      
      if (response.data?.success) {
        const { token, user: userData } = response.data.data;
        
        // Store token
        localStorage.setItem('token', token);
        
        // Update state
        setUser(userData);
        setIsAuthenticated(true);
        
        console.log('✅ Login successful:', userData?.email);
        return { success: true, user: userData };
      } else {
        throw new Error(response.data?.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 Attempting registration...');
      const response = await authAPI.post('/users/register', userData);
      
      if (response.data?.success) {
        console.log('✅ Registration successful');
        return { success: true, message: 'Registration successful' };
      } else {
        throw new Error(response.data?.message || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    console.log('🚪 Logging out user...');
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  console.log('🎯 CURRENT USER STATE:', user);

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};