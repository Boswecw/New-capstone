// client/src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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
