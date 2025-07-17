// client/src/services/api.js - FIXED VERSION - Ensures consistent backend URL usage

import axios from 'axios';

// ✅ FIXED: Ensure consistent backend URL usage
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://furbabies-backend.onrender.com/api'
  : 'http://localhost:5000/api';

console.log('🔧 API_BASE_URL:', API_BASE_URL);

// Create axios instance with consistent configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for debugging and error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.status, error.response?.data);
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error - check if backend is running');
    }
    
    return Promise.reject(error);
  }
);

// ===== USER API =====
const userAPI = {
  // Authentication
  login: (credentials) => api.post('/users/login', credentials),
  register: (userData) => api.post('/users/register', userData),
  logout: () => api.post('/users/logout'),
  
  // Profile
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  
  // Password
  changePassword: (passwordData) => api.put('/users/password', passwordData),
  forgotPassword: (email) => api.post('/users/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/users/reset-password', { token, password })
};

// ===== PET API =====
const petAPI = {
  // Get all pets with filtering
  getAllPets: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    return api.get(`/pets?${searchParams}`);
  },
  
  // Get single pet by ID
  getPetById: (id) => api.get(`/pets/${id}`),
  
  // ✅ FIXED: Get featured pets with proper backend URL
  getFeaturedPets: (limit = 4) => {
    console.log(`🐾 Fetching ${limit} featured pets from backend...`);
    return api.get(`/pets/featured?limit=${limit}`);
  },
  
  // Search pets
  searchPets: (query, params = {}) => {
    const searchParams = new URLSearchParams({ search: query, ...params });
    return api.get(`/pets?${searchParams}`);
  },
  
  // Get pets by category
  getPetsBySpecies: (species, params = {}) => {
    const searchParams = new URLSearchParams({ species, ...params });
    return api.get(`/pets?${searchParams}`);
  },
  
  // Get pet categories/species
  getPetSpecies: () => api.get('/pets/meta/species'),
  
  // Admin routes
  createPet: (petData) => api.post('/pets', petData),
  updatePet: (id, petData) => api.put(`/pets/${id}`, petData),
  deletePet: (id) => api.delete(`/pets/${id}`)
};

