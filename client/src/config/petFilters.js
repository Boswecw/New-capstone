// client/src/config/petFilters.js - REFACTORED FILTERING LOGIC

// ✅ NEW: Pet type categories based on updated JSON structure
export const PET_CATEGORIES = {
    ALL: 'all',
    DOGS: 'dogs',
    CATS: 'cats', 
    FISH: 'fish',
    BIRDS: 'birds',
    SMALL_PETS: 'small-pets'
  };
  
  // ✅ NEW: Specific pet types from updated JSON
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
  
  // ✅ NEW: Grouped filters for better UX
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
  
  // ✅ NEW: Filter utility functions
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
          if (filters.age === 'young' && !pet.age.includes('month')) return false;
          if (filters.age === 'adult' && pet.age.includes('month')) return false;
          if (filters.age === 'senior' && !pet.age.includes('year')) return false;
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
          ].join(' ').toLowerCase();
          
          if (!searchableText.includes(searchTerm)) return false;
        }
        
        return true;
      });
    }
    
    /**
     * Count pets for each filter option
     */
    static countPetsForFilters(pets) {
      const counts = {
        category: {},
        specificType: {},
        size: {},
        gender: {},
        age: {}
      };
      
      pets.forEach(pet => {
        // Count by category
        const category = this.getCategoryForType(pet.type);
        counts.category[category] = (counts.category[category] || 0) + 1;
        counts.category[PET_CATEGORIES.ALL] = (counts.category[PET_CATEGORIES.ALL] || 0) + 1;
        
        // Count by specific type
        counts.specificType[pet.type] = (counts.specificType[pet.type] || 0) + 1;
        
        // Count by size
        counts.size[pet.size] = (counts.size[pet.size] || 0) + 1;
        counts.size['all'] = (counts.size['all'] || 0) + 1;
        
        // Count by gender
        counts.gender[pet.gender] = (counts.gender[pet.gender] || 0) + 1;
        counts.gender['all'] = (counts.gender['all'] || 0) + 1;
        
        // Count by age
        counts.age[pet.age] = (counts.age[pet.age] || 0) + 1;
        counts.age['all'] = (counts.age['all'] || 0) + 1;
      });
      
      return counts;
    }
    
    /**
     * Get suggested filters based on popular combinations
     */
    static getSuggestedFilters() {
      return [
        { 
          label: 'Dogs - Small', 
          filters: { category: PET_CATEGORIES.DOGS, size: 'small' },
          icon: '🐕'
        },
        { 
          label: 'Cats - All', 
          filters: { category: PET_CATEGORIES.CATS },
          icon: '🐱'
        },
        { 
          label: 'Guinea Pigs', 
          filters: { type: 'Guinea Pig' },
          icon: '🐹'
        },
        { 
          label: 'Rabbits', 
          filters: { type: 'Rabbit' },
          icon: '🐰'
        },
        { 
          label: 'Featured Pets', 
          filters: { featured: true },
          icon: '⭐'
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
        if (value && value !== 'all' && value !== PET_CATEGORIES.ALL) {
          params.append(key, value);
        }
      });
      
      return params.toString();
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
  
  // ✅ NEW: Default filter state
  export const DEFAULT_FILTERS = {
    category: PET_CATEGORIES.ALL,
    type: 'all',
    size: 'all',
    gender: 'all',
    age: 'all',
    featured: null,
    available: true,
    search: ''
  };
  
  // ✅ NEW: Filter validation
  export const validateFilters = (filters) => {
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
    
    // Validate search
    if (typeof filters.search === 'string') {
      validatedFilters.search = filters.search.trim();
    }
    
    return validatedFilters;
  };