// client/src/services/api.js - UPDATED FOR CORS FIX ✅
import axios from 'axios';

// ✅ FIXED: Use correct backend URL for production
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://furbabies-backend.onrender.com/api'  // ✅ Corrected backend
  : 'http://localhost:5000/api';

console.log(`🔗 API Base URL: ${API_BASE_URL}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV}`);

// ===== CREATE AXIOS INSTANCE =====
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false
});

// ===== REQUEST INTERCEPTOR =====
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    console.log(`🎯 Full URL: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// ===== RESPONSE INTERCEPTOR =====
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
      method: error.config?.method,
      corsError: error.message.includes('CORS') || error.message.includes('Network Error')
    });

    if (error.message.includes('CORS') || error.message.includes('Network Error')) {
      console.error('🚫 CORS Error detected:', {
        frontend: window.location.origin,
        backend: API_BASE_URL,
        suggestion: 'Backend CORS not configured for this frontend domain'
      });
    }

    return Promise.reject(error);
  }
);

// ===== PET API =====
export const petAPI = {
  getAllPets: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '' && params[key] !== 'all') {
        searchParams.append(key, params[key]);
      }
    });

    const queryString = searchParams.toString();
    const url = queryString ? `/pets?${queryString}` : '/pets';
    return api.get(url);
  },

  getFeaturedPets: (limit = 4) => {
    console.log(`🌟 Fetching ${limit} featured pets...`);
    return api.get(`/pets/featured?limit=${limit}`);
  },

  getPetById: (id) => api.get(`/pets/${id}`),
  ratePet: (petId, rating) => api.post(`/pets/${petId}/rate`, { rating })
};

// ===== PRODUCT API =====
export const productAPI = {
  getAllProducts: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '' && params[key] !== 'all') {
        searchParams.append(key, params[key]);
      }
    });

    const queryString = searchParams.toString();
    const url = queryString ? `/products?${queryString}` : '/products';
    return api.get(url);
  },

  getFeaturedProducts: (limit = 4) => {
    console.log(`🌟 Fetching ${limit} featured products...`);
    return api.get(`/products/featured?limit=${limit}`);
  },

  getProductById: (id) => api.get(`/products/${id}`),
  getProductCategories: () => api.get('/products/categories'),
  getProductBrands: () => api.get('/products/brands')
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

    const queryString = searchParams.toString();
    const url = queryString ? `/news?${queryString}` : '/news';
    return api.get(url);
  },

  getFeaturedNews: (limit = 6) => {
    console.log(`🌟 Fetching ${limit} featured news articles...`);
    return api.get(`/news/featured?limit=${limit}`);
  },

  getExternalNews: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });

    const queryString = searchParams.toString();
    const url = queryString ? `/news/external?${queryString}` : '/news/external';
    return api.get(url);
  },

  getCustomNews: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });

    const queryString = searchParams.toString();
    const url = queryString ? `/news/custom?${queryString}` : '/news/custom';
    return api.get(url);
  },

  checkNewsHealth: () => api.get('/news/health')
};

// ===== USER API =====
export const userAPI = {
  login: (credentials) => api.post('/users/login', credentials),
  register: (userData) => api.post('/users/register', userData),
  getProfile: () => api.get('/users/profile')
};

// ===== CONTACT API =====
export const contactAPI = {
  submitMessage: (messageData) => api.post('/contact', messageData)
};

// ===== HEALTH CHECK =====
export const healthAPI = {
  checkApiHealth: () => api.get('/health')
};

// ===== TEST CORS FUNCTION =====
export const testCORS = async () => {
  try {
    console.log('🧪 Testing CORS connection...');
    const response = await api.get('/health');
    console.log('✅ CORS Test Success:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ CORS Test Failed:', error);
    return { success: false, error: error.message };
  }
};

export default api;
