// client/src/services/api.js - UPDATED WITH VOTE & RATE PET

import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://furbabies-backend.onrender.com/api'
  : 'http://localhost:5000/api';

console.log('🔧 API_BASE_URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.status, error.response?.data);
    if (!error.response) {
      console.error('Network error - check if backend is running');
    }
    return Promise.reject(error);
  }
);

const userAPI = {
  login: (credentials) => api.post('/users/login', credentials),
  register: (userData) => api.post('/users/register', userData),
  logout: () => api.post('/users/logout'),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  changePassword: (passwordData) => api.put('/users/password', passwordData),
  forgotPassword: (email) => api.post('/users/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/users/reset-password', { token, password })
};

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
  getFeaturedPets: (limit = 4) => {
    console.log(`🐾 Fetching ${limit} featured pets from backend...`);
    return api.get(`/pets/featured?limit=${limit}`);
  },
  searchPets: (query, params = {}) => {
    const searchParams = new URLSearchParams({ search: query, ...params });
    return api.get(`/pets?${searchParams}`);
  },
  getPetsBySpecies: (species, params = {}) => {
    const searchParams = new URLSearchParams({ species, ...params });
    return api.get(`/pets?${searchParams}`);
  },
  getPetSpecies: () => api.get('/pets/meta/species'),
  createPet: (petData) => api.post('/pets', petData),
  updatePet: (id, petData) => api.put(`/pets/${id}`, petData),
  deletePet: (id) => api.delete(`/pets/${id}`),
  votePet: (id, voteType) => api.post(`/pets/${id}/vote`, { voteType }),
  ratePet: (id, payload) => api.post(`/pets/${id}/rate`, payload)
};

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
  getFeaturedProducts: (limit = 4) => {
    console.log(`🛒 Fetching ${limit} featured products from backend...`);
    return api.get(`/products/featured?limit=${limit}`);
  },
  searchProducts: (query, params = {}) => {
    const searchParams = new URLSearchParams({ search: query, ...params });
    return api.get(`/products?${searchParams}`);
  },
  getProductsByCategory: (category, params = {}) => {
    const searchParams = new URLSearchParams({ category, ...params });
    return api.get(`/products?${searchParams}`);
  },
  getProductCategories: () => api.get('/products/meta/categories'),
  getProductBrands: () => api.get('/products/meta/brands'),
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`)
};

const newsAPI = {
  getFeaturedNews: (limit = 3) => {
    console.log(`📰 Fetching ${limit} featured news from backend...`);
    return api.get(`/news/featured?limit=${limit}`);
  },
  getAllNews: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return api.get(`/news?${searchParams}`);
  },
  getNewsById: (id) => api.get(`/news/${id}`)
};

const contactAPI = {
  submitContact: (contactData) => {
    console.log('📧 Submitting contact form to backend...');
    return api.post('/contact', contactData);
  },
  getContactSubmissions: () => api.get('/contact'),
  updateContactSubmission: (id, data) => api.put(`/contact/${id}`, data)
};

const imageAPI = {
  getImageHealth: () => api.get('/images/health'),
  getOptimizationHealth: () => api.get('/images/optimization/health'),
  getImageMetadata: (imagePath) => api.get(`/images/metadata/gcs/${imagePath}`),
  batchOptimize: (imagePaths, preset = 'medium') => 
    api.post('/images/optimize-batch', { imagePaths, preset }),
  getImageUrl: (imagePath, options = {}) => {
    if (!imagePath) return null;
    const baseUrl = `${API_BASE_URL}/images/gcs`;
    const params = new URLSearchParams(options);
    return `${baseUrl}/${imagePath}${params.toString() ? '?' + params.toString() : ''}`;
  },
  getPresetImageUrl: (imagePath, preset = 'medium') => {
    if (!imagePath) return null;
    return `${API_BASE_URL}/images/preset/${preset}/gcs/${imagePath}`;
  },
  getFallbackImageUrl: (category = 'default') => {
    return `${API_BASE_URL}/images/fallback/${category}`;
  }
};

const gcsAPI = {
  getConfig: () => api.get('/gcs/config'),
  getHealth: () => api.get('/gcs/health'),
  listImages: (bucketName, params = {}) => {
    const searchParams = new URLSearchParams(params);
    return api.get(`/gcs/buckets/${bucketName}/images?${searchParams}`);
  }
};

const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getAllUsers: () => api.get('/admin/users'),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getAllPetsAdmin: () => api.get('/admin/pets'),
  getAllProductsAdmin: () => api.get('/admin/products'),
  getAllContactsAdmin: () => api.get('/admin/contacts')
};

const healthAPI = {
  getHealth: () => {
    console.log('🔍 Checking backend health...');
    return api.get('/health');
  },
  getImageHealth: () => imageAPI.getImageHealth(),
  getGCSHealth: () => gcsAPI.getHealth()
};

const apiUtils = {
  handleResponse: (response) => {
    if (response.data?.success) {
      return response.data;
    } else {
      throw new Error(response.data?.message || 'API request failed');
    }
  },
  buildQueryString: (params) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    return searchParams.toString();
  },
  getBaseURL: () => API_BASE_URL,
  checkBackendHealth: async () => {
    try {
      const response = await healthAPI.getHealth();
      console.log('✅ Backend is healthy:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Backend health check failed:', error);
      return false;
    }
  }
};

export {
  userAPI,
  petAPI,
  productAPI,
  newsAPI,
  contactAPI,
  imageAPI,
  gcsAPI,
  adminAPI,
  healthAPI,
  apiUtils,
  api
};

export default {
  user: userAPI,
  pet: petAPI,
  product: productAPI,
  news: newsAPI,
  contact: contactAPI,
  image: imageAPI,
  gcs: gcsAPI,
  admin: adminAPI,
  health: healthAPI,
  utils: apiUtils
};