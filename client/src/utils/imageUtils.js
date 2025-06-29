// client/src/utils/imageUtils.js
/**
 * Google Cloud Storage Image Utilities
 * Local assets mirror GCS structure: /assets/brand/, /assets/pet/, /assets/product/
 * GCS structure: brand/, pet/, product/
 */

// Environment configuration
const GCS_CONFIG = {
  bucketName: process.env.REACT_APP_GCS_BUCKET_NAME || 'furbabies-petstore',
  baseUrl: process.env.REACT_APP_GCS_BASE_URL || 'https://storage.googleapis.com',
  cdnUrl: process.env.REACT_APP_GCS_CDN_URL,
};

// Local fallback paths - assets are organized in folders mirroring GCS
const LOCAL_FALLBACKS = {
  // Brand assets
  'brand/FurBabiesIcon.png': '/assets/brand/FurBabiesIcon.png',
  'brand/PawLoveicon.png': '/assets/brand/PawLoveicon.png',
  
  // Pet assets
  'pet/GoldenRetriever.png': '/assets/pet/GoldenRetriever.png',
  'pet/german-shepherd.png': '/assets/pet/german-shepherd.png',
  'pet/CatA.png': '/assets/pet/CatA.png',
  'pet/Siamese.png': '/assets/pet/Siamese.png',
  'pet/Betafish.jpg': '/assets/pet/Betafish.jpg',
  'pet/Parrot.png': '/assets/pet/Parrot.png',
  'pet/RabbitA.png': '/assets/pet/RabbitA.png',
  'pet/GuineaPigsLPicon.png': '/assets/pet/GuineaPigsLPicon.png',
  'pet/default-pet.png': '/assets/pet/default-pet.png',
  'pet/default-dog.png': '/assets/pet/default-dog.png',
  'pet/default-cat.png': '/assets/pet/default-cat.png',
  'pet/default-fish.png': '/assets/pet/default-fish.png',
  'pet/default-bird.png': '/assets/pet/default-bird.png',
  'pet/default-smallpet.png': '/assets/pet/default-smallpet.png',
  
  // Product assets
  'product/Dogfood.png': '/assets/product/Dogfood.png',
  'product/interactivecattoy.png': '/assets/product/interactivecattoy.png',
  'product/Aquarium.png': '/assets/product/Aquarium.png',
  'product/PetBeds.png': '/assets/product/PetBeds.png',
  'product/PetFoodLPicon.png': '/assets/product/PetFoodLPicon.png',
  'product/pet-toys.png': '/assets/product/pet-toys.png',
  'product/pet-collars.png': '/assets/product/pet-collars.png',
  'product/pet-carriers.png': '/assets/product/pet-carriers.png',
  'product/default-supply.png': '/assets/product/default-supply.png',

  // Legacy path mappings for backward compatibility
  'assets/brand/FurBabiesIcon.png': '/assets/brand/FurBabiesIcon.png',
  'assets/brand/PawLoveicon.png': '/assets/brand/PawLoveicon.png',
  'assets/pet/GoldenRetriever.png': '/assets/pet/GoldenRetriever.png',
  'assets/pet/CatA.png': '/assets/pet/CatA.png',
  'assets/pet/Siamese.png': '/assets/pet/Siamese.png',
  'assets/pet/Betafish.jpg': '/assets/pet/Betafish.jpg',
  'assets/pet/Parrot.png': '/assets/pet/Parrot.png',
  'assets/pet/RabbitA.png': '/assets/pet/RabbitA.png',
  'assets/pet/GuineaPigsLPicon.png': '/assets/pet/GuineaPigsLPicon.png',
  'assets/product/Dogfood.png': '/assets/product/Dogfood.png',
  'assets/product/interactivecattoy.png': '/assets/product/interactivecattoy.png',
  'assets/product/Aquarium.png': '/assets/product/Aquarium.png',
  'assets/product/PetBeds.png': '/assets/product/PetBeds.png',
  'assets/product/PetFoodLPicon.png': '/assets/product/PetFoodLPicon.png',
  'assets/product/pet-toys.png': '/assets/product/pet-toys.png',
  'assets/product/pet-collars.png': '/assets/product/pet-collars.png',
  'assets/product/pet-carriers.png': '/assets/product/pet-carriers.png',

  // Organized nested paths (from your imagePaths.js)
  'pets/dogs/GoldenRetriever.png': '/assets/pet/GoldenRetriever.png',
  'pets/dogs/german-shepherd.png': '/assets/pet/german-shepherd.png',
  'pets/cats/CatA.png': '/assets/pet/CatA.png',
  'pets/cats/Siamese.png': '/assets/pet/Siamese.png',
  'pets/aquatics/Betafish.jpg': '/assets/pet/Betafish.jpg',
  'pets/birds/Parrot.png': '/assets/pet/Parrot.png',
  'pets/small-pets/RabbitA.png': '/assets/pet/RabbitA.png',
  'pets/small-pets/GuineaPigsLPicon.png': '/assets/pet/GuineaPigsLPicon.png',
  'supplies/PetBeds.png': '/assets/product/PetBeds.png',
  'supplies/PetFoodLPicon.png': '/assets/product/PetFoodLPicon.png',
  'supplies/pet-toys.png': '/assets/product/pet-toys.png',
  'supplies/pet-collars.png': '/assets/product/pet-collars.png',
  'supplies/pet-carriers.png': '/assets/product/pet-carriers.png',

  // Fallback images directory
  'defaults/default-pet.png': '/images/default-pet.png',
  'defaults/default-dog.png': '/images/default-dog.png',
  'defaults/default-cat.png': '/images/default-cat.png',
  'defaults/default-fish.png': '/images/default-fish.png',
  'defaults/default-bird.png': '/images/default-bird.png',
  'defaults/default-smallpet.png': '/images/default-smallpet.png',
  'defaults/default-supply.png': '/images/default-supply.png',
};

