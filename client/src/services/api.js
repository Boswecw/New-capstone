// client/src/services/api.js - FIXED API Configuration for Dual Deployment
import axios from 'axios';

// ✅ FIXED: Proper API base URL for dual deployment
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://new-capstone.onrender.com/api'  // Your backend URL
  : 'http://localhost:5000/api';

console.log(`🔗 API Base URL: ${API_BASE_URL}`);

// ✅ Create axios instance with proper timeout and headers
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// ✅ Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// ✅ Response interceptor with better error handling
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
      method: error.config?.method
    });
    return Promise.reject(error);
  }
);

// ===== PRODUCT API - FIXED =====
export const productAPI = {
  // ✅ FIXED: Get all products
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

  // ✅ FIXED: Get featured products - THIS WAS MISSING
  getFeaturedProducts: (limit = 4) => {
    console.log(`🌟 Fetching ${limit} featured products...`);
    return api.get(`/products/featured?limit=${limit}`);
  },

  // ✅ Get single product
  getProductById: (id) => {
    console.log(`🛍️ Fetching product: ${id}`);
    return api.get(`/products/${id}`);
  },

  // ✅ Get product categories
  getProductCategories: () => {
    console.log(`📂 Fetching product categories...`);
    return api.get('/products/categories');
  },

  // ✅ Get product brands
  getProductBrands: () => {
    console.log(`🏷️ Fetching product brands...`);
    return api.get('/products/brands');
  }
};

// ===== PET API - VERIFIED =====
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

// ===== NEWS API - VERIFIED =====
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

  // ✅ FIXED: External news only (for New.js)
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

// ===== IMAGE API =====
export const imageAPI = {
  getImageHealth: () => {
    console.log(`🖼️ Checking image service health...`);
    return api.get('/images/health');
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