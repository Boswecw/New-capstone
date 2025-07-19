// client/src/components/PetImage.js - UPDATED: No hardcoded URLs, improved error handling
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';

// ========================================
// CONFIGURATION & CONSTANTS
// ========================================

// Environment-based API URL configuration for DUAL DEPLOYMENT
const getApiBaseUrl = () => {
  // 1. Try explicit environment variable (highest priority)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 2. Dual deployment detection for Render
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    // Frontend is on Render, so backend is separate service
    return 'https://new-capstone-api.onrender.com';
  }
  
  // 3. Development fallback
  return 'http://localhost:5000';
};

// Fallback images from Unsplash
const FALLBACK_IMAGES = {
  dog: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=500&h=400&fit=crop&q=80',
  cat: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&h=400&fit=crop&q=80',
  bird: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=500&h=400&fit=crop&q=80',
  fish: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&h=400&fit=crop&q=80',
  rabbit: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=500&h=400&fit=crop&q=80',
  hamster: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=500&h=400&fit=crop&q=80',
  'small-pet': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=500&h=400&fit=crop&q=80',
  other: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=500&h=400&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=500&h=400&fit=crop&q=80'
};

// Image size configurations
const SIZE_CONFIGS = {
  thumbnail: { width: 80, height: 80, fit: 'crop' },
  small: { width: 150, height: 150, fit: 'crop' },
  medium: { width: 300, height: 250, fit: 'crop' },
  large: { width: 500, height: 400, fit: 'crop' },
  card: { width: 400, height: 300, fit: 'crop' },
  hero: { width: 1200, height: 500, fit: 'crop' },
  default: { width: 300, height: 250, fit: 'crop' }
};

// ========================================
// PETIMAGE COMPONENT
// ========================================

