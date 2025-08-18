// client/src/config/entityConfigs.js
export const ENTITY_CONFIGS = {
  pets: {
    displayName: 'Pets',
    routes: {
      browse: '/browse',
      detail: '/pets/:id'
    },
    api: {
      getAllMethod: 'getAllPets'
    },
    header: {
      title: 'Find Your Perfect Companion',
      subtitle: (count) => `Discover ${count} amazing pets waiting for loving homes`,
      icon: 'fas fa-paw',
      quickActions: [
        {
          action: 'filter',
          text: 'Available Now',
          icon: '✅',
          variant: 'success',
          filters: { status: 'available' }
        },
        {
          action: 'filter', 
          text: 'Featured Pets',
          icon: '⭐',
          variant: 'warning',
          filters: { featured: 'true' }
        },
        {
          action: 'filter',
          text: 'Dogs',
          icon: '🐕',
          filters: { type: 'dog' }
        },
        {
          action: 'filter',
          text: 'Cats', 
          icon: '🐱',
          filters: { type: 'cat' }
        },
        {
          action: 'filter',
          text: 'Puppies & Kittens', 
          icon: '🐶',
          variant: 'info',
          filters: { age: 'puppy,kitten' }
        },
        {
          action: 'filter',
          text: 'Small Pets', 
          icon: '🐹',
          variant: 'secondary',
          filters: { size: 'small' }
        }
      ]
    },
    filters: {
      search: {
        type: 'text',
        label: 'Search Pets',
        placeholder: 'Search by name, breed, or description...'
      },
      type: {
        type: 'select',
        label: 'Pet Type',
        options: [
          { value: 'all', label: 'All Types' },
          { value: 'dog', label: 'Dogs' },
          { value: 'cat', label: 'Cats' },
          { value: 'bird', label: 'Birds' },
          { value: 'fish', label: 'Fish' },
          { value: 'rabbit', label: 'Rabbits' },
          { value: 'hamster', label: 'Hamsters' },
          { value: 'guinea-pig', label: 'Guinea Pigs' },
          { value: 'ferret', label: 'Ferrets' },
          { value: 'chinchilla', label: 'Chinchillas' },
          { value: 'gerbil', label: 'Gerbils' },
          { value: 'hedgehog', label: 'Hedgehogs' },
          { value: 'fancy-rat', label: 'Fancy Rats' },
          { value: 'sugar-glider', label: 'Sugar Gliders' },
          { value: 'stoat', label: 'Stoats' }
        ]
      },
      age: {
        type: 'select',
        label: 'Age Group',
        options: [
          { value: 'all', label: 'All Ages' },
          { value: 'puppy', label: 'Puppies' },
          { value: 'kitten', label: 'Kittens' },
          { value: 'baby', label: 'Babies' },
          { value: 'young', label: 'Young' },
          { value: 'juvenile', label: 'Juveniles' },
          { value: 'adult', label: 'Adults' },
          { value: 'mature', label: 'Mature' },
          { value: 'senior', label: 'Seniors' },
          { value: 'fry', label: 'Fry (Fish)' }
        ]
      },
      size: {
        type: 'select', 
        label: 'Size',
        options: [
          { value: 'all', label: 'All Sizes' },
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' }
        ]
      },
      status: {
        type: 'select',
        label: 'Availability',
        options: [
          { value: 'all', label: 'All' },
          { value: 'available', label: 'Available' },
          { value: 'pending', label: 'Pending' },
          { value: 'adopted', label: 'Adopted' }
        ]
      },
      featured: {
        type: 'select',
        label: 'Featured',
        options: [
          { value: 'all', label: 'All Pets' },
          { value: 'true', label: 'Featured Only' }
        ]
      }
    }
  },

  products: {
    displayName: 'Products',
    routes: {
      browse: '/products',
      detail: '/products/:id'
    },
    api: {
      getAllMethod: 'getAllProducts'
    },
    header: {
      title: 'Pet Products & Supplies',
      subtitle: (count) => `Shop from ${count} quality products for your furry friends`,
      icon: 'fas fa-shopping-bag',
      quickActions: [
        {
          action: 'filter',
          text: 'On Sale',
          icon: '🏷️',
          variant: 'danger',
          filters: { onSale: 'true' }
        },
        {
          action: 'filter',
          text: 'New Arrivals',
          icon: '✨',
          variant: 'info',
          filters: { newArrival: 'true' }
        },
        {
          action: 'filter',
          text: 'Top Rated',
          icon: '⭐',
          variant: 'warning',
          filters: { rating: '4plus' }
        }
      ]
    },
    filters: {
      search: {
        type: 'text',
        label: 'Search Products',
        placeholder: 'Search by name, brand, or description...'
      },
      category: {
        type: 'select',
        label: 'Category',
        options: [
          { value: 'all', label: 'All Categories' },
          { value: 'Dog Care', label: 'Dog Care' },
          { value: 'Cat Care', label: 'Cat Care' },
          { value: 'Aquarium & Fish Care', label: 'Aquarium & Fish Care' },
          { value: 'Grooming & Health', label: 'Grooming & Health' },
          { value: 'Training & Behavior', label: 'Training & Behavior' }
        ]
      },
      priceRange: {
        type: 'select',
        label: 'Price Range',
        options: [
          { value: 'all', label: 'All Prices' },
          { value: '0-10', label: 'Under $10' },
          { value: '10-20', label: '$10 - $20' },
          { value: '20-50', label: '$20 - $50' },
          { value: '50+', label: '$50+' }
        ]
      },
      inStock: {
        type: 'select',
        label: 'Availability',
        options: [
          { value: 'all', label: 'All Products' },
          { value: 'true', label: 'In Stock Only' }
        ]
      },
      featured: {
        type: 'select',
        label: 'Featured',
        options: [
          { value: 'all', label: 'All Products' },
          { value: 'true', label: 'Featured Only' }
        ]
      }
    }
  }
};