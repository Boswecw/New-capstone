// client/src/services/api.js - COMPLETE UPDATED VERSION WITH RANDOM ENDPOINTS
import axios from 'axios';

// ===== API CONFIGURATION =====
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://furbabies-backend.onrender.com/api';

console.log('🔧 API_BASE_URL:', API_BASE_URL);

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// ===== REQUEST INTERCEPTOR =====
api.interceptors.request.use(
  (config) => {
    console.log(`🔧 API Request: ${config.method?.toUpperCase()} ${config.url} (attempt 1)`);
    
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ===== RESPONSE INTERCEPTOR =====
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Success: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.data || error.message);
    
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Handle network errors with retry logic
    if (!error.response && error.config && !error.config.__isRetryRequest) {
      console.log('⚠️ Network error detected, retrying...');
      error.config.__isRetryRequest = true;
      
      // Wait 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        return await api.request(error.config);
      } catch (retryError) {
        console.error('❌ Retry failed:', retryError);
        return Promise.reject(retryError);
      }
    }
    
    return Promise.reject(error);
  }
);

// ===== PET API ENDPOINTS =====
export const petAPI = {
  // Get all pets with filtering and pagination
  getAllPets: (params = {}) => {
    console.log('🐕 Fetching pets with params:', params);
    return api.get('/pets', { params });
  },
  
  // Get single pet by ID
  getPetById: (id) => {
    console.log('🐕 Fetching pet by ID:', id);
    return api.get(`/pets/${id}`);
  },
  
  // ✅ NEW: Get random pets for home page
  getRandomPets: (limit = 4) => {
    console.log('🎲 Fetching random pets, limit:', limit);
    return api.get('/pets/random', { params: { limit } });
  },
  
  // Get featured pets
  getFeaturedPets: (limit = 10) => {
    console.log('🌟 Fetching featured pets, limit:', limit);
    return api.get('/pets', { params: { featured: true, limit } });
  },
  
  // Search pets
  searchPets: (searchParams) => {
    console.log('🔍 Searching pets with params:', searchParams);
    return api.get('/pets', { params: searchParams });
  },
  
  // Get pets by category
  getPetsByCategory: (category, limit = null) => {
    console.log('📂 Fetching pets by category:', category);
    const params = { category };
    if (limit) params.limit = limit;
    return api.get('/pets', { params });
  },
  
  // Get pets by type
  getPetsByType: (type, limit = null) => {
    console.log('🐾 Fetching pets by type:', type);
    const params = { type };
    if (limit) params.limit = limit;
    return api.get('/pets', { params });
  },
  
  // Admin functions (if needed)
  createPet: (petData) => {
    console.log('➕ Creating new pet');
    return api.post('/pets', petData);
  },
  
  updatePet: (id, petData) => {
    console.log('📝 Updating pet:', id);
    return api.put(`/pets/${id}`, petData);
  },
  
  deletePet: (id) => {
    console.log('🗑️ Deleting pet:', id);
    return api.delete(`/pets/${id}`);
  },
  
  // Favorites (if user system is implemented)
  addToFavorites: (petId) => {
    console.log('❤️ Adding pet to favorites:', petId);
    return api.post(`/users/favorites/${petId}`);
  },
  
  removeFromFavorites: (petId) => {
    console.log('💔 Removing pet from favorites:', petId);
    return api.delete(`/users/favorites/${petId}`);
  },
  
  getFavorites: () => {
    console.log('📋 Fetching user favorites');
    return api.get('/users/favorites');
  }
};

