// src/hooks/usePetFilters.js - FIXED VERSION

import { useState, useMemo, useCallback } from 'react';
import { buildPetImageUrl, hasValidImageExtension } from '../utils/imageUtils';

/**
 * Custom hook for filtering and managing pet data
 * @param {Array} pets - Array of pet objects
 * @param {Object} initialFilters - Initial filter state
 * @returns {Object} Filter state and methods
 */
const usePetFilters = (pets = [], initialFilters = {}) => {
  // ✅ CRITICAL FIX: Ensure pets is always an array
  const safePets = useMemo(() => {
    if (!pets) {
      console.warn('usePetFilters: pets is null/undefined, using empty array');
      return [];
    }
    
    if (!Array.isArray(pets)) {
      console.warn('usePetFilters: pets is not an array:', typeof pets, pets);
      // Try to extract array from common API response structures
      if (pets.data && Array.isArray(pets.data)) {
        console.warn('usePetFilters: Found pets array at pets.data, extracting...');
        return pets.data;
      }
      if (pets.pets && Array.isArray(pets.pets)) {
        console.warn('usePetFilters: Found pets array at pets.pets, extracting...');
        return pets.pets;
      }
      // Last resort: return empty array
      console.error('usePetFilters: Could not find valid pets array, using empty array');
      return [];
    }
    
    return pets;
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
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Update multiple filters at once
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
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

  // Get unique values for filter options - FIXED to use safePets
  const filterOptions = useMemo(() => {
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

    // ✅ FIX: Handle both 'species' and 'type' fields for compatibility
    const species = [...new Set(safePets.map(pet => pet.species || pet.type).filter(Boolean))];
    const breeds = [...new Set(safePets.map(pet => pet.breed).filter(Boolean))];
    const ages = [...new Set(safePets.map(pet => pet.age).filter(Boolean))];
    const sizes = [...new Set(safePets.map(pet => pet.size).filter(Boolean))];
    const genders = [...new Set(safePets.map(pet => pet.gender).filter(Boolean))];
    const statuses = [...new Set(safePets.map(pet => pet.status).filter(Boolean))];
    const locations = [...new Set(safePets.map(pet => pet.location).filter(Boolean))];

    return {
      species: species.sort(),
      breeds: breeds.sort(),
      ages: ages.sort(),
      sizes: sizes.sort(),
      genders: genders.sort(),
      statuses: statuses.sort(),
      locations: locations.sort()
    };
  }, [safePets]);

  // Filter pets based on current filters - FIXED to use safePets
  const filteredPets = useMemo(() => {
    if (safePets.length === 0) return [];

    let filtered = safePets.filter(pet => {
      // Handle null/undefined pet objects
      if (!pet) return false;

      // Species/Type filter (handle both fields)
      const petType = pet.type || pet.species;
      if (filters.species && petType !== filters.species) {
        return false;
      }

      // Breed filter
      if (filters.breed && pet.breed !== filters.breed) {
        return false;
      }

      // Age filter
      if (filters.age && pet.age !== filters.age) {
        return false;
      }

      // Size filter
      if (filters.size && pet.size !== filters.size) {
        return false;
      }

      // Gender filter
      if (filters.gender && pet.gender !== filters.gender) {
        return false;
      }

      // Status filter
      if (filters.status && pet.status !== filters.status) {
        return false;
      }

      // Location filter
      if (filters.location && pet.location !== filters.location) {
        return false;
      }

      // Search filter (searches name, description, breed, species)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = [
          pet.name,
          pet.description,
          pet.breed,
          pet.species,
          pet.type,
          pet.location
        ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
        
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // Has images filter
      if (filters.hasImages) {
        const hasValidImage = pet.image && hasValidImageExtension(pet.image);
        const hasImages = pet.images && Array.isArray(pet.images) && pet.images.length > 0;
        
        if (!hasValidImage && !hasImages) {
          return false;
        }
      }

      return true;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'age':
          // Handle age sorting properly
          const ageOrder = ['baby', 'young', 'adult', 'senior'];
          const aAge = ageOrder.indexOf(a.age) !== -1 ? ageOrder.indexOf(a.age) : 999;
          const bAge = ageOrder.indexOf(b.age) !== -1 ? ageOrder.indexOf(b.age) : 999;
          comparison = aAge - bAge;
          break;
        case 'species':
          comparison = (a.species || a.type || '').localeCompare(b.species || b.type || '');
          break;
        case 'breed':
          comparison = (a.breed || '').localeCompare(b.breed || '');
          break;
        case 'newest':
          comparison = new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          break;
        case 'oldest':
          comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
          break;
        case 'updated':
          comparison = new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
          break;
        case 'featured':
          // Featured pets first
          comparison = (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [safePets, filters, sortBy, sortOrder]);

  // Enhance pets with proper image URLs
  const enhancedPets = useMemo(() => {
    return filteredPets.map(pet => ({
      ...pet,
      imageUrl: buildPetImageUrl(pet.image),
      imageUrls: pet.images ? pet.images.map(img => buildPetImageUrl(img)) : []
    }));
  }, [filteredPets]);

  // Get filter statistics - FIXED to use safePets
  const filterStats = useMemo(() => {
    return {
      total: safePets.length,
      filtered: filteredPets.length,
      available: filteredPets.filter(pet => pet.status === 'available').length,
      adopted: filteredPets.filter(pet => pet.status === 'adopted').length,
      pending: filteredPets.filter(pet => pet.status === 'pending').length,
      withImages: filteredPets.filter(pet => 
        hasValidImageExtension(pet.image) || 
        (pet.images && pet.images.length > 0)
      ).length
    };
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

    return Object.keys(filters).some(key => 
      filters[key] !== defaultFilters[key]
    );
  }, [filters]);

  // ✅ DEBUG: Log what we're returning in development
  if (process.env.NODE_ENV === 'development') {
    console.log('usePetFilters debug:', {
      inputPetsType: Array.isArray(pets) ? 'array' : typeof pets,
      inputPetsLength: Array.isArray(pets) ? pets.length : 'N/A',
      safePetsLength: safePets.length,
      filteredLength: filteredPets.length,
      hasActiveFilters
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