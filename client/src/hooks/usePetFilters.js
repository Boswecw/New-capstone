// client/src/hooks/usePetFilters.js - COMPLETE FIXED VERSION
import { useState, useMemo, useCallback } from 'react';

// Utils (add fallback if these don't exist)
const buildPetImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `https://storage.googleapis.com/furbabies-petstore/${imagePath}`;
};

/**
 * Custom hook for filtering and managing pet data
 * Handles array safety to prevent "pets.map is not a function" errors
 * @param {Array|Object} pets - Array of pet objects or API response object
 * @param {Object} initialFilters - Initial filter state
 * @returns {Object} Filter state and methods
 */
const usePetFilters = (pets = [], initialFilters = {}) => {
  
  // ✅ CRITICAL FIX: Always ensure pets is an array and sanitize data
  const safePets = useMemo(() => {
    console.log('🔍 usePetFilters: Input pets type:', typeof pets, 'isArray:', Array.isArray(pets));
    
    // Handle null/undefined
    if (!pets) {
      console.warn('⚠️ usePetFilters: pets is null/undefined, using empty array');
      return [];
    }
    
    // If it's already an array, use it
    if (Array.isArray(pets)) {
      console.log('✅ usePetFilters: pets is array with length:', pets.length);
      // ✅ CRITICAL FIX: Sanitize pet data to ensure text fields are strings
      return pets.filter(pet => pet != null).map(pet => ({
        ...pet,
        name: typeof pet.name === 'string' ? pet.name : String(pet.name || 'Unknown Pet'),
        breed: typeof pet.breed === 'string' ? pet.breed : String(pet.breed || 'Unknown Breed'),
        description: typeof pet.description === 'string' ? pet.description : String(pet.description || ''),
        location: typeof pet.location === 'string' ? pet.location : String(pet.location || ''),
        species: typeof pet.species === 'string' ? pet.species : String(pet.species || pet.type || ''),
        type: typeof pet.type === 'string' ? pet.type : String(pet.type || pet.species || '')
      }));
    }
    
    // Handle common API response structures
    if (typeof pets === 'object') {
      console.log('🔄 usePetFilters: pets is object, checking for common structures...');
      
      let extractedPets = [];
      
      // Structure: { success: true, data: [...] }
      if (pets.success && pets.data && Array.isArray(pets.data)) {
        console.log('✅ usePetFilters: Found pets array at pets.data (success response)');
        extractedPets = pets.data;
      }
      // Structure: { data: [...] }
      else if (pets.data && Array.isArray(pets.data)) {
        console.log('✅ usePetFilters: Found pets array at pets.data');
        extractedPets = pets.data;
      }
      // Structure: { pets: [...] }
      else if (pets.pets && Array.isArray(pets.pets)) {
        console.log('✅ usePetFilters: Found pets array at pets.pets');
        extractedPets = pets.pets;
      }
      // Structure: { data: { data: [...] } }
      else if (pets.data && pets.data.data && Array.isArray(pets.data.data)) {
        console.log('✅ usePetFilters: Found pets array at pets.data.data (nested)');
        extractedPets = pets.data.data;
      }
      
      // ✅ CRITICAL FIX: Sanitize extracted pets data
      if (extractedPets.length > 0) {
        return extractedPets.filter(pet => pet != null).map(pet => ({
          ...pet,
          name: typeof pet.name === 'string' ? pet.name : String(pet.name || 'Unknown Pet'),
          breed: typeof pet.breed === 'string' ? pet.breed : String(pet.breed || 'Unknown Breed'),
          description: typeof pet.description === 'string' ? pet.description : String(pet.description || ''),
          location: typeof pet.location === 'string' ? pet.location : String(pet.location || ''),
          species: typeof pet.species === 'string' ? pet.species : String(pet.species || pet.type || ''),
          type: typeof pet.type === 'string' ? pet.type : String(pet.type || pet.species || '')
        }));
      }
    }
    
    // Last resort: return empty array
    console.error('❌ usePetFilters: Could not find valid pets array, using empty array. Received:', pets);
    return [];
  }, [pets]);

  const [filters, setFilters] = useState({
    species: '',
    breed: '',
    age: '',
    size: '',
    gender: '',
    status: 'available',
    search: '',
    location: '',
    hasImages: false,
    ...initialFilters
  });

  const [sortBy, setSortBy] = useState('newest');
  const [sortOrder, setSortOrder] = useState('desc');

  // Update specific filter
  const updateFilter = useCallback((key, value) => {
    console.log('🔄 usePetFilters: Updating filter', key, '=', value);
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Update multiple filters at once
  const updateFilters = useCallback((newFilters) => {
    console.log('🔄 usePetFilters: Updating multiple filters', newFilters);
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    console.log('🔄 usePetFilters: Resetting all filters');
    setFilters({
      species: '',
      breed: '',
      age: '',
      size: '',
      gender: '',
      status: 'available',
      search: '',
      location: '',
      hasImages: false,
      ...initialFilters
    });
  }, [initialFilters]);

  // ✅ FIXED: Get unique values for filter options using safePets
  const filterOptions = useMemo(() => {
    console.log('🔄 usePetFilters: Calculating filter options from', safePets.length, 'pets');
    
    if (safePets.length === 0) {
      return {
        species: [],
        breeds: [],
        ages: [],
        sizes: [],
        genders: [],
        statuses: [],
        locations: []
      };
    }

    try {
      // Handle both 'species' and 'type' fields for compatibility
      const species = [...new Set(safePets.map(pet => pet?.species || pet?.type).filter(Boolean))];
      const breeds = [...new Set(safePets.map(pet => pet?.breed).filter(Boolean))];
      const ages = [...new Set(safePets.map(pet => pet?.age).filter(Boolean))];
      const sizes = [...new Set(safePets.map(pet => pet?.size).filter(Boolean))];
      const genders = [...new Set(safePets.map(pet => pet?.gender).filter(Boolean))];
      const statuses = [...new Set(safePets.map(pet => pet?.status).filter(Boolean))];
      const locations = [...new Set(safePets.map(pet => pet?.location).filter(Boolean))];

      return {
        species: species.sort(),
        breeds: breeds.sort(),
        ages: ages.sort(),
        sizes: sizes.sort(),
        genders: genders.sort(),
        statuses: statuses.sort(),
        locations: locations.sort()
      };
    } catch (error) {
      console.error('❌ usePetFilters: Error creating filter options:', error);
      return {
        species: [],
        breeds: [],
        ages: [],
        sizes: [],
        genders: [],
        statuses: [],
        locations: []
      };
    }
  }, [safePets]);

  // ✅ FIXED: Filter pets based on current filters using safePets
  const filteredPets = useMemo(() => {
    console.log('🔄 usePetFilters: Filtering', safePets.length, 'pets with filters:', filters);
    
    if (safePets.length === 0) {
      console.log('⚠️ usePetFilters: No pets to filter');
      return [];
    }

    try {
      let filtered = safePets.filter(pet => {
        // Handle null/undefined pet objects
        if (!pet) {
          console.warn('⚠️ usePetFilters: Skipping null/undefined pet');
          return false;
        }

        // Species/Type filter (handle both fields)
        const petType = pet.type || pet.species;
        if (filters.species && filters.species !== '' && petType !== filters.species) {
          return false;
        }

        // Breed filter
        if (filters.breed && filters.breed !== '' && pet.breed !== filters.breed) {
          return false;
        }

        // Age filter
        if (filters.age && filters.age !== '' && pet.age !== filters.age) {
          return false;
        }

        // Size filter
        if (filters.size && filters.size !== '' && pet.size !== filters.size) {
          return false;
        }

        // Gender filter
        if (filters.gender && filters.gender !== '' && pet.gender !== filters.gender) {
          return false;
        }

        // Status filter
        if (filters.status && filters.status !== '' && pet.status !== filters.status) {
          return false;
        }

        // Location filter
        if (filters.location && filters.location !== '' && pet.location !== filters.location) {
          return false;
        }

        // Search filter (name, breed, description)
        if (filters.search && filters.search.trim() !== '') {
          const searchTerm = filters.search.toLowerCase().trim();
          const searchableText = [
            pet.name,
            pet.breed,
            pet.description
          ].filter(Boolean).join(' ').toLowerCase();
          
          if (!searchableText.includes(searchTerm)) {
            return false;
          }
        }

        // Has images filter
        if (filters.hasImages) {
          const hasImage = pet.image || pet.image_url || (pet.images && pet.images.length > 0);
          if (!hasImage) {
            return false;
          }
        }

        return true;
      });

      // ✅ FIXED: Sort the filtered results
      filtered.sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'name':
            comparison = (a.name || '').localeCompare(b.name || '');
            break;
          case 'age':
            const ageA = parseInt(a.age) || 0;
            const ageB = parseInt(b.age) || 0;
            comparison = ageA - ageB;
            break;
          case 'breed':
            comparison = (a.breed || '').localeCompare(b.breed || '');
            break;
          case 'newest':
            const dateA = new Date(a.createdAt || a.created_at || 0);
            const dateB = new Date(b.createdAt || b.created_at || 0);
            comparison = dateA - dateB;
            break;
          case 'featured':
            comparison = (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
            break;
          default:
            comparison = 0;
        }

        return sortOrder === 'desc' ? -comparison : comparison;
      });

      console.log(`✅ usePetFilters: Filtered ${filtered.length} pets from ${safePets.length} total`);
      return filtered;
      
    } catch (error) {
      console.error('❌ usePetFilters: Error filtering pets:', error);
      return [];
    }
  }, [safePets, filters, sortBy, sortOrder]);

  // ✅ FIXED: Enhance pets with proper image URLs using safePets
  const enhancedPets = useMemo(() => {
    console.log('🔄 usePetFilters: Enhancing', filteredPets.length, 'pets with image URLs');
    
    try {
      return filteredPets.map(pet => {
        if (!pet) return pet;
        
        return {
          ...pet,
          imageUrl: pet.image_url || pet.image || buildPetImageUrl(pet.image),
          imageUrls: pet.images || []
        };
      });
    } catch (error) {
      console.error('❌ usePetFilters: Error enhancing pets:', error);
      return filteredPets;
    }
  }, [filteredPets]);

  // ✅ FIXED: Get filter statistics using safePets
  const filterStats = useMemo(() => {
    try {
      const stats = {
        total: safePets.length,
        filtered: filteredPets.length,
        available: filteredPets.filter(pet => pet?.status === 'available').length,
        adopted: filteredPets.filter(pet => pet?.status === 'adopted').length,
        pending: filteredPets.filter(pet => pet?.status === 'pending').length,
        withImages: filteredPets.filter(pet => 
          pet?.image || pet?.image_url || (pet?.images && pet.images.length > 0)
        ).length
      };
      
      console.log('📊 usePetFilters: Filter stats:', stats);
      return stats;
    } catch (error) {
      console.error('❌ usePetFilters: Error calculating filter stats:', error);
      return {
        total: 0,
        filtered: 0,
        available: 0,
        adopted: 0,
        pending: 0,
        withImages: 0
      };
    }
  }, [safePets, filteredPets]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    const defaultFilters = {
      species: '',
      breed: '',
      age: '',
      size: '',
      gender: '',
      status: 'available',
      search: '',
      location: '',
      hasImages: false
    };

    const isActive = Object.keys(filters).some(key => 
      filters[key] !== defaultFilters[key]
    );
    
    console.log('🔄 usePetFilters: Has active filters:', isActive);
    return isActive;
  }, [filters]);

  // ✅ DEBUG: Log what we're returning in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🐾 usePetFilters debug summary:', {
      inputPetsType: Array.isArray(pets) ? 'array' : typeof pets,
      inputPetsLength: Array.isArray(pets) ? pets.length : 'N/A',
      safePetsLength: safePets.length,
      filteredLength: filteredPets.length,
      enhancedLength: enhancedPets.length,
      hasActiveFilters,
      currentFilters: filters,
      filterStats
    });
  }

  return {
    filters,
    sortBy,
    sortOrder,
    filteredPets: enhancedPets,
    filterOptions,
    filterStats,
    hasActiveFilters,
    updateFilter,
    updateFilters,
    resetFilters,
    setSortBy,
    setSortOrder
  };
};

export default usePetFilters;