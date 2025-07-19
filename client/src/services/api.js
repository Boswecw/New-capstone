// client/src/services/api.js - CONSOLIDATED API CONFIGURATION
import axios from 'axios';

// ✅ SINGLE SOURCE OF TRUTH: Use only your working backend
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://furbabies-backend.onrender.com/api'  // ✅ Your working backend
  : 'http://localhost:5000/api';

console.log('🔗 API Base URL:', API_BASE_URL);

// ✅ SINGLE AXIOS INSTANCE: All APIs use this same instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor with auth
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
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with better error handling
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
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    
    return Promise.reject(error);
  }
);

// ===== PET API =====
const petAPI = {
  getAllPets: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '' && params[key] !== 'all') {
        searchParams.append(key, params[key]);
      }
    });
    return api.get(`/pets?${searchParams}`);
  },
  getPetById: (id) => api.get(`/pets/${id}`),
  getFeaturedPets: (limit = 4) => {
    console.log(`🐾 Fetching ${limit} featured pets...`);
    return api.get(`/pets/featured?limit=${limit}`);
  },
  searchPets: (query, params = {}) => {
    const searchParams = new URLSearchParams({ search: query, ...params });
    return api.get(`/pets?${searchParams}`);
  },
  createPet: (petData) => api.post('/pets', petData),
  updatePet: (id, petData) => api.put(`/pets/${id}`, petData),
  deletePet: (id) => api.delete(`/pets/${id}`),
  ratePet: (id, payload) => api.post(`/pets/${id}/rate`, payload)
};

// ===== PRODUCT API =====
const productAPI = {
  getAllProducts: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '' && params[key] !== 'all') {
        searchParams.append(key, params[key]);
      }
    });
    return api.get(`/products?${searchParams}`);
  },
  getProductById: (id) => api.get(`/products/${id}`),
  getFeaturedProducts: (limit = 4) => {
    console.log(`🛒 Fetching ${limit} featured products...`);
    return api.get(`/products/featured?limit=${limit}`);
  },
  searchProducts: (query, params = {}) => {
    const searchParams = new URLSearchParams({ search: query, ...params });
    return api.get(`/products?${searchParams}`);
  },
  getProductsByCategory: (category, params = {}) => {
    const searchParams = new URLSearchParams({ category, ...params });
    return api.get(`/products?${searchParams}`);
  },
  getProductCategories: () => api.get('/products/meta/categories'),
  getProductBrands: () => api.get('/products/meta/brands'),
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`)
};

// ===== NEWS API - CONSOLIDATED =====
const newsAPI = {
  getFeaturedNews: (limit = 3) => {
    console.log(`📰 Fetching ${limit} featured news...`);
    return api.get(`/news/featured?limit=${limit}`);  // ✅ Uses same api instance
  },
  getAllNews: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return api.get(`/news?${searchParams}`);
  },
  getNewsById: (id) => api.get(`/news/${id}`),
  getCustomNews: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return api.get(`/news/custom?${searchParams}`);
  },
  getExternalNews: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return api.get(`/news/external?${searchParams}`);
  },
  getNewsHealth: () => api.get('/news/health')
};

// ===== USER API =====
const userAPI = {
  login: (credentials) => api.post('/users/login', credentials),
  register: (userData) => api.post('/users/register', userData),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData)
};

// ===== CONTACT API =====
const contactAPI = {
  submitContact: (contactData) => {
    console.log('📧 Submitting contact form...');
    return api.post('/contact', contactData);
  },
  getContactSubmissions: () => api.get('/contact'),
  updateContactSubmission: (id, data) => api.put(`/contact/${id}`, data)
};

// ===== IMAGE API =====
const imageAPI = {
  getImageHealth: () => api.get('/images/health'),
  getImageUrl: (imagePath, options = {}) => {
    if (!imagePath) return null;
    const baseUrl = `${API_BASE_URL}/images/gcs`;
    const params = new URLSearchParams(options);
    return `${baseUrl}/${imagePath}${params.toString() ? '?' + params.toString() : ''}`;
  },
  getFallbackImageUrl: (category = 'default') => {
    return `${API_BASE_URL}/images/fallback/${category}`;
  }
};

// ===== ADMIN API =====
const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getAllUsers: () => api.get('/admin/users'),
  getAllPetsAdmin: () => api.get('/admin/pets'),
  getAllProductsAdmin: () => api.get('/admin/products'),
  getAllContactsAdmin: () => api.get('/admin/contacts')
};

// ===== HEALTH API =====
const healthAPI = {
  getHealth: () => {
    console.log('🔍 Checking backend health...');
    return api.get('/health');
  }
};

// ===== EXPORTS =====
export {
  api,
  petAPI,
  productAPI,
  newsAPI,
  userAPI,
  contactAPI,
  imageAPI,
  adminAPI,
  healthAPI,
  API_BASE_URL
};

// Default export
const apiServices = {
  pets: petAPI,
  products: productAPI,
  news: newsAPI,
  users: userAPI,
  contact: contactAPI,
  images: imageAPI,
  admin: adminAPI,
  health: healthAPI
};

export default apiServices;