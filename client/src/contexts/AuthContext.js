import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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

  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://new-capstone.onrender.com/api'
    : 'http://localhost:5000/api';

  console.log('🔧 AuthContext API_BASE_URL:', API_BASE_URL);

  // ✅ Define logout function first to avoid circular dependency
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // ✅ Now authAPI can safely use logout in its dependency array
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
        console.error('❌ Auth API Error:', error);
        if (error.response?.status === 401) {
          console.log('🚪 401 Error - Logging out user');
          logout(); // Now this is safe to call
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [API_BASE_URL, logout]); // ✅ Fixed: Added logout to dependency array

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

  // ✅ UPDATED LOGIN FUNCTION WITH ENHANCED DEBUGGING AND ERROR HANDLING
  const login = async (email, password) => {
    try {
      console.log('🔐 Starting login process...');
      console.log('📝 Login parameters received:', { 
        email: email ? email : 'undefined',
        emailType: typeof email,
        password: password ? `${password.length} chars` : 'undefined',
        passwordType: typeof password
      });

      // Validate input parameters
      if (!email || !password) {
        console.error('❌ Missing email or password');
        return {
          success: false,
          message: 'Email and password are required'
        };
      }

      if (typeof email !== 'string' || typeof password !== 'string') {
        console.error('❌ Invalid parameter types:', { emailType: typeof email, passwordType: typeof password });
        return {
          success: false,
          message: 'Invalid email or password format'
        };
      }

      // Create clean login payload - ensure strings and trim email
      const loginPayload = { 
        email: String(email).trim().toLowerCase(), 
        password: String(password) 
      };
      
      console.log('📤 Sending login payload:', { 
        email: loginPayload.email, 
        passwordLength: loginPayload.password.length 
      });

      // Make the API request
      const response = await authAPI.post('/auth/login', loginPayload);

      console.log('📥 Login response status:', response.status);
      console.log('📥 Login response headers:', response.headers);
      console.log('📥 Login response data structure:', {
        success: response.data?.success,
        hasToken: !!response.data?.token,
        hasUser: !!response.data?.user,
        message: response.data?.message
      });
      console.log('📥 Full login response data:', response.data);

      if (response.data?.success) {
        const { token, user: userData } = response.data;
        
        if (!token) {
          console.error('❌ No token in successful response');
          return {
            success: false,
            message: 'Invalid server response - no token provided'
          };
        }

        if (!userData) {
          console.error('❌ No user data in successful response');
          return {
            success: false,
            message: 'Invalid server response - no user data provided'
          };
        }

        console.log('✅ Login successful, storing token and user data');
        console.log('👤 User data received:', {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role
        });

        localStorage.setItem('token', token);
        setUser(userData);
        setIsAuthenticated(true);
        
        return { 
          success: true, 
          user: userData,
          message: 'Login successful'
        };
      } else {
        console.log('❌ Login failed - success flag is false');
        throw new Error(response.data?.message || 'Login failed - invalid response');
      }
    } catch (error) {
      console.error('❌ Login error occurred:');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      if (error.response) {
        console.error('❌ HTTP Error Response:');
        console.error('Status:', error.response.status);
        console.error('Status Text:', error.response.statusText);
        console.error('Response Data:', error.response.data);
        console.error('Response Headers:', error.response.headers);
        
        // Handle specific HTTP status codes
        if (error.response.status === 400) {
          console.error('❌ Bad Request - Check request format');
          if (error.response.data?.errors) {
            console.error('❌ Validation Errors:', error.response.data.errors);
          }
        } else if (error.response.status === 401) {
          console.error('❌ Unauthorized - Invalid credentials');
        } else if (error.response.status === 500) {
          console.error('❌ Server Error');
        }
      } else if (error.request) {
        console.error('❌ Network Error - No response received:');
        console.error('Request:', error.request);
      } else {
        console.error('❌ Request Setup Error:', error.message);
      }
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed - network or server error',
        errorDetails: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        }
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 Attempting registration...');
      console.log('📝 Registration data:', {
        name: userData.name,
        email: userData.email,
        passwordProvided: !!userData.password
      });
      
      // ✅ FIXED: Using correct auth endpoint
      const response = await authAPI.post('/auth/register', userData);
      
      console.log('📥 Registration response:', response.data);
      
      if (response.data?.success) {
        console.log('✅ Registration successful');
        return { 
          success: true, 
          message: response.data.message || 'Registration successful' 
        };
      } else {
        throw new Error(response.data?.message || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      console.error('❌ Registration error response:', error.response?.data);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Registration failed',
      };
    }
  };

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

export default AuthContext;