// ===== PRODUCT API =====
const productAPI = {
  // Get all products with filtering
  getAllProducts: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    return api.get(`/products?${searchParams}`);
  },
  
  // Get single product by ID
  getProductById: (id) => api.get(`/products/${id}`),
  
  // ✅ FIXED: Get featured products with proper backend URL
  getFeaturedProducts: (limit = 4) => {
    console.log(`🛒 Fetching ${limit} featured products from backend...`);
    return api.get(`/products/featured?limit=${limit}`);
  },
  
  // Search products
  searchProducts: (query, params = {}) => {
    const searchParams = new URLSearchParams({ search: query, ...params });
    return api.get(`/products?${searchParams}`);
  },
  
  // Get products by category
  getProductsByCategory: (category, params = {}) => {
    const searchParams = new URLSearchParams({ category, ...params });
    return api.get(`/products?${searchParams}`);
  },
  
  // Get product categories
  getProductCategories: () => api.get('/products/meta/categories'),
  
  // Get product brands
  getProductBrands: () => api.get('/products/meta/brands'),
  
  // Admin routes
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`)
};

// ===== NEWS API =====
const newsAPI = {
  // Get featured news
  getFeaturedNews: (limit = 3) => {
    console.log(`📰 Fetching ${limit} featured news from backend...`);
    return api.get(`/news/featured?limit=${limit}`);
  },
  
  // Get all news
  getAllNews: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return api.get(`/news?${searchParams}`);
  },
  
  // Get single news article
  getNewsById: (id) => api.get(`/news/${id}`)
};

// ===== CONTACT API =====
const contactAPI = {
  // Submit contact form
  submitContact: (contactData) => {
    console.log('📧 Submitting contact form to backend...');
    return api.post('/contact', contactData);
  },
  
  // Get contact submissions (admin)
  getContactSubmissions: () => api.get('/contact'),
  
  // Update contact submission (admin)
  updateContactSubmission: (id, data) => api.put(`/contact/${id}`, data)
};

// ===== IMAGE API =====
const imageAPI = {
  // Get image health check
  getImageHealth: () => api.get('/images/health'),
  
  // Get image optimization health
  getOptimizationHealth: () => api.get('/images/optimization/health'),
  
  // Get image metadata
  getImageMetadata: (imagePath) => api.get(`/images/metadata/gcs/${imagePath}`),
  
  // Batch optimize images
  batchOptimize: (imagePaths, preset = 'medium') => 
    api.post('/images/optimize-batch', { imagePaths, preset }),
  
  // ✅ FIXED: Get image URL with consistent backend URL
  getImageUrl: (imagePath, options = {}) => {
    if (!imagePath) return null;
    
    const baseUrl = `${API_BASE_URL}/images/gcs`;
    const params = new URLSearchParams(options);
    
    return `${baseUrl}/${imagePath}${params.toString() ? '?' + params.toString() : ''}`;
  },
  
  // Get preset image URL
  getPresetImageUrl: (imagePath, preset = 'medium') => {
    if (!imagePath) return null;
    return `${API_BASE_URL}/images/preset/${preset}/gcs/${imagePath}`;
  },
  
  // Get fallback image URL
  getFallbackImageUrl: (category = 'default') => {
    return `${API_BASE_URL}/images/fallback/${category}`;
  }
};

// ===== GOOGLE CLOUD STORAGE API =====
const gcsAPI = {
  // Get GCS configuration
  getConfig: () => api.get('/gcs/config'),
  
  // Get GCS health
  getHealth: () => api.get('/gcs/health'),
  
  // List images in bucket
  listImages: (bucketName, params = {}) => {
    const searchParams = new URLSearchParams(params);
    return api.get(`/gcs/buckets/${bucketName}/images?${searchParams}`);
  }
};

// ===== ADMIN API =====
const adminAPI = {
  // Dashboard stats
  getStats: () => api.get('/admin/stats'),
  
  // User management
  getAllUsers: () => api.get('/admin/users'),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  
  // Content management
  getAllPetsAdmin: () => api.get('/admin/pets'),
  getAllProductsAdmin: () => api.get('/admin/products'),
  getAllContactsAdmin: () => api.get('/admin/contacts')
};

// ===== HEALTH CHECK =====
const healthAPI = {
  // Main health check
  getHealth: () => {
    console.log('🔍 Checking backend health...');
    return api.get('/health');
  },
  
  // Service-specific health checks
  getImageHealth: () => imageAPI.getImageHealth(),
  getGCSHealth: () => gcsAPI.getHealth()
};

// ===== UTILITY FUNCTIONS =====
const apiUtils = {
  // Helper to handle API responses
  handleResponse: (response) => {
    if (response.data?.success) {
      return response.data;
    } else {
      throw new Error(response.data?.message || 'API request failed');
    }
  },
  
  // Helper to build query strings
  buildQueryString: (params) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    return searchParams.toString();
  },
  
  // Helper to get base URL
  getBaseURL: () => API_BASE_URL,
  
  // Helper to check if backend is reachable
  checkBackendHealth: async () => {
    try {
      const response = await healthAPI.getHealth();
      console.log('✅ Backend is healthy:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Backend health check failed:', error);
      return false;
    }
  }
};

// Export individual APIs
export {
  userAPI,
  petAPI,
  productAPI,
  newsAPI,
  contactAPI,
  imageAPI,
  gcsAPI,
  adminAPI,
  healthAPI,
  apiUtils
};

// Default export (for backward compatibility)
export default {
  user: userAPI,
  pet: petAPI,
  product: productAPI,
  news: newsAPI,
  contact: contactAPI,
  image: imageAPI,
  gcs: gcsAPI,
  admin: adminAPI,
  health: healthAPI,
  utils: apiUtils
};