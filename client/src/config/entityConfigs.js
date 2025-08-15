// client/src/config/entityConfigs.js - CORRECTED for actual database structure

// ✅ Import removed since we're manually defining configs for now
// import { EntityFilterFactory } from './entityFilters';

export const ENTITY_CONFIGS = {
  pets: {
    // Basic Info
    name: 'pets',
    displayName: 'Pets',
    singularName: 'pet',
    singularDisplayName: 'Pet',
    
    // API Configuration
    api: {
      basePath: '/api/pets',
      getAllMethod: 'getAllPets',
      getByIdMethod: 'getPetById',
      getFeaturedMethod: 'getFeaturedPets'
    },
    
    // URL Configuration
    routes: {
      browse: '/browse',
      detail: '/pets/:id'
    },
    
    // ✅ CORRECTED: Filter Configuration matching your actual pet data
    filters: {
      search: { 
        label: 'Search Pets', 
        placeholder: 'Search by name, breed...',
        type: 'text' 
      },
      type: { 
        label: 'Pet Type', 
        type: 'select',
        options: [
          { value: 'all', label: 'All Types' },
          // ✅ Based on your actual data:  
          { value: 'dog', label: 'Dogs' },
          { value: 'cat', label: 'Cats' },
          { value: 'fish', label: 'Fish' },
          { value: 'hamster', label: 'Hamsters' },
          { value: 'guinea pig', label: 'Guinea Pigs' },
          { value: 'ferret', label: 'Ferrets' },
          { value: 'rabbit', label: 'Rabbits' },
          { value: 'bird', label: 'Birds' },
          { value: 'chinchilla', label: 'Chinchillas' },
          { value: 'fancy rat', label: 'Rats' },
          { value: 'hedge hog', label: 'Hedgehogs' },
          { value: 'gerbil', label: 'Gerbils' },
          { value: 'stoat', label: 'Stoats' },
          { value: 'sugar glider', label: 'Sugar Gliders' }
        ]
      },
      category: { 
        label: 'Category', 
        type: 'select',
        options: [
          { value: 'all', label: 'All Categories' },
          // ✅ Based on your actual category data:
          { value: 'dog', label: 'Dogs (16)' },
          { value: 'cat', label: 'Cats (9)' },
          { value: 'aquatic', label: 'Fish & Aquatic (8)' },
          { value: 'other', label: 'Small & Exotic Pets (21)' }
        ]
      },
      size: { 
        label: 'Size', 
        type: 'select',
        options: [
          { value: 'all', label: 'All Sizes' },
          // ✅ Based on your actual size data:
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' }
        ]
      },
      gender: { 
        label: 'Gender', 
        type: 'select',
        options: [
          { value: 'all', label: 'All Genders' },
          // ✅ Based on your actual gender data:
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
          { value: 'unknown', label: 'Unknown' }
        ]
      },
      featured: { 
        label: 'Featured', 
        type: 'select',
        options: [
          { value: 'all', label: 'All Pets' },
          { value: 'true', label: 'Featured Only' }
        ]
      },
      sort: { 
        label: 'Sort By', 
        type: 'select',
        options: [
          { value: 'newest', label: 'Newest First' },
          { value: 'oldest', label: 'Oldest First' },
          { value: 'name_asc', label: 'Name A-Z' },
          { value: 'name_desc', label: 'Name Z-A' },
          { value: 'featured', label: 'Featured First' }
        ]
      }
    },
    
    // Header configuration
    header: {
      title: 'Browse Pets',
      subtitle: 'Find your perfect companion',
      showQuickActions: true,
      quickActions: [
        { label: 'Dogs Only', action: 'dogs', icon: '🐕', filters: { category: 'dog' } },
        { label: 'Cats Only', action: 'cats', icon: '🐱', filters: { category: 'cat' } },
        { label: 'Fish & Aquatic', action: 'aquatic', icon: '🐠', filters: { category: 'aquatic' } },
        { label: 'Small & Exotic', action: 'other', icon: '🐹', filters: { category: 'other' } },
        { label: 'Featured Only', action: 'featured', icon: '⭐', filters: { featured: 'true' } },
        { label: 'Reset Filters', action: 'reset', icon: '🔄' }
      ]
    },
    
    // ✅ NEW: Enhanced features
    entityType: 'pets',
    showCategoryTabs: true,
    useEnhancedFiltering: true
  },

  products: {
    // Basic Info
    name: 'products',
    displayName: 'Products',
    singularName: 'product',
    singularDisplayName: 'Product',
    
    // API Configuration
    api: {
      basePath: '/api/products',
      getAllMethod: 'getAllProducts',
      getByIdMethod: 'getProductById',
      getFeaturedMethod: 'getFeaturedProducts'
    },
    
    // URL Configuration
    routes: {
      browse: '/products',
      detail: '/products/:id'
    },
    
    // ✅ CORRECTED: Filter Configuration matching your actual product data
    filters: {
      search: { 
        label: 'Search Products', 
        placeholder: 'Search products...',
        type: 'text' 
      },
      category: { 
        label: 'Category', 
        type: 'select',
        options: [
          { value: 'all', label: 'All Categories' },
          // ✅ Mapped to work with your actual database categories:
          { value: 'food', label: 'Food & Treats' },
          { value: 'toys', label: 'Toys' },
          { value: 'accessories', label: 'Accessories' },
          { value: 'health', label: 'Health & Grooming' },
          { value: 'aquarium', label: 'Aquarium Supplies' },
          { value: 'training', label: 'Training' }
        ]
      },
      priceRange: {
        label: 'Price Range',
        type: 'select',
        options: [
          { value: 'all', label: 'Any Price' },
          { value: '0-10', label: 'Under $10' },
          { value: '10-25', label: '$10 - $25' },
          { value: '25-50', label: '$25 - $50' },
          { value: '50+', label: '$50+' }
        ]
      },
      brand: { 
        label: 'Brand', 
        type: 'select',
        options: [
          { value: 'all', label: 'All Brands' },
          // ✅ Based on your actual brand data:
          { value: 'generic', label: 'Generic' }
          // Note: Add more brands as your data grows
        ]
      },
      featured: { 
        label: 'Featured', 
        type: 'select',
        options: [
          { value: 'all', label: 'All Products' },
          { value: 'true', label: 'Featured Only' }
        ]
      },
      sort: { 
        label: 'Sort By', 
        type: 'select',
        options: [
          { value: 'name', label: 'Name A-Z' },
          { value: 'name-desc', label: 'Name Z-A' },
          { value: 'price', label: 'Price Low to High' },
          { value: 'price-desc', label: 'Price High to Low' },
          { value: 'newest', label: 'Newest First' },
          { value: 'featured', label: 'Featured First' }
        ]
      }
    },
    
    // Header configuration
    header: {
      title: 'Browse Products',
      subtitle: 'Everything your pet needs',
      showQuickActions: true,
      quickActions: [
        { label: 'Dog Products', action: 'dog-products', icon: '🐕', filters: { search: 'dog' } },
        { label: 'Cat Products', action: 'cat-products', icon: '🐱', filters: { search: 'cat' } },
        { label: 'Under $10', action: 'budget', icon: '💰', filters: { priceRange: '0-10' } },
        { label: 'Featured Items', action: 'featured', icon: '🏆', filters: { featured: 'true' } },
        { label: 'Reset Filters', action: 'reset', icon: '🔄' }
      ]
    },
    
    // ✅ NEW: Enhanced features
    entityType: 'products',
    showCategoryTabs: true,
    useEnhancedFiltering: true
  }
};

// ✅ EXPORT: Category mapping for backend
export const CATEGORY_MAPPINGS = {
  pets: {
    // Direct mapping - your pet data is already correct
    dog: 'dog',
    cat: 'cat', 
    aquatic: 'aquatic',
    other: 'other'
  },
  products: {
    // Frontend category → Backend query mapping
    food: { 
      category: /(dog care|cat care)/i, 
      name: /(food|kibble)/i 
    },
    toys: { 
      name: /toy/i 
    },
    accessories: { 
      category: /(dog care|cat care)/i,
      name: /(harness|leash|collar|bed)/i 
    },
    health: { 
      category: /(grooming|health)/i 
    },
    aquarium: { 
      category: /aquarium/i 
    },
    training: { 
      category: /training/i 
    }
  }
};