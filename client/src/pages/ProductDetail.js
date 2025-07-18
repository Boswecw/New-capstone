// client/src/services/api.js - COMPLETE FIX with all required methods
import axios from 'axios';

// ✅ FIXED: Proper API base URL configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://new-capstone.onrender.com/api'  // Your deployed backend URL
  : 'http://localhost:5000/api';

console.log(`🔗 API Base URL: ${API_BASE_URL}`);

// ✅ ENHANCED: Create axios instance with better configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// ✅ ENHANCED: Request interceptor for auth and logging
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
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

// ✅ ENHANCED: Response interceptor for better error handling
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
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Optionally redirect to login
      // window.location.href = '/login';
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
    console.log(`🐾 Fetching pets with params:`, params);
    return api.get(`/pets?${searchParams}`);
  },
  getPetById: (id) => {
    console.log(`🐾 Fetching pet by ID: ${id}`);
    return api.get(`/pets/${id}`);
  },
  getFeaturedPets: (limit = 4) => {
    console.log(`🐾 Fetching ${limit} featured pets...`);
    return api.get(`/pets/featured?limit=${limit}`);
  },
  searchPets: (query, params = {}) => {
    const searchParams = new URLSearchParams({ search: query, ...params });
    return api.get(`/pets?${searchParams}`);
  },
  getPetsBySpecies: (species, params = {}) => {
    const searchParams = new URLSearchParams({ species, ...params });
    return api.get(`/pets?${searchParams}`);
  },
  getPetSpecies: () => api.get('/pets/meta/species'),
  createPet: (petData) => api.post('/pets', petData),
  updatePet: (id, petData) => api.put(`/pets/${id}`, petData),
  deletePet: (id) => api.delete(`/pets/${id}`),
  votePet: (id, voteType) => api.post(`/pets/${id}/vote`, { voteType }),
  ratePet: (id, payload) => api.post(`/pets/${id}/rate`, payload)
};

// ===== PRODUCT API - COMPLETE IMPLEMENTATION =====
const productAPI = {
  getAllProducts: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '' && params[key] !== 'all') {
        searchParams.append(key, params[key]);
      }
    });
    console.log(`🛒 Fetching products with params:`, params);
    return api.get(`/products?${searchParams}`);
  },
  
  getProductById: (id) => {
    console.log(`🛒 Fetching product by ID: ${id}`);
    return api.get(`/products/${id}`);
  },
  
  getFeaturedProducts: (limit = 4) => {
    console.log(`🛒 Fetching ${limit} featured products...`);
    return api.get(`/products/featured?limit=${limit}`);
  },
  
  searchProducts: (query, params = {}) => {
    const searchParams = new URLSearchParams({ search: query, ...params });
    console.log(`🛒 Searching products for: "${query}"`);
    return api.get(`/products?${searchParams}`);
  },
  
  getProductsByCategory: (category, params = {}) => {
    const searchParams = new URLSearchParams({ category, ...params });
    console.log(`🛒 Fetching products in category: ${category}`);
    return api.get(`/products?${searchParams}`);
  },
  
  // ✅ FIXED: Ensure these methods exist and are properly implemented
  getProductCategories: () => {
    console.log('📂 Fetching product categories...');
    return api.get('/products/meta/categories');
  },
  
  getProductBrands: () => {
    console.log('🏷️ Fetching product brands...');
    return api.get('/products/meta/brands');
  },
  
  // Admin methods
  createProduct: (productData) => {
    console.log('🛒 Creating new product...');
    return api.post('/products', productData);
  },
  
  updateProduct: (id, productData) => {
    console.log(`🛒 Updating product ${id}...`);
    return api.put(`/products/${id}`, productData);
  },
  
  deleteProduct: (id) => {
    console.log(`🛒 Deleting product ${id}...`);
    return api.delete(`/products/${id}`);
  }
};

// ===== USER API =====
const userAPI = {
  login: (credentials) => {
    console.log('👤 User login attempt...');
    return api.post('/users/login', credentials);
  },
  
  register: (userData) => {
    console.log('👤 User registration...');
    return api.post('/users/register', userData);
  },
  
  getProfile: () => {
    console.log('👤 Fetching user profile...');
    return api.get('/users/profile');
  },
  
  updateProfile: (userData) => {
    console.log('👤 Updating user profile...');
    return api.put('/users/profile', userData);
  },
  
  // Admin user management
  getAllUsers: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return api.get(`/admin/users?${searchParams}`);
  },
  
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`)
};

// ===== NEWS API =====
const newsAPI = {
  getFeaturedNews: (limit = 3) => {
    console.log(`📰 Fetching ${limit} featured news articles...`);
    return api.get(`/news/featured?limit=${limit}`);
  },
  
  getAllNews: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return api.get(`/news?${searchParams}`);
  },
  
  getNewsById: (id) => {
    console.log(`📰 Fetching news article by ID: ${id}`);
    return api.get(`/news/${id}`);
  }
};

// ===== CONTACT API =====
const contactAPI = {
  submitContact: (contactData) => {
    console.log('📧 Submitting contact form...');
    return api.post('/contact', contactData);
  },
  
  getContactSubmissions: () => {
    console.log('📧 Fetching contact submissions...');
    return api.get('/contact');
  },
  
  updateContactSubmission: (id, data) => {
    console.log(`📧 Updating contact submission ${id}...`);
    return api.put(`/contact/${id}`, data);
  }
};

// ===== IMAGE API =====
const imageAPI = {
  getImageHealth: () => api.get('/images/health'),
  
  getOptimizationHealth: () => api.get('/images/optimization/health'),
  
  getImageMetadata: (imagePath) => {
    console.log(`🖼️ Fetching metadata for image: ${imagePath}`);
    return api.get(`/images/metadata/gcs/${imagePath}`);
  },
  
  batchOptimize: (imagePaths, preset = 'medium') => {
    console.log(`🖼️ Batch optimizing ${imagePaths.length} images...`);
    return api.post('/images/optimize-batch', { imagePaths, preset });
  },
  
  getImageUrl: (imagePath, options = {}) => {
    if (!imagePath) return null;
    const baseUrl = `${API_BASE_URL}/images/gcs`;
    const params = new URLSearchParams(options);
    return `${baseUrl}/${imagePath}${params.toString() ? '?' + params.toString() : ''}`;
  }
};

// ===== ADMIN API =====
const adminAPI = {
  getDashboard: () => {
    console.log('🔧 Fetching admin dashboard...');
    return api.get('/admin/dashboard');
  },
  
  getStats: () => {
    console.log('📊 Fetching admin statistics...');
    return api.get('/admin/stats');
  }
};

// ===== HEALTH CHECK =====
const healthAPI = {
  checkHealth: () => {
    console.log('🏥 Checking API health...');
    return api.get('/health');
  },
  
  checkDatabase: () => {
    console.log('🗄️ Checking database health...');
    return api.get('/health/database');
  }
};

// ===== EXPORTS =====
export {
  api,
  petAPI,
  productAPI,
  userAPI,
  newsAPI,
  contactAPI,
  imageAPI,
  adminAPI,
  healthAPI,
  API_BASE_URL
};

// ✅ FIXED: Assign object to variable before exporting as default
const apiServices = {
  pets: petAPI,
  products: productAPI,
  users: userAPI,
  news: newsAPI,
  contact: contactAPI,
  images: imageAPI,
  admin: adminAPI,
  health: healthAPI
};

export default apiServices;