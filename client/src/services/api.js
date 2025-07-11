// client/src/services/api.js - FINAL FIX - REPLACE ENTIRE FILE
import axios from 'axios';

// ✅ FIXED: Safe API URL detection that works in production
const getApiBaseUrl = () => {
  // Check if we're in production on Render
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Production: if frontend is on Render, use production backend
    if (hostname.includes('onrender.com')) {
      // ⚠️ REPLACE 'furbabies-backend' with your actual backend service name
      return 'https://furbabies-backend.onrender.com/api';
    }
  }
  
  // Development: use localhost
  return 'http://localhost:5000/api';
};

// This replaces the problematic line that was causing the error
const API_BASE_URL = getApiBaseUrl();

console.log('🔧 API_BASE_URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// PET API
export const petAPI = {
  getAllPets: (params) => api.get('/pets', { params }),
  getPetById: (id) => api.get(`/pets/${id}`),
  getFeaturedPets: (params = {}) => api.get('/pets/featured', { params }),
};

// PRODUCT API
export const productAPI = {
  getAllProducts: (params) => api.get('/products', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  getFeaturedProducts: (params = {}) => api.get('/products/featured', { params }),
};

export default api;