// client/src/utils/imageUtils.js - CLEAN ERROR-FREE VERSION

/**
 * Google Cloud Storage configuration
 */
const BUCKET_NAME = 'furbabies-petstore';
const BUCKET_BASE_URL = `https://storage.googleapis.com/${BUCKET_NAME}`;

/**
 * Emergency fallback images using data URIs (self-contained)
 */
const DEFAULT_IMAGES = {
  pet: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRkY2QjZCIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iI0ZGRkZGRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfkb4gUGV0PC90ZXh0Pjwvc3ZnPg==',
  product: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNEVDREM0Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iI0ZGRkZGRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfm6HvuI8gUHJvZHVjdDwvdGV4dD48L3N2Zz4=',
  brand: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjOUI1OUI2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iI0ZGRkZGRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfj6IgQnJhbmQ8L3RleHQ+PC9zdmc+',
  user: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzQ5OERCIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iI0ZGRkZGRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfkbQgVXNlcjwvdGV4dD48L3N2Zz4='
};

/**
 * Get Google Cloud Storage URL from image path
 * @param {string|object} imagePath - Image path from database OR object with image properties
 * @param {string} size - Size preset (unused for now)
 * @param {string} category - Category for fallback selection
 * @returns {string} Complete image URL
 */
export const getGoogleStorageUrl = (imagePath, size = 'medium', category = 'pet') => {
  console.log('🖼️ getGoogleStorageUrl called with:', { imagePath, size, category });
  
  // EMERGENCY FIX: Handle objects being passed instead of strings
  if (imagePath && typeof imagePath === 'object') {
    console.warn('🔧 EMERGENCY: Object passed to getGoogleStorageUrl, extracting image path');
    const extractedPath = imagePath.imageUrl || imagePath.image || imagePath.photo || imagePath.src;
    
    if (extractedPath && typeof extractedPath === 'string') {
      console.warn('🔧 Successfully extracted:', extractedPath);
      imagePath = extractedPath;
    } else {
      console.error('🔧 Could not extract valid image path from object, using fallback');
      return DEFAULT_IMAGES[category] || DEFAULT_IMAGES.pet;
    }
  }

  // Handle invalid input
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    console.warn('🔧 Invalid or empty image path, using fallback for category:', category);
    return DEFAULT_IMAGES[category] || DEFAULT_IMAGES.pet;
  }
  
  // Return complete URLs as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    console.log('🔧 Using complete URL as-is:', imagePath);
    return imagePath;
  }
  
  // Clean relative paths and construct full GCS URL
  const cleanPath = imagePath.trim().replace(/^\/+/, '').replace(/\/+/g, '/');
  const fullUrl = `${BUCKET_BASE_URL}/${cleanPath}`;
  
  console.log('🔧 Constructed GCS URL:', fullUrl);
  return fullUrl;
};

/**
 * Get optimized image props for React components
 * @param {string} imagePath - Image path or full URL
 * @param {string} alt - Alt text for accessibility
 * @param {string} size - Size preset
 * @param {string} category - Category for fallback
 * @param {boolean} lazy - Enable lazy loading
 * @returns {object} Complete image props with error handling
 */
export const getOptimizedImageProps = (imagePath, alt, size = 'medium', category = 'pet', lazy = true) => {
  const imageUrl = getGoogleStorageUrl(imagePath, size, category);
  
  const baseProps = {
    src: imageUrl,
    alt: alt || `${category} image`,
    onError: (e) => {
      const currentSrc = e.target.src;
      console.warn('🖼️ Image failed to load:', currentSrc);
      
      // Only try fallback once to prevent infinite loops
      if (!e.target.hasTriedFallback && !currentSrc.includes('data:image/svg+xml')) {
        e.target.hasTriedFallback = true;
        const fallbackUrl = DEFAULT_IMAGES[category] || DEFAULT_IMAGES.pet;
        console.warn('🔧 Using emergency fallback');
        e.target.src = fallbackUrl;
        
        // Track failed images for debugging
        if (window.failedImages) {
          window.failedImages.push(currentSrc);
        } else {
          window.failedImages = [currentSrc];
        }
      }
    },
    onLoad: (e) => {
      if (e && e.target) {
        delete e.target.hasTriedFallback;
        console.log('✅ Image loaded successfully');
      }
    }
  };
  
  // Add lazy loading attributes if requested
  if (lazy) {
    baseProps.loading = 'lazy';
    baseProps.decoding = 'async';
  }
  
  console.log('🖼️ Created image props');
  return baseProps;
};

