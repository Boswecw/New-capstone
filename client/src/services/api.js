// client/src/services/api.js - CORRECTED VERSION with proper featured endpoints
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://furbabies-backend.onrender.com/api'  // Your working backend
    : 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout for Render cold starts
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== USER API =====
const userAPI = {
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/users/login', credentials),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  addFavorite: (petId) => api.post(`/users/favorites/${petId}`),
  removeFavorite: (petId) => api.delete(`/users/favorites/${petId}`),
  getFavorites: () => api.get('/users/favorites'),
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
  
  // ✅ CORRECTED: Use proper featured endpoint
  getFeaturedPets: (limit = 6) => {
    return api.get(`/pets/featured?limit=${limit}`);
  },
  
  // Get random pets (if your backend supports it)
  getRandomPets: (limit = 6) => {
    const searchParams = new URLSearchParams();
    searchParams.append('limit', limit);
    searchParams.append('random', 'true');
    return api.get(`/pets?${searchParams}`);
  },
  
  // Get pets by category
  getPetsByCategory: (category, limit = null) => {
    const params = { category };
    if (limit) params.limit = limit;
    return petAPI.getAllPets(params);
  },
  
  // Get pets by type
  getPetsByType: (type, limit = null) => {
    const params = { type };
    if (limit) params.limit = limit;
    return petAPI.getAllPets(params);
  },
  
  // Search pets
  searchPets: (searchTerm, filters = {}) => {
    const params = { search: searchTerm, ...filters };
    return petAPI.getAllPets(params);
  },
  
  // Favorites
  addToFavorites: (petId) => api.post(`/pets/${petId}/favorites`),
  removeFromFavorites: (petId) => api.delete(`/pets/${petId}/favorites`),
  
  // Admin functions
  createPet: (petData) => api.post('/pets', petData),
  updatePet: (id, petData) => api.put(`/pets/${id}`, petData),
  deletePet: (id) => api.delete(`/pets/${id}`),
  
  // Metadata
  getPetTypes: () => api.get('/pets/meta/types'),
  getPetCategories: () => api.get('/pets/meta/categories'),
  getPetBreeds: (type) => api.get(`/pets/meta/breeds/${type}`),
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
  
  // ✅ CORRECTED: Use proper featured endpoint
  getFeaturedProducts: (limit = 6) => {
    return api.get(`/products/featured?limit=${limit}`);
  },
  
  // Get random products (if your backend supports it)
  getRandomProducts: (limit = 6) => {
    const searchParams = new URLSearchParams();
    searchParams.append('limit', limit);
    searchParams.append('random', 'true');
    return api.get(`/products?${searchParams}`);
  },
  
  // Get products by category
  getProductsByCategory: (category, limit = null) => {
    const params = { category };
    if (limit) params.limit = limit;
    return productAPI.getAllProducts(params);
  },
  
  // Search products
  searchProducts: (searchTerm, filters = {}) => {
    const params = { search: searchTerm, ...filters };
    return productAPI.getAllProducts(params);
  },
  
  // Admin functions
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  
  // Metadata
  getProductCategories: () => api.get('/products/meta/categories'),
  getProductBrands: () => api.get('/products/meta/brands'),
};

// ===== NEWS API =====
const newsAPI = {
  // Get all news
  getAllNews: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    return api.get(`/news?${searchParams}`);
  },

  // ✅ CORRECTED: Use proper featured endpoint
  getFeaturedNews: (limit = 6) => {
    return api.get(`/news/featured?limit=${limit}`);
  },

  // Get single news article
  getNewsById: (id) => api.get(`/news/${id}`),

  // Get news by category
  getNewsByCategory: (category) => {
    return api.get(`/news?category=${category}`);
  },

  // Search news
  searchNews: (searchTerm) => {
    return api.get(`/news?search=${searchTerm}`);
  },

  // Admin functions
  createNews: (newsData) => api.post('/news', newsData),
  updateNews: (id, newsData) => api.put(`/news/${id}`, newsData),
  deleteNews: (id) => api.delete(`/news/${id}`),
};

// ===== CONTACT API =====
const contactAPI = {
  // Submit contact form
  submitContactForm: (contactData) => api.post('/contact', contactData),
  
  // Admin functions
  getAllContacts: () => api.get('/contact'),
  getContactById: (id) => api.get(`/contact/${id}`),
  updateContactStatus: (id, status) => api.put(`/contact/${id}`, { status }),
  deleteContact: (id) => api.delete(`/contact/${id}`),
};

// ===== IMAGE API =====
const imageAPI = {
  // Health check for image service
  getImageHealth: () => api.get('/images/health'),
  
  // Get fallback image
  getFallbackImage: (category = 'default') => api.get(`/images/fallback/${category}`),
  
  // Note: Image proxy URLs are constructed directly:
  // For GCS images: /api/images/gcs/{imagePath}
  getProxyImageUrl: (imagePath) => {
    const baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://furbabies-backend.onrender.com'
      : 'http://localhost:5000';
    return `${baseURL}/api/images/gcs/${imagePath}`;
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
  },
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
  getAllContactsAdmin: () => api.get('/admin/contacts'),
};

// ===== HEALTH CHECK =====
const healthAPI = {
  // Main health check
  getHealth: () => api.get('/health'),
  
  // Service-specific health checks
  getImageHealth: () => imageAPI.getImageHealth(),
  getGCSHealth: () => gcsAPI.getHealth(),
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
  getBaseURL: () => {
    return process.env.NODE_ENV === 'production' 
      ? 'https://furbabies-backend.onrender.com/api'
      : 'http://localhost:5000/api';
  }
};

// Export all APIs
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