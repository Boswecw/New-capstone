// client/src/constants/imagePaths.js
import { getGoogleStorageUrl, getPawLoveIcon } from '../utils/imageUtils';

/**
 * Centralized image path configuration using Google Cloud Storage
 * All images are now served from GCS with optimization and fallback support
 */

const brandIcon = getGoogleStorageUrl('brand/FurBabiesicon.png');

export const IMAGE_PATHS = {
  // Brand assets
  brand: {
    logo: brandIcon,
    logoLarge: brandIcon,
    logoSmall: brandIcon,
    pawLove: getPawLoveIcon(),
  },

  // Pet images organized by category
  pets: {
    goldenRetriever: getGoogleStorageUrl('pet/GoldenRetriever.png'),
    germanShepherd: getGoogleStorageUrl('pet/german-shepherd.png'),
    catA: getGoogleStorageUrl('pet/CatA.png'),
    siamese: getGoogleStorageUrl('pet/Siamese.png'),
    betafish: getGoogleStorageUrl('pet/Betafish.jpg'),
    parrot: getGoogleStorageUrl('pet/Parrot.png'),
    rabbit: getGoogleStorageUrl('pet/RabbitA.png'),
    guineaPig: getGoogleStorageUrl('pet/GuineaPigsLPicon.png'),
  },

  // Supply/product images
  supplies: {
    petBed: getGoogleStorageUrl('product/PetBeds.png'),
    petFood: getGoogleStorageUrl('product/PetFoodLPicon.png'),
    toys: getGoogleStorageUrl('product/interactive-cat-toy.png'),
  },

  // Default/placeholder images
  defaults: {
    pet: getGoogleStorageUrl('pet/default-pet.png'),
    dog: getGoogleStorageUrl('pet/default-dog.png'),
    cat: getGoogleStorageUrl('pet/default-cat.png'),
    fish: getGoogleStorageUrl('pet/default-fish.png'),
    bird: getGoogleStorageUrl('pet/default-bird.png'),
    smallPet: getGoogleStorageUrl('pet/default-smallpet.png'),
    supply: getGoogleStorageUrl('product/default-supply.png'),
    loading: getGoogleStorageUrl('product/loading-spinner.gif'),
  },

  // Hero/banner images
  heroes: {
    home: getGoogleStorageUrl('hero/home-banner.jpg', 'hero'),
    about: getGoogleStorageUrl('hero/about-banner.jpg', 'hero'),
    contact: getGoogleStorageUrl('hero/contact-banner.jpg', 'hero'),
    icon: brandIcon,
  },

  // Category images for navigation/cards
  categories: {
    dogs: getGoogleStorageUrl('category/dogs-category.jpg'),
    cats: getGoogleStorageUrl('category/cats-category.jpg'),
    aquatics: getGoogleStorageUrl('category/aquatics-category.jpg'),
    birds: getGoogleStorageUrl('category/birds-category.jpg'),
    smallPets: getGoogleStorageUrl('category/small-pets-category.jpg'),
    supplies: getGoogleStorageUrl('category/supplies-category.jpg'),
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
 * Get image URL by category and name
 */
export const getImageUrl = (category, name, size = 'medium') => {
  const categoryImages = IMAGE_PATHS[category];
  if (!categoryImages) return IMAGE_PATHS.defaults.pet;
  return categoryImages[name] || IMAGE_PATHS.defaults.pet;
};

/**
 * Get pet image by type or breed
 */
export const getPetImageUrl = (petType, breed = null, size = 'medium') => {
  if (breed) {
    const key = breed.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (IMAGE_PATHS.pets[key]) return IMAGE_PATHS.pets[key];
  }
  return IMAGE_PATHS.defaults[petType] || IMAGE_PATHS.defaults.pet;
};

/**
 * Get category display image
 */
export const getCategoryImageUrl = (category) => {
  return IMAGE_PATHS.categories[category] || IMAGE_PATHS.defaults.pet;
};

/**
 * Preload core assets
 */
export const preloadCriticalImages = () => {
  const preload = [
    IMAGE_PATHS.brand.logo,
    IMAGE_PATHS.heroes.home,
    IMAGE_PATHS.defaults.pet,
    IMAGE_PATHS.defaults.dog,
    IMAGE_PATHS.defaults.cat,
  ];

  if (typeof window !== 'undefined') {
    preload.forEach((url) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });
  }
};

export default IMAGE_PATHS;
