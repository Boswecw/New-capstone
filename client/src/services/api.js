// client/src/services/api.js - ENHANCED VERSION FOR RENDER
import axios from 'axios';

// Enhanced configuration for Render deployment
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://furbabies-backend.onrender.com/api'
    : 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increased to 30 seconds for Render cold starts
});

// Retry configuration
const RETRY_CONFIG = {
  retries: 3,
  retryDelay: 1000, // Start with 1 second
  retryCondition: (error) => {
    // Retry on network errors or 5xx status codes
    return !error.response || error.response.status >= 500 || error.code === 'ECONNABORTED';
  }
};

// Exponential backoff delay
const getRetryDelay = (retryCount) => {
  return Math.min(RETRY_CONFIG.retryDelay * Math.pow(2, retryCount), 10000);
};

// Enhanced request interceptor with retry logic
const createRequestWithRetry = (config) => {
  return new Promise((resolve, reject) => {
    let retryCount = 0;
    
    const makeRequest = async () => {
      try {
        const response = await api(config);
        resolve(response);
      } catch (error) {
        console.error(`API Error (attempt ${retryCount + 1}):`, error.message);
        
        if (retryCount < RETRY_CONFIG.retries && RETRY_CONFIG.retryCondition(error)) {
          retryCount++;
          const delay = getRetryDelay(retryCount);
          
          console.log(`Retrying in ${delay}ms... (${retryCount}/${RETRY_CONFIG.retries})`);
          
          setTimeout(makeRequest, delay);
        } else {
          reject(error);
        }
      }
    };
    
    makeRequest();
  });
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Response Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Enhanced API methods with retry logic
const createAPIMethod = (method, url, data = null) => {
  return (params = {}) => {
    const config = {
      method,
      url,
      ...params
    };
    
    if (data) {
      config.data = data;
    }
    
    return createRequestWithRetry(config);
  };
};

// ===== PET API =====
export const petAPI = {
  getAllPets: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    
    return createRequestWithRetry({
      method: 'GET',
      url: `/pets?${searchParams}`
    });
  },
  
  getFeaturedPets: (limit = 6) => {
    return createRequestWithRetry({
      method: 'GET',
      url: `/pets/featured?limit=${limit}`
    });
  },
  
  getPetById: (id) => {
    return createRequestWithRetry({
      method: 'GET',
      url: `/pets/${id}`
    });
  },
  
  createPet: (petData) => {
    return createRequestWithRetry({
      method: 'POST',
      url: '/pets',
      data: petData
    });
  },
  
  updatePet: (id, petData) => {
    return createRequestWithRetry({
      method: 'PUT',
      url: `/pets/${id}`,
      data: petData
    });
  },
  
  deletePet: (id) => {
    return createRequestWithRetry({
      method: 'DELETE',
      url: `/pets/${id}`
    });
  }
};

// ===== PRODUCT API =====
export const productAPI = {
  getAllProducts: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    
    return createRequestWithRetry({
      method: 'GET',
      url: `/products?${searchParams}`
    });
  },
  
  getFeaturedProducts: (limit = 6) => {
    return createRequestWithRetry({
      method: 'GET',
      url: `/products/featured?limit=${limit}`
    });
  },
  
  getProductById: (id) => {
    return createRequestWithRetry({
      method: 'GET',
      url: `/products/${id}`
    });
  },
  
  getCategories: () => {
    return createRequestWithRetry({
      method: 'GET',
      url: '/products/categories'
    });
  },
  
  getBrands: () => {
    return createRequestWithRetry({
      method: 'GET',
      url: '/products/brands'
    });
  }
};

// ===== USER API =====
export const userAPI = {
  register: (userData) => {
    return createRequestWithRetry({
      method: 'POST',
      url: '/users/register',
      data: userData
    });
  },
  
  login: (credentials) => {
    return createRequestWithRetry({
      method: 'POST',
      url: '/users/login',
      data: credentials
    });
  },
  
  getProfile: () => {
    return createRequestWithRetry({
      method: 'GET',
      url: '/users/profile'
    });
  },
  
  updateProfile: (userData) => {
    return createRequestWithRetry({
      method: 'PUT',
      url: '/users/profile',
      data: userData
    });
  },
  
  addFavorite: (petId) => {
    return createRequestWithRetry({
      method: 'POST',
      url: `/users/favorites/${petId}`
    });
  },
  
  removeFavorite: (petId) => {
    return createRequestWithRetry({
      method: 'DELETE',
      url: `/users/favorites/${petId}`
    });
  },
  
  getFavorites: () => {
    return createRequestWithRetry({
      method: 'GET',
      url: '/users/favorites'
    });
  }
};

// ===== HEALTH CHECK =====
export const healthAPI = {
  check: () => {
    return createRequestWithRetry({
      method: 'GET',
      url: '/health'
    });
  }
};

// ===== UTILITY FUNCTIONS =====
export const handleApiError = (error) => {
  console.error('API Error Details:', {
    message: error.message,
    status: error.response?.status,
    statusText: error.response?.statusText,
    url: error.config?.url,
    method: error.config?.method,
    timeout: error.code === 'ECONNABORTED',
    networkError: !error.response
  });
  
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || 'Server error occurred';
    return {
      message,
      status: error.response.status,
      data: error.response.data,
      type: 'server_error'
    };
  } else if (error.request) {
    // Request was made but no response (network error or timeout)
    const isTimeout = error.code === 'ECONNABORTED';
    return {
      message: isTimeout 
        ? 'Request timed out. The server might be waking up from sleep mode.'
        : 'Network error. Please check your connection.',
      status: 0,
      data: null,
      type: isTimeout ? 'timeout' : 'network_error'
    };
  } else {
    // Something else happened
    return {
      message: error.message || 'An unexpected error occurred',
      status: 0,
      data: null,
      type: 'unknown_error'
    };
  }
};

// Test API connection with better error handling
export const testConnection = async () => {
  try {
    console.log('🔍 Testing API connection...');
    const response = await healthAPI.check();
    console.log('✅ API Connection successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    const errorDetails = handleApiError(error);
    console.error('❌ API Connection failed:', errorDetails);
    return { success: false, error: errorDetails };
  }
};

// Wake up the server (useful for Render cold starts)
export const wakeUpServer = async () => {
  try {
    console.log('🌅 Waking up server...');
    await testConnection();
    console.log('✅ Server is awake!');
    return true;
  } catch (error) {
    console.error('❌ Failed to wake up server:', error);
    return false;
  }
};

export default api;