const PetImage = ({
  imagePath,
  petType = 'default',
  size = 'medium',
  alt = 'Pet image',
  className = '',
  style = {},
  onLoad,
  onError,
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
  retryAttempts = 2,
  ...imageProps
}) => {
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  const [imageState, setImageState] = useState({
    loading: true,
    error: false,
    retryCount: 0,
    currentSrc: null
  });

  // ========================================
  // MEMOIZED VALUES
  // ========================================

  // API base URL (memoized to prevent unnecessary recalculations)
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);

  // Size parameters for URL optimization
  const sizeParams = useMemo(() => {
    const config = SIZE_CONFIGS[size] || SIZE_CONFIGS.default;
    const params = new URLSearchParams({
      w: config.width.toString(),
      h: config.height.toString(),
      fit: config.fit,
      q: '80',
      auto: 'format'
    });
    return `?${params.toString()}`;
  }, [size]);

  // Fallback image URL
  const fallbackImageUrl = useMemo(() => {
    const type = petType?.toLowerCase() || 'default';
    return FALLBACK_IMAGES[type] || FALLBACK_IMAGES.default;
  }, [petType]);

  // Primary image URL (GCS via proxy)
  const primaryImageUrl = useMemo(() => {
    if (!imagePath || imagePath.trim() === '') {
      return null;
    }

    // Clean the image path
    const cleanPath = imagePath.replace(/^\/+/, '');
    
    // Add retry parameter if this is a retry attempt
    const retryParam = imageState.retryCount > 0 ? '&retry=1' : '';
    
    return `${apiBaseUrl}/api/images/gcs/${cleanPath}${sizeParams}${retryParam}`;
  }, [imagePath, apiBaseUrl, sizeParams, imageState.retryCount]);

  // Current image source
  const currentImageSrc = useMemo(() => {
    if (imageState.error || !primaryImageUrl) {
      return fallbackImageUrl;
    }
    return primaryImageUrl;
  }, [imageState.error, primaryImageUrl, fallbackImageUrl]);

  // ========================================
  // EVENT HANDLERS
  // ========================================

  // Handle successful image load
  const handleImageLoad = useCallback((event) => {
    console.log('✅ Image loaded successfully:', currentImageSrc);
    
    setImageState(prev => ({
      ...prev,
      loading: false,
      error: false
    }));

    // Call parent onLoad handler if provided
    onLoad?.(event);
  }, [currentImageSrc, onLoad]);

  // Handle image error with retry logic
  const handleImageError = useCallback((event) => {
    console.warn('❌ Image load error:', currentImageSrc);
    
    setImageState(prev => {
      const newState = { ...prev, loading: false };
      
      // Only retry for primary images (not fallbacks) and within retry limit
      if (prev.retryCount < retryAttempts && 
          currentImageSrc === primaryImageUrl && 
          !currentImageSrc?.includes('unsplash.com')) {
        
        console.log(`🔄 Retrying image load (attempt ${prev.retryCount + 1}/${retryAttempts})`);
        newState.retryCount = prev.retryCount + 1;
        newState.error = false;
        newState.loading = true;
      } else {
        console.log('💔 Using fallback image:', fallbackImageUrl);
        newState.error = true;
      }
      
      return newState;
    });

    // Call parent onError handler if provided
    onError?.(event);
  }, [currentImageSrc, primaryImageUrl, retryAttempts, fallbackImageUrl, onError]);

  // ========================================
  // EFFECTS
  // ========================================

  // Reset state when imagePath changes
  useEffect(() => {
    setImageState({
      loading: true,
      error: false,
      retryCount: 0,
      currentSrc: null
    });
  }, [imagePath, size]);

  // ========================================
  // RENDER HELPERS
  // ========================================

  // Default loading component
  const DefaultLoadingComponent = () => (
    <div 
      className={`d-flex align-items-center justify-content-center bg-light ${className}`}
      style={{ 
        minHeight: SIZE_CONFIGS[size]?.height || 250,
        ...style 
      }}
    >
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading image...</span>
      </div>
    </div>
  );

  // Default error component
  const DefaultErrorComponent = () => (
    <div 
      className={`d-flex align-items-center justify-content-center bg-light text-muted ${className}`}
      style={{ 
        minHeight: SIZE_CONFIGS[size]?.height || 250,
        ...style 
      }}
    >
      <div className="text-center">
        <i className="fas fa-image fa-2x mb-2"></i>
        <div>Image not available</div>
      </div>
    </div>
  );

  // ========================================
  // MAIN RENDER
  // ========================================

  // Show loading state
  if (imageState.loading) {
    return LoadingComponent ? <LoadingComponent /> : <DefaultLoadingComponent />;
  }

  // Show error state (only if no fallback available)
  if (imageState.error && !currentImageSrc) {
    return ErrorComponent ? <ErrorComponent /> : <DefaultErrorComponent />;
  }

  // Render the image
  return (
    <img
      src={currentImageSrc}
      alt={alt}
      className={className}
      style={style}
      onLoad={handleImageLoad}
      onError={handleImageError}
      loading="lazy"
      {...imageProps}
    />
  );
};

// ========================================
// PROP TYPES
// ========================================

PetImage.propTypes = {
  imagePath: PropTypes.string,
  petType: PropTypes.oneOf([
    'dog', 'cat', 'bird', 'fish', 'rabbit', 'hamster', 'small-pet', 'other', 'default'
  ]),
  size: PropTypes.oneOf([
    'thumbnail', 'small', 'medium', 'large', 'card', 'hero'
  ]),
  alt: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  loadingComponent: PropTypes.elementType,
  errorComponent: PropTypes.elementType,
  retryAttempts: PropTypes.number
};

// ========================================
// UTILITY FUNCTIONS (for external use)
// ========================================

// Export utility function to get API base URL
export const getApiUrl = getApiBaseUrl;

// Export utility function to get fallback image
export const getFallbackImage = (petType) => {
  const type = petType?.toLowerCase() || 'default';
  return FALLBACK_IMAGES[type] || FALLBACK_IMAGES.default;
};

// Export utility function to build image URL
export const buildImageUrl = (imagePath, size = 'medium', apiBaseUrl = null) => {
  if (!imagePath) return null;
  
  const baseUrl = apiBaseUrl || getApiBaseUrl();
  const cleanPath = imagePath.replace(/^\/+/, '');
  const config = SIZE_CONFIGS[size] || SIZE_CONFIGS.default;
  
  const params = new URLSearchParams({
    w: config.width.toString(),
    h: config.height.toString(),
    fit: config.fit,
    q: '80',
    auto: 'format'
  });
  
  return `${baseUrl}/api/images/gcs/${cleanPath}?${params.toString()}`;
};

export default PetImage;