// Image size configurations
const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150, quality: 80 },
  small: { width: 300, height: 200, quality: 85 },
  medium: { width: 600, height: 400, quality: 90 },
  large: { width: 1200, height: 800, quality: 95 },
  hero: { width: 1920, height: 1080, quality: 95 }
};

/**
 * Check if GCS is properly configured
 */
const shouldUseGCS = () => {
  return process.env.REACT_APP_GCS_BUCKET_NAME && 
         process.env.REACT_APP_GCS_BUCKET_NAME !== 'furbabies-petstore';
};

/**
 * Convert any image path to correct GCS structure (brand/, pet/, product/)
 */
const convertToGCSPath = (imagePath) => {
  if (!imagePath) return null;
  
  // Remove leading slashes and clean the path
  const cleanPath = imagePath.replace(/^\/+/, '');
  
  // If already in correct GCS format (brand/, pet/, product/), return as-is
  if (cleanPath.startsWith('brand/') || cleanPath.startsWith('pet/') || cleanPath.startsWith('product/')) {
    return cleanPath;
  }
  
  // Handle /assets/brand/, /assets/pet/, /assets/product/ paths
  if (cleanPath.startsWith('assets/')) {
    const withoutAssets = cleanPath.replace('assets/', '');
    // Already in correct folder structure after removing 'assets/'
    if (withoutAssets.startsWith('brand/') || withoutAssets.startsWith('pet/') || withoutAssets.startsWith('product/')) {
      return withoutAssets;
    }
  }
  
  // Handle nested organized paths
  if (cleanPath.startsWith('pets/')) {
    const fileName = cleanPath.split('/').pop();
    return `pet/${fileName}`;
  }
  
  if (cleanPath.startsWith('supplies/')) {
    const fileName = cleanPath.split('/').pop();
    return `product/${fileName}`;
  }
  
  if (cleanPath.startsWith('defaults/')) {
    const fileName = cleanPath.replace('defaults/', '');
    if (fileName.includes('supply') || fileName.includes('product')) {
      return `product/${fileName}`;
    } else {
      return `pet/${fileName}`;
    }
  }
  
  // If no folder structure, try to determine from filename
  const fileName = cleanPath.split('/').pop();
  
  // Brand assets
  if (fileName.includes('Icon') || fileName.includes('Logo') || fileName.includes('Paw') || fileName.includes('brand')) {
    return `brand/${fileName}`;
  }
  
  // Product assets
  if (fileName.includes('food') || fileName.includes('Food') || fileName.includes('toy') || fileName.includes('bed') || 
      fileName.includes('collar') || fileName.includes('carrier') || fileName.includes('supply') || 
      fileName.includes('Aquarium') || fileName.includes('interactivecattoy')) {
    return `product/${fileName}`;
  }
  
  // Default to pet folder for animal-related assets
  return `pet/${fileName}`;
};

