// client/src/services/api.js - Improved version with better timeout handling

import axios from 'axios';

// Enhanced API configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://furbabies-backend.onrender.com/api'
  : 'http://localhost:5000/api';

console.log('🔧 API_BASE_URL:', API_BASE_URL);

// Create axios instance with enhanced configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000, // Increased to 45 seconds for cold starts
});

// Enhanced request interceptor with retry logic
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log API calls for debugging
    console.log(`🚀 API Call: ${config.method?.toUpperCase()} ${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with better error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Success: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    const errorInfo = {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method
    };
    
    console.error('❌ API Response Error:', errorInfo);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Request timed out - server may be sleeping');
    }
    
    return Promise.reject(error);
  }
);

// Health check function to wake up the server
export const healthCheck = async () => {
  try {
    console.log('🏥 Performing health check...');
    const response = await api.get('/health', { timeout: 60000 }); // 60 second timeout
    console.log('✅ Health check successful');
    return response.data;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    throw error;
  }
};

// Retry function for important requests
const retryRequest = async (requestFn, maxRetries = 2, delay = 2000) => {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      console.warn(`⚠️ Request attempt ${i + 1} failed:`, error.message);
      
      if (i === maxRetries) {
        throw error;
      }
      
      // If it's a timeout or server error, wait before retrying
      if (error.code === 'ECONNABORTED' || error.response?.status >= 500) {
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Exponential backoff
      } else {
        throw error; // Don't retry client errors
      }
    }
  }
};

// ===== ENHANCED PET API =====
export const petAPI = {
  getAllPets: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    
    return retryRequest(() => api.get(`/pets?${searchParams}`));
  },
  
  getFeaturedPets: (limit = 6) => {
    console.log('🐾 Fetching featured pets...');
    return retryRequest(() => api.get(`/pets?featured=true&limit=${limit}`));
  },
  
  getPetById: (id) => api.get(`/pets/${id}`),
  createPet: (petData) => api.post('/pets', petData),
  updatePet: (id, petData) => api.put(`/pets/${id}`, petData),
  deletePet: (id) => api.delete(`/pets/${id}`),
};

// ===== ENHANCED PRODUCT API =====
export const productAPI = {
  getAllProducts: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    
    return retryRequest(() => api.get(`/products?${searchParams}`));
  },
  
  getFeaturedProducts: (limit = 6) => {
    console.log('🛍️ Fetching featured products...');
    return retryRequest(() => api.get(`/products?featured=true&limit=${limit}`));
  },
  
  getProductById: (id) => api.get(`/products/${id}`),
  
  getCategories: () => {
    console.log('📂 Fetching product categories...');
    return retryRequest(() => api.get('/products/categories'));
  },
  
  // getBrands removed - not needed, Hero banner works fine without it
  
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

// ===== USER API =====
export const userAPI = {
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/users/login', credentials),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  addFavorite: (petId) => api.post(`/users/favorites/${petId}`),
  removeFavorite: (petId) => api.delete(`/users/favorites/${petId}`),
  getFavorites: () => api.get('/users/favorites'),
};

// ===== CONTACT API =====
export const contactAPI = {
  submitContact: (contactData) => api.post('/contact', contactData),
};

// ===== ADMIN API =====
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    return api.get(`/admin/users?${searchParams}`);
  },
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

// Export the axios instance for direct use if needed
export default api;