/**
 * Smart utility for card components (pets and products)
 * @param {object} item - Pet or product object from API
 * @param {string} size - Size preset
 * @returns {object} Complete image props ready for React components
 */
export const getCardImageProps = (item, size = 'medium') => {
  console.log('🐕/🛍️ getCardImageProps called with item:', item);

  if (!item) {
    console.warn('🔧 No item provided to getCardImageProps, using pet fallback');
    return {
      src: DEFAULT_IMAGES.pet,
      alt: 'Content unavailable',
      loading: 'lazy'
    };
  }

  // Extract image path properly
  const imagePath = item.imageUrl || item.image || item.photo;
  console.log('🔧 Extracted image path:', imagePath);
  
  // Determine content category
  const isProduct = item.price !== undefined || 
                   (item.category && typeof item.category === 'string' && 
                    /care|training|grooming|aquarium|food|toy|product/i.test(item.category));
  
  const category = isProduct ? 'product' : 'pet';
  console.log('🔧 Determined category:', category);
  
  // Generate meaningful alt text
  let alt;
  if (category === 'pet') {
    const parts = [item.name, item.breed, item.type].filter(Boolean);
    alt = parts.join(', ') || 'Pet';
  } else {
    const parts = [item.name, item.category].filter(Boolean);
    alt = parts.join(' - ') || 'Product';
  }
  
  console.log('🔧 Generated alt text:', alt);
  
  return getOptimizedImageProps(imagePath, alt, size, category, true);
};

/**
 * Get CSS background image properties
 * @param {string} imagePath - Image path or full URL
 * @param {string} size - Size preset
 * @param {string} category - Category for fallback
 * @returns {object} CSS properties for background images
 */
export const getOptimizedBackgroundImage = (imagePath, size = 'large', category = 'pet') => {
  const imageUrl = getGoogleStorageUrl(imagePath, size, category);
  
  return {
    backgroundImage: `url("${imageUrl}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };
};

/**
 * Test if image URL is accessible
 * @param {string} imagePath - Image path to test
 * @param {string} category - Category for fallback
 * @returns {Promise<object>} Test result with accessibility info
 */
export const testImageUrl = async (imagePath, category = 'pet') => {
  const url = getGoogleStorageUrl(imagePath, 'medium', category);
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      url,
      accessible: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type'),
      cacheControl: response.headers.get('cache-control')
    };
  } catch (error) {
    return {
      url,
      accessible: false,
      error: error.message
    };
  }
};

/**
 * Legacy compatibility function
 * @param {string} imagePath - Image path
 * @param {string} size - Size preset
 * @returns {string} Image URL
 */
export const getImageUrl = (imagePath, size = 'medium') => {
  // Detect category from path
  let category = 'pet';
  if (imagePath && typeof imagePath === 'string') {
    const lowerPath = imagePath.toLowerCase();
    if (lowerPath.includes('product')) {
      category = 'product';
    } else if (lowerPath.includes('brand')) {
      category = 'brand';
    } else if (lowerPath.includes('user') || lowerPath.includes('avatar')) {
      category = 'user';
    }
  }
  
  return getGoogleStorageUrl(imagePath, size, category);
};

/**
 * Debug function to check image configuration
 * @returns {object} Debug information
 */
export const getImageDebugInfo = () => {
  return {
    bucketName: BUCKET_NAME,
    bucketBaseUrl: BUCKET_BASE_URL,
    fallbackStrategy: 'Emergency data URIs',
    defaultImages: {
      pet: 'Red SVG with pet icon',
      product: 'Teal SVG with product icon', 
      brand: 'Purple SVG with brand icon',
      user: 'Blue SVG with user icon'
    },
    failedImages: window.failedImages || [],
    instructions: 'All images try GCS direct first, then emergency fallback',
    emergencyMode: true,
    timestamp: new Date().toISOString()
  };
};

/**
 * Configuration object for external access
 */
export const imageConfig = {
  defaults: DEFAULT_IMAGES,
  bucketName: BUCKET_NAME,
  bucketBaseUrl: BUCKET_BASE_URL,
  supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  maxFileSize: '10MB',
  fallbackStrategy: 'emergency-svg',
  folders: {
    pets: 'pet',
    products: 'product', 
    brands: 'brand',
    users: 'user'
  }
};

/**
 * Main export object for named imports
 */
const imageUtils = {
  getGoogleStorageUrl,
  getOptimizedImageProps,
  getCardImageProps,
  getOptimizedBackgroundImage,
  testImageUrl,
  getImageUrl,
  getImageDebugInfo,
  imageConfig
};

export default imageUtils;