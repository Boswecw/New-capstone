// client/src/utils/imageUtils.js - COMPLETE FIXED VERSION
const BUCKET_NAME = 'furbabies-petstore';
const BUCKET_BASE_URL = `https://storage.googleapis.com/${BUCKET_NAME}`;

// Working placeholder images
const DEFAULT_IMAGES = {
  pet: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80',
  product: 'https://images.unsplash.com/photo-1601758123927-4a72ca5c9caf?w=400&h=300&fit=crop&q=80',
  fallback: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80'
};

/**
 * Get Google Cloud Storage URL with proper error handling
 */
export const getGoogleStorageUrl = (imagePath, category = 'pet') => {
  // Handle invalid input
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return DEFAULT_IMAGES[category] || DEFAULT_IMAGES.fallback;
  }
  
  // Return complete URLs as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Clean and construct GCS URL
  const cleanPath = imagePath.trim().replace(/^\/+/, '').replace(/\/+/g, '/');
  return `${BUCKET_BASE_URL}/${cleanPath}`;
};

/**
 * Main function for card images - simplified and robust
 */
export const getCardImageProps = (item, size = 'medium') => {
  if (!item) {
    return {
      src: DEFAULT_IMAGES.fallback,
      alt: 'Content unavailable',
      onError: () => {}, // No-op to prevent errors
      onLoad: () => {}
    };
  }

  // Determine category
  const isProduct = item.price !== undefined || 
                   (item.category && 
                    ['Dog Care', 'Cat Care', 'Grooming', 'Training', 'Aquarium'].some(cat => 
                      item.category.includes(cat)
                    ));
  
  const category = isProduct ? 'product' : 'pet';
  
  // Get image source (prioritize backend imageUrl)
  const imageSrc = item.imageUrl || 
                   (item.image ? getGoogleStorageUrl(item.image, category) : null) || 
                   DEFAULT_IMAGES[category];
  
  // Generate alt text
  const altText = isProduct 
    ? `${item.name || 'Product'} - ${item.category || 'Pet Store Item'}`
    : `${item.name || 'Pet'} - ${item.breed || ''} ${item.type || ''}`.trim();

  return {
    src: imageSrc,
    alt: altText,
    onError: (e) => {
      // Simple one-time fallback
      if (!e.target.dataset.fallbackAttempted) {
        e.target.dataset.fallbackAttempted = 'true';
        e.target.src = DEFAULT_IMAGES[category];
        console.warn(`Image failed: ${imageSrc}, using fallback`);
      }
    },
    onLoad: () => {
      // Clean up fallback flag on successful load
      delete e.target?.dataset?.fallbackAttempted;
    }
  };
};

/**
 * Optimized image props with lazy loading
 */
export const getOptimizedImageProps = (imagePath, alt, size = 'medium', category = 'pet', lazy = true) => {
  const imageUrl = getGoogleStorageUrl(imagePath, category);
  
  return {
    src: imageUrl,
    alt: alt || 'Content',
    loading: lazy ? 'lazy' : 'eager',
    decoding: 'async',
    onError: (e) => {
      if (!e.target.dataset.fallbackAttempted) {
        e.target.dataset.fallbackAttempted = 'true';
        e.target.src = DEFAULT_IMAGES[category];
      }
    },
    onLoad: (e) => {
      delete e.target?.dataset?.fallbackAttempted;
    }
  };
};

/**
 * Test image URL availability
 */
export const testImageUrl = async (imagePath, category = 'pet') => {
  const url = getGoogleStorageUrl(imagePath, category);
  
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      cache: 'no-cache'
    });
    
    return {
      url,
      accessible: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type')
    };
  } catch (error) {
    return {
      url,
      accessible: false,
      error: error.message
    };
  }
};

// Export configuration
export const imageConfig = {
  bucketName: BUCKET_NAME,
  bucketBaseUrl: BUCKET_BASE_URL,
  defaults: DEFAULT_IMAGES
};

// Default export
export default {
  getCardImageProps,
  getGoogleStorageUrl,
  getOptimizedImageProps,
  testImageUrl,
  imageConfig
};