/**
 * Generate Google Cloud Storage URL
 */
const generateGCSUrl = (imagePath, size = 'medium', options = {}) => {
  if (!shouldUseGCS()) return null;
  
  const gcsPath = convertToGCSPath(imagePath);
  if (!gcsPath) return null;
  
  const baseUrl = GCS_CONFIG.cdnUrl || `${GCS_CONFIG.baseUrl}/${GCS_CONFIG.bucketName}`;
  const sizeConfig = IMAGE_SIZES[size] || IMAGE_SIZES.medium;
  
  // Build query parameters
  const params = new URLSearchParams();
  
  if (GCS_CONFIG.cdnUrl) {
    params.append('w', sizeConfig.width);
    params.append('h', sizeConfig.height);
    params.append('q', options.quality || sizeConfig.quality);
    
    if (options.webp !== false && supportsWebP()) {
      params.append('fm', 'webp');
    }
    
    if (options.fit) params.append('fit', options.fit);
    if (options.crop) params.append('crop', options.crop);
  }
  
  const queryString = params.toString();
  const url = `${baseUrl}/${gcsPath}${queryString ? `?${queryString}` : ''}`;
  
  console.log(`Generated GCS URL: ${url} (from: ${imagePath})`);
  return url;
};

/**
 * Get local fallback image path
 */
const getLocalFallback = (imagePath) => {
  if (!imagePath) return '/images/placeholder.png';
  
  // Clean the path
  const cleanPath = imagePath.replace(/^\/+/, '');
  
  // Try exact match first
  if (LOCAL_FALLBACKS[cleanPath]) {
    return LOCAL_FALLBACKS[cleanPath];
  }
  
  // Try GCS converted path
  const gcsPath = convertToGCSPath(imagePath);
  if (gcsPath && LOCAL_FALLBACKS[gcsPath]) {
    return LOCAL_FALLBACKS[gcsPath];
  }
  
  // Try to build path from folder structure
  if (gcsPath) {
    const localPath = `/assets/${gcsPath}`;
    console.log(`Trying local path: ${localPath} for ${imagePath}`);
    return localPath;
  }
  
  // Fallback to images directory based on type
  if (cleanPath.includes('brand') || cleanPath.includes('logo') || cleanPath.includes('Icon')) {
    return '/images/logo.png';
  } else if (cleanPath.includes('product') || cleanPath.includes('supply') || cleanPath.includes('food')) {
    return '/images/default-supply.png';
  } else if (cleanPath.includes('dog')) {
    return '/images/default-dog.png';
  } else if (cleanPath.includes('cat')) {
    return '/images/default-cat.png';
  } else if (cleanPath.includes('fish') || cleanPath.includes('aqua')) {
    return '/images/default-fish.png';
  } else if (cleanPath.includes('bird')) {
    return '/images/default-bird.png';
  } else if (cleanPath.includes('rabbit') || cleanPath.includes('guinea')) {
    return '/images/default-smallpet.png';
  }
  
  // Ultimate fallback
  return '/images/placeholder.png';
};

/**
 * Main function: Get optimized image URL with intelligent fallback
 */
export const getGoogleStorageUrl = (imagePath, size = 'medium', options = {}) => {
  if (!imagePath) return getLocalFallback('pet/default-pet.png');
  
  // Strategy 1: Use GCS if properly configured
  if (shouldUseGCS()) {
    const gcsUrl = generateGCSUrl(imagePath, size, options);
    if (gcsUrl) return gcsUrl;
  }
  
  // Strategy 2: Use local fallback (assets mirror GCS structure)
  const localUrl = getLocalFallback(imagePath);
  console.log(`Using local fallback: ${localUrl} for ${imagePath}`);
  return localUrl;
};

/**
 * Get brand logo URL
 */
export const getBrandLogo = (size = 'medium') => {
  return getGoogleStorageUrl('brand/FurBabiesIcon.png', size);
};

/**
 * Get paw love icon URL
 */
export const getPawLoveIcon = () => {
  return getGoogleStorageUrl('brand/PawLoveicon.png');
};

/**
 * Get pet image URL
 */
export const getPetImage = (imageName, size = 'medium') => {
  return getGoogleStorageUrl(`pet/${imageName}`, size);
};

/**
 * Get product image URL
 */
export const getProductImage = (imageName, size = 'medium') => {
  return getGoogleStorageUrl(`product/${imageName}`, size);
};

