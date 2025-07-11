// client/src/services/api.js - COMPLETE FIXED VERSION FOR RENDER
import axios from 'axios';

// ===== API BASE CONFIGURATION =====
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://furbabies-backend.onrender.com/api';

console.log('🔧 FurBabies API_BASE_URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const endpoint = response.config.url?.replace(response.config.baseURL, '') || '';
    console.log(`✅ API Success: ${response.status} ${endpoint}`);
    console.log('📦 Response Data:', response.data);
    return response;
  },
  (error) => {
    const endpoint = error.config?.url?.replace(error.config?.baseURL, '') || 'unknown';
    console.error(`❌ API Error: ${error.response?.status || 'Network'} ${endpoint}`, error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
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

  // ✅ CORRECTED: Uses /pets endpoint with featured filter instead of /pets/featured
  getFeaturedPets: (params = {}) => {
    const queryParams = { 
      featured: 'true', 
      limit: 4, 
      ...params 
    };
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

  // ✅ CORRECTED: Uses /products endpoint with featured filter instead of /products/featured
  getFeaturedProducts: (params = {}) => {
    const queryParams = { 
      featured: 'true', 
      limit: 3, 
      ...params 
    };
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

// ===== USER API =====
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

// ===== CONTACT API =====
export const contactAPI = {
  sendMessage: (messageData) => {
    console.log('📧 contactAPI.sendMessage called');
    return api.post('/contact', messageData);
  }
};

// ===== NEWS API =====
export const newsAPI = {
  getAllNews: (params = {}) => {
    console.log('📰 newsAPI.getAllNews called with params:', params);
    return api.get('/news', { params });
  },

  getNewsById: (id) => {
    if (!id) {
      console.error('❌ newsAPI.getNewsById: News ID is required');
      return Promise.reject(new Error('News ID is required'));
    }
    console.log('📰 newsAPI.getNewsById called with ID:', id);
    return api.get(`/news/${id}`);
  },

  getNewsCategories: () => {
    console.log('📰 newsAPI.getNewsCategories called');
    return api.get('/news/categories');
  }
};

// ===== HEALTH CHECK =====
export const healthAPI = {
  check: () => {
    console.log('🩺 healthAPI.check called');
    return api.get('/health');
  }
};

// Export the default axios instance for custom requests
export default api;