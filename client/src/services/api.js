import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
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

// Pet API functions
export const getPets = async (category = '') => {
  try {
    const endpoint = category ? `/pets?category=${category}` : '/pets';
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching pets:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch pets');
  }
};

export const getPetById = async (id) => {
  try {
    const response = await api.get(`/pets/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching pet:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch pet details');
  }
};

export const searchPets = async (query) => {
  try {
    const response = await api.get(`/pets/search?q=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Error searching pets:', error);
    throw new Error(error.response?.data?.message || 'Failed to search pets');
  }
};

// Auth API functions
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    const { token, user } = response.data;
    
    if (token) {
      localStorage.setItem('token', token);
    }
    
    return { token, user };
  } catch (error) {
    console.error('Login error:', error);
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch user data');
  }
};

// Export the axios instance as default
export default api;