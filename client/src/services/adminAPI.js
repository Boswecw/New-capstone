// client/src/services/adminAPI.js - SHARED ADMIN API SERVICE
import axios from 'axios';

// ✅ Create dedicated admin API instance
const adminApi = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://furbabies-backend.onrender.com/api'
    : 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add auth token interceptor
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`📡 Admin API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Add response interceptor with better error handling
adminApi.interceptors.response.use(
  (response) => {
    console.log(`✅ Admin API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Admin API Error:', error.response?.status, error.response?.data);
    
    // Handle common admin errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      console.error('Admin access denied');
    }
    
    return Promise.reject(error);
  }
);

// ===== ADMIN API METHODS =====
const adminAPI = {
  // Dashboard
  getDashboard: () => adminApi.get('/admin/dashboard'),
  getStats: () => adminApi.get('/admin/stats'),
  
  // Pets Management
  getAllPets: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return adminApi.get(`/admin/pets?${searchParams}`);
  },
  createPet: (petData) => adminApi.post('/admin/pets', petData),
  updatePet: (id, petData) => adminApi.put(`/admin/pets/${id}`, petData),
  deletePet: (id) => adminApi.delete(`/admin/pets/${id}`),
  adoptPet: (id, userId) => adminApi.post(`/admin/pets/${id}/adopt`, { userId }),
  
  // Users Management
  getAllUsers: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return adminApi.get(`/admin/users?${searchParams}`);
  },
  getUserById: (id) => adminApi.get(`/admin/users/${id}`),
  createUser: (userData) => adminApi.post('/admin/users', userData),
  updateUser: (id, userData) => adminApi.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => adminApi.delete(`/admin/users/${id}`),
  
  // Contacts Management
  getAllContacts: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return adminApi.get(`/admin/contacts?${searchParams}`);
  },
  updateContact: (id, contactData) => adminApi.put(`/admin/contacts/${id}`, contactData),
  deleteContact: (id) => adminApi.delete(`/admin/contacts/${id}`),
  
  // Products Management
  getAllProducts: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return adminApi.get(`/admin/products?${searchParams}`);
  },
  createProduct: (productData) => adminApi.post('/admin/products', productData),
  updateProduct: (id, productData) => adminApi.put(`/admin/products/${id}`, productData),
  deleteProduct: (id) => adminApi.delete(`/admin/products/${id}`),
  
  // Reports
  getReports: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return adminApi.get(`/admin/reports?${searchParams}`);
  },
  
  // Analytics
  getAnalytics: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return adminApi.get(`/admin/analytics?${searchParams}`);
  },
  
  // Settings
  getSettings: () => adminApi.get('/admin/settings'),
  updateSettings: (settings) => adminApi.put('/admin/settings', settings),
  
  // System
  getSystemInfo: () => adminApi.get('/admin/system'),
  performMaintenance: (action) => adminApi.post(`/admin/maintenance/${action}`),
  
  // Batch Operations
  batchDeletePets: (petIds) => adminApi.post('/admin/pets/batch-delete', { petIds }),
  batchUpdatePets: (updates) => adminApi.post('/admin/pets/batch-update', updates),
  batchDeleteUsers: (userIds) => adminApi.post('/admin/users/batch-delete', { userIds }),
  
  // Health Checks
  healthCheck: () => adminApi.get('/admin/health'),
  databaseHealth: () => adminApi.get('/admin/health/database'),
  
  // Utilities
  exportData: (type, params = {}) => {
    const searchParams = new URLSearchParams(params);
    return adminApi.get(`/admin/export/${type}?${searchParams}`, {
      responseType: 'blob'
    });
  },
  
  importData: (type, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return adminApi.post(`/admin/import/${type}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

// Helper functions for common admin operations
export const adminHelpers = {
  // Format API response
  handleResponse: (response) => {
    if (response.data?.success) {
      return response.data;
    } else {
      throw new Error(response.data?.message || 'Operation failed');
    }
  },
  
  // Build query parameters
  buildParams: (filters) => {
    const params = {};
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== '') {
        params[key] = filters[key];
      }
    });
    return params;
  },
  
  // Handle pagination
  getPaginationInfo: (response) => {
    return response.data?.pagination || {};
  },
  
  // Handle errors consistently
  handleError: (error, fallbackMessage = 'An error occurred') => {
    const message = error.response?.data?.message || error.message || fallbackMessage;
    console.error('Admin API Error:', message, error);
    return message;
  }
};

// Export the admin API
export default adminAPI;