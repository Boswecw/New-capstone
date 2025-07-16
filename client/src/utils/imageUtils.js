// client/src/utils/imageUtils.js - FIXED FALLBACK IMAGES
const BUCKET_NAME = 'furbabies-petstore';
const BUCKET_BASE_URL = `https://storage.googleapis.com/${BUCKET_NAME}`;

// Working fallback images - FIXED
const DEFAULT_IMAGES = {
  pet: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80', // ✅ Working
  product: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80', // ✅ New working URL
  fallback: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80' // ✅ Working
};

export const getGoogleStorageUrl = (imagePath, category = 'pet') => {
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return DEFAULT_IMAGES[category] || DEFAULT_IMAGES.fallback;
  }
  
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  const cleanPath = imagePath.trim().replace(/^\/+/, '').replace(/\/+/g, '/');
  return `${BUCKET_BASE_URL}/${cleanPath}`;
};

export const getCardImageProps = (item, size = 'medium') => {
  if (!item) {
    return {
      src: DEFAULT_IMAGES.fallback,
      alt: 'Content unavailable',
      onError: () => {},
      onLoad: () => {}
    };
  }

  const isProduct = item.price !== undefined || 
                   (item.category && 
                    ['Dog Care', 'Cat Care', 'Grooming', 'Training', 'Aquarium'].some(cat => 
                      item.category.includes(cat)
                    ));
  
  const category = isProduct ? 'product' : 'pet';
  
  // Since your Google Cloud Storage images are working, prioritize them
  const imageSrc = item.imageUrl || 
                   (item.image ? getGoogleStorageUrl(item.image, category) : null) || 
                   DEFAULT_IMAGES[category];
  
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
    onLoad: (e) => {
      delete e.target?.dataset?.fallbackAttempted;
    }
  };
};

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

export const imageConfig = {
  bucketName: BUCKET_NAME,
  bucketBaseUrl: BUCKET_BASE_URL,
  defaults: DEFAULT_IMAGES
};

export default {
  getCardImageProps,
  getGoogleStorageUrl,
  getOptimizedImageProps,
  imageConfig
};