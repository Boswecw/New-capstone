// client/src/utils/imageUtils.js - CORRECTED VERSION

const BUCKET_NAME = 'furbabies-petstore';
const GCS_BASE_URL = `https://storage.googleapis.com/${BUCKET_NAME}`;

// ✅ UPDATED FALLBACK IMAGES - Using reliable CDN sources
const DEFAULT_IMAGES = {
  pet: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80&auto=format',
  dog: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop&q=80&auto=format',
  cat: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=300&fit=crop&q=80&auto=format',
  aquatic: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80&auto=format',
  fish: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80&auto=format',
  bird: 'https://images.unsplash.com/photo-1520637836862-4d197d17c448?w=400&h=300&fit=crop&q=80&auto=format',
  other: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop&q=80&auto=format',
  product: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80&auto=format',
  default: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80&auto=format'
};

/**
 * Get proxy base URL for CORS handling
 */
const getProxyBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // ✅ UPDATE THIS TO YOUR ACTUAL BACKEND URL
    return 'https://furbabies-backend.onrender.com/api/images/gcs';
  }
  return 'http://localhost:5000/api/images/gcs';
};

/**
 * Clean image path - remove leading slashes, fix double slashes
 */
const cleanImagePath = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') {
    return '';
  }
  
  return imagePath.trim()
    .replace(/^\/+/, '')    // Remove leading slashes
    .replace(/\/+/g, '/');  // Fix double slashes
};

/**
 * Get fallback image based on category/type
 */
const getFallbackImage = (category, type) => {
  // Try specific type first
  if (type && DEFAULT_IMAGES[type.toLowerCase()]) {
    return DEFAULT_IMAGES[type.toLowerCase()];
  }
  
  // Try category
  if (category && DEFAULT_IMAGES[category.toLowerCase()]) {
    return DEFAULT_IMAGES[category.toLowerCase()];
  }
  
  return DEFAULT_IMAGES.default;
};

/**
 * Build Google Cloud Storage URL with multiple fallback strategies
 */
export const getImageUrl = (imagePath, category = null, type = null) => {
  // If already a full URL, return it
  if (imagePath && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
    return imagePath;
  }

  // If no image path, return fallback immediately
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return getFallbackImage(category, type);
  }

  const cleanPath = cleanImagePath(imagePath);
  if (!cleanPath) {
    return getFallbackImage(category, type);
  }

  // Build direct GCS URL with encoded path
  const gcsUrl = `${GCS_BASE_URL}/${encodeURIComponent(cleanPath)}`;
  
  console.log('🖼️ Building image URL:', {
    input: imagePath,
    cleaned: cleanPath,
    final: gcsUrl,
    fallback: getFallbackImage(category, type)
  });

  return gcsUrl;
};

/**
 * Enhanced image component with error handling
 */
export const ImageWithFallback = ({ 
  src, 
  alt, 
  category = null, 
  type = null, 
  className = '', 
  style = {},
  ...props 
}) => {
  const [currentSrc, setCurrentSrc] = React.useState(() => getImageUrl(src, category, type));
  const [hasError, setHasError] = React.useState(false);

  const handleError = () => {
    if (!hasError) {
      console.log('🔄 Image failed, switching to fallback:', currentSrc);
      setHasError(true);
      setCurrentSrc(getFallbackImage(category, type));
    }
  };

  // Reset error state when src changes
  React.useEffect(() => {
    setHasError(false);
    setCurrentSrc(getImageUrl(src, category, type));
  }, [src, category, type]);

  return (
    <img 
      src={currentSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  );
};

/**
 * Build image URL using proxy (for CORS handling)
 */
export const getProxyImageUrl = (imagePath, category = null, type = null) => {
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return getFallbackImage(category, type);
  }

  // If already a full URL, return it
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  const cleanPath = cleanImagePath(imagePath);
  if (!cleanPath) {
    return getFallbackImage(category, type);
  }

  const proxyUrl = `${getProxyBaseUrl()}/${encodeURIComponent(cleanPath)}`;
  
  console.log('🛡️ Building proxy URL:', {
    input: imagePath,
    cleaned: cleanPath,
    proxy: proxyUrl
  });

  return proxyUrl;
};

/**
 * Check if an image URL is accessible
 */
export const checkImageExists = async (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

/**
 * Get best available image URL with fallback chain
 */
export const getBestImageUrl = async (imagePath, category = null, type = null) => {
  // Try direct GCS URL first
  const gcsUrl = getImageUrl(imagePath, category, type);
  const gcsWorks = await checkImageExists(gcsUrl);
  if (gcsWorks) return gcsUrl;

  // Try proxy URL
  const proxyUrl = getProxyImageUrl(imagePath, category, type);
  const proxyWorks = await checkImageExists(proxyUrl);
  if (proxyWorks) return proxyUrl;

  // Return fallback
  return getFallbackImage(category, type);
};

/**
 * Preload images for better performance
 */
export const preloadImages = (imageUrls) => {
  imageUrls.forEach(url => {
    if (url) {
      const img = new Image();
      img.src = url;
    }
  });
};

// Export the React import for ImageWithFallback
export const React = require('react');

const imageUtils = {
  getImageUrl,
  getProxyImageUrl,
  getBestImageUrl,
  checkImageExists,
  preloadImages,
  ImageWithFallback,
  cleanImagePath,
  getFallbackImage,
  DEFAULT_IMAGES
};

export default imageUtils;