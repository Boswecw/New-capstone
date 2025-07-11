// client/src/services/api.js 
import axios from 'axios';

// ✅ FIXED: Safe API URL detection that works in production
const getApiBaseUrl = () => {
  // Check if we're in production on Render
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Production: if frontend is on Render, use production backend
    if (hostname.includes('onrender.com')) {
      // ⚠️ REPLACE 'new-capstone-backend' with your actual backend service name from Render
      return 'https://furbabies-backend.onrender.com/api';
    }
  }
  
  // Development: use localhost
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔧 New-Capstone API_BASE_URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor with detailed logging
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('🔴 API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with detailed logging
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Success: ${response.status} ${response.config.url}`);
    console.log('📦 Response Data:', response.data);
    return response;
  },
  (error) => {
    console.error(`❌ API Error: ${error.response?.status || 'Network'} ${error.config?.url}`);
    console.error('📦 Error Details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// ===== PET API =====
export const petAPI = {
  getAllPets: (params = {}) => {
    console.log('🐕 petAPI.getAllPets called with params:', params);
    return api.get('/pets', { params });
  },

  getPetById: (id) => {
    if (!id) {
      console.error('❌ petAPI.getPetById: Pet ID is required');
      return Promise.reject(new Error('Pet ID is required'));
    }
    console.log('🐕 petAPI.getPetById called with ID:', id);
    return api.get(`/pets/${id}`);
  },

  getFeaturedPets: (params = {}) => {
    const queryParams = { limit: 6, featured: true, ...params };
    console.log('🐕 petAPI.getFeaturedPets called with params:', queryParams);
    return api.get('/pets', { params: queryParams });
  },

  searchPets: (query, filters = {}) => {
    console.log('🐕 petAPI.searchPets called:', { query, filters });
    return api.get('/pets', { params: { search: query, ...filters } });
  },

  getPetsByCategory: (category, params = {}) => {
    console.log('🐕 petAPI.getPetsByCategory called:', { category, params });
    return api.get('/pets', { params: { category, ...params } });
  }
};

// ===== PRODUCT API =====
export const productAPI = {
  getAllProducts: (params = {}) => {
    console.log('🛍️ productAPI.getAllProducts called with params:', params);
    return api.get('/products', { params });
  },

  getProductById: (id) => {
    if (!id) {
      console.error('❌ productAPI.getProductById: Product ID is required');
      return Promise.reject(new Error('Product ID is required'));
    }
    console.log('🛍️ productAPI.getProductById called with ID:', id);
    return api.get(`/products/${id}`);
  },

  getFeaturedProducts: (params = {}) => {
    const queryParams = { limit: 6, featured: true, ...params };
    console.log('🛍️ productAPI.getFeaturedProducts called with params:', queryParams);
    return api.get('/products', { params: queryParams });
  },

  searchProducts: (query, filters = {}) => {
    console.log('🛍️ productAPI.searchProducts called:', { query, filters });
    return api.get('/products', { params: { search: query, ...filters } });
  },

  getProductsByCategory: (category, params = {}) => {
    console.log('🛍️ productAPI.getProductsByCategory called:', { category, params });
    return api.get('/products', { params: { category, ...params } });
  }
};

// ===== OTHER APIS =====
export const userAPI = {
  register: (userData) => {
    console.log('👤 userAPI.register called');
    return api.post('/users/register', userData);
  },
  
  login: (credentials) => {
    console.log('👤 userAPI.login called');
    return api.post('/users/login', credentials);
  },
  
  getProfile: () => {
    console.log('👤 userAPI.getProfile called');
    return api.get('/users/profile');
  },
  
  updateProfile: (userData) => {
    console.log('👤 userAPI.updateProfile called');
    return api.put('/users/profile', userData);
  }
};

export const contactAPI = {
  sendMessage: (messageData) => {
    console.log('📧 contactAPI.sendMessage called');
    return api.post('/contact', messageData);
  }
};

export default api;