// client/src/services/api.js - RENDER DEPLOYMENT FIXED
import axios from 'axios';

// ✅ RENDER FIX: Simple API base URL configuration
const getApiBaseUrl = () => {
  // Production (Render)
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_BASE_URL || 'https://new-capstone-backend.onrender.com/api';
  }
  
  // Development
  return process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔧 API Service Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  API_BASE_URL,
  REACT_APP_API_BASE_URL: process.env.REACT_APP_API_BASE_URL
});

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const endpoint = response.config.url?.replace(response.config.baseURL, '') || '';
    console.log(`✅ API Success: ${response.status} ${endpoint}`);
    console.log('📦 Response Data:', response.data);
    return response;
  },
  (error) => {
    const endpoint = error.config?.url?.replace(error.config?.baseURL, '') || 'unknown';
    console.error(`❌ API Error: ${error.response?.status || 'Network'} ${endpoint}`, error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// ===== PET API =====
export const petAPI = {
  getAllPets: (params = {}) => {
    console.log('🐕 petAPI.getAllPets called with params:', params);
    return api.get('/pets', { params });
  },

  getPetById: (id) => {
    if (!id) {
      console.error('❌ petAPI.getPetById: Pet ID is required');
      return Promise.reject(new Error('Pet ID is required'));
    }
    console.log('🐕 petAPI.getPetById called with ID:', id);
    return api.get(`/pets/${id}`);
  },

  createPet: (petData) => {
    console.log('🐕 petAPI.createPet called');
    return api.post('/pets', petData);
  },

  updatePet: (id, petData) => {
    console.log('🐕 petAPI.updatePet called for ID:', id);
    return api.put(`/pets/${id}`, petData);
  },

  deletePet: (id) => {
    console.log('🐕 petAPI.deletePet called for ID:', id);
    return api.delete(`/pets/${id}`);
  }
};

// ===== USER API =====
export const userAPI = {
  register: (userData) => {
    console.log('👤 userAPI.register called');
    return api.post('/users/register', userData);
  },

  login: (credentials) => {
    console.log('🔐 userAPI.login called');
    return api.post('/users/login', credentials);
  },

  getProfile: () => {
    console.log('👤 userAPI.getProfile called');
    return api.get('/users/profile');
  },

  updateProfile: (profileData) => {
    console.log('👤 userAPI.updateProfile called');
    return api.put('/users/profile', profileData);
  },

  getFavorites: () => {
    console.log('❤️ userAPI.getFavorites called');
    return api.get('/users/favorites');
  },

  addToFavorites: (petId) => {
    console.log('❤️ userAPI.addToFavorites called for pet:', petId);
    return api.post(`/users/favorites/${petId}`);
  },

  removeFromFavorites: (petId) => {
    console.log('💔 userAPI.removeFromFavorites called for pet:', petId);
    return api.delete(`/users/favorites/${petId}`);
  }
};

// ===== ADMIN API =====
export const adminAPI = {
  getDashboard: () => {
    console.log('📊 adminAPI.getDashboard called');
    return api.get('/admin/dashboard');
  },

  getUsers: (params = {}) => {
    console.log('👥 adminAPI.getUsers called with params:', params);
    return api.get('/admin/users', { params });
  },

  updateUserRole: (userId, role) => {
    console.log('👑 adminAPI.updateUserRole called for user:', userId);
    return api.put(`/admin/users/${userId}/role`, { role });
  },

  updateUserStatus: (userId, isActive) => {
    console.log('🔄 adminAPI.updateUserStatus called for user:', userId);
    return api.put(`/admin/users/${userId}/status`, { isActive });
  },

  deleteUser: (userId) => {
    console.log('🗑️ adminAPI.deleteUser called for user:', userId);
    return api.delete(`/admin/users/${userId}`);
  },

  getPets: (params = {}) => {
    console.log('🐕 adminAPI.getPets called with params:', params);
    return api.get('/admin/pets', { params });
  },

  createPet: (petData) => {
    console.log('🐕 adminAPI.createPet called');
    return api.post('/admin/pets', petData);
  },

  updatePet: (petId, petData) => {
    console.log('🐕 adminAPI.updatePet called for pet:', petId);
    return api.put(`/admin/pets/${petId}`, petData);
  },

  deletePet: (petId) => {
    console.log('🗑️ adminAPI.deletePet called for pet:', petId);
    return api.delete(`/admin/pets/${petId}`);
  },

  getContacts: (params = {}) => {
    console.log('📧 adminAPI.getContacts called with params:', params);
    return api.get('/admin/contacts', { params });
  },

  getContact: (contactId) => {
    console.log('📧 adminAPI.getContact called for contact:', contactId);
    return api.get(`/admin/contacts/${contactId}`);
  },

  updateContactStatus: (contactId, status) => {
    console.log('📧 adminAPI.updateContactStatus called for contact:', contactId);
    return api.put(`/admin/contacts/${contactId}/status`, { status });
  },

  respondToContact: (contactId, message) => {
    console.log('📧 adminAPI.respondToContact called for contact:', contactId);
    return api.put(`/admin/contacts/${contactId}/respond`, { message });
  },

  deleteContact: (contactId) => {
    console.log('🗑️ adminAPI.deleteContact called for contact:', contactId);
    return api.delete(`/admin/contacts/${contactId}`);
  }
};

// ===== CONTACT API =====
export const contactAPI = {
  submitContact: (contactData) => {
    console.log('📧 contactAPI.submitContact called');
    return api.post('/contact', contactData);
  }
};

// ===== EXPORT DEFAULT =====
export default api;

// ===== EXPORT API BASE URL =====
export { API_BASE_URL };