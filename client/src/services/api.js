// client/src/services/api.js - RENDER DEPLOYMENT FIXED
import axios from 'axios';

// ✅ RENDER FIX: Simple API base URL configuration
const getApiBaseUrl = () => {
  // Production (Render)
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_BASE_URL || 'https://new-capstone-backend.onrender.com/api';
  }
  
  // Development
  return process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔧 API Service Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  API_BASE_URL,
  REACT_APP_API_BASE_URL: process.env.REACT_APP_API_BASE_URL
});

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

  createPet: (petData) => {
    console.log('🐕 petAPI.createPet called');
    return api.post('/pets', petData);
  },

  updatePet: (id, petData) => {
    console.log('🐕 petAPI.updatePet called for ID:', id);
    return api.put(`/pets/${id}`, petData);
  },

  deletePet: (id) => {
    console.log('🐕 petAPI.deletePet called for ID:', id);
    return api.delete(`/pets/${id}`);
  }
};

// ===== USER API =====
export const userAPI = {
  register: (userData) => {
    console.log('👤 userAPI.register called');
    return api.post('/users/register', userData);
  },

  login: (credentials) => {
    console.log('🔐 userAPI.login called');
    return api.post('/users/login', credentials);
  },

  getProfile: () => {
    console.log('👤 userAPI.getProfile called');
    return api.get('/users/profile');
  },

  updateProfile: (profileData) => {
    console.log('👤 userAPI.updateProfile called');
    return api.put('/users/profile', profileData);
  },

  getFavorites: () => {
    console.log('❤️ userAPI.getFavorites called');
    return api.get('/users/favorites');
  },

  addToFavorites: (petId) => {
    console.log('❤️ userAPI.addToFavorites called for pet:', petId);
    return api.post(`/users/favorites/${petId}`);
  },

  removeFromFavorites: (petId) => {
    console.log('💔 userAPI.removeFromFavorites called for pet:', petId);
    return api.delete(`/users/favorites/${petId}`);
  }
};

