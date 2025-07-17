// client/src/components/ProxyImage.js - ENHANCED VERSION

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Spinner } from 'react-bootstrap';

const ProxyImage = ({ 
  item, 
  category, 
  alt = "Image", 
  className = "", 
  size = "medium",
  style = {},
  containerStyle = {},
  onLoad,
  onError,
  priority = false,
  lazy = true,
  fallbackType = "unsplash"
}) => {
  const [imageState, setImageState] = useState({
    loading: true,
    error: false,
    retryCount: 0,
    currentSrc: null
  });

  // Enhanced fallback images with proper aspect ratios for cards
  const fallbackImages = useMemo(() => ({
    dog: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop&q=80&auto=format',
    cat: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=300&fit=crop&q=80&auto=format',
    fish: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80&auto=format',
    bird: 'https://images.unsplash.com/photo-1520637836862-4d197d17c448?w=400&h=300&fit=crop&q=80&auto=format',
    rabbit: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop&q=80&auto=format',
    'small-pet': 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop&q=80&auto=format',
    hamster: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop&q=80&auto=format',
    'guinea pig': 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80&auto=format',
    reptile: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80&auto=format',
    product: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80&auto=format',
    'dog-care': 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop&q=80&auto=format',
    'cat-care': 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=300&fit=crop&q=80&auto=format',
    grooming: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=400&h=300&fit=crop&q=80&auto=format',
    food: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&h=300&fit=crop&q=80&auto=format',
    toys: 'https://images.unsplash.com/photo-1594149929161-86070191b966?w=400&h=300&fit=crop&q=80&auto=format',
    accessories: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80&auto=format',
    default: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80&auto=format'
  }), []);

  // Size configurations optimized for the new CSS
  const sizeConfig = useMemo(() => ({
    'card-sm': {
      maxWidth: '200px',
      maxHeight: '160px',
      objectFit: 'cover'
    },
    'card-md': {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    'card-lg': {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
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
    hero: {
      width: '100%',
      height: '500px',
      objectFit: 'cover'
    }
  }), []);

  // Build primary image URL from your backend
  const buildPrimaryImageUrl = useCallback((item) => {
    if (!item) return null;

    // If item has a direct imageUrl, use it
    if (item.imageUrl && item.imageUrl.startsWith('http')) {
      return item.imageUrl;
    }

    // Build from image property
    const imagePath = item.image;
    if (!imagePath) return null;

    // Clean the path
    const cleanPath = imagePath.replace(/^\/+/, '');
    
    // Use your backend image proxy
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://furbabies-backend.onrender.com'
      : 'http://localhost:5000';
    
    return `${baseUrl}/api/images/gcs/${cleanPath}`;
  }, []);

  // Get fallback image based on category
  const getFallbackImage = useCallback((category) => {
    const cleanCategory = category?.toLowerCase().replace(/[^a-z-]/g, '') || 'default';
    
    // Direct category match
    if (fallbackImages[cleanCategory]) {
      return fallbackImages[cleanCategory];
    }
    
    // Partial matches for better fallbacks
    if (cleanCategory.includes('dog')) return fallbackImages.dog;
    if (cleanCategory.includes('cat')) return fallbackImages.cat;
    if (cleanCategory.includes('fish')) return fallbackImages.fish;
    if (cleanCategory.includes('bird')) return fallbackImages.bird;
    if (cleanCategory.includes('rabbit')) return fallbackImages.rabbit;
    if (cleanCategory.includes('hamster') || cleanCategory.includes('mouse')) return fallbackImages.hamster;
    if (cleanCategory.includes('guinea')) return fallbackImages['guinea pig'];
    if (cleanCategory.includes('reptile') || cleanCategory.includes('lizard') || cleanCategory.includes('snake')) return fallbackImages.reptile;
    if (cleanCategory.includes('product') || cleanCategory.includes('toy') || cleanCategory.includes('food') || cleanCategory.includes('care')) {
      return fallbackImages.product;
    }
    
    return fallbackImages.default;
  }, [fallbackImages]);

  // Determine which image source to use
  const imageSource = useMemo(() => {
    if (imageState.error || !item) {
      return getFallbackImage(category);
    }
    return buildPrimaryImageUrl(item) || getFallbackImage(category);
  }, [item, category, imageState.error, buildPrimaryImageUrl, getFallbackImage]);

  // Handle image load success
  const handleLoad = useCallback((e) => {
    console.log(`✅ Image loaded successfully: ${e.target.src}`);
    setImageState(prev => ({ 
      ...prev, 
      loading: false, 
      error: false,
      currentSrc: e.target.src
    }));
    onLoad?.(e);
  }, [onLoad]);

  // Handle image load error with retry logic
  const handleError = useCallback((e) => {
    console.log(`❌ Image load error: ${e.target.src}`);
    
    setImageState(prev => {
      const newRetryCount = prev.retryCount + 1;
      
      // If we haven't already switched to fallback, do so now
      if (newRetryCount === 1 && !prev.error) {
        console.log(`🔄 Switching to fallback image for category: ${category}`);
        return {
          ...prev,
          error: true,
          loading: false,
          retryCount: newRetryCount
        };
      }
      
      // If fallback also fails, show error state
      return {
        ...prev,
        error: true,
        loading: false,
        retryCount: newRetryCount
      };
    });
    
    onError?.(e);
  }, [category, onError]);

  // Reset state when item changes
  useEffect(() => {
    setImageState({
      loading: true,
      error: false,
      retryCount: 0,
      currentSrc: null
    });
  }, [item?.id, item?.image]);

  // Get computed styles
  const computedStyle = {
    ...sizeConfig[size],
    ...style
  };

  // Enhanced loading spinner
  const LoadingSpinner = () => (
    <div 
      className="d-flex align-items-center justify-content-center w-100 h-100"
      style={{ 
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        minHeight: '150px'
      }}
    >
      <div className="text-center">
        <Spinner 
          animation="border" 
          size="sm" 
          className="mb-2"
          style={{ color: '#6c757d' }}
        />
        <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
          Loading image...
        </div>
      </div>
    </div>
  );

  // Error state fallback
  const ErrorFallback = () => (
    <div 
      className="d-flex align-items-center justify-content-center w-100 h-100"
      style={{ 
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        minHeight: '150px',
        color: '#6c757d'
      }}
    >
      <div className="text-center">
        <i className="fas fa-image fa-2x mb-2" style={{ opacity: 0.5 }}></i>
        <div style={{ fontSize: '0.875rem' }}>
          Image unavailable
        </div>
      </div>
    </div>
  );

  // Show loading state
  if (imageState.loading) {
    return (
      <div style={containerStyle}>
        <LoadingSpinner />
      </div>
    );
  }

  // Show error state if fallback also failed
  if (imageState.error && imageState.retryCount > 1) {
    return (
      <div style={containerStyle}>
        <ErrorFallback />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <img
        src={imageSource}
        alt={alt}
        className={`${className} ${imageState.loading ? 'loading' : ''}`}
        style={computedStyle}
        onLoad={handleLoad}
        onError={handleError}
        loading={lazy ? "lazy" : "eager"}
        decoding="async"
        crossOrigin="anonymous"
      />
    </div>
  );
};

export default ProxyImage;