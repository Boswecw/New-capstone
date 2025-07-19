// client/src/services/api.js - UPDATED with missing product methods
import axios from 'axios';

// ✅ Environment-based API URL configuration
const getBaseURL = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return 'https://furbabies-backend.onrender.com/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== PET API =====
export const petAPI = {
  // Get all pets
  getAllPets: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    const queryString = searchParams.toString();
    const url = queryString ? `/pets?${queryString}` : '/pets';
    return api.get(url);
  },

  // Get featured pets
  getFeaturedPets: (limit = 6) => {
    return api.get(`/pets?featured=true&limit=${limit}`);
  },

  // Get pet by ID
  getPetById: (id) => {
    return api.get(`/pets/${id}`);
  },

  // Create pet (admin)
  createPet: (petData) => {
    return api.post('/pets', petData);
  },

  // Update pet (admin)
  updatePet: (id, petData) => {
    return api.put(`/pets/${id}`, petData);
  },

  // Delete pet (admin)
  deletePet: (id) => {
    return api.delete(`/pets/${id}`);
  },

  // Rate pet
  ratePet: (id, rating) => {
    return api.post(`/pets/${id}/rate`, { rating });
  },

  // Add to favorites
  addToFavorites: (petId) => {
    return api.post(`/pets/${petId}/favorite`);
  },

  // Remove from favorites
  removeFromFavorites: (petId) => {
    return api.delete(`/pets/${petId}/favorite`);
  }
};

// ===== PRODUCT API - UPDATED with missing methods =====
export const productAPI = {
  // Get all products
  getAllProducts: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    const queryString = searchParams.toString();
    const url = queryString ? `/products?${queryString}` : '/products';
    return api.get(url);
  },

  // Get featured products
  getFeaturedProducts: (limit = 6) => {
    return api.get(`/products/featured?limit=${limit}`);
  },

  // Get product by ID
  getProductById: (id) => {
    return api.get(`/products/${id}`);
  },

  // ✅ ADDED: Get product categories
  getProductCategories: () => {
    return api.get('/products/categories');
  },

  // ✅ ADDED: Get product brands
  getProductBrands: () => {
    return api.get('/products/brands');
  },

  // Create product (admin)
  createProduct: (productData) => {
    return api.post('/products', productData);
  },

  // Update product (admin)
  updateProduct: (id, productData) => {
    return api.put(`/products/${id}`, productData);
  },

  // Delete product (admin)
  deleteProduct: (id) => {
    return api.delete(`/products/${id}`);
  }
};

// ===== USER API =====
export const userAPI = {
  // Register user
  register: (userData) => {
    return api.post('/users/register', userData);
  },

  // Login user
  login: (credentials) => {
    return api.post('/users/login', credentials);
  },

  // Get user profile
  getProfile: () => {
    return api.get('/users/profile');
  },

  // Update user profile
  updateProfile: (userData) => {
    return api.put('/users/profile', userData);
  },

  // Get user favorites
  getFavorites: () => {
    return api.get('/users/favorites');
  }
};

// ===== CONTACT API =====
export const contactAPI = {
  // Submit contact form
  submitContact: (contactData) => {
    return api.post('/contacts', contactData);
  },

  // Get all contacts (admin)
  getAllContacts: () => {
    return api.get('/contacts');
  }
};

// ===== AUTH API =====
export const authAPI = {
  // Login
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },

  // Register
  register: (userData) => {
    return api.post('/auth/register', userData);
  },

  // Logout
  logout: () => {
    return api.post('/auth/logout');
  },

  // Refresh token
  refreshToken: () => {
    return api.post('/auth/refresh');
  }
};

// ===== NEWS API =====
export const newsAPI = {
  // Get featured news
  getFeaturedNews: (limit = 6) => {
    return api.get(`/news/featured?limit=${limit}`);
  },

  // Get all news articles
  getAllNews: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    const queryString = searchParams.toString();
    const url = queryString ? `/news?${queryString}` : '/news';
    return api.get(url);
  },

  // Get news article by ID
  getNewsById: (id) => {
    return api.get(`/news/${id}`);
  },

  // Get custom articles
  getCustomArticles: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    const queryString = searchParams.toString();
    const url = queryString ? `/news/custom?${queryString}` : '/news/custom';
    return api.get(url);
  },

  // Get external articles
  getExternalArticles: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    const queryString = searchParams.toString();
    const url = queryString ? `/news/external?${queryString}` : '/news/external';
    return api.get(url);
  },

  // Like an article
  likeArticle: (id) => {
    return api.post(`/news/${id}/like`);
  },

  // Get categories
  getCategories: () => {
    return api.get('/news/categories');
  },

  // Get news health check
  getHealth: () => {
    return api.get('/news/health');
  }
};

export default api;