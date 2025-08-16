// client/src/hooks/usePetFilters.js - ESLint Compliant Version
import { useState, useMemo, useCallback } from 'react';

/**
 * Custom hook for filtering and managing pet data
 * @param {Array} pets - Array of pet objects
 * @param {Object} initialFilters - Initial filter state
 * @returns {Object} Filter state and methods
 */
const usePetFilters = (pets = [], initialFilters = {}) => {
  // ✅ FIX: Memoize safePets to prevent dependency warnings
  const safePets = useMemo(() => {
    return Array.isArray(pets) ? pets : [];
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

  // Get unique values for filter options
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

    const species = [...new Set(safePets.map(pet => pet.type || pet.species).filter(Boolean))];
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

  // Filter pets based on current filters
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

      // Search filter (search in name, breed, description)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = [
          pet.name,
          pet.breed,
          pet.description,
          pet.type,
          pet.species
        ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // Images filter
      if (filters.hasImages && !pet.image) {
        return false;
      }

      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'age':
          const ageOrder = ['baby', 'young', 'adult', 'senior'];
          const aAge = ageOrder.indexOf(a.age) !== -1 ? ageOrder.indexOf(a.age) : 999;
          const bAge = ageOrder.indexOf(b.age) !== -1 ? ageOrder.indexOf(b.age) : 999;
          comparison = aAge - bAge;
          break;
        case 'price':
          comparison = (a.adoptionFee || 0) - (b.adoptionFee || 0);
          break;
        case 'newest':
          comparison = new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          break;
        case 'oldest':
          comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [safePets, filters, sortBy, sortOrder]);

  // Get filter statistics
  const filterStats = useMemo(() => {
    return {
      total: safePets.length,
      filtered: filteredPets.length,
      available: safePets.filter(pet => pet?.status === 'available').length,
      pending: safePets.filter(pet => pet?.status === 'pending').length,
      adopted: safePets.filter(pet => pet?.status === 'adopted').length
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
      filters[key] !== defaultFilters[key] && filters[key] !== ''
    );
  }, [filters]);

  return {
    // Filter state
    filters,
    sortBy,
    sortOrder,
    
    // Computed data
    filteredPets,
    filterOptions,
    filterStats,
    hasActiveFilters,
    
    // Filter methods
    updateFilter,
    updateFilters,
    resetFilters,
    setSortBy,
    setSortOrder
  };
};

export default usePetFilters;