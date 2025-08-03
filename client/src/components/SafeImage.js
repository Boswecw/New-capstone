// client/src/components/SafeImage.js - FIXED ESLint errors
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

// ✅ SOLUTION: Move FALLBACK_IMAGES outside component to avoid dependency issues
const FALLBACK_IMAGES = {
  dog: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop&q=80&auto=format',
  cat: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=300&fit=crop&q=80&auto=format',
  fish: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80&auto=format',
  bird: 'https://images.unsplash.com/photo-1520637836862-4d197d17c448?w=400&h=300&fit=crop&q=80&auto=format',
  rabbit: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop&q=80&auto=format',
  'small-pet': 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop&q=80&auto=format',
  hamster: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop&q=80&auto=format',
  product: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80&auto=format',
  food: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&h=300&fit=crop&q=80&auto=format',
  toy: 'https://images.unsplash.com/photo-1594149929161-86070191b966?w=400&h=300&fit=crop&q=80&auto=format',
  accessories: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80&auto=format',
  default: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80&auto=format'
};

// ✅ SOLUTION: Move category mappings outside component
const CATEGORY_MAPPINGS = {
  'dog': 'dog',
  'cat': 'cat', 
  'bird': 'bird',
  'fish': 'fish',
  'rabbit': 'rabbit',
  'hamster': 'small-pet',
  'guinea pig': 'small-pet',
  'ferret': 'small-pet',
  'other': 'default',
  'general': 'product',
  'toys': 'toy',
  'accessories': 'accessories',
  'health': 'product'
};

// ✅ SOLUTION: Move backend URL logic outside component
const getBackendUrl = () => {
  return process.env.NODE_ENV === 'production' 
    ? 'https://furbabies-backend.onrender.com'
    : 'http://localhost:5000';
};

const SafeImage = ({
  src,
  item,
  category = 'default',
  alt = '',
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

  // ✅ FIXED: Now uses stable external constants
  const getFallbackImage = useCallback(() => {
    let fallbackCategory = category?.toLowerCase() || 'default';
    
    if (item) {
      if (item.type) {
        fallbackCategory = item.type.toLowerCase();
      } else if (item.category) {
        fallbackCategory = item.category.toLowerCase();
      }
    }

    const mappedCategory = CATEGORY_MAPPINGS[fallbackCategory] || fallbackCategory;
    return FALLBACK_IMAGES[mappedCategory] || FALLBACK_IMAGES.default;
  }, [category, item]); // ✅ FIXED: Clean dependencies

  const buildImageUrl = useCallback(() => {
    if (!item && !src) {
      return getFallbackImage();
    }

    let imagePath = src;
    
    if (!imagePath && item) {
      imagePath = item.image || item.imageUrl || item.imageFile || item.photo;
    }

    if (!imagePath) {
      return getFallbackImage();
    }

    let cleanPath = imagePath;
    
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    
    if (cleanPath.startsWith('images/')) {
      cleanPath = cleanPath.substring(7);
    }
    
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
      return cleanPath;
    }

    const backendUrl = getBackendUrl();
    return `${backendUrl}/api/images/gcs/${cleanPath}`;
  }, [src, item, getFallbackImage]);

  useEffect(() => {
    let isMounted = true;
    
    const loadImage = async () => {
      setLoading(true);
      setError(false);
      
      const imageUrl = buildImageUrl();
      
      const img = new Image();
      
      img.onload = () => {
        if (isMounted) {
          setImageSrc(imageUrl);
          setLoading(false);
          setError(false);
          if (onLoad) onLoad();
        }
      };
      
      img.onerror = () => {
        if (isMounted) {
          const fallbackUrl = getFallbackImage();
          
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            if (isMounted) {
              setImageSrc(fallbackUrl);
              setLoading(false);
              setError(false);
            }
          };
          
          fallbackImg.onerror = () => {
            if (isMounted) {
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
  }, [buildImageUrl, getFallbackImage, onLoad, onError]);

  // Enhanced loading component
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

  // Enhanced error component
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