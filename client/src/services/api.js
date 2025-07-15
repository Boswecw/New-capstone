// client/src/services/api.js - WORKING VERSION (NewsAPI Commented Out)
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://furbabies-backend.onrender.com/api'  // Update with your actual backend URL
    : 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
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
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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

// ===== PET API =====
export const petAPI = {
  getAllPets: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    return api.get(`/pets?${searchParams}`);
  },
  getPetById: (id) => api.get(`/pets/${id}`),
  createPet: (petData) => api.post('/pets', petData),
  updatePet: (id, petData) => api.put(`/pets/${id}`, petData),
  deletePet: (id) => api.delete(`/pets/${id}`),
};

// ===== PRODUCT API =====
export const productAPI = {
  getAllProducts: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    return api.get(`/products?${searchParams}`);
  },
  getProductById: (id) => api.get(`/products/${id}`),
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

// ===== NEWS API ===== 
// 🚫 REAL API COMMENTED OUT - USING MOCK DATA FOR NOW
/*
export const newsAPI = {
  getAllNews: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    return api.get(`/news?${searchParams}`);
  },
  getNewsById: (id) => api.get(`/news/${id}`),
  getFeaturedNews: (limit = 5) => api.get(`/news/featured?limit=${limit}`),
  getNewsCategories: () => api.get('/news/categories'),
  getNewsByCategory: (category, params = {}) => {
    const searchParams = new URLSearchParams({ category, ...params });
    return api.get(`/news/category/${category}?${searchParams}`);
  },
};
*/

// 🆕 TEMPORARY: Mock newsAPI to prevent build errors
export const newsAPI = {
  getAllNews: (params = {}) => {
    console.log('🚧 Using mock newsAPI - getAllNews');
    return Promise.resolve({ 
      data: { 
        success: true, 
        data: [], 
        message: 'News section temporarily unavailable' 
      } 
    });
  },
  getNewsById: (id) => {
    console.log('🚧 Using mock newsAPI - getNewsById');
    return Promise.resolve({ 
      data: { 
        success: false, 
        data: null, 
        message: 'News article not found' 
      } 
    });
  },
  getFeaturedNews: (limit = 5) => {
    console.log('🚧 Using mock newsAPI - getFeaturedNews');
    return Promise.resolve({ 
      data: { 
        success: true, 
        data: [], 
        message: 'Featured news temporarily unavailable' 
      } 
    });
  },
  getNewsCategories: () => {
    console.log('🚧 Using mock newsAPI - getNewsCategories');
    return Promise.resolve({ 
      data: { 
        success: true, 
        data: [
          { name: 'adoption', displayName: 'Adoption', count: 0 },
          { name: 'health', displayName: 'Health', count: 0 },
          { name: 'training', displayName: 'Training', count: 0 }
        ], 
        message: 'News categories (mock data)' 
      } 
    });
  },
  getNewsByCategory: (category, params = {}) => {
    console.log('🚧 Using mock newsAPI - getNewsByCategory');
    return Promise.resolve({ 
      data: { 
        success: true, 
        data: [], 
        message: `No news articles found for category: ${category}` 
      } 
    });
  },
};

// ===== CONTACT API =====
export const contactAPI = {
  submitContact: (contactData) => api.post('/contact', contactData),
  getAllContacts: () => api.get('/contact'),
  getContactById: (id) => api.get(`/contact/${id}`),
  updateContact: (id, contactData) => api.put(`/contact/${id}`, contactData),
  deleteContact: (id) => api.delete(`/contact/${id}`),
};

// ===== ADMIN API ===== 
export const adminAPI = {
  // Dashboard stats
  getStats: () => api.get('/admin/stats'),
  
  // User management
  getAllUsers: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    return api.get(`/admin/users?${searchParams}`);
  },
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  
  // Pet management
  getAllPets: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    return api.get(`/admin/pets?${searchParams}`);
  },
  
  // Contact management
  getAllContacts: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    return api.get(`/admin/contacts?${searchParams}`);
  },
  
  // Settings
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (settingsData) => api.put('/admin/settings', settingsData),
  
  // Analytics
  getAnalytics: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    return api.get(`/admin/analytics?${searchParams}`);
  },
};

// ===== UTILITY FUNCTIONS =====
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || 'An error occurred';
    return {
      message,
      status: error.response.status,
      data: error.response.data
    };
  } else if (error.request) {
    // Request was made but no response
    return {
      message: 'Network error. Please check your connection.',
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
    const response = await api.get('/health');
    console.log('✅ API Connection successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ API Connection failed:', error);
    return { success: false, error: handleApiError(error) };
  }
};

// Default export for backward compatibility
export default api;