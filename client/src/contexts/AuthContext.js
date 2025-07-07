// contexts/AuthContext.js
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

  // Get API base URL from environment or default
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
  }, [validateToken]); // ✅ Fixed: Added validateToken to dependencies

  // Debug logging for user state changes
  useEffect(() => {
    console.log('🎯 CURRENT USER STATE:', user);
    if (user) {
      console.log('🎯 CURRENT USER ROLE:', user.role);
      console.log('🎯 IS ADMIN?:', user.role === 'admin');
    }
  }, [user]); // ✅ Fixed: Added user to dependencies

  const login = async (credentials) => {
    try {
      // Make sure we're using email/password format expected by backend
      const loginData = {
        email: credentials.email || credentials.username, // Support both formats
        password: credentials.password
      };

      console.log('Attempting login to:', `${API_BASE_URL}/users/login`);
      console.log('Login data being sent:', loginData);

      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store token and user data
        localStorage.setItem('token', data.data.token);
        setUser(data.data.user);
        
        // Debug logging
        console.log('🎯 LOGIN SUCCESS - User data:', data.data.user);
        console.log('🎯 LOGIN SUCCESS - User role:', data.data.user.role);
        
        console.log('Login successful:', data.message);
        return {
          success: true,
          user: data.data.user,
          token: data.data.token,
          message: data.message
        };
      } else {
        // Login failed
        const errorMessage = data.message || 'Login failed';
        console.error('Login failed:', errorMessage);
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
      console.log('Attempting registration to:', `${API_BASE_URL}/users/register`);

      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Auto-login after successful registration
        localStorage.setItem('token', data.data.token);
        setUser(data.data.user);
        
        console.log('Registration successful:', data.message);
        return {
          success: true,
          user: data.data.user,
          token: data.data.token,
          message: data.message
        };
      } else {
        const errorMessage = data.message || 'Registration failed';
        console.error('Registration failed:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Network error during registration');
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    console.log('User logged out');
  }, []);

  const updateProfile = async (profileData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.data);
        return data;
      } else {
        throw new Error(data.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  // Check if user has specific role
  const hasRole = useCallback((role) => {
    return user && user.role === role;
  }, [user]); // ✅ Fixed: Added user to dependencies

  // Check if user is admin
  const isAdmin = useCallback(() => {
    return hasRole('admin');
  }, [hasRole]); // ✅ Fixed: Added hasRole to dependencies

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    return !!user && !!localStorage.getItem('token');
  }, [user]); // ✅ Fixed: Added user to dependencies

  // Refresh user data (useful for admin operations)
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token && user) {
      try {
        const userData = await validateToken(token);
        if (userData) {
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    }
  }, [user, validateToken]); // ✅ Fixed: Added dependencies

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    hasRole,
    isAdmin,
    isAuthenticated,
    refreshUser,
    // Expose API base URL for other components if needed
    apiBaseUrl: API_BASE_URL
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;