// ===== PRODUCT API ENDPOINTS =====
export const productAPI = {
  // Get all products with filtering and pagination
  getAllProducts: (params = {}) => {
    console.log('🛒 Fetching products with params:', params);
    return api.get('/products', { params });
  },
  
  // Get single product by ID
  getProductById: (id) => {
    console.log('🛒 Fetching product by ID:', id);
    return api.get(`/products/${id}`);
  },
  
  // ✅ NEW: Get random products for home page
  getRandomProducts: (limit = 4) => {
    console.log('🎲 Fetching random products, limit:', limit);
    return api.get('/products/random', { params: { limit } });
  },
  
  // Get featured products
  getFeaturedProducts: (limit = 10) => {
    console.log('🌟 Fetching featured products, limit:', limit);
    return api.get('/products', { params: { featured: true, limit } });
  },
  
  // Search products
  searchProducts: (searchParams) => {
    console.log('🔍 Searching products with params:', searchParams);
    return api.get('/products', { params: searchParams });
  },
  
  // Get products by category
  getProductsByCategory: (category, limit = null) => {
    console.log('📂 Fetching products by category:', category);
    const params = { category };
    if (limit) params.limit = limit;
    return api.get('/products', { params });
  },
  
  // Get products by brand
  getProductsByBrand: (brand, limit = null) => {
    console.log('🏷️ Fetching products by brand:', brand);
    const params = { brand };
    if (limit) params.limit = limit;
    return api.get('/products', { params });
  },
  
  // Admin functions (if needed)
  createProduct: (productData) => {
    console.log('➕ Creating new product');
    return api.post('/products', productData);
  },
  
  updateProduct: (id, productData) => {
    console.log('📝 Updating product:', id);
    return api.put(`/products/${id}`, productData);
  },
  
  deleteProduct: (id) => {
    console.log('🗑️ Deleting product:', id);
    return api.delete(`/products/${id}`);
  }
};

// ===== NEWS API ENDPOINTS =====
export const newsAPI = {
  // Get featured news
  getFeaturedNews: (limit = 3) => {
    console.log('📰 Fetching featured news, limit:', limit);
    return api.get('/news/featured', { params: { limit } });
  },
  
  // Get all news (when implemented)
  getAllNews: (params = {}) => {
    console.log('📰 Fetching all news with params:', params);
    return api.get('/news', { params });
  },
  
  // Get news by category (when implemented)
  getNewsByCategory: (category, limit = null) => {
    console.log('📂 Fetching news by category:', category);
    const params = { category };
    if (limit) params.limit = limit;
    return api.get('/news', { params });
  }
};

// ===== USER API ENDPOINTS =====
export const userAPI = {
  // Authentication
  register: (userData) => {
    console.log('📝 Registering user:', userData.email);
    return api.post('/users/register', userData);
  },
  
  login: (credentials) => {
    console.log('🔐 Logging in user:', credentials.email);
    return api.post('/users/login', credentials);
  },
  
  logout: () => {
    console.log('🚪 Logging out user');
    return api.post('/users/logout');
  },
  
  // Profile management
  getProfile: () => {
    console.log('👤 Fetching user profile');
    return api.get('/users/profile');
  },
  
  updateProfile: (profileData) => {
    console.log('📝 Updating user profile');
    return api.put('/users/profile', profileData);
  },
  
  // Password management
  changePassword: (passwordData) => {
    console.log('🔑 Changing user password');
    return api.post('/users/change-password', passwordData);
  },
  
  forgotPassword: (email) => {
    console.log('🤔 Requesting password reset for:', email);
    return api.post('/users/forgot-password', { email });
  },
  
  resetPassword: (resetData) => {
    console.log('🔄 Resetting password');
    return api.post('/users/reset-password', resetData);
  },
  
  // User favorites and applications (if implemented)
  getFavorites: () => {
    console.log('❤️ Fetching user favorites');
    return api.get('/users/favorites');
  },
  
  getApplications: () => {
    console.log('📋 Fetching user applications');
    return api.get('/users/applications');
  }
};

// ===== CONTACT API ENDPOINTS =====
export const contactAPI = {
  // Send contact form
  sendMessage: (messageData) => {
    console.log('📧 Sending contact message');
    return api.post('/contact', messageData);
  },
  
  // Get contact messages (admin)
  getMessages: (params = {}) => {
    console.log('📨 Fetching contact messages');
    return api.get('/contact', { params });
  }
};

