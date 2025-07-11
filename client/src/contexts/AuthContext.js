// client/src/contexts/AuthContext.js - RENDER DEPLOYMENT FIXED
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

  // ✅ RENDER FIX: Simple environment variable handling
  const API_BASE_URL = (() => {
    // Production (Render)
    if (process.env.NODE_ENV === 'production') {
      return process.env.REACT_APP_API_BASE_URL || 'https://furbabies-backend.onrender.com/api';
    }
    
    // Development
    return process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
  })();
  
  console.log('🔧 AuthContext API Configuration:', {
    NODE_ENV: process.env.NODE_ENV,
    API_BASE_URL,
    REACT_APP_API_BASE_URL: process.env.REACT_APP_API_BASE_URL
  });

  // Memoized function to validate token
  const validateToken = useCallback(async (token) => {
    try {
      console.log('🔍 Validating token...');
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Token validation successful');
        return data.data;
      } else {
        console.log('❌ Token validation failed:', response.status);
        return null;
      }
    } catch (error) {
      console.error('❌ Token validation error:', error);
      return null;
    }
  }, [API_BASE_URL]);

  // Check authentication status on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('🔍 Checking auth status...');
        const token = localStorage.getItem('token');
        
        if (token) {
          console.log('🎫 Token found, validating...');
          const userData = await validateToken(token);
          
          if (userData) {
            setUser(userData);
            console.log('🎯 Auth restored - User:', userData.name, 'Role:', userData.role);
          } else {
            console.log('❌ Token invalid, removing...');
            localStorage.removeItem('token');
            setUser(null);
          }
        } else {
          console.log('🚫 No token found');
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
        console.log('✅ Auth check complete');
      }
    };

    checkAuthStatus();
  }, [validateToken]);

  // Debug logging for user state changes
  useEffect(() => {
    if (user) {
      console.log('👤 Current User:', {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.role === 'admin'
      });
    } else {
      console.log('👤 No user authenticated');
    }
  }, [user]);

  const login = async (credentials) => {
    try {
      const loginData = {
        email: credentials.email || credentials.username,
        password: credentials.password
      };

      console.log('🔐 Attempting login to:', `${API_BASE_URL}/users/login`);
      console.log('📤 Login data:', { email: loginData.email, hasPassword: !!loginData.password });

      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      console.log('📡 Login response status:', response.status);
      console.log('📡 Login response headers:', Object.fromEntries(response.headers.entries()));

      // Enhanced error handling for non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
          console.log('📦 Login response data:', data);
        } catch (jsonError) {
          console.error('❌ JSON parsing failed:', jsonError);
          throw new Error('Server returned malformed JSON response');
        }
      } else {
        const text = await response.text();
        console.error('❌ Expected JSON, received:', text.substring(0, 200));
        console.error('❌ Content-Type:', contentType);
        console.error('❌ Full response headers:', Object.fromEntries(response.headers.entries()));
        
        // Check if it's a CORS error (often returns HTML)
        if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
          throw new Error(`CORS error: Server returned HTML instead of JSON. Check server CORS configuration.
          
🔧 Debugging info:
- API URL: ${API_BASE_URL}/users/login
- Response Status: ${response.status}
- Content-Type: ${contentType}
- Response starts with: ${text.substring(0, 100)}...`);
        }
        
        throw new Error(`Server returned non-JSON response (${response.status}): ${text.substring(0, 100)}`);
      }

      if (response.ok && data.success) {
        localStorage.setItem('token', data.data.token);
        setUser(data.data.user);
        
        console.log('✅ Login successful:', data.message);
        return {
          success: true,
          user: data.data.user,
          token: data.data.token,
          message: data.message
        };
      } else {
        const errorMessage = data.message || 'Login failed';
        console.error('❌ Login failed:', errorMessage);
        
        if (data.errors && Array.isArray(data.errors)) {
          const detailedErrors = data.errors.map(err => `${err.field}: ${err.message}`).join(', ');
          throw new Error(`Login failed: ${detailedErrors}`);
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      
      // Provide more helpful error messages
      if (error.message.includes('Failed to fetch')) {
        throw new Error(`Network error: Unable to connect to server.
        
🔧 Debugging info:
- API URL: ${API_BASE_URL}
- Check if backend is running
- Check CORS configuration
- Check environment variables`);
      }
      
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 Attempting registration to:', `${API_BASE_URL}/users/register`);

      const requestData = {
        name: userData.firstName && userData.lastName 
          ? `${userData.firstName} ${userData.lastName}`
          : userData.name || '',
        email: userData.email,
        password: userData.password,
        ...(userData.phone && { phone: userData.phone }),
        ...(userData.address && { address: userData.address }),
        role: 'user'
      };

      console.log('📤 Registration data:', { ...requestData, password: '[HIDDEN]' });

      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('❌ Expected JSON, received:', text.substring(0, 200));
        throw new Error(`Server returned non-JSON response (${response.status})`);
      }

      if (response.ok && data.success) {
        console.log('✅ Registration successful:', data.message);
        
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
        const errorMessage = data.message || 'Registration failed';
        console.error('❌ Registration failed:', errorMessage);
        
        if (data.errors && Array.isArray(data.errors)) {
          const detailedErrors = data.errors.map(err => `${err.field}: ${err.message}`).join(', ');
          throw new Error(`Registration failed: ${detailedErrors}`);
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('💥 Registration error:', error);
      throw error;
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