// client/src/contexts/AuthContext.js - FIXED WITH PROPER EXPORTS
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ✅ Create and export AuthContext
const AuthContext = createContext();

// ✅ Export the context itself for components that need direct access
export { AuthContext };

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

  // ✅ FIXED: Consistent API base URL configuration for production
  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://furbabies-backend.onrender.com/api'  // Your working backend
    : 'http://localhost:5000/api';
  
  console.log('🔧 AuthContext API_BASE_URL:', API_BASE_URL);

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
        return data.data || data.user;
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

  // Login function
  const login = async (credentials) => {
    try {
      console.log('🔐 Attempting login...');
      
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse login response:', jsonError);
        throw new Error('Server error. Please try again later.');
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
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Network error during login');
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      console.log('📝 Attempting registration...');

      // Prepare registration data
      const requestData = {
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

      console.log('📝 Sending registration data:', {
        ...requestData,
        password: '[HIDDEN]'
      });

      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse registration response:', jsonError);
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

  // Logout function
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
    return user && user.role === 'admin';
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
        throw new Error(data.message || 'Password reset request failed');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      throw new Error(error.message || 'Network error during password reset');
    }
  };

  // Client-side validation helpers
  const validatePassword = (password) => {
    const errors = [];
    
    if (!password || password.length < 8) {
      errors.push('Password must be at least 8 characters long');
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

// ✅ Export AuthProvider as default for convenience
export default AuthProvider;