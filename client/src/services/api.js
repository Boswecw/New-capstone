// client/src/services/api.js - FIXED ENDPOINTS

import axios from 'axios';

// ✅ Environment-based API URL configuration
const getBaseURL = () => {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.REACT_APP_API_URL) {
      throw new Error('REACT_APP_API_URL is required in production');
    }
    return process.env.REACT_APP_API_URL;
  }

  // Development fallback
  return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
};

// ✅ Get the base URL and export it
export const API_BASE_URL = getBaseURL();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
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

// ✅ Expose to window AFTER api is created
if (process.env.NODE_ENV === 'development') {
  window.__API_BASE_URL__ = API_BASE_URL;
  window.__api = api;
  console.log('🔧 API Base URL exposed for debugging:', API_BASE_URL);
  console.log('🔧 API instance exposed as window.__api');
}

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

  // ✅ FIXED: Get featured pets - using correct endpoint
  getFeaturedPets: (limit = 6) => {
    return api.get(`/pets/featured?limit=${limit}`);
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
  },

  // Get filtered pets
  getFilteredPets: (queryString) => {
    return api.get(`/pets?${queryString}`);
  }
};

// ===== PRODUCT API =====
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

  // ✅ FIXED: Get featured products - using correct endpoint
  getFeaturedProducts: (limit = 6) => {
    return api.get(`/products/featured?limit=${limit}`);
  },

  // Get product by ID
  getProductById: (id) => {
    return api.get(`/products/${id}`);
  },

  // Get product categories
  getProductCategories: () => {
    return api.get('/products/categories');
  },

  // Get product brands
  getProductBrands: () => {
    return api.get('/products/brands');
  },

  // Search products
  searchProducts: (query, params = {}) => {
    const searchParams = new URLSearchParams({ search: query, ...params });
    return api.get(`/products?${searchParams.toString()}`);
  },

  // Get products by category
  getProductsByCategory: (category, params = {}) => {
    const searchParams = new URLSearchParams({ category, ...params });
    return api.get(`/products?${searchParams.toString()}`);
  },

  // Get products by brand
  getProductsByBrand: (brand, params = {}) => {
    const searchParams = new URLSearchParams({ brand, ...params });
    return api.get(`/products?${searchParams.toString()}`);
  },

  // Get products in price range
  getProductsByPriceRange: (minPrice, maxPrice, params = {}) => {
    const searchParams = new URLSearchParams({ 
      minPrice: minPrice.toString(), 
      maxPrice: maxPrice.toString(), 
      ...params 
    });
    return api.get(`/products?${searchParams.toString()}`);
  },

  // Admin functions
  createProduct: (productData) => {
    return api.post('/products', productData);
  },

  updateProduct: (id, productData) => {
    return api.put(`/products/${id}`, productData);
  },

  deleteProduct: (id) => {
    return api.delete(`/products/${id}`);
  },

  // Rate product
  rateProduct: (id, rating) => {
    return api.post(`/products/${id}/rate`, { rating });
  },

  // Add to wishlist
  addToWishlist: (productId) => {
    return api.post(`/products/${productId}/wishlist`);
  },

  // Remove from wishlist
  removeFromWishlist: (productId) => {
    return api.delete(`/products/${productId}/wishlist`);
  }
};

// ===== NEWS API =====
export const newsAPI = {
  // Get all news
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

  // ✅ FIXED: Get featured news - using correct endpoint
  getFeaturedNews: (limit = 3) => {
    return api.get(`/news/featured?limit=${limit}`);
  },

  // Get news by ID
  getNewsById: (id) => {
    return api.get(`/news/${id}`);
  },

  // Search news
  searchNews: (query, params = {}) => {
    const searchParams = new URLSearchParams({ search: query, ...params });
    return api.get(`/news?${searchParams.toString()}`);
  }
};

// ===== USER API =====
export const userAPI = {
  // Auth
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },

  register: (userData) => {
    return api.post('/auth/register', userData);
  },

  logout: () => {
    return api.post('/auth/logout');
  },

  // Profile
  getProfile: () => {
    return api.get('/auth/profile');
  },

  updateProfile: (profileData) => {
    return api.put('/auth/profile', profileData);
  },

  // Password
  changePassword: (passwordData) => {
    return api.put('/auth/password', passwordData);
  },

  // Admin user management
  getAllUsers: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    const queryString = searchParams.toString();
    const url = queryString ? `/users?${queryString}` : '/users';
    return api.get(url);
  },

  getUserById: (id) => {
    return api.get(`/users/${id}`);
  },

  updateUser: (id, userData) => {
    return api.put(`/users/${id}`, userData);
  },

  deleteUser: (id) => {
    return api.delete(`/users/${id}`);
  }
};

// ===== CONTACT API =====
export const contactAPI = {
  submitContact: (contactData) => {
    return api.post('/contact', contactData);
  },

  getAllContacts: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    const queryString = searchParams.toString();
    const url = queryString ? `/contacts?${queryString}` : '/contacts';
    return api.get(url);
  },

  getContactById: (id) => {
    return api.get(`/contacts/${id}`);
  },

  updateContact: (id, contactData) => {
    return api.put(`/contacts/${id}`, contactData);
  },

  deleteContact: (id) => {
    return api.delete(`/contacts/${id}`);
  }
};

// Export default api instance for direct use
export default api;