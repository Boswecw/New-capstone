// client/src/utils/imageUtils.js

// Google Cloud Storage Configuration
const GCS_CONFIG = {
  bucketName: process.env.REACT_APP_GCS_BUCKET_NAME || 'furbabies-petstore',
  baseUrl: process.env.REACT_APP_GCS_BASE_URL || 'https://storage.googleapis.com/furbabies-petstore',
  cdnUrl: process.env.REACT_APP_GCS_CDN_URL || '',
};

// Helper to decide if GCS is enabled
const shouldUseGCS = () => {
  return Boolean(process.env.REACT_APP_GCS_BUCKET_NAME);
};

// Centralized fallback map for local images
const FALLBACKS = {
  brand: {
    logo: '/assets/brand/FurBabiesicon.png',
    pawLove: '/assets/brand/PawLoveicon.png',
  },
  product: {
    default: '/assets/product/default-supply.png',
    'interactive-cat-toy.png': '/assets/product/interactive-cat-toy.png',
    'PetBeds.png': '/assets/product/PetBeds.png',
    'PetFoodLPicon.png': '/assets/product/PetFoodLPicon.png',
  },
  pet: {
    default: '/assets/pet/default-pet.png',
    dog: '/assets/pet/default-dog.png',
    cat: '/assets/pet/default-cat.png',
    fish: '/assets/pet/default-fish.png',
    bird: '/assets/pet/default-bird.png',
    smallpet: '/assets/pet/default-smallpet.png',
  }
};

// Construct full GCS URL
const generateGCSUrl = (path) => {
  if (!shouldUseGCS()) return null;
  const cleanPath = path.replace(/^\/+/g, '');
  return `${GCS_CONFIG.baseUrl}/${cleanPath}`;
};

// Determine fallback local asset path
const getLocalFallback = (path) => {
  const cleanPath = path.toLowerCase();
  if (cleanPath.includes('brand')) {
    return FALLBACKS.brand.logo;
  } else if (cleanPath.includes('pawlove')) {
    return FALLBACKS.brand.pawLove;
  } else if (cleanPath.includes('interactive-cat-toy')) {
    return FALLBACKS.product['interactive-cat-toy.png'];
  } else if (cleanPath.includes('petbeds')) {
    return FALLBACKS.product['PetBeds.png'];
  } else if (cleanPath.includes('petfood')) {
    return FALLBACKS.product['PetFoodLPicon.png'];
  } else if (cleanPath.includes('dog')) {
    return FALLBACKS.pet.dog;
  } else if (cleanPath.includes('cat')) {
    return FALLBACKS.pet.cat;
  } else if (cleanPath.includes('fish')) {
    return FALLBACKS.pet.fish;
  } else if (cleanPath.includes('bird')) {
    return FALLBACKS.pet.bird;
  } else if (cleanPath.includes('small')) {
    return FALLBACKS.pet.smallpet;
  }
  return FALLBACKS.pet.default;
};

// Exported main function
export const getGoogleStorageUrl = (path) => {
  const gcsUrl = generateGCSUrl(path);
  return gcsUrl || getLocalFallback(path);
};

export const getBrandLogo = (size = 'medium') => {
  return getGoogleStorageUrl('brand/FurBabiesicon.png');
};

export const getPawLoveIcon = () => {
  return getGoogleStorageUrl('brand/PawLoveicon.png');
};

export const getPetImage = (fileName) => {
  return getGoogleStorageUrl(`pet/${fileName}`);
};

export const getProductImage = (fileName) => {
  return getGoogleStorageUrl(`product/${fileName}`);
};

export const getDefaultPetImage = (type = 'pet') => {
  return FALLBACKS.pet[type] || FALLBACKS.pet.default;
};

export const handleImageError = (e, fallbackType = 'pet') => {
  e.target.src = getDefaultPetImage(fallbackType);
};

export const generateSrcSet = (imagePath, sizes = ['small', 'medium', 'large']) => {
  if (!imagePath) return '';
  
  const baseUrl = getGoogleStorageUrl(imagePath);
  return baseUrl;
};