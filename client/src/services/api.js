// client/src/services/api.js - COMPLETE CONSOLIDATED API
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://furbabies-backend.onrender.com/api',
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

  // Get featured products
  getFeaturedProducts: (limit = 6) => {
    return api.get(`/products/featured?limit=${limit}`);
  },

  // Get product by ID
  getProductById: (id) => {
    return api.get(`/products/${id}`);
  },

  // Get product categories
  getCategories: () => {
    return api.get('/products/categories');
  },

  // Get product brands
  getBrands: () => {
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

// ===== NEWS API =====
export const newsAPI = {
  // Get all news (mixed custom + external)
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

  // Get featured news for home page (always works)
  getFeaturedNews: async (limit = 6) => {
    try {
      console.log(`🌟 Fetching ${limit} featured news articles...`);
      const response = await api.get(`/news/featured?limit=${limit}`);
      
      // Ensure consistent response format
      if (response.data && !response.data.success) {
        return {
          data: {
            success: true,
            data: Array.isArray(response.data) ? response.data : [],
            count: Array.isArray(response.data) ? response.data.length : 0
          }
        };
      }
      
      return response;
    } catch (error) {
      console.error('❌ Featured news fetch failed:', error);
      // Return fallback structure
      return {
        data: {
          success: true,
          data: getFallbackNews(),
          count: 3,
          isFallback: true
        }
      };
    }
  },

  // Get individual article by ID
  getNewsById: (id) => {
    return api.get(`/news/${id}`);
  },

  // Get only custom (admin-created) articles
  getCustomNews: (params = {}) => {
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

  // Get only external (NewsAPI) articles
  getExternalNews: (params = {}) => {
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

  // Get categories
  getCategories: () => api.get('/news/categories'),

  // Health check
  getHealth: () => api.get('/news/health'),

  // Like article
  likeArticle: (id) => api.post(`/news/${id}/like`),

  // Create article (admin)
  createArticle: (articleData) => {
    return api.post('/news', articleData);
  },

  // Update article (admin)
  updateArticle: (id, articleData) => {
    return api.put(`/news/${id}`, articleData);
  },

  // Delete article (admin)
  deleteArticle: (id) => {
    return api.delete(`/news/${id}`);
  }
};

// ===== USER API =====
export const userAPI = {
  // Authentication
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },

  register: (userData) => {
    return api.post('/auth/register', userData);
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  // Profile management
  getProfile: () => {
    return api.get('/users/profile');
  },

  updateProfile: (profileData) => {
    return api.put('/users/profile', profileData);
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

  createUser: (userData) => {
    return api.post('/users', userData);
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
  // Submit contact form
  submitContact: (contactData) => {
    return api.post('/contacts', contactData);
  },

  // Admin: Get all contacts
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

  // Admin: Update contact status
  updateContact: (id, updateData) => {
    return api.put(`/contacts/${id}`, updateData);
  },

  // Admin: Delete contact
  deleteContact: (id) => {
    return api.delete(`/contacts/${id}`);
  }
};

// ===== ADMIN API =====
export const adminAPI = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),
  getStats: () => api.get('/admin/stats'),

  // Reports
  getReports: (type, params = {}) => {
    const searchParams = new URLSearchParams(params);
    return api.get(`/admin/reports/${type}?${searchParams}`);
  },

  // Analytics
  getAnalytics: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return api.get(`/admin/analytics?${searchParams}`);
  },

  // Health checks
  healthCheck: () => api.get('/admin/health'),
  databaseHealth: () => api.get('/admin/health/database')
};

// Fallback news data
const getFallbackNews = () => [
  {
    id: 'fallback-1',
    title: 'Pet Adoption Tips for New Families',
    summary: 'Essential guide for families considering pet adoption.',
    publishedAt: new Date().toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400'
  },
  {
    id: 'fallback-2', 
    title: 'Senior Pet Care Guide',
    summary: 'Special considerations for caring for older pets.',
    publishedAt: new Date().toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400'
  },
  {
    id: 'fallback-3',
    title: 'Pet Health and Wellness',
    summary: 'Keeping your furry friends healthy and happy.',
    publishedAt: new Date().toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400'
  }
];

export default api;