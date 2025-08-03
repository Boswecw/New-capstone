// client/src/services/petService.js
import { petAPI } from './api';

// Pet service functions that wrap the API calls
export const getAllPets = async (params = {}) => {
  try {
    return await petAPI.getAllPets(params);
  } catch (error) {
    console.error('Error fetching all pets:', error);
    throw error;
  }
};

export const searchPets = async (params = {}) => {
  try {
    // Convert search parameters to the format your API expects
    const queryParams = {};
    
    if (params.search) queryParams.search = params.search;
    if (params.category) queryParams.category = params.category;
    if (params.breed) queryParams.breed = params.breed;
    if (params.age) queryParams.age = params.age;
    if (params.featured) queryParams.featured = params.featured;
    if (params.limit) queryParams.limit = params.limit;

    return await petAPI.getAllPets(queryParams);
  } catch (error) {
    console.error('Error searching pets:', error);
    throw error;
  }
};

export const getFeaturedPets = async (limit = 6) => {
  try {
    return await petAPI.getAllPets({ featured: true, limit });
  } catch (error) {
    console.error('Error fetching featured pets:', error);
    throw error;
  }
};

export const getPetById = async (id) => {
  try {
    return await petAPI.getPetById(id);
  } catch (error) {
    console.error('Error fetching pet by ID:', error);
    throw error;
  }
};

export const getPetsByCategory = async (category, limit = null) => {
  try {
    const params = { category };
    if (limit) params.limit = limit;
    return await petAPI.getAllPets(params);
  } catch (error) {
    console.error('Error fetching pets by category:', error);
    throw error;
  }
};

export const addToFavorites = async (petId) => {
  try {
    return await petAPI.addToFavorites(petId);
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
};

export const removeFromFavorites = async (petId) => {
  try {
    return await petAPI.removeFromFavorites(petId);
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};

// Admin functions (if needed)
export const createPet = async (petData) => {
  try {
    return await petAPI.createPet(petData);
  } catch (error) {
    console.error('Error creating pet:', error);
    throw error;
  }
};

export const updatePet = async (id, petData) => {
  try {
    return await petAPI.updatePet(id, petData);
  } catch (error) {
    console.error('Error updating pet:', error);
    throw error;
  }
};

export const deletePet = async (id) => {
  try {
    return await petAPI.deletePet(id);
  } catch (error) {
    console.error('Error deleting pet:', error);
    throw error;
  }
};

// Create the service object
const petService = {
  getAllPets,
  searchPets,
  getFeaturedPets,
  getPetById,
  getPetsByCategory,
  addToFavorites,
  removeFromFavorites,
  createPet,
  updatePet,
  deletePet
};

// Export as default
export default petService;