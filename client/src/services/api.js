// client/src/services/api.js - FIXED VERSION
import axios from 'axios';

// Create axios instance with improved configuration
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://furbabies-backend.onrender.com/api'
    : 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Increased to 15 seconds
  retry: 2, // Maximum 2 retries
  retryDelay: 1000, // 1 second between retries
});

// Enhanced request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add retry count to config
    config.retryCount = config.retryCount || 0;
    
    console.log(`🔧 API Request: ${config.method?.toUpperCase()} ${config.url} (attempt ${config.retryCount + 1})`);
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with retry logic
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Success: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const { config } = error;
    
    // Don't retry if we don't have a config or already exceeded retries
    if (!config || config.retryCount >= (config.retry || 2)) {
      console.error(`❌ API Error (final): ${config?.method?.toUpperCase()} ${config?.url}`, error.message);
      
      // Handle auth errors
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }

    // Increment retry count
    config.retryCount++;
    
    // Only retry on network errors or 5xx server errors
    const shouldRetry = (
      !error.response || // Network error
      error.response.status >= 500 || // Server error
      error.code === 'ECONNABORTED' // Timeout
    );

    if (shouldRetry) {
      console.warn(`⚠️ Retrying API call: ${config.method?.toUpperCase()} ${config.url} (attempt ${config.retryCount + 1})`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, config.retryDelay || 1000));
      
      return api.request(config);
    }

    console.error(`❌ API Error (no retry): ${config.method?.toUpperCase()} ${config.url}`, error.message);
    return Promise.reject(error);
  }
);

// ===== PET API =====
export const petAPI = {
  getAllPets: async (params = {}) => {
    try {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          searchParams.append(key, params[key]);
        }
      });
      
      console.log('🐕 Fetching pets with params:', params);
      const response = await api.get(`/pets?${searchParams}`);
      
      return response;
    } catch (error) {
      console.error('❌ petAPI.getAllPets error:', error);
      throw error;
    }
  },
  
  getPetById: async (id) => {
    try {
      console.log(`🐕 Fetching pet: ${id}`);
      const response = await api.get(`/pets/${id}`);
      return response;
    } catch (error) {
      console.error(`❌ petAPI.getPetById error for ${id}:`, error);
      throw error;
    }
  },
  
  createPet: (petData) => api.post('/pets', petData),
  updatePet: (id, petData) => api.put(`/pets/${id}`, petData),
  deletePet: (id) => api.delete(`/pets/${id}`),
};

// ===== PRODUCT API =====
export const productAPI = {
  getAllProducts: async (params = {}) => {
    try {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          searchParams.append(key, params[key]);
        }
      });
      
      console.log('🛒 Fetching products with params:', params);
      const response = await api.get(`/products?${searchParams}`);
      
      return response;
    } catch (error) {
      console.error('❌ productAPI.getAllProducts error:', error);
      throw error;
    }
  },
  
  getProductById: (id) => api.get(`/products/${id}`),
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

// ===== NEWS API =====
export const newsAPI = {
  getAllNews: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    return api.get(`/news?${searchParams}`);
  },
  
  getNewsById: (id) => api.get(`/news/${id}`),
  
  getFeaturedNews: async (limit = 5) => {
    try {
      console.log(`📰 Fetching featured news (limit: ${limit})`);
      const response = await api.get(`/news/featured?limit=${limit}`);
      return response;
    } catch (error) {
      console.error('❌ newsAPI.getFeaturedNews error:', error);
      throw error;
    }
  },
  
  getNewsCategories: () => api.get('/news/categories'),
  getNewsByCategory: (category, params = {}) => {
    const searchParams = new URLSearchParams({ category, ...params });
    return api.get(`/news/category/${category}?${searchParams}`);
  },
};

// ===== UTILITY FUNCTIONS =====
export const handleApiError = (error) => {
  console.error('🔧 API Error Handler:', error);
  
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || `Server error: ${error.response.status}`;
    return {
      message,
      status: error.response.status,
      data: error.response.data
    };
  } else if (error.request) {
    // Request was made but no response (network error)
    return {
      message: 'Network error. Please check your connection and try again.',
      status: 0,
      data: null
    };
  } else {
    // Something else happened
    return {
      message: error.message || 'An unexpected error occurred',
      status: 0,
      data: null
    };
  }
};

// Test API connection
export const testConnection = async () => {
  try {
    console.log('🔧 Testing API connection...');
    const response = await api.get('/health');
    console.log('✅ API Connection successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ API Connection failed:', error);
    return { success: false, error: handleApiError(error) };
  }
};

// Default export for backward compatibility
export default api;