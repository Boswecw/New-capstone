// client/src/config/petFilters.js - COMPLETE WITH ALL EXPORTS

// ✅ Pet type categories based on updated JSON structure
export const PET_CATEGORIES = {
  ALL: 'all',
  DOGS: 'dogs',
  CATS: 'cats', 
  FISH: 'fish',
  BIRDS: 'birds',
  SMALL_PETS: 'small-pets'
};

// ✅ Specific pet types from updated JSON
export const PET_TYPES = {
  // Traditional pets
  dog: { label: 'Dogs', category: PET_CATEGORIES.DOGS, icon: '🐕' },
  cat: { label: 'Cats', category: PET_CATEGORIES.CATS, icon: '🐱' },
  fish: { label: 'Fish', category: PET_CATEGORIES.FISH, icon: '🐠' },
  bird: { label: 'Birds', category: PET_CATEGORIES.BIRDS, icon: '🦜' },
  
  // Small pets (now specific types)
  'Guinea Pig': { label: 'Guinea Pigs', category: PET_CATEGORIES.SMALL_PETS, icon: '🐹' },
  'Fancy Rat': { label: 'Fancy Rats', category: PET_CATEGORIES.SMALL_PETS, icon: '🐭' },
  'Hamster': { label: 'Hamsters', category: PET_CATEGORIES.SMALL_PETS, icon: '🐹' },
  'Rabbit': { label: 'Rabbits', category: PET_CATEGORIES.SMALL_PETS, icon: '🐰' },
  'ferret': { label: 'Ferrets', category: PET_CATEGORIES.SMALL_PETS, icon: '🦔' },
  'Chinchilla': { label: 'Chinchillas', category: PET_CATEGORIES.SMALL_PETS, icon: '🐭' },
  'Hedge Hog': { label: 'Hedgehogs', category: PET_CATEGORIES.SMALL_PETS, icon: '🦔' },
  'Sugar Glider': { label: 'Sugar Gliders', category: PET_CATEGORIES.SMALL_PETS, icon: '🐿️' },
  'Stoat': { label: 'Stoats', category: PET_CATEGORIES.SMALL_PETS, icon: '🦔' },
  'gerbil': { label: 'Gerbils', category: PET_CATEGORIES.SMALL_PETS, icon: '🐭' }
};

// ✅ Grouped filters for better UX
export const FILTER_GROUPS = {
  category: {
    label: 'Pet Category',
    options: [
      { value: PET_CATEGORIES.ALL, label: 'All Pets', count: 0 },
      { value: PET_CATEGORIES.DOGS, label: 'Dogs', count: 0 },
      { value: PET_CATEGORIES.CATS, label: 'Cats', count: 0 },
      { value: PET_CATEGORIES.FISH, label: 'Fish', count: 0 },
      { value: PET_CATEGORIES.BIRDS, label: 'Birds', count: 0 },
      { value: PET_CATEGORIES.SMALL_PETS, label: 'Small Pets', count: 0 }
    ]
  },
  
  specificType: {
    label: 'Specific Pet Type',
    options: Object.entries(PET_TYPES).map(([value, config]) => ({
      value,
      label: config.label,
      icon: config.icon,
      category: config.category,
      count: 0
    }))
  },
  
  size: {
    label: 'Size',
    options: [
      { value: 'all', label: 'Any Size', count: 0 },
      { value: 'small', label: 'Small', count: 0 },
      { value: 'medium', label: 'Medium', count: 0 },
      { value: 'large', label: 'Large', count: 0 }
    ]
  },
  
  gender: {
    label: 'Gender',
    options: [
      { value: 'all', label: 'Any Gender', count: 0 },
      { value: 'male', label: 'Male', count: 0 },
      { value: 'female', label: 'Female', count: 0 },
      { value: 'unknown', label: 'Unknown', count: 0 }
    ]
  },
  
  age: {
    label: 'Age',
    options: [
      { value: 'all', label: 'Any Age', count: 0 },
      { value: '6 months', label: '6 Months', count: 0 },
      { value: 'young', label: 'Young (< 1 year)', count: 0 },
      { value: 'adult', label: 'Adult (1-7 years)', count: 0 },
      { value: 'senior', label: 'Senior (7+ years)', count: 0 }
    ]
  }
};

// ✅ Filter utility functions
export class PetFilterUtils {
  
  /**
   * Get category for a specific pet type
   */
  static getCategoryForType(petType) {
    return PET_TYPES[petType]?.category || PET_CATEGORIES.ALL;
  }
  
  /**
   * Get all pet types for a category
   */
  static getTypesForCategory(category) {
    if (category === PET_CATEGORIES.ALL) {
      return Object.keys(PET_TYPES);
    }
    
    return Object.entries(PET_TYPES)
      .filter(([_, config]) => config.category === category)
      .map(([type]) => type);
  }
  
