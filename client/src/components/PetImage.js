// client/src/components/PetImage.js - Enhanced with better error handling and proper sizing

import React, { useState, useCallback, useMemo } from 'react';
import { Spinner } from 'react-bootstrap';

const PetImage = ({ 
  petType, 
  imagePath, 
  alt = "Pet Image", 
  className = "", 
  size = "medium",
  style = {},
  containerStyle = {},
  onLoad,
  onError,
  priority = false,
  lazy = true
}) => {
  const [imageState, setImageState] = useState({
    loading: true,
    error: false,
    retryCount: 0
  });

  // Enhanced fallback images with proper sizing
  const fallbackImages = useMemo(() => ({
    dog: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop&q=80&auto=format',
    cat: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=300&fit=crop&q=80&auto=format',
    fish: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80&auto=format',
    bird: 'https://images.unsplash.com/photo-1520637836862-4d197d17c448?w=400&h=300&fit=crop&q=80&auto=format',
    'small-pet': 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop&q=80&auto=format',
    rabbit: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop&q=80&auto=format',
    default: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80&auto=format'
  }), []);

  // Enhanced size configurations with responsive support
  const sizeConfig = useMemo(() => ({
    thumbnail: { 
      width: '80px', 
      height: '80px',
      borderRadius: '50%',
      objectFit: 'cover'
    },
    small: { 
      maxWidth: '150px', 
      maxHeight: '150px',
      objectFit: 'cover'
    },
    medium: { 
      maxWidth: '300px', 
      maxHeight: '250px',
      objectFit: 'cover'
    },
    large: { 
      maxWidth: '500px', 
      maxHeight: '400px',
      objectFit: 'cover'
    },
    card: { 
      width: '100%', 
      height: '100%',
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'cover',
      objectPosition: 'center'
    },
    hero: {
      width: '100%',
      height: '500px',
      maxWidth: '100%',
      objectFit: 'cover',
      objectPosition: 'center'
    }
  }), []);

  // Build optimized image URL with size parameters
  const buildImageUrl = useCallback((path, isRetry = false) => {
    if (!path) return null;
    
    // If it's already a full URL (fallback), use it directly
    if (path.startsWith('http')) {
      return path;
    }
    
    // Clean the path
    const cleanPath = path.replace(/^\/+/, '');
    
    // Use proxy for GCS images with size optimization
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://new-capstone.onrender.com'
      : 'http://localhost:5000';
    
    // Add size parameters for optimization
    const sizeParams = getSizeParams(size);
    const retryParam = isRetry ? '&retry=1' : '';
    
    return `${baseUrl}/api/images/gcs/${cleanPath}${sizeParams}${retryParam}`;
  }, [size]);

  // Get size parameters for URL optimization
  const getSizeParams = useCallback((sizeType) => {
    const params = new URLSearchParams();
    
    switch (sizeType) {
      case 'thumbnail':
        params.set('w', '80');
        params.set('h', '80');
        params.set('fit', 'crop');
        break;
      case 'small':
        params.set('w', '150');
        params.set('h', '150');
        params.set('fit', 'crop');
        break;
      case 'medium':
        params.set('w', '300');
        params.set('h', '250');
        params.set('fit', 'crop');
        break;
      case 'large':
        params.set('w', '500');
        params.set('h', '400');
        params.set('fit', 'crop');
        break;
      case 'card':
        params.set('w', '400');
        params.set('h', '300');
        params.set('fit', 'crop');
        break;
      case 'hero':
        params.set('w', '1200');
        params.set('h', '500');
        params.set('fit', 'crop');
        break;
      default:
        params.set('w', '300');
        params.set('h', '250');
        params.set('fit', 'crop');
    }
    
    params.set('q', '80');
    params.set('auto', 'format');
    
    return `?${params.toString()}`;
  }, []);

  // Get fallback image for the pet type
  const getFallbackImage = useCallback(() => {
    const type = petType?.toLowerCase() || 'default';
    return fallbackImages[type] || fallbackImages.default;
  }, [petType, fallbackImages]);

  // Build the final image URL
  const imageUrl = useMemo(() => {
    if (imageState.error || !imagePath) {
      return getFallbackImage();
    }
    return buildImageUrl(imagePath, imageState.retryCount > 0);
  }, [imagePath, imageState.error, imageState.retryCount, buildImageUrl, getFallbackImage]);

  // Handle successful image load
  const handleImageLoad = useCallback((e) => {
    setImageState(prev => ({ ...prev, loading: false, error: false }));
    onLoad?.(e);
  }, [onLoad]);

  // Handle image error with retry logic
  const handleImageError = useCallback((e) => {
    console.warn('Image load error:', imageUrl);
    
    setImageState(prev => {
      const newState = { ...prev, loading: false };
      
      if (prev.retryCount < 2 && !imageUrl?.includes('unsplash.com')) {
        // Retry with fallback
        newState.retryCount = prev.retryCount + 1;
        newState.error = false;
      } else {
        newState.error = true;
      }
      
      return newState;
    });
    
    onError?.(e);
  }, [imageUrl, onError]);

  // Calculate combined styles
  const combinedStyle = useMemo(() => {
    const configStyle = sizeConfig[size] || sizeConfig.medium;
    
    return {
      ...configStyle,
      ...style,
      display: 'block',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      willChange: 'transform, filter',
      transform: 'translateZ(0)',
      backfaceVisibility: 'hidden'
    };
  }, [size, style, sizeConfig]);

  // Container styles
  const finalContainerStyle = useMemo(() => ({
    position: 'relative',
    display: 'inline-block',
    overflow: 'hidden',
    ...containerStyle
  }), [containerStyle]);

  return (
    <div style={finalContainerStyle}>
      {/* Loading Spinner */}
      {imageState.loading && (
        <div 
          className="position-absolute top-50 start-50 translate-middle"
          style={{ 
            zIndex: 2,
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '50%',
            padding: '8px'
          }}
        >
          <Spinner animation="border" size="sm" className="text-primary" />
        </div>
      )}
      
      {/* Main Image */}
      <img
        src={imageUrl}
        alt={alt}
        className={`${className} ${imageState.loading ? 'loading' : ''}`}
        style={combinedStyle}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={lazy && !priority ? "lazy" : "eager"}
        // Accessibility
        role="img"
        aria-label={alt}
        // Performance hints
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
      />
      
      {/* Error indicator (development only) */}
      {process.env.NODE_ENV === 'development' && imageState.error && (
        <div 
          className="position-absolute bottom-0 start-0 end-0 text-center"
          style={{ 
            fontSize: '10px', 
            background: 'rgba(255, 193, 7, 0.9)', 
            color: 'black',
            padding: '2px',
            borderRadius: '0 0 4px 4px'
          }}
        >
          Fallback Image ({imageState.retryCount} retries)
        </div>
      )}
    </div>
  );
};

export default PetImage;