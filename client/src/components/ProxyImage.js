// client/src/components/ProxyImage.js - Enhanced unified image component

import React, { useState, useCallback, useMemo } from 'react';
import { Spinner } from 'react-bootstrap';
import { getGoogleStorageUrl, getFallbackImageUrl } from '../utils/imageUtils';

const ProxyImage = ({ 
  item,
  category = 'default',
  alt,
  className = "",
  size = "medium",
  style = {},
  containerStyle = {},
  onLoad,
  onError,
  priority = false,
  lazy = true,
  placeholder = true,
  aspectRatio = null
}) => {
  const [imageState, setImageState] = useState({
    loading: true,
    error: false,
    retryCount: 0
  });

  // Size configurations with responsive support
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
    },
    // New responsive card sizes
    'card-sm': {
      width: '100%',
      height: '160px',
      maxWidth: '100%',
      objectFit: 'cover',
      objectPosition: 'center'
    },
    'card-md': {
      width: '100%',
      height: '200px',
      maxWidth: '100%',
      objectFit: 'cover',
      objectPosition: 'center'
    },
    'card-lg': {
      width: '100%',
      height: '250px',
      maxWidth: '100%',
      objectFit: 'cover',
      objectPosition: 'center'
    }
  }), []);

  // Get image path from item
  const getImagePath = useCallback(() => {
    if (!item) return null;
    
    // Handle different item structures
    if (item.image) return item.image;
    if (item.imagePath) return item.imagePath;
    if (item.imageUrl) return item.imageUrl;
    if (item.photo) return item.photo;
    if (item.thumbnail) return item.thumbnail;
    
    return null;
  }, [item]);

  // Determine category from item if not provided
  const getCategory = useCallback(() => {
    if (category !== 'default') return category;
    
    if (!item) return 'default';
    
    // Auto-detect category from item
    if (item.species) return item.species.toLowerCase();
    if (item.type) return item.type.toLowerCase();
    if (item.category) {
      const cat = item.category.toLowerCase();
      if (cat.includes('dog')) return 'dog';
      if (cat.includes('cat')) return 'cat';
      if (cat.includes('fish') || cat.includes('aqua')) return 'fish';
      if (cat.includes('bird')) return 'bird';
      return 'product';
    }
    if (item.price !== undefined) return 'product';
    
    return 'pet';
  }, [item, category]);

  // Build optimized image URL
  const buildImageUrl = useCallback(() => {
    const imagePath = getImagePath();
    
    if (!imagePath) {
      return getFallbackImageUrl(getCategory());
    }

    if (imageState.error || imageState.retryCount > 1) {
      return getFallbackImageUrl(getCategory());
    }

    return getGoogleStorageUrl(imagePath, getCategory());
  }, [getImagePath, getCategory, imageState.error, imageState.retryCount]);

  // Generate alt text if not provided
  const getAltText = useCallback(() => {
    if (alt) return alt;
    
    if (!item) return 'Image';
    
    const name = item.name || item.title || item.breed || '';
    const type = item.species || item.type || item.category || '';
    
    return `${name} ${type}`.trim() || 'Pet Image';
  }, [alt, item]);

  // Handle successful image load
  const handleImageLoad = useCallback((e) => {
    setImageState(prev => ({ ...prev, loading: false, error: false }));
    onLoad?.(e);
  }, [onLoad]);

  // Handle image error with retry logic
  const handleImageError = useCallback((e) => {
    console.warn('ProxyImage load error:', buildImageUrl());
    
    setImageState(prev => {
      const newState = { ...prev, loading: false };
      
      if (prev.retryCount < 2) {
        // Retry with incremented count
        newState.retryCount = prev.retryCount + 1;
        newState.error = false;
      } else {
        newState.error = true;
      }
      
      return newState;
    });
    
    onError?.(e);
  }, [buildImageUrl, onError]);

  // Calculate combined styles
  const combinedStyle = useMemo(() => {
    const configStyle = sizeConfig[size] || sizeConfig.medium;
    
    let finalStyle = {
      ...configStyle,
      ...style,
      display: 'block',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      willChange: 'transform, filter',
      transform: 'translateZ(0)',
      backfaceVisibility: 'hidden'
    };

    // Apply aspect ratio if specified
    if (aspectRatio) {
      finalStyle.aspectRatio = aspectRatio;
      finalStyle.width = '100%';
      finalStyle.height = 'auto';
    }

    return finalStyle;
  }, [size, style, sizeConfig, aspectRatio]);

  // Container styles
  const finalContainerStyle = useMemo(() => ({
    position: 'relative',
    display: 'inline-block',
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    ...containerStyle
  }), [containerStyle]);

  const imageUrl = buildImageUrl();
  const altText = getAltText();

  return (
    <div style={finalContainerStyle}>
      {/* Loading Spinner */}
      {imageState.loading && placeholder && (
        <div 
          className="position-absolute top-50 start-50 translate-middle"
          style={{ 
            zIndex: 2,
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '50%',
            padding: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Spinner animation="border" size="sm" className="text-primary" />
        </div>
      )}
      
      {/* Placeholder background */}
      {imageState.loading && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1
          }}
        >
          <div style={{ 
            color: '#6c757d', 
            fontSize: '2rem',
            fontWeight: 'bold',
            fontFamily: 'system-ui, sans-serif'
          }}>
            {getCategory() === 'product' ? '📦' : '🐾'}
          </div>
        </div>
      )}
      
      {/* Main Image */}
      <img
        src={imageUrl}
        alt={altText}
        className={`${className} ${imageState.loading ? 'loading' : ''}`}
        style={combinedStyle}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={lazy && !priority ? "lazy" : "eager"}
        // Accessibility
        role="img"
        aria-label={altText}
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
          Fallback ({imageState.retryCount} retries)
        </div>
      )}
    </div>
  );
};

export default ProxyImage;