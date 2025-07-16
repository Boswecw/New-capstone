// client/src/services/api.js - FIXED VERSION (Remove duplicate exports)
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://furbabies-backend.onrender.com/api'  // Your working backend
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
const userAPI = {
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/users/login', credentials),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  addFavorite: (petId) => api.post(`/users/favorites/${petId}`),
  removeFavorite: (petId) => api.delete(`/users/favorites/${petId}`),
  getFavorites: () => api.get('/users/favorites'),
};

// ===== PET API =====
const petAPI = {
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
  addToFavorites: (petId) => api.post(`/pets/${petId}/favorites`),
  removeFromFavorites: (petId) => api.delete(`/pets/${petId}/favorites`),
  
  // Add missing getRandomPets method
  getRandomPets: (limit = 6) => {
    const searchParams = new URLSearchParams();
    searchParams.append('limit', limit);
    searchParams.append('random', 'true');
    return api.get(`/pets?${searchParams}`);
  },
  
  // Add missing getRandomProducts method (if needed)
  getFeaturedPets: (limit = 6) => {
    const searchParams = new URLSearchParams();
    searchParams.append('featured', 'true');
    searchParams.append('limit', limit);
    return api.get(`/pets?${searchParams}`);
  },
};

// ===== PRODUCT API =====
const productAPI = {
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
  
  // Add missing getRandomProducts method
  getRandomProducts: (limit = 6) => {
    const searchParams = new URLSearchParams();
    searchParams.append('limit', limit);
    searchParams.append('random', 'true');
    return api.get(`/products?${searchParams}`);
  },
  
  // Add missing getFeaturedProducts method
  getFeaturedProducts: (limit = 6) => {
    const searchParams = new URLSearchParams();
    searchParams.append('featured', 'true');
    searchParams.append('limit', limit);
    return api.get(`/products?${searchParams}`);
  },
};

// ===== NEWS API =====
const newsAPI = {
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

// ===== CONTACT API =====
const contactAPI = {
  submitContact: (contactData) => api.post('/contact', contactData),
  getAllContacts: () => api.get('/contact'),
  getContactById: (id) => api.get(`/contact/${id}`),
  updateContact: (id, contactData) => api.put(`/contact/${id}`, contactData),
  deleteContact: (id) => api.delete(`/contact/${id}`),
};

// ===== ADMIN API ===== 
const adminAPI = {
  // Dashboard stats
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  
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
  
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  
  // Content management
  getAllContent: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    return api.get(`/admin/content?${searchParams}`);
  },
  
  // Mock settings for now
  getSettings: () => {
    return Promise.resolve({
      data: {
        success: true,
        data: {
          siteName: 'FurBabies Pet Store',
          contactEmail: 'contact@furbabies.com',
          maintenanceMode: false,
          allowRegistration: true,
          updatedAt: new Date().toISOString()
        }
      }
    });
  },
  
  updateSettings: (settingsData) => {
    return Promise.resolve({
      data: {
        success: true,
        message: 'Settings updated successfully',
        data: {
          ...settingsData,
          updatedAt: new Date().toISOString()
        }
      }
    });
  },

  getAnalytics: (params = {}) => {
    // Mock analytics data until backend endpoint is ready
    const mockAnalytics = {
      overview: {
        totalVisits: 15420,
        uniqueVisitors: 8930,
        pageViews: 45230,
        bounceRate: 32.5
      },
      pets: {
        totalViews: 12350,
        adoptionRate: 18.5,
        popularBreeds: [
          { name: 'Golden Retriever', views: 1250 },
          { name: 'Persian Cat', views: 980 },
          { name: 'Labrador', views: 875 }
        ]
      },
      products: {
        totalViews: 8960,
        conversionRate: 12.3,
        topCategories: [
          { name: 'Dog Food', sales: 450 },
          { name: 'Cat Toys', sales: 320 },
          { name: 'Pet Care', sales: 280 }
        ]
      },
      trends: {
        dailyVisits: [120, 150, 180, 145, 200, 175, 160],
        weeklySignups: [25, 30, 28, 35, 42, 38, 45]
      },
      timeRange: params.range || '30days'
    };

    return Promise.resolve({
      data: {
        success: true,
        data: mockAnalytics,
        message: 'Analytics data retrieved successfully'
      }
    });
  }
};

// ===== UTILITY FUNCTIONS =====
const handleApiError = (error) => {
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
const testConnection = async () => {
  try {
    const response = await api.get('/health');
    console.log('✅ API Connection successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ API Connection failed:', error);
    return { success: false, error: handleApiError(error) };
  }
};

// SINGLE EXPORT STATEMENT - This fixes the duplicate export issue
export {
  petAPI,
  productAPI,
  newsAPI,
  userAPI,
  contactAPI,
  adminAPI,
  handleApiError,
  testConnection
};

// Default export for backward compatibility
export default api;