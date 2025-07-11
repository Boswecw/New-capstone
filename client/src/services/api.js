// client/src/services/api.js - Render Production Ready
import axios from 'axios';

// ✅ RENDER FIX: Dynamic API URL configuration
const getApiBaseUrl = () => {
  // If environment variable is set, use it
  if (process.env.REACT_APP_API_URL) {
    console.log('🌍 Using configured API URL:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // Auto-detect based on current hostname for Render deployments
  if (window.location.hostname.includes('onrender.com')) {
    // Replace your-app-name with your actual Render backend service name
    const backendUrl = 'https://your-backend-service-name.onrender.com/api';
    console.log('🚀 Auto-detected Render API URL:', backendUrl);
    return backendUrl;
  }
  
  // Local development fallback
  const localUrl = 'http://localhost:5000/api';
  console.log('🏠 Using local development URL:', localUrl);
  return localUrl;
};

// Create axios instance with dynamic base URL
const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Increased timeout for Render cold starts
});

// Helper function to generate image URLs with fallbacks
export const getImageUrl = (imagePath, fallback = '/images/placeholder.png') => {
  if (!imagePath) return fallback;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) return imagePath;
  
  // Build backend URL
  const baseURL = getApiBaseUrl().replace('/api', '');
  return `${baseURL}/${imagePath}`;
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Add request logging for debugging
    console.log(`🔍 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    // Check if localStorage is available (browser environment)
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    console.error('🚨 Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling auth errors and logging
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('🚨 API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      message: error.message
    });
    
    // Check if we're in browser environment before accessing localStorage/window
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Export specific API methods
export const petAPI = {
  getAllPets: (params = {}) => api.get('/pets', { params }),
  getPetById: (id) => api.get(`/pets/${id}`),
  createPet: (petData) => api.post('/pets', petData),
  updatePet: (id, petData) => api.put(`/pets/${id}`, petData),
  deletePet: (id) => api.delete(`/pets/${id}`),
  addToFavorites: (petId) => api.post(`/pets/${petId}/favorite`),
  removeFromFavorites: (petId) => api.delete(`/pets/${petId}/favorite`),
};

export const productAPI = {
  getAllProducts: (params = {}) => api.get('/products', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  getFeaturedProducts: (limit = 6) => api.get(`/products/featured?limit=${limit}`),
  getProductCategories: () => api.get('/products/categories'),
  getProductBrands: () => api.get('/products/brands'),
};

// ✅ NEWS API - This should fix your 404 error
export const newsAPI = {
  getAllNews: (params = {}) => api.get('/news', { params }),
  getNewsById: (id) => api.get(`/news/${id}`),
  getNewsCategories: () => api.get('/news/categories'),
  getNewsByCategory: (category, limit = 10) => api.get(`/news?category=${category}&limit=${limit}`),
};

export const userAPI = {
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/users/login', credentials),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
};

export const contactAPI = {
  submitContact: (contactData) => api.post('/contact', contactData),
};

export default api;