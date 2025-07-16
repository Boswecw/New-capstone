// client/src/services/api.js - Add random endpoints
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://furbabies-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Pet API endpoints
export const petAPI = {
  getAllPets: (params = {}) => api.get('/pets', { params }),
  getPetById: (id) => api.get(`/pets/${id}`),
  getRandomPets: (limit = 4) => api.get('/pets/random', { params: { limit } }),
  getFeaturedPets: (limit = 10) => api.get('/pets/featured', { params: { limit } })
};

// Product API endpoints
export const productAPI = {
  getAllProducts: (params = {}) => api.get('/products', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  getRandomProducts: (limit = 4) => api.get('/products/random', { params: { limit } }),
  getFeaturedProducts: (limit = 10) => api.get('/products/featured', { params: { limit } })
};

// News API endpoints
export const newsAPI = {
  getFeaturedNews: (limit = 3) => api.get('/news/featured', { params: { limit } }),
  getAllNews: (params = {}) => api.get('/news', { params })
};

export default api;