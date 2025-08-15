// client/src/services/petServices.js - FIXED QUERY BUILDER WITH STATUS MAPPING

import api from './api';

/**
 * Build query string for pet API with proper parameter mapping
 * @param {Object} filters - Filter object from UI
 * @returns {string} - URL query string
 */
export function buildPetQuery(filters) {
  const q = new URLSearchParams();

  // Text search
  if (filters.search && filters.search.trim()) {
    q.set('search', filters.search.trim());
  }

  // Facet filters
  if (filters.type && filters.type !== 'all') {
    q.set('type', filters.type);
  }
  if (filters.category && filters.category !== 'all') {
    q.set('category', filters.category);
  }
  if (filters.size && filters.size !== 'all') {
    q.set('size', filters.size);
  }
  if (filters.gender && filters.gender !== 'all') {
    q.set('gender', filters.gender);
  }
  if (filters.age && filters.age !== 'all') {
    q.set('age', filters.age);
  }
  if (filters.breed && filters.breed !== 'all') {
    q.set('breed', filters.breed);
  }

  // Featured filter
  if (typeof filters.featured === 'boolean') {
    q.set('featured', String(filters.featured));
  }

  // ✅ CRITICAL FIX: Status ↔ Available mapping (match your backend!)
  if (filters.status === 'available') {
    q.set('available', 'true');
  } else if (filters.status && filters.status !== 'all') {
    // If your backend supports explicit statuses:
    q.set('status', filters.status);
  }

  // Sorting and pagination
  q.set('sort', filters.sort || 'newest');
  q.set('page', String(filters.page || 1));
  q.set('limit', String(filters.limit || 20));

  return q.toString();
}

/**
 * Search pets with filters - main API call
 * @param {Object} filters - Filter object
 * @returns {Promise<Object>} - API response with pets, pagination, etc.
 */
export async function searchPetsWithFilters(filters) {
  try {
    const queryString = buildPetQuery(filters);
    console.log('🔍 Pet search query:', queryString);
    
    // axios instance already has baseURL = http://localhost:5000/api
    const response = await api.get(`/pets?${queryString}`);
    
    // ✅ CRITICAL: Normalize image field for consistency
    if (response.data.success && response.data.data) {
      response.data.data = response.data.data.map(pet => ({
        ...pet,
        imageUrl: pet.image || pet.imageUrl || null, // ✅ now both work
      }));
    }
    
    console.log('✅ Pet search response:', {
      success: response.data.success,
      count: response.data.data?.length || 0,
      pagination: response.data.pagination,
      total: response.data.total || response.data.pagination?.totalCount
    });

    return response.data; // { success, data, pagination, total }
  } catch (error) {
    console.error('❌ Pet search error:', error);
    throw error;
  }
}

/**
 * Get featured pets
 * @param {number} limit - Number of pets to fetch
 * @returns {Promise<Object>} - API response
 */
export async function getFeaturedPets(limit = 6) {
  try {
    const response = await api.get(`/pets/featured?limit=${limit}`);
    
    // ✅ CRITICAL: Normalize image field for consistency
    if (response.data.success && response.data.data) {
      response.data.data = response.data.data.map(pet => ({
        ...pet,
        imageUrl: pet.image || pet.imageUrl || null, // ✅ now both work
      }));
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Featured pets error:', error);
    throw error;
  }
}

/**
 * Get single pet by ID
 * @param {string} petId - Pet ID
 * @returns {Promise<Object>} - API response
 */
export async function getPetById(petId) {
  try {
    const response = await api.get(`/pets/${petId}`);
    
    // ✅ CRITICAL: Normalize image field for consistency
    if (response.data.success && response.data.data) {
      response.data.data = {
        ...response.data.data,
        imageUrl: response.data.data.image || response.data.data.imageUrl || null,
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Get pet error:', error);
    throw error;
  }
}

/**
 * Get pet statistics for admin dashboard
 * @returns {Promise<Object>} - Stats object
 */
export async function getPetStats() {
  try {
    const response = await api.get('/pets/stats/summary');
    return response.data;
  } catch (error) {
    console.error('❌ Pet stats error:', error);
    throw error;
  }
}

/**
 * Create new pet (admin)
 * @param {Object} petData - Pet data
 * @returns {Promise<Object>} - Created pet
 */
export async function createPet(petData) {
  try {
    const response = await api.post('/pets', petData);
    return response.data;
  } catch (error) {
    console.error('❌ Create pet error:', error);
    throw error;
  }
}

/**
 * Update pet (admin)
 * @param {string} petId - Pet ID
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} - Updated pet
 */
export async function updatePet(petId, updateData) {
  try {
    const response = await api.patch(`/pets/${petId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('❌ Update pet error:', error);
    throw error;
  }
}

/**
 * Delete pet (admin)
 * @param {string} petId - Pet ID
 * @returns {Promise<Object>} - Deletion result
 */
export async function deletePet(petId) {
  try {
    const response = await api.delete(`/pets/${petId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Delete pet error:', error);
    throw error;
  }
}

/**
 * Get available filter options (breeds, etc.)
 * @returns {Promise<Object>} - Filter options
 */
export async function getPetFilterOptions() {
  try {
    // This would call an endpoint that returns available breeds, etc.
    // For now, return static options
    const filterOptions = {
      success: true,
      data: {
        types: ['dog', 'cat', 'bird', 'fish', 'rabbit', 'hamster', 'small-pet', 'other'],
        sizes: ['small', 'medium', 'large', 'extra-large'],
        genders: ['male', 'female', 'unknown'],
        ageGroups: ['young', 'adult', 'senior'],
        statuses: ['available', 'pending', 'adopted', 'not-available']
      }
    };
    
    return filterOptions;
  } catch (error) {
    console.error('❌ Pet filter options error:', error);
    throw error;
  }
}

// Export default object for easier importing - moved to end of file
const petServicesDefault = {
  buildPetQuery,
  searchPetsWithFilters,
  getFeaturedPets,
  getPetById,
  getPetStats,
  createPet,
  updatePet,
  deletePet,
  getPetFilterOptions
};

export default petServicesDefault;