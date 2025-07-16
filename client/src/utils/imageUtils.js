const BUCKET_NAME = 'furbabies-petstore';
const BUCKET_BASE_URL = `https://storage.googleapis.com/${BUCKET_NAME}`;

// Use reliable working fallback images
const DEFAULT_IMAGES = {
  pet: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80',
  product: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80',
  fallback: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80'
};

export const getGoogleStorageUrl = (imagePath, category = 'pet') => {
  // Return fallback immediately if no path
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return DEFAULT_IMAGES[category] || DEFAULT_IMAGES.fallback;
  }
  
  // If already a full URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Clean the path and construct GCS URL
  const cleanPath = imagePath.trim().replace(/^\/+/, '').replace(/\/+/g, '/');
  return `${BUCKET_BASE_URL}/${cleanPath}`;
};

// Simplified image props that work without CORS
export const getCardImageProps = (item, size = 'medium') => {
  if (!item) {
    return {
      src: DEFAULT_IMAGES.fallback,
      alt: 'Content unavailable'
    };
  }

  const isProduct = item.price !== undefined;
  const category = isProduct ? 'product' : 'pet';
  
  // Try imageUrl first, then image field, then fallback
  let imageSrc = item.imageUrl;
  if (!imageSrc && item.image) {
    imageSrc = getGoogleStorageUrl(item.image, category);
  }
  if (!imageSrc) {
    imageSrc = DEFAULT_IMAGES[category];
  }
  
  return {
    src: imageSrc,
    alt: isProduct 
      ? `${item.name || 'Product'} - ${item.category || 'Pet Store Item'}`
      : `${item.name || 'Pet'} - ${item.breed || ''} ${item.type || ''}`.trim(),
    onError: (e) => {
      // Simple one-time fallback - no infinite loops
      if (e.target.src !== DEFAULT_IMAGES[category]) {
        e.target.src = DEFAULT_IMAGES[category];
        console.warn(`Image failed: ${item.imageUrl || item.image}, using fallback`);
      }
    }
  };
};