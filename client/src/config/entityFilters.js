// ✅ PETS: Import existing pet filters
import { 
    PET_CATEGORIES, 
    PET_TYPES, 
    FILTER_GROUPS as PET_FILTER_GROUPS,
    PetFilterUtils,
    DEFAULT_FILTERS as PET_DEFAULT_FILTERS,
    validateFilters as validatePetFilters
  } from './petFilters';
  
  // ✅ PRODUCTS: Define product categories and types
  export const PRODUCT_CATEGORIES = {
    ALL: 'all',
    FOOD: 'food',
    TOYS: 'toys',
    ACCESSORIES: 'accessories',
    HEALTH: 'health',
    BEDS: 'beds',
    CARRIERS: 'carriers'
  };
  
  export const PRODUCT_TYPES = {
    // Food & Treats
    'dry-food': { label: 'Dry Food', category: PRODUCT_CATEGORIES.FOOD, icon: '🥘' },
    'wet-food': { label: 'Wet Food', category: PRODUCT_CATEGORIES.FOOD, icon: '🥫' },
    'treats': { label: 'Treats', category: PRODUCT_CATEGORIES.FOOD, icon: '🦴' },
    'supplements': { label: 'Supplements', category: PRODUCT_CATEGORIES.HEALTH, icon: '💊' },
    
    // Toys
    'chew-toys': { label: 'Chew Toys', category: PRODUCT_CATEGORIES.TOYS, icon: '🦴' },
    'interactive-toys': { label: 'Interactive Toys', category: PRODUCT_CATEGORIES.TOYS, icon: '🧩' },
    'balls': { label: 'Balls', category: PRODUCT_CATEGORIES.TOYS, icon: '⚽' },
    'rope-toys': { label: 'Rope Toys', category: PRODUCT_CATEGORIES.TOYS, icon: '🪢' },
    
    // Accessories
    'collars': { label: 'Collars', category: PRODUCT_CATEGORIES.ACCESSORIES, icon: '🦮' },
    'leashes': { label: 'Leashes', category: PRODUCT_CATEGORIES.ACCESSORIES, icon: '🦮' },
    'harnesses': { label: 'Harnesses', category: PRODUCT_CATEGORIES.ACCESSORIES, icon: '🦮' },
    'bowls': { label: 'Bowls & Feeders', category: PRODUCT_CATEGORIES.ACCESSORIES, icon: '🥣' },
    
    // Health & Care
    'grooming': { label: 'Grooming', category: PRODUCT_CATEGORIES.HEALTH, icon: '✂️' },
    'dental-care': { label: 'Dental Care', category: PRODUCT_CATEGORIES.HEALTH, icon: '🦷' },
    'flea-tick': { label: 'Flea & Tick', category: PRODUCT_CATEGORIES.HEALTH, icon: '🚫' },
    
    // Beds & Furniture
    'beds': { label: 'Beds', category: PRODUCT_CATEGORIES.BEDS, icon: '🛏️' },
    'blankets': { label: 'Blankets', category: PRODUCT_CATEGORIES.BEDS, icon: '🧸' },
    'furniture': { label: 'Furniture', category: PRODUCT_CATEGORIES.BEDS, icon: '🪑' },
    
    // Carriers & Travel
    'carriers': { label: 'Carriers', category: PRODUCT_CATEGORIES.CARRIERS, icon: '👜' },
    'travel': { label: 'Travel Gear', category: PRODUCT_CATEGORIES.CARRIERS, icon: '🧳' }
  };
  
  // ✅ PRODUCTS: Filter groups
  export const PRODUCT_FILTER_GROUPS = {
    category: {
      label: 'Product Category',
      options: [
        { value: PRODUCT_CATEGORIES.ALL, label: 'All Products', count: 0 },
        { value: PRODUCT_CATEGORIES.FOOD, label: 'Food & Treats', count: 0 },
        { value: PRODUCT_CATEGORIES.TOYS, label: 'Toys', count: 0 },
        { value: PRODUCT_CATEGORIES.ACCESSORIES, label: 'Accessories', count: 0 },
        { value: PRODUCT_CATEGORIES.HEALTH, label: 'Health & Care', count: 0 },
        { value: PRODUCT_CATEGORIES.BEDS, label: 'Beds & Comfort', count: 0 },
        { value: PRODUCT_CATEGORIES.CARRIERS, label: 'Carriers & Travel', count: 0 }
      ]
    },
    
    specificType: {
      label: 'Product Type',
      options: Object.entries(PRODUCT_TYPES).map(([value, config]) => ({
        value,
        label: config.label,
        icon: config.icon,
        category: config.category,
        count: 0
      }))
    },
    
    priceRange: {
      label: 'Price Range',
      options: [
        { value: 'all', label: 'Any Price', count: 0 },
        { value: '0-15', label: 'Under $15', count: 0 },
        { value: '15-30', label: '$15 - $30', count: 0 },
        { value: '30-50', label: '$30 - $50', count: 0 },
        { value: '50-100', label: '$50 - $100', count: 0 },
        { value: '100+', label: '$100+', count: 0 }
      ]
    },
    
    brand: {
      label: 'Brand',
      options: [
        { value: 'all', label: 'All Brands', count: 0 },
        { value: 'kong', label: 'KONG', count: 0 },
        { value: 'purina', label: 'Purina', count: 0 },
        { value: 'royal-canin', label: 'Royal Canin', count: 0 },
        { value: 'petmate', label: 'Petmate', count: 0 },
        { value: 'blue-buffalo', label: 'Blue Buffalo', count: 0 }
      ]
    },
    
    rating: {
      label: 'Customer Rating',
      options: [
        { value: 'all', label: 'Any Rating', count: 0 },
        { value: '4+', label: '4+ Stars', count: 0 },
        { value: '3+', label: '3+ Stars', count: 0 },
        { value: '2+', label: '2+ Stars', count: 0 }
      ]
    }
  };
  
  // ✅ PRODUCTS: Filter utility class
  export class ProductFilterUtils {
    
    static getCategoryForType(productType) {
      return PRODUCT_TYPES[productType]?.category || PRODUCT_CATEGORIES.ALL;
    }
    
    static getTypesForCategory(category) {
      if (category === PRODUCT_CATEGORIES.ALL) {
        return Object.keys(PRODUCT_TYPES);
      }
      
      return Object.entries(PRODUCT_TYPES)
        .filter(([_, config]) => config.category === category)
        .map(([type]) => type);
    }
    
    static filterProducts(products, filters) {
      return products.filter(product => {
        // Category filter
        if (filters.category && filters.category !== PRODUCT_CATEGORIES.ALL) {
          const productCategory = this.getCategoryForType(product.type || product.category);
          if (productCategory !== filters.category) return false;
        }
        
        // Specific type filter
        if (filters.type && filters.type !== 'all') {
          if (product.type !== filters.type && product.category !== filters.type) return false;
        }
        
        // Price range filter
        if (filters.priceRange && filters.priceRange !== 'all') {
          const price = parseFloat(product.price) || 0;
          const [min, max] = filters.priceRange.split('-').map(p => p.replace('+', ''));
          
          if (max) {
            if (price < parseFloat(min) || price > parseFloat(max)) return false;
          } else {
            if (price < parseFloat(min)) return false;
          }
        }
        
        // Brand filter
        if (filters.brand && filters.brand !== 'all') {
          if (product.brand?.toLowerCase() !== filters.brand.toLowerCase()) return false;
        }
        
        // Rating filter
        if (filters.rating && filters.rating !== 'all') {
          const rating = parseFloat(product.rating) || 0;
          const minRating = parseFloat(filters.rating.replace('+', ''));
          if (rating < minRating) return false;
        }
        
        // Featured filter
        if (filters.featured === true && !product.featured) return false;
        if (filters.featured === false && product.featured) return false;
        
        // Available filter
        if (filters.available === true && product.status !== 'available') return false;
        if (filters.available === false && product.status === 'available') return false;
        
        // Search text filter
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          const searchableText = [
            product.name,
            product.type,
            product.category,
            product.brand,
            product.description
          ].join(' ').toLowerCase();
          
          if (!searchableText.includes(searchTerm)) return false;
        }
        
        return true;
      });
    }
    
    static countProductsForFilters(products) {
      const counts = {
        category: {},
        specificType: {},
        priceRange: {},
        brand: {},
        rating: {}
      };
      
      products.forEach(product => {
        // Count by category
        const category = this.getCategoryForType(product.type || product.category);
        counts.category[category] = (counts.category[category] || 0) + 1;
        counts.category[PRODUCT_CATEGORIES.ALL] = (counts.category[PRODUCT_CATEGORIES.ALL] || 0) + 1;
        
        // Count by specific type
        const type = product.type || product.category;
        counts.specificType[type] = (counts.specificType[type] || 0) + 1;
        
        // Count by price range
        const price = parseFloat(product.price) || 0;
        if (price < 15) counts.priceRange['0-15'] = (counts.priceRange['0-15'] || 0) + 1;
        else if (price < 30) counts.priceRange['15-30'] = (counts.priceRange['15-30'] || 0) + 1;
        else if (price < 50) counts.priceRange['30-50'] = (counts.priceRange['30-50'] || 0) + 1;
        else if (price < 100) counts.priceRange['50-100'] = (counts.priceRange['50-100'] || 0) + 1;
        else counts.priceRange['100+'] = (counts.priceRange['100+'] || 0) + 1;
        counts.priceRange['all'] = (counts.priceRange['all'] || 0) + 1;
        
        // Count by brand
        if (product.brand) {
          const brand = product.brand.toLowerCase().replace(/\s+/g, '-');
          counts.brand[brand] = (counts.brand[brand] || 0) + 1;
        }
        counts.brand['all'] = (counts.brand['all'] || 0) + 1;
        
        // Count by rating
        const rating = parseFloat(product.rating) || 0;
        if (rating >= 4) counts.rating['4+'] = (counts.rating['4+'] || 0) + 1;
        if (rating >= 3) counts.rating['3+'] = (counts.rating['3+'] || 0) + 1;
        if (rating >= 2) counts.rating['2+'] = (counts.rating['2+'] || 0) + 1;
        counts.rating['all'] = (counts.rating['all'] || 0) + 1;
      });
      
      return counts;
    }
    
    static getSuggestedFilters() {
      return [
        { 
          label: 'Dog Food', 
          filters: { category: PRODUCT_CATEGORIES.FOOD, search: 'dog' },
          icon: '🥘'
        },
        { 
          label: 'Cat Toys', 
          filters: { category: PRODUCT_CATEGORIES.TOYS, search: 'cat' },
          icon: '🧩'
        },
        { 
          label: 'Under $25', 
          filters: { priceRange: '0-15' },
          icon: '💰'
        },
        { 
          label: 'Top Rated', 
          filters: { rating: '4+' },
          icon: '⭐'
        },
        { 
          label: 'Featured Items', 
          filters: { featured: true },
          icon: '🏆'
        },
        { 
          label: 'KONG Products', 
          filters: { brand: 'kong' },
          icon: '🦴'
        }
      ];
    }
    
    static filtersToQueryString(filters) {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== PRODUCT_CATEGORIES.ALL) {
          params.append(key, value);
        }
      });
      
      return params.toString();
    }
    
    static queryStringToFilters(queryString) {
      const params = new URLSearchParams(queryString);
      const filters = {};
      
      for (const [key, value] of params) {
        filters[key] = value;
      }
      
      return filters;
    }
    
    static mapFiltersToBackendQuery(filters) {
      const backendQuery = { status: 'available' };
      
      // Map category to types
      if (filters.category && filters.category !== PRODUCT_CATEGORIES.ALL) {
        const typesForCategory = this.getTypesForCategory(filters.category);
        backendQuery.category = { $in: typesForCategory };
      }
      
      // Handle specific type (overrides category)
      if (filters.type && filters.type !== 'all') {
        backendQuery.category = filters.type;
      }
      
      // Price range mapping
      if (filters.priceRange && filters.priceRange !== 'all') {
        const [min, max] = filters.priceRange.split('-').map(p => p.replace('+', ''));
        if (max) {
          backendQuery.price = { $gte: parseFloat(min), $lte: parseFloat(max) };
        } else {
          backendQuery.price = { $gte: parseFloat(min) };
        }
      }
      
      // Other filters map directly
      if (filters.brand && filters.brand !== 'all') {
        backendQuery.brand = new RegExp(filters.brand, 'i');
      }
      
      if (filters.rating && filters.rating !== 'all') {
        const minRating = parseFloat(filters.rating.replace('+', ''));
        backendQuery.rating = { $gte: minRating };
      }
      
      if (filters.featured === true) {
        backendQuery.featured = true;
      }
      
      if (filters.search) {
        const searchRegex = new RegExp(filters.search, 'i');
        backendQuery.$or = [
          { name: searchRegex },
          { brand: searchRegex },
          { description: searchRegex },
          { category: searchRegex }
        ];
      }
      
      return backendQuery;
    }
  }
  
  // ✅ PRODUCTS: Default filters
  export const PRODUCT_DEFAULT_FILTERS = {
    category: PRODUCT_CATEGORIES.ALL,
    type: 'all',
    priceRange: 'all',
    brand: 'all',
    rating: 'all',
    featured: null,
    available: true,
    search: ''
  };
  
  // ✅ PRODUCTS: Filter validation
  export const validateProductFilters = (filters) => {
    const validatedFilters = { ...PRODUCT_DEFAULT_FILTERS };
    
    // Validate category
    if (Object.values(PRODUCT_CATEGORIES).includes(filters.category)) {
      validatedFilters.category = filters.category;
    }
    
    // Validate type
    if (Object.keys(PRODUCT_TYPES).includes(filters.type) || filters.type === 'all') {
      validatedFilters.type = filters.type;
    }
    
    // Validate price range
    if (['all', '0-15', '15-30', '30-50', '50-100', '100+'].includes(filters.priceRange)) {
      validatedFilters.priceRange = filters.priceRange;
    }
    
    // Validate brand
    if (typeof filters.brand === 'string') {
      validatedFilters.brand = filters.brand;
    }
    
    // Validate rating
    if (['all', '2+', '3+', '4+'].includes(filters.rating)) {
      validatedFilters.rating = filters.rating;
    }
    
    // Validate search
    if (typeof filters.search === 'string') {
      validatedFilters.search = filters.search.trim();
    }
    
    return validatedFilters;
  };
  
  // ✅ UNIVERSAL: Entity filter factory
  export class EntityFilterFactory {
    static getFilterSystem(entityType) {
      switch (entityType) {
        case 'pets':
          return {
            categories: PET_CATEGORIES,
            types: PET_TYPES,
            filterGroups: PET_FILTER_GROUPS,
            filterUtils: PetFilterUtils,
            defaultFilters: PET_DEFAULT_FILTERS,
            validateFilters: validatePetFilters
          };
        
        case 'products':
          return {
            categories: PRODUCT_CATEGORIES,
            types: PRODUCT_TYPES,
            filterGroups: PRODUCT_FILTER_GROUPS,
            filterUtils: ProductFilterUtils,
            defaultFilters: PRODUCT_DEFAULT_FILTERS,
            validateFilters: validateProductFilters
          };
        
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }
    }
    
    static createEntityFilterConfig(entityType) {
      const system = this.getFilterSystem(entityType);
      
      return {
        // Core filter configuration
        filters: this.buildFilterConfig(system.filterGroups),
        
        // Utility functions
        filterUtils: system.filterUtils,
        defaultFilters: system.defaultFilters,
        validateFilters: system.validateFilters,
        
        // Categories and types
        categories: system.categories,
        types: system.types,
        filterGroups: system.filterGroups
      };
    }
    
    static buildFilterConfig(filterGroups) {
      const config = {
        search: { 
          label: 'Search', 
          placeholder: 'Search...',
          type: 'text' 
        }
      };
      
      Object.entries(filterGroups).forEach(([key, group]) => {
        config[key] = {
          label: group.label,
          type: 'select',
          options: group.options
        };
      });
      
      // Add common filters
      config.featured = {
        label: 'Featured',
        type: 'select',
        options: [
          { value: 'all', label: 'All Items' },
          { value: 'true', label: 'Featured Only' }
        ]
      };
      
      config.sort = {
        label: 'Sort By',
        type: 'select',
        options: [
          { value: 'newest', label: 'Newest First' },
          { value: 'oldest', label: 'Oldest First' },
          { value: 'name_asc', label: 'Name A-Z' },
          { value: 'name_desc', label: 'Name Z-A' },
          { value: 'featured', label: 'Featured First' }
        ]
      };
      
      return config;
    }
  }