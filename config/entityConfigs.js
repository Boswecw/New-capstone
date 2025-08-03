
// client/src/config/entityConfigs.js
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
      
      // Filter Configuration
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
            { value: 'dog', label: 'Dogs' },
            { value: 'cat', label: 'Cats' },
            { value: 'bird', label: 'Birds' },
            { value: 'fish', label: 'Fish' },
            { value: 'rabbit', label: 'Rabbits' },
            { value: 'hamster', label: 'Hamsters' },
            { value: 'other', label: 'Other Pets' }
          ]
        },
        age: { 
          label: 'Age', 
          type: 'select',
          options: [
            { value: 'all', label: 'All Ages' },
            { value: 'puppy/kitten', label: 'Puppy/Kitten' },
            { value: 'young', label: 'Young' },
            { value: 'adult', label: 'Adult' },
            { value: 'senior', label: 'Senior' }
          ]
        },
        gender: { 
          label: 'Gender', 
          type: 'select',
          options: [
            { value: 'all', label: 'All Genders' },
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' }
          ]
        },
        size: { 
          label: 'Size', 
          type: 'select',
          options: [
            { value: 'all', label: 'All Sizes' },
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' }
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
            { value: 'name', label: 'Name A-Z' },
            { value: 'name-desc', label: 'Name Z-A' },
            { value: 'featured', label: 'Featured First' }
          ]
        }
      },
      
      // Card Configuration
      card: {
        imageCategory: 'pet',
        titleField: 'name',
        subtitleFields: ['breed', 'age'],
        badgeField: 'type',
        statusLogic: (item) => {
          if (item.adopted) return { text: 'Adopted', variant: 'success', icon: 'heart' };
          if (item.featured) return { text: 'Featured', variant: 'warning', icon: 'star' };
          return { text: 'Available', variant: 'primary', icon: 'home' };
        },
        showFavoriteButton: true,
        showAdoptionStatus: true
      },
      
      // Detail Page Configuration
      detail: {
        imageCategory: 'pet',
        titleField: 'name',
        breadcrumbLogic: (item) => `${item.name} - ${item.breed}`,
        primaryAction: { text: 'Adopt Me', icon: 'heart', variant: 'primary' },
        secondaryAction: { text: 'Share', icon: 'share', variant: 'outline-secondary' }
      },
      
      // Header Configuration
      header: {
        icon: 'fas fa-paw',
        title: 'Browse Pets',
        subtitle: (totalCount) => totalCount > 0 
          ? `Found ${totalCount} adorable pet${totalCount > 1 ? 's' : ''} waiting for homes`
          : 'Discover your perfect companion',
        quickActions: [
          { text: 'Reset Filters', icon: 'undo', variant: 'outline-primary', action: 'reset' },
          { text: 'Featured Only', icon: 'star', variant: 'outline-success', action: 'featured' }
        ]
      }
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
      
      // Filter Configuration
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
            { value: 'food', label: 'Food' },
            { value: 'toys', label: 'Toys' },
            { value: 'accessories', label: 'Accessories' },
            { value: 'grooming', label: 'Grooming' },
            { value: 'health', label: 'Health' },
            { value: 'general', label: 'General' }
          ]
        },
        brand: { 
          label: 'Brand', 
          type: 'select',
          options: [
            { value: 'all', label: 'All Brands' },
            { value: 'generic', label: 'Generic' },
            { value: 'premium', label: 'Premium' }
          ]
        },
        minPrice: { 
          label: 'Min Price', 
          type: 'number',
          placeholder: 'Min $'
        },
        maxPrice: { 
          label: 'Max Price', 
          type: 'number',
          placeholder: 'Max $'
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
      
      // Card Configuration
      card: {
        imageCategory: 'product',
        titleField: 'name',
        subtitleFields: ['category', 'brand'],
        priceField: 'price',
        statusLogic: (item) => {
          if (!item.inStock) return { text: 'Out of Stock', variant: 'danger', icon: 'times' };
          if (item.featured) return { text: 'Featured', variant: 'warning', icon: 'star' };
          return { text: 'In Stock', variant: 'success', icon: 'check' };
        },
        showAddToCart: true,
        showPrice: true
      },
      
      // Detail Page Configuration
      detail: {
        imageCategory: 'product',
        titleField: 'name',
        breadcrumbLogic: (item) => `${item.name}`,
        primaryAction: { text: 'Add to Cart', icon: 'shopping-cart', variant: 'primary' },
        secondaryAction: { text: 'Add to Wishlist', icon: 'heart', variant: 'outline-danger' }
      },
      
      // Header Configuration
      header: {
        icon: 'fas fa-shopping-bag',
        title: 'Browse Products',
        subtitle: (totalCount) => totalCount > 0 
          ? `Found ${totalCount} product${totalCount > 1 ? 's' : ''} for your pets`
          : 'Everything your pets need and more',
        quickActions: [
          { text: 'Reset Filters', icon: 'undo', variant: 'outline-primary', action: 'reset' },
          { text: 'Featured Only', icon: 'star', variant: 'outline-success', action: 'featured' }
        ]
      }
    },
  
    // ✅ BONUS: News configuration (ready for future expansion)
    news: {
      name: 'news',
      displayName: 'News',
      singularName: 'article',
      singularDisplayName: 'Article',
      
      api: {
        basePath: '/api/news',
        getAllMethod: 'getAllNews',
        getByIdMethod: 'getNewsById',
        getFeaturedMethod: 'getFeaturedNews'
      },
      
      routes: {
        browse: '/news',
        detail: '/news/:id'
      },
      
      filters: {
        search: { 
          label: 'Search Articles', 
          placeholder: 'Search news...',
          type: 'text' 
        },
        category: { 
          label: 'Category', 
          type: 'select',
          options: [
            { value: 'all', label: 'All Categories' },
            { value: 'pet-care', label: 'Pet Care' },
            { value: 'health', label: 'Health' },
            { value: 'nutrition', label: 'Nutrition' },
            { value: 'training', label: 'Training' },
            { value: 'adoption', label: 'Adoption' }
          ]
        },
        featured: { 
          label: 'Featured', 
          type: 'select',
          options: [
            { value: 'all', label: 'All Articles' },
            { value: 'true', label: 'Featured Only' }
          ]
        },
        sort: { 
          label: 'Sort By', 
          type: 'select',
          options: [
            { value: 'newest', label: 'Newest First' },
            { value: 'oldest', label: 'Oldest First' },
            { value: 'title', label: 'Title A-Z' },
            { value: 'featured', label: 'Featured First' }
          ]
        }
      },
      
      card: {
        imageCategory: 'news',
        titleField: 'title',
        subtitleFields: ['category', 'author'],
        statusLogic: (item) => {
          if (item.featured) return { text: 'Featured', variant: 'warning', icon: 'star' };
          return { text: 'Published', variant: 'primary', icon: 'newspaper' };
        },
        showReadMore: true
      },
      
      detail: {
        imageCategory: 'news',
        titleField: 'title',
        breadcrumbLogic: (item) => item.title,
        primaryAction: { text: 'Share Article', icon: 'share', variant: 'primary' },
        secondaryAction: { text: 'Save for Later', icon: 'bookmark', variant: 'outline-secondary' }
      },
      
      header: {
        icon: 'fas fa-newspaper',
        title: 'Pet News & Articles',
        subtitle: (totalCount) => totalCount > 0 
          ? `${totalCount} helpful article${totalCount > 1 ? 's' : ''} for pet lovers`
          : 'Stay informed about pet care and news',
        quickActions: [
          { text: 'Reset Filters', icon: 'undo', variant: 'outline-primary', action: 'reset' },
          { text: 'Featured Only', icon: 'star', variant: 'outline-success', action: 'featured' }
        ]
      }
    }
  };