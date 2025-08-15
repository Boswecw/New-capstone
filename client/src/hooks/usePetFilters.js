// src/hooks/usePetFilters.js

import { useState, useMemo, useCallback } from 'react';
import { buildPetImageUrl, hasValidImageExtension } from '../utils/imageUtils';

/**
 * Custom hook for filtering and managing pet data
 * @param {Array} pets - Array of pet objects
 * @param {Object} initialFilters - Initial filter state
 * @returns {Object} Filter state and methods
 */
const usePetFilters = (pets = [], initialFilters = {}) => {
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

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    if (!pets || pets.length === 0) {
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

    const species = [...new Set(pets.map(pet => pet.species).filter(Boolean))];
    const breeds = [...new Set(pets.map(pet => pet.breed).filter(Boolean))];
    const ages = [...new Set(pets.map(pet => pet.age).filter(Boolean))];
    const sizes = [...new Set(pets.map(pet => pet.size).filter(Boolean))];
    const genders = [...new Set(pets.map(pet => pet.gender).filter(Boolean))];
    const statuses = [...new Set(pets.map(pet => pet.status).filter(Boolean))];
    const locations = [...new Set(pets.map(pet => pet.location).filter(Boolean))];

    return {
      species: species.sort(),
      breeds: breeds.sort(),
      ages: ages.sort(),
      sizes: sizes.sort(),
      genders: genders.sort(),
      statuses: statuses.sort(),
      locations: locations.sort()
    };
  }, [pets]);

  // Filter pets based on current filters
  const filteredPets = useMemo(() => {
    if (!pets || pets.length === 0) return [];

    let filtered = pets.filter(pet => {
      // Species filter
      if (filters.species && pet.species !== filters.species) {
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
          pet.location
        ].join(' ').toLowerCase();
        
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
          comparison = (a.age || '').localeCompare(b.age || '');
          break;
        case 'species':
          comparison = (a.species || '').localeCompare(b.species || '');
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
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [pets, filters, sortBy, sortOrder]);

  // Enhance pets with proper image URLs
  const enhancedPets = useMemo(() => {
    return filteredPets.map(pet => ({
      ...pet,
      imageUrl: buildPetImageUrl(pet.image),
      imageUrls: pet.images ? pet.images.map(img => buildPetImageUrl(img)) : []
    }));
  }, [filteredPets]);

  // Get filter statistics
  const filterStats = useMemo(() => {
    return {
      total: pets.length,
      filtered: filteredPets.length,
      available: filteredPets.filter(pet => pet.status === 'available').length,
      adopted: filteredPets.filter(pet => pet.status === 'adopted').length,
      pending: filteredPets.filter(pet => pet.status === 'pending').length,
      withImages: filteredPets.filter(pet => 
        hasValidImageExtension(pet.image) || 
        (pet.images && pet.images.length > 0)
      ).length
    };
  }, [pets, filteredPets]);

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