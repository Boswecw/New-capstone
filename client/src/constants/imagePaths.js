// client/src/constants/imagePaths.js
import { getGoogleStorageUrl, getBrandLogo, getPawLoveIcon } from '../utils/imageUtils';

/**
 * Centralized image path configuration using Google Cloud Storage
 * All images are now served from GCS with optimization and fallback support
 */

export const IMAGE_PATHS = {
  // Brand assets
  brand: {
    logo: getBrandLogo('medium'),
    logoLarge: getBrandLogo('large'),
    logoSmall: getBrandLogo('small'),
    pawLove: getPawLoveIcon(),
  },
  
  // Pet images organized by category
  pets: {
    // Dogs
    goldenRetriever: getGoogleStorageUrl('pets/dogs/GoldenRetriever.png'),
    germanShepherd: getGoogleStorageUrl('pets/dogs/german-shepherd.png'),
    
    // Cats  
    catA: getGoogleStorageUrl('pets/cats/CatA.png'),
    siamese: getGoogleStorageUrl('pets/cats/Siamese.png'),
    
    // Aquatic pets
    betafish: getGoogleStorageUrl('pets/aquatics/Betafish.jpg'),
    
    // Birds
    parrot: getGoogleStorageUrl('pets/birds/Parrot.png'),
    
    // Small pets
    rabbit: getGoogleStorageUrl('pets/small-pets/RabbitA.png'),
    guineaPig: getGoogleStorageUrl('pets/small-pets/GuineaPigsLPicon.png'),
  },
  
  // Supply/product images
  supplies: {
    petBed: getGoogleStorageUrl('supplies/PetBeds.png'),
    petFood: getGoogleStorageUrl('supplies/PetFoodLPicon.png'),
    toys: getGoogleStorageUrl('supplies/pet-toys.png'),
    collars: getGoogleStorageUrl('supplies/pet-collars.png'),
    carriers: getGoogleStorageUrl('supplies/pet-carriers.png'),
  },
  
  // Default/placeholder images
  defaults: {
    pet: getGoogleStorageUrl('defaults/default-pet.png'),
    dog: getGoogleStorageUrl('defaults/default-dog.png'),
    cat: getGoogleStorageUrl('defaults/default-cat.png'),
    fish: getGoogleStorageUrl('defaults/default-fish.png'),
    bird: getGoogleStorageUrl('defaults/default-bird.png'),
    smallPet: getGoogleStorageUrl('defaults/default-smallpet.png'),
    supply: getGoogleStorageUrl('defaults/default-supply.png'),
    loading: getGoogleStorageUrl('defaults/loading-spinner.gif'),
  },
  
  // Hero/banner images
  heroes: {
    home: getGoogleStorageUrl('heroes/home-banner.jpg', 'hero'),
    about: getGoogleStorageUrl('heroes/about-banner.jpg', 'hero'),
    contact: getGoogleStorageUrl('heroes/contact-banner.jpg', 'hero'),
  },
  
  // Category images for navigation/cards
  categories: {
    dogs: getGoogleStorageUrl('categories/dogs-category.jpg'),
    cats: getGoogleStorageUrl('categories/cats-category.jpg'),
    aquatics: getGoogleStorageUrl('categories/aquatics-category.jpg'),
    birds: getGoogleStorageUrl('categories/birds-category.jpg'),
    smallPets: getGoogleStorageUrl('categories/small-pets-category.jpg'),
    supplies: getGoogleStorageUrl('categories/supplies-category.jpg'),
  },
  
  // Legacy fallback URLs (for external placeholders)
  placeholders: {
    pet: "https://via.placeholder.com/300x200/cccccc/666666?text=Pet+Photo",
    product: "https://via.placeholder.com/300x200/cccccc/666666?text=Product",
    brand: "https://via.placeholder.com/300x200/cccccc/666666?text=Brand",
    avatar: "https://via.placeholder.com/100x100/cccccc/666666?text=User",
  },
};

/**
 * Helper function to get image URL by category and name
 * @param {string} category - Image category (pets, supplies, brand, etc.)
 * @param {string} name - Image name
 * @param {string} size - Size variant (optional)
 * @returns {string} - Image URL
 */
export const getImageUrl = (category, name, size = 'medium') => {
  const categoryImages = IMAGE_PATHS[category];
  if (!categoryImages) {
    console.warn(`Image category "${category}" not found`);
    return IMAGE_PATHS.defaults.pet;
  }
  
  const imageUrl = categoryImages[name];
  if (!imageUrl) {
    console.warn(`Image "${name}" not found in category "${category}"`);
    return IMAGE_PATHS.defaults.pet;
  }
  
  return imageUrl;
};

/**
 * Get pet image by type with fallback
 * @param {string} petType - Type of pet
 * @param {string} breed - Breed name (optional)
 * @param {string} size - Size variant
 * @returns {string} - Pet image URL
 */
export const getPetImageUrl = (petType, breed = null, size = 'medium') => {
  // Try to find specific breed image first
  if (breed) {
    const breedKey = breed.toLowerCase().replace(/[^a-z0-9]/g, '');
    const breedImage = IMAGE_PATHS.pets[breedKey];
    if (breedImage) {
      return breedImage;
    }
  }
  
  // Fall back to default for pet type
  const defaultImage = IMAGE_PATHS.defaults[petType];
  if (defaultImage) {
    return defaultImage;
  }
  
  // Final fallback
  return IMAGE_PATHS.defaults.pet;
};

/**
 * Get category image for navigation/display
 * @param {string} category - Category name
 * @returns {string} - Category image URL
 */
export const getCategoryImageUrl = (category) => {
  const categoryImage = IMAGE_PATHS.categories[category];
  return categoryImage || IMAGE_PATHS.defaults.pet;
};

/**
 * Preload critical images for the application
 */
export const preloadCriticalImages = () => {
  const criticalImages = [
    IMAGE_PATHS.brand.logo,
    IMAGE_PATHS.heroes.home,
    IMAGE_PATHS.defaults.pet,
    IMAGE_PATHS.defaults.dog,
    IMAGE_PATHS.defaults.cat,
  ];
  
  if (typeof window !== 'undefined') {
    criticalImages.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });
  }
};

export default IMAGE_PATHS;