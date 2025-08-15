// ===== PROPER Environment Variable Setup =====
// client/src/contexts/AuthContext.js - ENVIRONMENT VARIABLE DRIVEN

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

  // ✅ CORRECT: Let environment variables handle this automatically
  const API_BASE_URL = process.env.REACT_APP_API_URL || 
    (process.env.NODE_ENV === 'production' 
      ? '/api'  // Use relative path in production - Render will handle routing
      : 'http://localhost:5000/api'
    );

  console.log('🔧 Environment:', process.env.NODE_ENV);
  console.log('🔧 API_BASE_URL:', API_BASE_URL);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    console.log('🚪 User logged out');
  }, []);

  const authAPI = useMemo(() => {
    const instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Request interceptor
    instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(`🔐 ${process.env.NODE_ENV} Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    instance.interceptors.response.use(
      (response) => {
        console.log(`✅ Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ Auth API Error:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: error.config?.url,
          baseURL: error.config?.baseURL
        });
        
        if (error.response?.status === 401) {
          console.log('🚪 401 Error - Auto logout');
          logout();
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [API_BASE_URL, logout]);

  const checkAuthStatus = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      console.log('🎯 Checking auth status...');
      const response = await authAPI.get('/users/profile');

      if (response.data?.success && response.data?.data) {
        setUser(response.data.data);
        setIsAuthenticated(true);
        console.log('✅ User authenticated:', response.data.data?.email);
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error.message);
      logout();
    } finally {
      setLoading(false);
    }
  }, [authAPI, logout]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (email, password, rememberMe = false) => {
    try {
      console.log('🔐 Starting login for:', email);

      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const loginData = {
        email: String(email).trim(),
        password: String(password)
      };

      const response = await authAPI.post('/auth/login', loginData);
      
      if (response.data?.success && response.data?.token) {
        const { token, user } = response.data;
        
        localStorage.setItem('token', token);
        setUser(user);
        setIsAuthenticated(true);
        
        console.log('✅ Login successful for:', user?.email);
        return { success: true, user, token };
      } else {
        throw new Error(response.data?.message || 'Login failed');
      }
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Login failed. Please check your credentials.';
      console.error('❌ Login failed:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 Starting registration for:', userData.email);
      
      const response = await authAPI.post('/auth/register', userData);
      
      if (response.data?.success) {
        console.log('✅ Registration successful');
        
        // Auto-login after successful registration
        if (response.data.token && response.data.user) {
          localStorage.setItem('token', response.data.token);
          setUser(response.data.user);
          setIsAuthenticated(true);
        }
        
        return { 
          success: true, 
          message: response.data.message || 'Registration successful',
          user: response.data.user 
        };
      } else {
        throw new Error(response.data?.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Registration failed. Please try again.';
      console.error('❌ Registration failed:', errorMessage);
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
    authAPI,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ===== ENVIRONMENT VARIABLE SETUP =====

// ✅ LOCAL DEVELOPMENT (client/.env.local) - OPTIONAL
/*
# Only set this if you want to override defaults
# REACT_APP_API_URL=http://localhost:5000/api
*/

// ✅ RENDER ENVIRONMENT VARIABLES
// Set these in your Render Dashboard -> Environment tab:
/*
For your FRONTEND service on Render:
- REACT_APP_API_URL=https://furbabies-backend.onrender.com/api

For your BACKEND service on Render:
- NODE_ENV=production
- JWT_SECRET=your-secret-key
- MONGODB_URI=your-mongodb-url
- PORT=5000
- FRONTEND_URL=https://your-frontend.onrender.com
*/

// ===== HOW IT WORKS =====
/*
🏠 LOCAL DEVELOPMENT:
- Uses: http://localhost:5000/api
- No environment variable needed

🚀 RENDER PRODUCTION:  
- Frontend uses: process.env.REACT_APP_API_URL (set in Render dashboard)
- Backend uses: process.env.PORT (Render sets this automatically)
- CORS configured with: process.env.FRONTEND_URL
*/

// ===== RENDER DEPLOYMENT SETUP =====
/*
1. BACKEND SERVICE (furbabies-backend.onrender.com):
   Environment Variables:
   - NODE_ENV=production
   - JWT_SECRET=your-super-secret-key
   - MONGODB_URI=your-mongodb-connection-string
   - FRONTEND_URL=https://your-frontend.onrender.com
   
2. FRONTEND SERVICE:
   Environment Variables:
   - REACT_APP_API_URL=https://furbabies-backend.onrender.com/api
   
3. BUILD SETTINGS:
   Backend Build Command: npm install
   Backend Start Command: npm start
   
   Frontend Build Command: npm run build  
   Frontend Start Command: serve -s build
*/