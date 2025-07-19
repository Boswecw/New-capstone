// client/src/components/SafeImage.js - UPDATED for both pets and products
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

// ✅ ENHANCED: Fallback images for different categories
const FALLBACK_IMAGES = {
  // Pet fallbacks
  dog: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop&q=80',
  cat: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop&q=80',
  bird: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=400&h=300&fit=crop&q=80',
  fish: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop&q=80',
  rabbit: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop&q=80',
  hamster: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop&q=80',
  'small-pet': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop&q=80',
  
  // ✅ ADDED: Product category fallbacks
  'dog care': 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80',
  'cat care': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80',
  'aquarium & fish care': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop&q=80',
  'training & behavior': 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80',
  'grooming & health': 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&h=300&fit=crop&q=80',
  
  // Generic product fallbacks
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

  // ✅ ENHANCED: Get appropriate fallback image with better category detection
  const getFallbackImage = useCallback(() => {
    let fallbackCategory = category.toLowerCase();

    // ✅ ENHANCED: Determine category from item if not provided
    if (item && (!category || category === 'default')) {
      if (item.type) {
        // For pets
        fallbackCategory = item.type.toLowerCase();
      } else if (item.category) {
        // For products
        fallbackCategory = item.category.toLowerCase();
      }
    }

    // ✅ ENHANCED: Better category mapping
    const categoryMappings = {
      // Pet type mappings
      'dog': 'dog',
      'cat': 'cat', 
      'bird': 'bird',
      'fish': 'fish',
      'rabbit': 'rabbit',
      'hamster': 'small-pet',
      'guinea pig': 'small-pet',
      'ferret': 'small-pet',
      'other': 'pet',
      
      // Product category mappings
      'dog care': 'dog care',
      'cat care': 'cat care',
      'aquarium & fish care': 'aquarium & fish care',
      'training & behavior': 'training & behavior', 
      'grooming & health': 'grooming & health',
      'general': 'product',
      'food': 'food',
      'toy': 'toy',
      'toys': 'toy',
      'accessories': 'accessory',
      'health': 'health'
    };

    const mappedCategory = categoryMappings[fallbackCategory] || fallbackCategory;
    
    // Return the fallback image URL
    return FALLBACK_IMAGES[mappedCategory] || FALLBACK_IMAGES.default;
  }, [category, item]);

  // ✅ ENHANCED: Build image URL with better path handling
  const buildImageUrl = useCallback(() => {
    if (!item && !src) {
      console.log('🔄 No image source provided, using fallback');
      return getFallbackImage();
    }

    let imagePath = src;
    
    // Extract image path from item if not provided directly
    if (!imagePath && item) {
      imagePath = item.image || item.imageUrl || item.imageFile || item.photo;
    }

    if (!imagePath) {
      console.log('🔄 No image path found, using fallback');
      return getFallbackImage();
    }

    // ✅ ENHANCED: Handle different image path formats
    let cleanPath = imagePath;
    
    // Remove leading slashes
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    
    // Remove 'images/' prefix if present
    if (cleanPath.startsWith('images/')) {
      cleanPath = cleanPath.substring(7);
    }
    
    // Don't process if already a full URL
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
      return cleanPath;
    }

    // Build the proxy URL through your backend
    const backendUrl = getBackendUrl();
    const proxyUrl = `${backendUrl}/api/images/gcs/${cleanPath}`;
    
    console.log(`🖼️ Built proxy URL for ${item?.name || 'item'}: ${proxyUrl}`);
    return proxyUrl;
  }, [src, item, getFallbackImage]);

  // ✅ ENHANCED: Handle image loading with retry logic
  useEffect(() => {
    let isMounted = true;
    
    const loadImage = async () => {
      setLoading(true);
      setError(false);
      
      const imageUrl = buildImageUrl();
      
      // Test if the image exists
      const img = new Image();
      
      img.onload = () => {
        if (isMounted) {
          console.log(`✅ Image loaded successfully: ${imageUrl}`);
          setImageSrc(imageUrl);
          setLoading(false);
          setError(false);
          if (onLoad) onLoad();
        }
      };
      
      img.onerror = () => {
        if (isMounted) {
          console.log(`❌ Image failed to load: ${imageUrl}`);
          const fallbackUrl = getFallbackImage();
          console.log(`🔄 Using fallback image for category "${category}": ${fallbackUrl}`);
          
          // Try fallback image
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            if (isMounted) {
              console.log(`🔄 Switching to fallback: ${fallbackUrl}`);
              setImageSrc(fallbackUrl);
              setLoading(false);
              setError(false);
            }
          };
          
          fallbackImg.onerror = () => {
            if (isMounted) {
              console.error(`❌ Fallback image also failed: ${fallbackUrl}`);
              setLoading(false);
              setError(true);
              if (onError) onError();
            }
          };
          
          fallbackImg.src = fallbackUrl;
        }
      };
      
      img.src = imageUrl;
    };

    loadImage();
    
    return () => {
      isMounted = false;
    };
  }, [src, item, category, buildImageUrl, getFallbackImage, onLoad, onError]);

  // ✅ ENHANCED: Loading component
  if (loading && showLoader) {
    return (
      <div 
        className={`d-flex align-items-center justify-content-center bg-light ${className}`}
        style={{ 
          ...style, 
          minHeight: style.height || '200px',
          width: style.width || '100%'
        }}
      >
        <div className="text-center">
          <div className="spinner-border spinner-border-sm text-primary mb-2" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="small text-muted">Loading image...</div>
        </div>
      </div>
    );
  }

  // ✅ ENHANCED: Error component
  if (error) {
    return (
      <div 
        className={`d-flex align-items-center justify-content-center bg-light ${className}`}
        style={{ 
          ...style, 
          minHeight: style.height || '200px',
          width: style.width || '100%'
        }}
      >
        <div className="text-center text-muted">
          <i className="fas fa-image fa-2x mb-2"></i>
          <div className="small">Image not available</div>
        </div>
      </div>
    );
  }

  // ✅ ENHANCED: Main image render
  return (
    <img
      src={imageSrc}
      alt={alt || (item?.name ? `Photo of ${item.name}` : 'Image')}
      className={className}
      style={style}
      loading="lazy"
      {...props}
    />
  );
};

SafeImage.propTypes = {
  src: PropTypes.string,
  item: PropTypes.object,
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