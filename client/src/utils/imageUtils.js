// client/src/utils/imageUtils.js - Enhanced version
const BUCKET_NAME = 'furbabies-petstore';
const BUCKET_BASE_URL = `https://storage.googleapis.com/${BUCKET_NAME}`;

const DEFAULT_IMAGES = {
  pet: 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=🐾+Pet',
  product: 'https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=🛍️+Product',
  news: 'https://via.placeholder.com/400x300/E74C3C/FFFFFF?text=📰+News'
};

export const getGoogleStorageUrl = (imagePath, category = 'pet') => {
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return DEFAULT_IMAGES[category] || DEFAULT_IMAGES.pet;
  }
  
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  const cleanPath = imagePath.trim().replace(/^\/+/, '').replace(/\/+/g, '/');
  return `${BUCKET_BASE_URL}/${cleanPath}`;
};

export const getOptimizedImageProps = (imagePath, alt, category = 'pet') => {
  const imageUrl = getGoogleStorageUrl(imagePath, category);
  
  return {
    src: imageUrl,
    alt: alt || 'Content',
    onError: (e) => {
      if (!e.target.hasTriedFallback) {
        e.target.hasTriedFallback = true;
        const fallbackUrl = DEFAULT_IMAGES[category] || DEFAULT_IMAGES.pet;
        e.target.src = fallbackUrl;
        console.warn(`Image failed to load: ${imageUrl}, using fallback: ${fallbackUrl}`);
      }
    },
    onLoad: (e) => {
      if (e && e.target) {
        delete e.target.hasTriedFallback;
      }
    }
  };
};