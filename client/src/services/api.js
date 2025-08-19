// client/src/services/api.js - COMPLETE FIXED VERSION
import axios from 'axios';

/**
 * API Base URL Configuration
 * For Create React App (not Vite), use REACT_APP_ prefix
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://furbabies-backend.onrender.com/api'  // Production URL
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
const api = axios.create({
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
    
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with improved error handling
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    
    // Handle different error scenarios
    if (error.response) {
      const { status, data } = error.response;
      
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ API Error:', {
          status,
          message: data?.message || error.message,
          url: originalRequest?.url,
          baseURL: originalRequest?.baseURL
        });
      }
      
      // Handle 401 errors (but don't auto-logout from API level)
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        // Only clear token if it's definitely invalid
        const authHeader = originalRequest.headers?.Authorization;
        if (authHeader && authHeader !== 'Bearer null') {
          console.log('🚪 401 Error - Invalid token detected');
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
        }
      }
    } else if (error.request) {
      console.error('❌ Network Error:', error.message);
    } else {
      console.error('❌ Request Setup Error:', error.message);
    }
    
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
 *        USER/AUTH API
 * ========================= */
export const userAPI = {
  // Authentication endpoints (matching your backend routes)
  login(data) {
    return api.post('/users/login', data);
  },
  register(data) {
    return api.post('/users/register', data);
  },
  getProfile() {
    return api.get('/users/profile');
  },
  updateProfile(data) {
    return api.put('/users/profile', data);
  },
  changePassword(data) {
    return api.put('/users/change-password', data);
  },
  
  // Favorites
  getFavorites() {
    return api.get('/users/favorites');
  },
  addToFavorites(petId) {
    return api.post(`/users/favorites/${petId}`);
  },
  removeFromFavorites(petId) {
    return api.delete(`/users/favorites/${petId}`);
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
   * Get featured pets
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
export const newsAPI = {
  /**
   * Get all news articles with optional filters
   */
  getAllNews(params = {}) {
    return api.get('/news', { params: cleanParams(params) });
  },

  /**
   * Get news categories
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
 *      ADMIN API
 * ========================= */
export const adminAPI = {
  // Dashboard
  getDashboard() {
    return api.get('/admin/dashboard');
  },
  getStats() {
    return api.get('/admin/stats');
  },
  
  // Users Management
  getAllUsers(params = {}) {
    return api.get('/admin/users', { params: cleanParams(params) });
  },
  getUserById(id) {
    return api.get(`/admin/users/${id}`);
  },
  updateUser(id, data) {
    return api.put(`/admin/users/${id}`, data);
  },
  deleteUser(id) {
    return api.delete(`/admin/users/${id}`);
  },
  
  // Pets Management
  getAllPetsAdmin(params = {}) {
    return api.get('/admin/pets', { params: cleanParams(params) });
  },
  createPet(data) {
    return api.post('/admin/pets', data);
  },
  updatePet(id, data) {
    return api.put(`/admin/pets/${id}`, data);
  },
  deletePet(id) {
    return api.delete(`/admin/pets/${id}`);
  },
  adoptPet(id, userId) {
    return api.post(`/admin/pets/${id}/adopt`, { userId });
  },
};

/* =========================
 *         LEGACY EXPORTS
 * ========================= */
// Legacy authAPI for backward compatibility
export const authAPI = {
  login: userAPI.login,
  register: userAPI.register,
  me: userAPI.getProfile,
  logout: () => Promise.resolve({ data: { success: true } }), // Local logout
};

/* =========================
 *         DEBUG
 * ========================= */
if (typeof window !== 'undefined') {
  console.log('🔧 API Base URL exposed for debugging:', API_BASE_URL);
  console.log('🔧 API instance exposed as window.__api');
  window.__api = api;
  window.__userAPI = userAPI;
  window.__adminAPI = adminAPI;
}

/* =========================
 *         EXPORTS
 * ========================= */

// Named export for backward compatibility
export { api };

// Default export
export default api;