  /**
   * Filter pets based on criteria
   */
  static filterPets(pets, filters) {
    if (!pets || !Array.isArray(pets)) return [];
    
    return pets.filter(pet => {
      // Category filter
      if (filters.category && filters.category !== PET_CATEGORIES.ALL) {
        const petCategory = this.getCategoryForType(pet.type);
        if (petCategory !== filters.category) return false;
      }
      
      // Specific type filter
      if (filters.type && filters.type !== 'all') {
        if (pet.type !== filters.type) return false;
      }
      
      // Size filter
      if (filters.size && filters.size !== 'all') {
        if (pet.size !== filters.size) return false;
      }
      
      // Gender filter
      if (filters.gender && filters.gender !== 'all') {
        if (pet.gender !== filters.gender) return false;
      }
      
      // Age filter
      if (filters.age && filters.age !== 'all') {
        if (filters.age === 'young' && !pet.age?.includes('month')) return false;
        if (filters.age === 'adult' && pet.age?.includes('month')) return false;
        if (filters.age === 'senior' && !pet.age?.includes('year')) return false;
        if (filters.age !== 'young' && filters.age !== 'adult' && filters.age !== 'senior') {
          if (pet.age !== filters.age) return false;
        }
      }
      
      // Featured filter
      if (filters.featured === true && !pet.featured) return false;
      if (filters.featured === false && pet.featured) return false;
      
      // Available filter
      if (filters.available === true && pet.status !== 'available') return false;
      if (filters.available === false && pet.status === 'available') return false;
      
      // Search text filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = [
          pet.name,
          pet.type,
          pet.breed,
          pet.description,
          pet.age,
          pet.size,
          pet.gender
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) return false;
      }
      
      return true;
    });
  }
  
  /**
   * Count pets for each filter option
   */
  static countPetsForFilters(pets) {
    if (!pets || !Array.isArray(pets)) return {};
    
    const counts = {};
    
    // Count by category
    Object.values(PET_CATEGORIES).forEach(category => {
      counts[category] = pets.filter(pet => 
        category === PET_CATEGORIES.ALL || 
        this.getCategoryForType(pet.type) === category
      ).length;
    });
    
    // Count by size
    ['small', 'medium', 'large'].forEach(size => {
      counts[size] = pets.filter(pet => pet.size === size).length;
    });
    
    // Count by gender
    ['male', 'female', 'unknown'].forEach(gender => {
      counts[gender] = pets.filter(pet => pet.gender === gender).length;
    });
    
    return counts;
  }
  
  /**
   * Get popular combinations
   */
  static getPopularCombinations() {
    return [
      { 
        label: 'Small Cats', 
        filters: { category: PET_CATEGORIES.CATS, size: 'small' },
        icon: '🐱'
      },
      { 
        label: 'Young Dogs', 
        filters: { category: PET_CATEGORIES.DOGS, age: 'young' },
        icon: '🐶'
      },
      { 
        label: 'Large Dogs', 
        filters: { category: PET_CATEGORIES.DOGS, size: 'large' },
        icon: '🐕‍🦺'
      }
    ];
  }
  
  /**
   * Build URL query string from filters
   */
  static filtersToQueryString(filters) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== PET_CATEGORIES.ALL && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    
    return params;
  }
  
  /**
   * Parse URL query string to filters
   */
  static queryStringToFilters(queryString) {
    const params = new URLSearchParams(queryString);
    const filters = {};
    
    for (const [key, value] of params) {
      filters[key] = value;
    }
    
    return filters;
  }
}

// ✅ Default filter state
export const DEFAULT_FILTERS = {
  category: PET_CATEGORIES.ALL,
  type: 'all',
  size: 'all',
  gender: 'all',
  age: 'all',
  featured: null,
  available: true,
  search: '',
  sort: 'newest',
  page: 1,
  limit: 20
};

// ✅ Filter validation function
export const validateFilters = (filters) => {
  if (!filters || typeof filters !== 'object') {
    return { ...DEFAULT_FILTERS };
  }
  
  const validatedFilters = { ...DEFAULT_FILTERS };
  
  // Validate category
  if (Object.values(PET_CATEGORIES).includes(filters.category)) {
    validatedFilters.category = filters.category;
  }
  
  // Validate type
  if (Object.keys(PET_TYPES).includes(filters.type) || filters.type === 'all') {
    validatedFilters.type = filters.type;
  }
  
  // Validate size
  if (['all', 'small', 'medium', 'large'].includes(filters.size)) {
    validatedFilters.size = filters.size;
  }
  
  // Validate gender
  if (['all', 'male', 'female', 'unknown'].includes(filters.gender)) {
    validatedFilters.gender = filters.gender;
  }
  
  // Validate age
  if (['all', '6 months', 'young', 'adult', 'senior'].includes(filters.age)) {
    validatedFilters.age = filters.age;
  }
  
  // Validate featured
  if (typeof filters.featured === 'boolean') {
    validatedFilters.featured = filters.featured;
  } else if (filters.featured === null || filters.featured === undefined) {
    validatedFilters.featured = null;
  }
  
  // Validate available
  if (typeof filters.available === 'boolean') {
    validatedFilters.available = filters.available;
  }
  
  // Validate search
  if (typeof filters.search === 'string') {
    validatedFilters.search = filters.search.trim();
  }
  
  // Validate sort
  if (['newest', 'oldest', 'name-asc', 'name-desc', 'age-asc', 'age-desc'].includes(filters.sort)) {
    validatedFilters.sort = filters.sort;
  }
  
  // Validate page
  if (typeof filters.page === 'number' && filters.page > 0) {
    validatedFilters.page = filters.page;
  } else if (typeof filters.page === 'string' && !isNaN(parseInt(filters.page))) {
    validatedFilters.page = parseInt(filters.page);
  }
  
  // Validate limit
  if (typeof filters.limit === 'number' && filters.limit > 0) {
    validatedFilters.limit = filters.limit;
  } else if (typeof filters.limit === 'string' && !isNaN(parseInt(filters.limit))) {
    validatedFilters.limit = parseInt(filters.limit);
  }
  
  return validatedFilters;
};

// ✅ Named variable for default export (ESLint compliant)
const PetFilterExports = {
  PET_CATEGORIES,
  PET_TYPES,
  FILTER_GROUPS,
  PetFilterUtils,
  DEFAULT_FILTERS,
  validateFilters
};

export default PetFilterExports;