// client/src/components/PetImage.js - Enhanced with better error handling and sizing

import React, { useState, useCallback } from 'react';
import { Spinner } from 'react-bootstrap';

const PetImage = ({ 
  petType, 
  imagePath, 
  alt = "Pet Image", 
  className = "", 
  size = "medium",
  style = {},
  onLoad,
  onError 
}) => {
  const [imageState, setImageState] = useState({
    loading: true,
    error: false,
    retryCount: 0
  });

  // Fallback images by category
  const fallbackImages = {
    dog: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop&q=80',
    cat: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=300&fit=crop&q=80',
    fish: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80',
    bird: 'https://images.unsplash.com/photo-1520637836862-4d197d17c448?w=400&h=300&fit=crop&q=80',
    'small-pet': 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop&q=80',
    default: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80'
  };

  // Size configurations
  const sizeConfig = {
    small: { maxWidth: '150px', maxHeight: '150px' },
    medium: { maxWidth: '300px', maxHeight: '200px' },
    large: { maxWidth: '500px', maxHeight: '400px' },
    card: { width: '100%', height: '100%', objectFit: 'cover' }
  };

  // Build image URL with proxy
  const buildImageUrl = useCallback((path, isRetry = false) => {
    if (!path) return null;
    
    // If it's already a full URL (fallback), use it directly
    if (path.startsWith('http')) {
      return path;
    }
    
    // Clean the path
    const cleanPath = path.replace(/^\/+/, '');
    
    // Use proxy for GCS images
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://new-capstone.onrender.com'
      : 'http://localhost:5000';
    
    return `${baseUrl}/api/images/gcs/${cleanPath}${isRetry ? '?retry=' + Date.now() : ''}`;
  }, []);

  // Get fallback image
  const getFallbackImage = useCallback(() => {
    const type = petType?.toLowerCase() || 'default';
    return fallbackImages[type] || fallbackImages.default;
  }, [petType, fallbackImages]);

  // Handle image load success
  const handleImageLoad = useCallback((e) => {
    console.log('✅ Image loaded successfully:', e.target.src);
    setImageState({
      loading: false,
      error: false,
      retryCount: 0
    });
    if (onLoad) onLoad(e);
  }, [onLoad]);

  // Handle image load error
  const handleImageError = useCallback((e) => {
    console.error('❌ Image load error:', e.target.src);
    
    setImageState(prev => {
      const newRetryCount = prev.retryCount + 1;
      
      // If we haven't exceeded retry limit and this isn't already a fallback
      if (newRetryCount <= 2 && !e.target.src.includes('unsplash.com')) {
        console.log(`🔄 Retrying image load (attempt ${newRetryCount})`);
        
        // Try the proxy URL again with cache busting
        const retryUrl = buildImageUrl(imagePath, true);
        if (retryUrl) {
          setTimeout(() => {
            e.target.src = retryUrl;
          }, 1000 * newRetryCount); // Exponential backoff
        }
        
        return {
          ...prev,
          retryCount: newRetryCount
        };
      } else {
        console.log('🔄 Using fallback image');
        // Use fallback image
        e.target.src = getFallbackImage();
        
        return {
          loading: false,
          error: true,
          retryCount: newRetryCount
        };
      }
    });
    
    if (onError) onError(e);
  }, [imagePath, buildImageUrl, getFallbackImage, onError]);

  // Get the primary image URL
  const primaryImageUrl = buildImageUrl(imagePath);
  
  // If no image path, use fallback immediately
  const imageUrl = primaryImageUrl || getFallbackImage();
  
  // Combine styles
  const combinedStyle = {
    ...sizeConfig[size],
    ...style,
    // Ensure images don't exceed container
    maxWidth: style.width || sizeConfig[size]?.maxWidth || '100%',
    maxHeight: style.height || sizeConfig[size]?.maxHeight || '100%',
    // Smooth loading transition
    transition: 'opacity 0.3s ease',
    opacity: imageState.loading ? 0.7 : 1
  };

  return (
    <div className="position-relative" style={{ display: 'inline-block' }}>
      {/* Loading Spinner */}
      {imageState.loading && (
        <div 
          className="position-absolute top-50 start-50 translate-middle"
          style={{ zIndex: 2 }}
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
        loading="lazy"
        // Accessibility
        role="img"
        aria-label={alt}
      />
      
      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && imageState.error && (
        <div 
          className="position-absolute bottom-0 start-0 w-100 text-center"
          style={{ 
            fontSize: '10px', 
            background: 'rgba(255, 0, 0, 0.7)', 
            color: 'white',
            padding: '2px'
          }}
        >
          Fallback Image
        </div>
      )}
    </div>
  );
};

export default PetImage;