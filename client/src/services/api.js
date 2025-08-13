// client/src/services/api.js - COMPLETE with all API exports (FULLY FIXED)
import axios from 'axios';

// ✅ Environment-based API URL configuration
const getBaseURL = () => {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.REACT_APP_API_URL) {
      throw new Error('REACT_APP_API_URL is required in production');
    }
    return process.env.REACT_APP_API_URL;
  }

  // Development fallback
  return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
};

// ✅ Get the base URL and export it
export const API_BASE_URL = getBaseURL();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ✅ Expose to window AFTER api is created
if (process.env.NODE_ENV === 'development') {
  window.__API_BASE_URL__ = API_BASE_URL;
  window.__api = api;
  console.log('🔧 API Base URL exposed for debugging:', API_BASE_URL);
  console.log('🔧 API instance exposed as window.__api');
}

// ===== PET API =====
export const petAPI = {
  // Get all pets
  getAllPets: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    const queryString = searchParams.toString();
    const url = queryString ? `/pets?${queryString}` : '/pets';
    return api.get(url);
  },

  // Get featured pets
  getFeaturedPets: (limit = 6) => {
    return api.get(`/pets?featured=true&limit=${limit}`);
  },

  // Get pet by ID
  getPetById: (id) => {
    return api.get(`/pets/${id}`);
  },

  // Create pet (admin)
  createPet: (petData) => {
    return api.post('/pets', petData);
  },

  // Update pet (admin)
  updatePet: (id, petData) => {
    return api.put(`/pets/${id}`, petData);
  },

  // Delete pet (admin)
  deletePet: (id) => {
    return api.delete(`/pets/${id}`);
  },

  // Rate pet
  ratePet: (id, rating) => {
    return api.post(`/pets/${id}/rate`, { rating });
  },

  // Add to favorites
  addToFavorites: (petId) => {
    return api.post(`/pets/${petId}/favorite`);
  },

  // Remove from favorites
  removeFromFavorites: (petId) => {
    return api.delete(`/pets/${petId}/favorite`);
  },

  // Get filtered pets
  getFilteredPets: (queryString) => {
    return api.get(`/pets?${queryString}`);
  }
};

// ===== PRODUCT API =====
export const productAPI = {
  // Get all products
  getAllProducts: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    const queryString = searchParams.toString();
    const url = queryString ? `/products?${queryString}` : '/products';
    return api.get(url);
  },

  // Get featured products
  getFeaturedProducts: (limit = 6) => {
    return api.get(`/products?featured=true&limit=${limit}`);
  },

  // Get product by ID
  getProductById: (id) => {
    return api.get(`/products/${id}`);
  },

  // Get product categories
  getProductCategories: () => {
    return api.get('/products/categories');
  },

  // Get product brands
  getProductBrands: () => {
    return api.get('/products/brands');
  },

  // Search products
  searchProducts: (query, params = {}) => {
    const searchParams = new URLSearchParams({ search: query, ...params });
    return api.get(`/products?${searchParams.toString()}`);
  },

  // Get products by category
  getProductsByCategory: (category, params = {}) => {
    const searchParams = new URLSearchParams({ category, ...params });
    return api.get(`/products?${searchParams.toString()}`);
  },

  // Get products by brand
  getProductsByBrand: (brand, params = {}) => {
    const searchParams = new URLSearchParams({ brand, ...params });
    return api.get(`/products?${searchParams.toString()}`);
  },

  // Get products in price range
  getProductsByPriceRange: (minPrice, maxPrice, params = {}) => {
    const searchParams = new URLSearchParams({ 
      minPrice: minPrice.toString(), 
      maxPrice: maxPrice.toString(), 
      ...params 
    });
    return api.get(`/products?${searchParams.toString()}`);
  },

  // Admin functions
  createProduct: (productData) => {
    return api.post('/products', productData);
  },

  updateProduct: (id, productData) => {
    return api.put(`/products/${id}`, productData);
  },

  deleteProduct: (id) => {
    return api.delete(`/products/${id}`);
  },

  // Rate product
  rateProduct: (id, rating) => {
    return api.post(`/products/${id}/rate`, { rating });
  },

  // Add to wishlist
  addToWishlist: (productId) => {
    return api.post(`/products/${productId}/wishlist`);
  },

  // Remove from wishlist
  removeFromWishlist: (productId) => {
    return api.delete(`/products/${productId}/wishlist`);
  }
};

// ===== NEWS API =====
export const newsAPI = {
  // Get all news
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

  // Get featured news
  getFeaturedNews: (limit = 3) => {
    return api.get(`/news?featured=true&limit=${limit}`);
  },

  // Get news by ID
  getNewsById: (id) => {
    return api.get(`/news/${id}`);
  },

  // Create news (admin)
  createNews: (newsData) => {
    return api.post('/news', newsData);
  },

  // Update news (admin)
  updateNews: (id, newsData) => {
    return api.put(`/news/${id}`, newsData);
  },

  // Delete news (admin)
  deleteNews: (id) => {
    return api.delete(`/news/${id}`);
  },

  // Get distinct news categories
  getCategories: () => {
    return api.get('/news/categories');
  },

  // Get custom news (admin dashboard)
  getCustomNews: () => {
    return api.get('/news/custom');
  }
};

// ===== USER API =====
export const userAPI = {
  // Register
  register: (userData) => {
    return api.post('/auth/register', userData);
  },

  // Login
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },

  // Get profile
  getProfile: () => {
    return api.get('/users/profile');
  },

  // Update profile
  updateProfile: (profileData) => {
    return api.put('/users/profile', profileData);
  },

  // Change password
  changePassword: (passwordData) => {
    return api.put('/users/change-password', passwordData);
  },

  // Forgot password
  forgotPassword: (email) => {
    return api.post('/users/forgot-password', { email });
  },

  // Reset password
  resetPassword: (token, newPassword) => {
    return api.post('/users/reset-password', { token, password: newPassword });
  }
};

// ===== CONTACT API =====
export const contactAPI = {
  // Send contact message
  sendMessage: (messageData) => {
    return api.post('/contact', messageData);
  },

  // Get contact messages (admin)
  getMessages: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    const queryString = searchParams.toString();
    const url = queryString ? `/contact?${queryString}` : '/contact';
    return api.get(url);
  },

  // Mark message as read (admin)
  markAsRead: (id) => {
    return api.patch(`/contact/${id}/read`);
  },

  // Delete message (admin)
  deleteMessage: (id) => {
    return api.delete(`/contact/${id}`);
  }
};

// ===== ADMIN API =====
export const adminAPI = {
  // Dashboard stats
  getDashboardStats: () => {
    return api.get('/admin/dashboard');
  },

  // Analytics
  getAnalytics: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    const queryString = searchParams.toString();
    const url = queryString ? `/admin/analytics?${queryString}` : '/admin/analytics';
    return api.get(url);
  },

  // User management
  getAllUsers: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    const queryString = searchParams.toString();
    const url = queryString ? `/admin/users?${queryString}` : '/admin/users';
    return api.get(url);
  },

  updateUser: (id, userData) => {
    return api.put(`/admin/users/${id}`, userData);
  },

  deleteUser: (id) => {
    return api.delete(`/admin/users/${id}`);
  },

  // System settings
  getSettings: () => {
    return api.get('/admin/settings');
  },

  updateSettings: (settings) => {
    return api.put('/admin/settings', settings);
  }
};

// Default export
export default api;