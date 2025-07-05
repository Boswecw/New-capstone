// services/api.js
import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5 second timeout
});

// Helper function to generate image URLs with fallbacks
export const getImageUrl = (imagePath, fallback = '/images/placeholder.png') => {
  if (!imagePath) return fallback;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) return imagePath;
  
  // Build backend URL
  const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  return `${baseURL.replace('/api', '')}/${imagePath}`;
};

// Request interceptor to add auth token - SAFER VERSION
api.interceptors.request.use(
  (config) => {
    // Check if localStorage is available (browser environment)
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling auth errors - SAFER VERSION
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API error:', error);
    
    // Check if we're in browser environment before accessing localStorage/window
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth functions
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    localStorage.removeItem('token');
    return response.data;
  },
  
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  
  resetPassword: async (token, password) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  
  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  }
};

// Pet functions
export const petAPI = {
  getAllPets: async (params) => {
    const response = await api.get('/pets', { params });
    return response.data;
  },
  
  getPetById: async (id) => {
    const response = await api.get(`/pets/${id}`);
    return response.data;
  },
  
  createPet: async (petData) => {
    const response = await api.post('/pets', petData);
    return response.data;
  },
  
  updatePet: async (id, petData) => {
    const response = await api.put(`/pets/${id}`, petData);
    return response.data;
  },
  
  deletePet: async (id) => {
    const response = await api.delete(`/pets/${id}`);
    return response.data;
  },
  
  addToFavorites: async (petId) => {
    const response = await api.post(`/pets/${petId}/favorite`);
    return response.data;
  },
  
  removeFromFavorites: async (petId) => {
    const response = await api.delete(`/pets/${petId}/favorite`);
    return response.data;
  }
};

// Contact functions
export const contactAPI = {
  submitContact: async (contactData) => {
    const response = await api.post('/contact', contactData);
    return response.data;
  },
  
  getAllContacts: async () => {
    const response = await api.get('/admin/contacts');
    return response.data;
  },
  
  updateContactStatus: async (id, status) => {
    const response = await api.put(`/admin/contacts/${id}`, { status });
    return response.data;
  },
  
  deleteContact: async (id) => {
    const response = await api.delete(`/admin/contacts/${id}`);
    return response.data;
  }
};

// Admin functions
export const adminAPI = {
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },
  
  getAllUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },
  
  updateUserRole: async (userId, role) => {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },
  
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  }
};

// Export the axios instance as default
export default api;