// client/src/contexts/AuthContext.js - FIXED VERSION
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ CORRECTED API BASE URL - Use your actual backend URL
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://furbabies-backend.onrender.com/api'  // ← UPDATE THIS TO YOUR ACTUAL BACKEND URL
    : 'http://localhost:5000/api';

  console.log('🔧 AuthContext API_BASE_URL:', API_BASE_URL);

  // ✅ Define logout function first to avoid circular dependency
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // ✅ Enhanced authAPI with better error handling
  const authAPI = useMemo(() => {
    const instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: false
    });

    instance.interceptors.request.use(
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

    instance.interceptors.response.use(
      (response) => {
        console.log(`✅ Auth API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ Auth API Error:', {
          message: error.message,
          status: error.response?.status,
          url: error.config?.url,
          data: error.response?.data
        });
        
        if (error.response?.status === 401) {
          console.log('🚪 401 Error - Logging out user');
          logout();
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [API_BASE_URL, logout]);

  const checkAuthStatus = useCallback(async () => {
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
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [authAPI]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (email, password) => {
    try {
      console.log('🔐 Starting login process...');
      console.log('📝 Login parameters:', { 
        email: email || 'undefined',
        emailType: typeof email,
        passwordProvided: !!password
      });

      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const loginData = {
        email: String(email).trim(),
        password: String(password)
      };

      console.log('📤 Sending login request to:', `${API_BASE_URL}/users/login`);
      
      const response = await authAPI.post('/users/login', loginData);
      
      console.log('📥 Login response received:', {
        status: response.status,
        hasData: !!response.data,
        hasToken: !!response.data?.token,
        hasUser: !!response.data?.user || !!response.data?.data
      });

      if (response.data?.success && response.data?.token) {
        const { token, user, data } = response.data;
        const userData = user || data;
        
        localStorage.setItem('token', token);
        setUser(userData);
        setIsAuthenticated(true);
        
        console.log('✅ Login successful for:', userData?.email);
        return { success: true, user: userData, token };
      } else {
        throw new Error(response.data?.message || 'Login failed - Invalid response format');
      }
      
    } catch (error) {
      console.error('❌ Login failed:', {
        message: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
        url: error.config?.url
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(errorMessage);
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 Starting registration...');
      const response = await authAPI.post('/users/register', userData);
      
      if (response.data?.success) {
        console.log('✅ Registration successful');
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    register,
    authAPI
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};