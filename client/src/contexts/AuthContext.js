// client/src/contexts/AuthContext.js
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

  // ✅ FIXED: Consistent API base URL configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  console.log('🔧 API_BASE_URL:', API_BASE_URL); // Debug logging

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
          ? `${userData.firstName} ${userData.lastName}`.trim()
          : userData.name || userData.username || userData.firstName || userData.lastName || '',
        email: userData.email,
        password: userData.password
      };

      // Validate required fields
      if (!requestData.name || !requestData.email || !requestData.password) {
        throw new Error('Name, email, and password are required');
      }

      console.log('📝 Sending registration data:', requestData);

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
        console.error('Response headers:', response.headers);
        
        // If we get HTML instead of JSON, it's likely a 404 or server error
        if (response.status === 404) {
          throw new Error('Registration endpoint not found. Please check server configuration.');
        } else {
          throw new Error(`Server returned invalid response (${response.status}). Please check your connection and try again.`);
        }
      }

      if (response.ok && data.success) {
        // Auto-login after successful registration
        localStorage.setItem('token', data.data.token);
        setUser(data.data.user);
        
        console.log('✅ Registration successful:', data.message);
        return {
          success: true,
          user: data.data.user,
          token: data.data.token,
          message: data.message
        };
      } else {
        const errorMessage = data.message || 'Registration failed';
        console.error('❌ Registration failed:', errorMessage);
        
        // ✅ IMPROVED: Show detailed validation errors if available
        if (data.errors && Array.isArray(data.errors)) {
          const detailedErrors = data.errors.map(err => `${err.field}: ${err.message}`).join(', ');
          console.error('📋 Validation details:', detailedErrors);
          throw new Error(`Registration failed: ${detailedErrors}`);
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Network error during registration');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    console.log('👋 User logged out');
  };

  // Get current user info
  const getCurrentUser = () => {
    return user;
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // Check if user is admin
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.data);
        console.log('✅ Profile updated successfully');
        return {
          success: true,
          user: data.data,
          message: data.message
        };
      } else {
        // ✅ IMPROVED: Show detailed validation errors if available
        if (data.errors && Array.isArray(data.errors)) {
          const detailedErrors = data.errors.map(err => `${err.field}: ${err.message}`).join(', ');
          throw new Error(`Profile update failed: ${detailedErrors}`);
        }
        
        throw new Error(data.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw new Error(error.message || 'Network error during profile update');
    }
  };

  // Request password reset
  const requestPasswordReset = async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Password reset email sent');
        return {
          success: true,
          message: data.message
        };
      } else {
        // ✅ IMPROVED: Show detailed validation errors if available
        if (data.errors && Array.isArray(data.errors)) {
          const detailedErrors = data.errors.map(err => `${err.field}: ${err.message}`).join(', ');
          throw new Error(`Password reset failed: ${detailedErrors}`);
        }
        
        throw new Error(data.message || 'Password reset request failed');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      throw new Error(error.message || 'Network error during password reset');
    }
  };

  // ✅ NEW: Client-side password validation helper
  const validatePassword = (password) => {
    const errors = [];
    
    if (!password || password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  };

  // ✅ NEW: Client-side name validation helper
  const validateName = (name) => {
    const errors = [];
    
    if (!name || name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
    
    if (name && name.length > 50) {
      errors.push('Name cannot exceed 50 characters');
    }
    
    if (name && !/^[a-zA-Z\s]+$/.test(name)) {
      errors.push('Name can only contain letters and spaces');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  };

  // ✅ NEW: Client-side email validation helper
  const validateEmail = (email) => {
    const errors = [];
    
    if (!email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Please provide a valid email address');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    getCurrentUser,
    isAuthenticated,
    isAdmin,
    updateProfile,
    requestPasswordReset,
    validateToken,
    // ✅ NEW: Expose validation helpers
    validatePassword,
    validateName,
    validateEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Default export for the provider (optional - if you prefer default import)
export default AuthProvider;
