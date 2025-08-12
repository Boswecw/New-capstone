// client/src/services/petServices.js - FIXED WITH PROPER IMPORTS

import { petAPI } from './api';
import { PetFilterUtils, validateFilters } from '../config/petFilters';

// ✅ Enhanced pet service functions
export const getAllPets = async (params = {}) => {
  try {
    return await petAPI.getAllPets(params);
  } catch (error) {
    console.error('Error fetching all pets:', error);
    throw error;
  }
};

// ✅ Enhanced search with new filter system
export const searchPetsWithFilters = async (filters = {}) => {
  try {
    // Validate filters first
    const validatedFilters = validateFilters(filters);
    
    // Convert to query parameters for backend
    const queryParams = PetFilterUtils.filtersToQueryString(validatedFilters);
    
    console.log('🔍 Searching pets with filters:', validatedFilters);
    console.log('📡 Query params:', queryParams.toString());
    
    const response = await petAPI.getAllPets(queryParams);
    
    // Apply client-side filtering for immediate response if needed
    if (response.data?.success && response.data.data) {
      const serverPets = response.data.data;
      
      // Only apply client-side filtering if we have additional filters not handled by server
      const needsClientFiltering = validatedFilters.search && validatedFilters.search.length > 0;
      
      if (needsClientFiltering) {
        const clientFilteredPets = PetFilterUtils.filterPets(serverPets, validatedFilters);
        
        return {
          ...response,
          data: {
            ...response.data,
            data: clientFilteredPets,
            clientFiltered: true
          }
        };
      }
    }
    
    return response;
  } catch (error) {
    console.error('Error searching pets with filters:', error);
    throw error;
  }
};

// ✅ Legacy search function with new system
export const searchPets = async (params = {}) => {
  try {
    // Convert old params to new filter format
    const filters = {
      search: params.search || '',
      category: params.category || 'all',
      type: params.breed || params.type || 'all',
      age: params.age || 'all',
      featured: params.featured || null,
      size: params.size || 'all',
      gender: params.gender || 'all',
      status: params.status || 'available',
      sort: params.sort || 'newest',
      page: params.page || 1,
      limit: params.limit || 20
    };
    
    return await searchPetsWithFilters(filters);
  } catch (error) {
    console.error('Error in legacy search pets:', error);
    throw error;
  }
};

// ✅ Enhanced: Get featured pets with category support
export const getFeaturedPets = async (limit = 6, category = null) => {
  try {
    const filters = { 
      featured: true,
      status: 'available',
      limit: limit
    };
    
    if (category && category !== 'all') {
      filters.category = category;
    }
    
    const queryParams = PetFilterUtils.filtersToQueryString(filters);
    
    return await petAPI.getAllPets(queryParams);
  } catch (error) {
    console.error('Error fetching featured pets:', error);
    throw error;
  }
};

// ✅ Get pets by new category system
export const getPetsByCategory = async (category, limit = null) => {
  try {
    const filters = { 
      category,
      status: 'available'
    };
    
    if (limit) {
      filters.limit = limit;
    }
    
    const queryParams = PetFilterUtils.filtersToQueryString(filters);
    
    return await petAPI.getAllPets(queryParams);
  } catch (error) {
    console.error('Error fetching pets by category:', error);
    throw error;
  }
};

// ✅ Get filter counts for UI
export const getFilterCounts = async () => {
  try {
    // Get all pets to calculate counts
    const response = await petAPI.getAllPets({ limit: 1000 });
    
    if (response.data?.success && response.data.data) {
      const counts = PetFilterUtils.countPetsForFilters(response.data.data);
      return { success: true, data: counts };
    }
    
    return { success: false, data: {} };
  } catch (error) {
    console.error('Error getting filter counts:', error);
    return { success: false, data: {} };
  }
};

// ✅ Get popular filter combinations
export const getPopularFilterCombinations = async () => {
  try {
    const combinations = PetFilterUtils.getPopularCombinations();
    
    // Get counts for each combination
    const combinationsWithCounts = await Promise.all(
      combinations.map(async (combo) => {
        try {
          const response = await searchPetsWithFilters(combo.filters);
          return {
            ...combo,
            count: response.data?.pagination?.total || 0
          };
        } catch (error) {
          console.error('Error getting count for combination:', combo.label, error);
          return { ...combo, count: 0 };
        }
      })
    );
    
    return { success: true, data: combinationsWithCounts };
  } catch (error) {
    console.error('Error getting popular combinations:', error);
    return { success: false, data: [] };
  }
};

// ✅ Existing functions - keep as is
export const getPetById = async (id) => {
  try {
    return await petAPI.getPetById(id);
  } catch (error) {
    console.error('Error fetching pet by ID:', error);
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

// Admin functions
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

// ✅ Enhanced service object with all new functions
const petService = {
  // Core functions
  getAllPets,
  searchPets,
  searchPetsWithFilters,
  getFeaturedPets,
  getPetById,
  getPetsByCategory,
  
  // Filter utilities
  getFilterCounts,
  getPopularFilterCombinations,
  
  // User functions
  addToFavorites,
  removeFromFavorites,
  
  // Admin functions
  createPet,
  updatePet,
  deletePet
};

export default petService;