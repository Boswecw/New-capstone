// client/src/services/api.js - FIXED VERSION
import axios from 'axios';

/**
 * API Base URL Configuration
 * For Create React App (not Vite), use REACT_APP_ prefix
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? '/api'  // Use relative path in production
    : 'http://localhost:5000/api'  // Development default
  );

console.log('🔧 API Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  API_BASE_URL: API_BASE_URL
});

/**
 * Main API instance
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor for auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`🌐 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('🚨 Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    const method = error.config?.method?.toUpperCase() || 'REQUEST';
    const url = error.config?.url || 'unknown';
    const status = error.response?.status || 'NETWORK_ERROR';
    
    console.error(`❌ ${method} ${url} - ${status}`, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Clean up parameters before sending to API
 */
function cleanParams(params = {}) {
  const cleaned = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      cleaned[key] = value;
    }
  });
  return cleaned;
}

/* =========================
 *        AUTH API
 * ========================= */
export const authAPI = {
  login(data) {
    return api.post('/auth/login', data);
  },
  register(data) {
    return api.post('/auth/register', data);
  },
  me() {
    return api.get('/auth/me');
  },
  logout() {
    return api.post('/auth/logout');
  },
};

/* =========================
 *        PETS API
 * ========================= */
export const petAPI = {
  /**
   * Get all pets with optional filters
   */
  getAllPets(params = {}) {
    return api.get('/pets', { params: cleanParams(params) });
  },

  /**
   * Get featured pets - this endpoint should work now
   */
  getFeaturedPets(limit = 6) {
    return api.get('/pets/featured', { params: { limit } });
  },

  /**
   * Alternative: Get featured pets using query parameter
   */
  getFeaturedPetsAlt(limit = 6) {
    return api.get('/pets', { params: { featured: true, limit } });
  },

  /**
   * Get single pet by ID
   */
  getPetById(id) {
    return api.get(`/pets/${id}`);
  },

  /**
   * Rate a pet
   */
  ratePet(id, rating) {
    return api.post(`/pets/${id}/rate`, { rating });
  },

  // Admin endpoints
  createPet(data) {
    return api.post('/pets', data);
  },
  updatePet(id, data) {
    return api.put(`/pets/${id}`, data);
  },
  deletePet(id) {
    return api.delete(`/pets/${id}`);
  },
};

/* =========================
 *      PRODUCTS API
 * ========================= */
export const productAPI = {
  /**
   * Get all products with optional filters
   */
  getAllProducts(params = {}) {
    return api.get('/products', { params: cleanParams(params) });
  },

  /**
   * Get featured products
   */
  getFeaturedProducts(limit = 6) {
    return api.get('/products/featured', { params: { limit } });
  },

  /**
   * Alternative: Get featured products using query parameter
   */
  getFeaturedProductsAlt(limit = 6) {
    return api.get('/products', { params: { featured: true, limit } });
  },

  /**
   * Get single product by ID
   */
  getProductById(id) {
    return api.get(`/products/${id}`);
  },
};

/* =========================
 *        CART API
 * ========================= */
export const cartAPI = {
  /**
   * Get cart for session
   */
  getCart(sessionId) {
    return api.get('/cart', { params: { sessionId } });
  },

  /**
   * Add item to cart
   */
  addToCart(sessionId, item) {
    return api.post('/cart', { sessionId, ...item });
  },

  /**
   * Update cart item
   */
  updateCartItem(sessionId, itemId, updates) {
    return api.put(`/cart/${itemId}`, { sessionId, ...updates });
  },

  /**
   * Remove item from cart
   */
  removeFromCart(sessionId, itemId) {
    return api.delete(`/cart/${itemId}`, { params: { sessionId } });
  },
};

/* =========================
 *        NEWS API
 * ========================= */
// Add this to your newsAPI object in client/src/services/api.js

export const newsAPI = {
  /**
   * Get all news articles with optional filters
   */
  getAllNews(params = {}) {
    return api.get('/news', { params: cleanParams(params) });
  },

  /**
   * Get news categories - ADDED METHOD
   */
  getCategories() {
    return api.get('/news/categories');
  },

  /**
   * Get featured news articles
   */
  getFeaturedNews(limit = 3) {
    return api.get('/news/featured', { params: { limit } });
  },

  /**
   * Alternative: Get featured news using query parameter
   */
  getFeaturedNewsAlt(limit = 3) {
    return api.get('/news', { params: { featured: true, limit } });
  },

  /**
   * Get single news article by ID
   */
  getNewsById(id) {
    return api.get(`/news/${id}`);
  },

  /**
   * Legacy method aliases for backward compatibility
   */
  getNews(params = {}) {
    return this.getAllNews(params);
  },

  // Admin endpoints
  createNews(data) {
    return api.post('/news', data);
  },
  updateNews(id, data) {
    return api.put(`/news/${id}`, data);
  },
  deleteNews(id) {
    return api.delete(`/news/${id}`);
  },
};

/* =========================
 *      CONTACT API
 * ========================= */
export const contactAPI = {
  sendMessage(data) {
    return api.post('/contact', data);
  },
};

/* =========================
 *         DEBUG
 * ========================= */
if (typeof window !== 'undefined') {
  console.log('🔧 API Base URL exposed for debugging:', API_BASE_URL);
  console.log('🔧 API instance exposed as window.__api');
  window.__api = api;
}

export default api;