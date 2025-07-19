// client/src/components/SafeImage.js - UNIFIED IMAGE COMPONENT
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

// Get correct backend URL
const getBackendUrl = () => {
  // Check environment variable first
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace('/api', '');
  }
  
  // Production detection
  if (process.env.NODE_ENV === 'production') {
    return 'https://furbabies-backend.onrender.com';
  }
  
  // Development fallback
  return 'http://localhost:5000';
};

// Fallback images for different categories
const FALLBACK_IMAGES = {
  // Pet fallbacks
  dog: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop&q=80',
  cat: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop&q=80',
  bird: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=400&h=300&fit=crop&q=80',
  fish: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop&q=80',
  rabbit: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop&q=80',
  
  // Product fallbacks
  food: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&h=300&fit=crop&q=80',
  toy: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80',
  accessory: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80',
  grooming: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&h=300&fit=crop&q=80',
  health: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=300&fit=crop&q=80',
  
  // General fallbacks
  pet: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80',
  product: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80'
};

const SafeImage = ({ 
  src,
  item, // Can be pet or product object
  category = 'default',
  alt,
  className = '',
  style = {},
  size = 'medium',
  onLoad,
  onError,
  showLoader = false,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Get appropriate fallback image
  const getFallbackImage = useCallback(() => {
    let fallbackCategory = category;

    // Determine category from item if available
    if (item) {
      const itemType = item.type || item.category;
      if (itemType) {
        fallbackCategory = itemType.toLowerCase();
      }
    }

    // Map to fallback image
    let fallbackImage = FALLBACK_IMAGES[fallbackCategory];
    
    if (!fallbackImage) {
      // Try category variations
      if (fallbackCategory.includes('food') || fallbackCategory.includes('treat')) {
        fallbackImage = FALLBACK_IMAGES.food;
      } else if (fallbackCategory.includes('toy')) {
        fallbackImage = FALLBACK_IMAGES.toy;
      } else if (fallbackCategory.includes('groom')) {
        fallbackImage = FALLBACK_IMAGES.grooming;
      } else if (fallbackCategory.includes('health')) {
        fallbackImage = FALLBACK_IMAGES.health;
      } else if (fallbackCategory.includes('collar') || fallbackCategory.includes('leash')) {
        fallbackImage = FALLBACK_IMAGES.accessory;
      } else {
        fallbackImage = FALLBACK_IMAGES.default;
      }
    }

    console.log(`🔄 Using fallback image for category "${fallbackCategory}": ${fallbackImage}`);
    return fallbackImage;
  }, [category, item]);

  // Build image URL from various sources
  const buildImageUrl = useCallback(() => {
    // 1. Use provided src if it's a full URL
    if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
      console.log(`🖼️ Using direct URL: ${src}`);
      return src;
    }

    // 2. Build from item object (pet or product)
    if (item) {
      const imagePath = item.image || item.imageUrl || item.imagePath || item.photo;
      
      if (!imagePath) {
        console.warn(`❌ No image path found for item: ${item.name || 'Unknown'}`);
        return getFallbackImage();
      }

      // If imagePath is already a full URL
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        console.log(`🖼️ Using item URL: ${imagePath}`);
        return imagePath;
      }

      // Build proxy URL
      const backendUrl = getBackendUrl();
      let cleanPath = imagePath.replace(/^\/+/, ''); // Remove leading slashes
      
      // Ensure proper category prefix for GCS
      if (!cleanPath.includes('/')) {
        // Determine category from item or fallback
        const itemCategory = item.type || item.category || category;
        if (itemCategory === 'dog' || itemCategory === 'cat' || itemCategory === 'bird' || itemCategory === 'fish') {
          cleanPath = `pet/${cleanPath}`;
        } else {
          cleanPath = `product/${cleanPath}`;
        }
      }
      
      const proxyUrl = `${backendUrl}/api/images/gcs/${cleanPath}`;
      console.log(`🖼️ Built proxy URL for ${item.name || 'item'}: ${proxyUrl}`);
      return proxyUrl;
    }

    // 3. Build from src path
    if (src) {
      const backendUrl = getBackendUrl();
      let cleanPath = src.replace(/^\/+/, '');
      
      // Add category prefix if not present
      if (!cleanPath.includes('/')) {
        cleanPath = `${category}/${cleanPath}`;
      }
      
      const proxyUrl = `${backendUrl}/api/images/gcs/${cleanPath}`;
      console.log(`🖼️ Built proxy URL from src: ${proxyUrl}`);
      return proxyUrl;
    }

    // 4. No valid source found
    console.warn('❌ No valid image source provided');
    return getFallbackImage();
  }, [src, item, category, getFallbackImage]);

  // Initialize image source
  useEffect(() => {
    const imageUrl = buildImageUrl();
    setImageSrc(imageUrl);
    setError(false);
    setLoading(true);
  }, [buildImageUrl]);

  // Handle successful image load
  const handleImageLoad = useCallback((e) => {
    console.log(`✅ Image loaded successfully: ${imageSrc}`);
    setLoading(false);
    setError(false);
    
    if (onLoad) {
      onLoad(e);
    }
  }, [imageSrc, onLoad]);

  // Handle image load error
  const handleImageError = useCallback((e) => {
    console.warn(`❌ Image failed to load: ${imageSrc}`);
    
    if (!error) {
      // Switch to fallback image
      const fallbackUrl = getFallbackImage();
      console.log(`🔄 Switching to fallback: ${fallbackUrl}`);
      setImageSrc(fallbackUrl);
      setError(true);
    } else {
      console.error('❌ Even fallback image failed to load');
      setLoading(false);
    }
    
    if (onError) {
      onError(e);
    }
  }, [imageSrc, error, getFallbackImage, onError]);

  // Size configurations
  const getSizeStyle = () => {
    const sizeMap = {
      thumbnail: { width: '80px', height: '80px' },
      small: { width: '150px', height: '150px' },
      medium: { width: '250px', height: '200px' },
      large: { width: '400px', height: '300px' },
      card: { width: '100%', height: '200px' },
      hero: { width: '100%', height: '400px' }
    };

    return sizeMap[size] || sizeMap.medium;
  };

  // Generate alt text
  const getAltText = () => {
    if (alt) return alt;
    if (item?.name) return item.name;
    if (item?.title) return item.title;
    return 'Image';
  };

  const imageStyle = {
    objectFit: 'cover',
    borderRadius: '8px',
    transition: 'opacity 0.3s ease',
    ...getSizeStyle(),
    ...style
  };

  return (
    <div className={`safe-image-container ${className}`} style={{ position: 'relative' }}>
      {/* Loading indicator */}
      {loading && showLoader && (
        <div 
          style={{
            ...imageStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            color: '#6c757d',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1
          }}
        >
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* Main image */}
      <img
        src={imageSrc}
        alt={getAltText()}
        className={className}
        style={{
          ...imageStyle,
          opacity: loading && showLoader ? 0 : 1
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
        {...props}
      />
    </div>
  );
};

SafeImage.propTypes = {
  src: PropTypes.string,
  item: PropTypes.object, // Pet or product object
  category: PropTypes.string,
  alt: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  size: PropTypes.oneOf(['thumbnail', 'small', 'medium', 'large', 'card', 'hero']),
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  showLoader: PropTypes.bool
};

export default SafeImage;