// ===== ADMIN API =====
export const adminAPI = {
  getDashboard: () => {
    console.log('📊 adminAPI.getDashboard called');
    return api.get('/admin/dashboard');
  },

  getUsers: (params = {}) => {
    console.log('👥 adminAPI.getUsers called with params:', params);
    return api.get('/admin/users', { params });
  },

  updateUserRole: (userId, role) => {
    console.log('👑 adminAPI.updateUserRole called for user:', userId);
    return api.put(`/admin/users/${userId}/role`, { role });
  },

  updateUserStatus: (userId, isActive) => {
    console.log('🔄 adminAPI.updateUserStatus called for user:', userId);
    return api.put(`/admin/users/${userId}/status`, { isActive });
  },

  deleteUser: (userId) => {
    console.log('🗑️ adminAPI.deleteUser called for user:', userId);
    return api.delete(`/admin/users/${userId}`);
  },

  getPets: (params = {}) => {
    console.log('🐕 adminAPI.getPets called with params:', params);
    return api.get('/admin/pets', { params });
  },

  createPet: (petData) => {
    console.log('🐕 adminAPI.createPet called');
    return api.post('/admin/pets', petData);
  },

  updatePet: (petId, petData) => {
    console.log('🐕 adminAPI.updatePet called for pet:', petId);
    return api.put(`/admin/pets/${petId}`, petData);
  },

  deletePet: (petId) => {
    console.log('🗑️ adminAPI.deletePet called for pet:', petId);
    return api.delete(`/admin/pets/${petId}`);
  },

  // Product management
  getProducts: (params = {}) => {
    console.log('🛍️ adminAPI.getProducts called with params:', params);
    return api.get('/admin/products', { params });
  },

  createProduct: (productData) => {
    console.log('🛍️ adminAPI.createProduct called');
    return api.post('/admin/products', productData);
  },

  updateProduct: (productId, productData) => {
    console.log('🛍️ adminAPI.updateProduct called for product:', productId);
    return api.put(`/admin/products/${productId}`, productData);
  },

  deleteProduct: (productId) => {
    console.log('🗑️ adminAPI.deleteProduct called for product:', productId);
    return api.delete(`/admin/products/${productId}`);
  },

  // News management
  getNews: (params = {}) => {
    console.log('📰 adminAPI.getNews called with params:', params);
    return api.get('/admin/news', { params });
  },

  createNews: (newsData) => {
    console.log('📰 adminAPI.createNews called');
    return api.post('/admin/news', newsData);
  },

  updateNews: (newsId, newsData) => {
    console.log('📰 adminAPI.updateNews called for news:', newsId);
    return api.put(`/admin/news/${newsId}`, newsData);
  },

  deleteNews: (newsId) => {
    console.log('🗑️ adminAPI.deleteNews called for news:', newsId);
    return api.delete(`/admin/news/${newsId}`);
  },

  // Bulk operations
  bulkUpdatePetStatus: (petIds, status) => {
    console.log('🔄 adminAPI.bulkUpdatePetStatus called');
    return api.post('/admin/bulk/pets/status', { petIds, status });
  },

  bulkUpdateUserStatus: (userIds, isActive) => {
    console.log('🔄 adminAPI.bulkUpdateUserStatus called');
    return api.post('/admin/bulk/users/status', { userIds, isActive });
  },

  getContacts: (params = {}) => {
    console.log('📧 adminAPI.getContacts called with params:', params);
    return api.get('/admin/contacts', { params });
  },

  getContact: (contactId) => {
    console.log('📧 adminAPI.getContact called for contact:', contactId);
    return api.get(`/admin/contacts/${contactId}`);
  },

  updateContactStatus: (contactId, status) => {
    console.log('📧 adminAPI.updateContactStatus called for contact:', contactId);
    return api.put(`/admin/contacts/${contactId}/status`, { status });
  },

  respondToContact: (contactId, message) => {
    console.log('📧 adminAPI.respondToContact called for contact:', contactId);
    return api.put(`/admin/contacts/${contactId}/respond`, { message });
  },

  deleteContact: (contactId) => {
    console.log('🗑️ adminAPI.deleteContact called for contact:', contactId);
    return api.delete(`/admin/contacts/${contactId}`);
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

  createProduct: (productData) => {
    console.log('🛍️ productAPI.createProduct called');
    return api.post('/products', productData);
  },

  updateProduct: (id, productData) => {
    console.log('🛍️ productAPI.updateProduct called for ID:', id);
    return api.put(`/products/${id}`, productData);
  },

  deleteProduct: (id) => {
    console.log('🛍️ productAPI.deleteProduct called for ID:', id);
    return api.delete(`/products/${id}`);
  },

  getProductsByCategory: (category, params = {}) => {
    console.log('🛍️ productAPI.getProductsByCategory called for category:', category);
    return api.get('/products', { params: { ...params, category } });
  },

  searchProducts: (searchTerm, params = {}) => {
    console.log('🔍 productAPI.searchProducts called with term:', searchTerm);
    return api.get('/products', { params: { ...params, search: searchTerm } });
  },

  getFeaturedProducts: (limit = 6) => {
    console.log('⭐ productAPI.getFeaturedProducts called');
    return api.get('/products', { params: { featured: true, limit } });
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
    console.log('📂 newsAPI.getNewsCategories called');
    return api.get('/news/categories');
  },

  getNewsByCategory: (category, params = {}) => {
    console.log('📰 newsAPI.getNewsByCategory called for category:', category);
    return api.get('/news', { params: { ...params, category } });
  },

  getFeaturedNews: (limit = 3) => {
    console.log('⭐ newsAPI.getFeaturedNews called');
    return api.get('/news', { params: { featured: true, limit } });
  }
};

// ===== CONTACT API =====
export const contactAPI = {
  submitContact: (contactData) => {
    console.log('📧 contactAPI.submitContact called');
    return api.post('/contact', contactData);
  }
};

// ===== EXPORT DEFAULT =====
export default api;

// ===== EXPORT API BASE URL =====
export { API_BASE_URL };