// ===== ADMIN API ENDPOINTS =====
export const adminAPI = {
  // Dashboard
  getDashboard: () => {
    console.log('📊 Fetching admin dashboard');
    return api.get('/admin/dashboard');
  },
  
  // Analytics
  getAnalytics: (params = {}) => {
    console.log('📈 Fetching analytics with params:', params);
    return api.get('/admin/analytics', { params });
  },
  
  // Users management
  getUsers: (params = {}) => {
    console.log('👥 Fetching users with params:', params);
    return api.get('/admin/users', { params });
  },
  
  updateUser: (id, userData) => {
    console.log('📝 Updating user:', id);
    return api.put(`/admin/users/${id}`, userData);
  },
  
  deleteUser: (id) => {
    console.log('🗑️ Deleting user:', id);
    return api.delete(`/admin/users/${id}`);
  },
  
  // Reports
  getReports: (params = {}) => {
    console.log('📊 Fetching reports with params:', params);
    return api.get('/admin/reports', { params });
  },
  
  // Settings
  getSettings: () => {
    console.log('⚙️ Fetching admin settings');
    return api.get('/admin/settings');
  },
  
  updateSettings: (settings) => {
    console.log('📝 Updating admin settings');
    return api.put('/admin/settings', settings);
  }
};

// ===== UTILITY FUNCTIONS =====

// Handle API errors consistently
export const handleApiError = (error) => {
  console.error('🚨 API Error Handler:', error);
  
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || `Error ${error.response.status}: ${error.response.statusText}`;
    return {
      message,
      status: error.response.status,
      data: error.response.data
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      message: 'Network error. Please check your internet connection and try again.',
      status: 0,
      data: null
    };
  } else {
    // Something else happened
    return {
      message: error.message || 'An unexpected error occurred',
      status: 0,
      data: null
    };
  }
};

// Test API connection
export const testConnection = async () => {
  try {
    console.log('🔍 Testing API connection...');
    const response = await api.get('/health');
    console.log('✅ API Connection successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ API Connection failed:', error);
    return { success: false, error: handleApiError(error) };
  }
};

// Get API status
export const getApiStatus = async () => {
  try {
    const response = await api.get('/health');
    return {
      online: true,
      status: response.data.status,
      timestamp: response.data.timestamp,
      environment: response.data.environment,
      database: response.data.database
    };
  } catch (error) {
    return {
      online: false,
      error: handleApiError(error),
      timestamp: new Date().toISOString()
    };
  }
};

// Refresh auth token (if implemented)
export const refreshToken = async () => {
  try {
    const response = await api.post('/auth/refresh');
    if (response.data.success) {
      localStorage.setItem('token', response.data.token);
      return response.data.token;
    }
    throw new Error('Token refresh failed');
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    throw error;
  }
};

// ===== EXPORT EVERYTHING =====

// Main API instance
export default api;

// All API modules
export {
  petAPI,
  productAPI,
  newsAPI,
  userAPI,
  contactAPI,
  adminAPI
};

// Utility functions
export {
  handleApiError,
  testConnection,
  getApiStatus,
  refreshToken
};

// API configuration
export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  retryAttempts: 2,
  retryDelay: 1000
};

// Export individual functions for convenience
export const {
  // Pet functions
  getAllPets,
  getPetById,
  getRandomPets,
  getFeaturedPets,
  searchPets,
  getPetsByCategory,
  getPetsByType,
  createPet,
  updatePet,
  deletePet,
  addToFavorites,
  removeFromFavorites,
  getFavorites
} = petAPI;

export const {
  // Product functions
  getAllProducts,
  getProductById,
  getRandomProducts,
  getFeaturedProducts,
  searchProducts,
  getProductsByCategory,
  getProductsByBrand,
  createProduct,
  updateProduct,
  deleteProduct
} = productAPI;

export const {
  // News functions
  getFeaturedNews,
  getAllNews,
  getNewsByCategory
} = newsAPI;

export const {
  // User functions
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  getApplications
} = userAPI;

console.log('✅ API module initialized successfully');
console.log('🔧 Available endpoints:');
console.log('   - Pet API: getAllPets, getRandomPets ✅ NEW, getFeaturedPets, etc.');
console.log('   - Product API: getAllProducts, getRandomProducts ✅ NEW, getFeaturedProducts, etc.');
console.log('   - News API: getFeaturedNews, getAllNews, etc.');
console.log('   - User API: register, login, getProfile, etc.');
console.log('   - Contact API: sendMessage, getMessages, etc.');
console.log('   - Admin API: getDashboard, getAnalytics, etc.');