/**
 * Get default placeholder image
 */
export const getDefaultPetImage = (petType = 'pet') => {
  const fallbackMap = {
    dog: 'pet/default-dog.png',
    cat: 'pet/default-cat.png',
    fish: 'pet/default-fish.png',
    bird: 'pet/default-bird.png',
    'small-pet': 'pet/default-smallpet.png',
    smallpet: 'pet/default-smallpet.png',
    supply: 'product/default-supply.png',
    product: 'product/default-supply.png',
    pet: 'pet/default-pet.png'
  };
  
  const imagePath = fallbackMap[petType] || fallbackMap.pet;
  return getGoogleStorageUrl(imagePath);
};

/**
 * Generate srcset for responsive images
 */
export const generateSrcSet = (imagePath, sizes = ['small', 'medium', 'large']) => {
  if (!imagePath) return '';
  
  return sizes
    .map(size => {
      const url = getGoogleStorageUrl(imagePath, size);
      const config = IMAGE_SIZES[size];
      return `${url} ${config.width}w`;
    })
    .join(', ');
};

/**
 * Handle image loading errors with fallback logic
 */
export const handleImageError = (event, itemType = 'pet') => {
  const img = event.target;
  
  if (img.dataset.fallbackCount >= 3) {
    console.warn('All image fallbacks exhausted, hiding image');
    img.style.display = 'none';
    return;
  }
  
  const fallbackCount = parseInt(img.dataset.fallbackCount || '0') + 1;
  img.dataset.fallbackCount = fallbackCount;
  
  switch (fallbackCount) {
    case 1:
      img.src = getDefaultPetImage(itemType);
      console.warn(`Image failed, trying type-specific fallback: ${img.src}`);
      break;
    case 2:
      img.src = getLocalFallback('pet/default-pet.png');
      console.warn(`Type-specific fallback failed, trying generic: ${img.src}`);
      break;
    case 3:
      img.src = '/images/placeholder.png';
      console.warn(`Generic fallback failed, trying absolute placeholder: ${img.src}`);
      break;
    default:
      img.style.display = 'none';
      console.error('All image fallbacks failed');
  }
};

/**
 * Check WebP support
 */
export const supportsWebP = () => {
  if (typeof window === 'undefined') return false;
  
  if (window.webpSupport !== undefined) {
    return window.webpSupport;
  }
  
  const webp = new Image();
  webp.onload = webp.onerror = () => {
    window.webpSupport = (webp.height === 2);
  };
  webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  
  return false;
};

/**
 * Preload critical images
 */
export const preloadImages = (imagePaths, size = 'medium') => {
  imagePaths.forEach(path => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = getGoogleStorageUrl(path, size);
    document.head.appendChild(link);
  });
};

/**
 * Validate configuration
 */
export const validateGCSConfig = () => {
  const issues = [];
  
  if (!shouldUseGCS()) {
    issues.push('GCS not properly configured - using local fallbacks');
    issues.push('Set REACT_APP_GCS_BUCKET_NAME to enable GCS');
  }
  
  return {
    isValid: shouldUseGCS(),
    usingGCS: shouldUseGCS(),
    usingLocal: !shouldUseGCS(),
    bucketStructure: ['brand/', 'pet/', 'product/'],
    localStructure: ['/assets/brand/', '/assets/pet/', '/assets/product/'],
    issues,
    config: { 
      gcs: GCS_CONFIG,
      localFallbacks: Object.keys(LOCAL_FALLBACKS).length 
    }
  };
};

// Debug function
export const debugImageConfig = () => {
  if (process.env.NODE_ENV === 'development') {
    console.group('🖼️ FurBabies Image Configuration');
    console.log('Structure: Local assets mirror GCS buckets');
    console.log('Local: /assets/brand/, /assets/pet/, /assets/product/');
    console.log('GCS: brand/, pet/, product/');
    console.log('Validation:', validateGCSConfig());
    console.log('Environment Variables:');
    console.log('- REACT_APP_GCS_BUCKET_NAME:', process.env.REACT_APP_GCS_BUCKET_NAME);
    console.log('- REACT_APP_GCS_BASE_URL:', process.env.REACT_APP_GCS_BASE_URL);
    console.groupEnd();
  }
};

// Initialize debug in development
if (process.env.NODE_ENV === 'development') {
  debugImageConfig();
}