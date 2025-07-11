// client/src/contexts/AuthContext.js - FIXED VERSION
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/environment';

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

  console.log('🔧 AuthContext using API_BASE_URL:', API_BASE_URL);

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
  }, []);

  // Check authentication status on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const userData = await validateToken(token);
          
          if (userData) {
            setUser(userData);
            console.log('🎯 Auth restored - User:', userData.name, 'Role:', userData.role);
          } else {
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
    if (user) {
      console.log('🎯 Current User:', user.name, 'Role:', user.role, 'Admin:', user.role === 'admin');
    }
  }, [user]);

  const login = async (credentials) => {
    try {
      const loginData = {
        email: credentials.email || credentials.username,
        password: credentials.password
      };

      console.log('🔐 Attempting login to:', `${API_BASE_URL}/users/login`);

      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      // Enhanced error handling for non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('❌ JSON parsing failed:', jsonError);
          throw new Error('Server returned malformed JSON response');
        }
      } else {
        const text = await response.text();
        console.error('❌ Expected JSON, received:', text.substring(0, 200));
        console.error('❌ Content-Type:', contentType);
        
        // Check if it's a CORS error (often returns HTML)
        if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
          throw new Error('CORS error: Server returned HTML instead of JSON. Check server CORS configuration.');
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
        throw new Error('Network error: Unable to connect to server. Check your internet connection and server status.');
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