// client/src/services/api.js
import axios from 'axios';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://furbabies-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ========== PET API ==========
export const petAPI = {
  // Get featured pets
  getFeaturedPets: (params = {}) => api.get('/pets/featured', { params }),

  // Get all pets with filters (search, type, breed, etc.)
  getAllPets: (params = {}) => api.get('/pets', { params }),

  // Get single pet by ID
  getPetById: (id) => api.get(`/pets/${id}`),

  // Create new pet (protected route)
  createPet: (data) => api.post('/pets', data),

  // Update pet (protected route)
  updatePet: (id, data) => api.put(`/pets/${id}`, data),

  // Delete pet (protected route)
  deletePet: (id) => api.delete(`/pets/${id}`),

  // Vote on a pet (authenticated)
  votePet: (id, voteType) => api.post(`/pets/${id}/vote`, { voteType }),
};

// ========== PRODUCT API ==========
export const productAPI = {
  // Get featured products
  getFeaturedProducts: (params = {}) => api.get('/products/featured', { params }),

  // Get all products with filters (search, category, brand, price, etc.)
  getAllProducts: (params = {}) => api.get('/products', { params }),

  // Get single product by ID
  getProductById: (id) => api.get(`/products/${id}`),

  // Get related products
  getRelatedProducts: (id) => api.get(`/products/${id}/related`),

  // Get available categories
  getCategories: () => api.get('/products/categories'),

  // Get available brands
  getBrands: () => api.get('/products/brands'),

  // Create new product (protected)
  createProduct: (data) => api.post('/products', data),

  // Update product
  updateProduct: (id, data) => api.patch(`/products/${id}`, data),

  // Delete product
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

// Optional: Auth or user API can go here too

export default api;
