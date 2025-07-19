// client/src/services/api.js - FIXED for CORS
import axios from 'axios';

// ✅ FIXED: Ensure correct backend URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://new-capstone.onrender.com/api'  // ✅ Your actual backend URL
  : 'http://localhost:5000/api';

console.log(`🔗 API Base URL: ${API_BASE_URL}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV}`);

// ✅ ENHANCED: Create axios instance with CORS-friendly configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true  // ✅ ADDED: Enable credentials for CORS
});

// ✅ ENHANCED: Request interceptor with better logging
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
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

// ✅ ENHANCED: Response interceptor with CORS error handling
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
    
    // ✅ CORS Error Handling
    if (error.message.includes('CORS') || error.message.includes('Network Error')) {
      console.error('🚫 CORS Error detected:', {
        frontend: window.location.origin,
        backend: API_BASE_URL,
        suggestion: 'Check backend CORS configuration'
      });
    }
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      console.log('🔐 Token removed due to 401 error');
    }
    
    return Promise.reject(error);
  }
);

// ===== TEST ENDPOINT =====
export const testAPI = {
  // ✅ CORS Test endpoint
  testCORS: () => {
    console.log('🧪 Testing CORS connection...');
    return api.get('/health');
  }
};

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
    
    console.log(`🐾 Fetching pets: ${url}`);
    return api.get(url);
  },

  getFeaturedPets: (limit = 4) => {
    console.log(`🌟 Fetching ${limit} featured pets...`);
    return api.get(`/pets/featured?limit=${limit}`);
  },

  getPetById: (id) => {
    console.log(`🐾 Fetching pet: ${id}`);
    return api.get(`/pets/${id}`);
  },

  ratePet: (petId, rating) => {
    console.log(`❤️ Rating pet ${petId}: ${rating}`);
    return api.post(`/pets/${petId}/rate`, { rating });
  }
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
    
    console.log(`🛍️ Fetching products: ${url}`);
    return api.get(url);
  },

  getFeaturedProducts: (limit = 4) => {
    console.log(`🌟 Fetching ${limit} featured products...`);
    return api.get(`/products/featured?limit=${limit}`);
  },

  getProductById: (id) => {
    console.log(`🛍️ Fetching product: ${id}`);
    return api.get(`/products/${id}`);
  },

  getProductCategories: () => {
    console.log(`📂 Fetching product categories...`);
    return api.get('/products/categories');
  },

  getProductBrands: () => {
    console.log(`🏷️ Fetching product brands...`);
    return api.get('/products/brands');
  }
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
    
    console.log(`📰 Fetching all news: ${url}`);
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
    
    console.log(`🌐 Fetching external news: ${url}`);
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
    
    console.log(`📝 Fetching custom news: ${url}`);
    return api.get(url);
  },

  checkNewsHealth: () => {
    console.log(`🏥 Checking news service health...`);
    return api.get('/news/health');
  }
};

// ===== USER API =====
export const userAPI = {
  login: (credentials) => {
    console.log(`🔐 User login attempt...`);
    return api.post('/users/login', credentials);
  },

  register: (userData) => {
    console.log(`📝 User registration attempt...`);
    return api.post('/users/register', userData);
  },

  getProfile: () => {
    console.log(`👤 Fetching user profile...`);
    return api.get('/users/profile');
  }
};

// ===== CONTACT API =====
export const contactAPI = {
  submitMessage: (messageData) => {
    console.log(`📧 Submitting contact message...`);
    return api.post('/contact', messageData);
  }
};

// ===== HEALTH CHECK =====
export const healthAPI = {
  checkApiHealth: () => {
    console.log(`🏥 Checking API health...`);
    return api.get('/health');
  }
};

export default api;