// client/src/components/SafeImage.js - BULLETPROOF VERSION

import React, { useState, useEffect } from 'react';
import { Spinner } from 'react-bootstrap';

const SafeImage = ({ 
  item, 
  category = 'default', 
  alt = "Image", 
  className = "", 
  style = {},
  containerStyle = {},
  onLoad,
  onError,
  showSpinner = true,
  ...props 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);

  // Static fallback images - these WILL work
  const fallbackImages = {
    dog: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop&q=80&auto=format',
    cat: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=300&fit=crop&q=80&auto=format',
    fish: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80&auto=format',
    bird: 'https://images.unsplash.com/photo-1520637836862-4d197d17c448?w=400&h=300&fit=crop&q=80&auto=format',
    rabbit: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop&q=80&auto=format',
    product: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80&auto=format',
    default: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80&auto=format'
  };

  // Get fallback image URL
  const getFallbackUrl = (category) => {
    const cleanCategory = category?.toLowerCase() || 'default';
    
    if (fallbackImages[cleanCategory]) {
      return fallbackImages[cleanCategory];
    }
    
    // Check partial matches
    if (cleanCategory.includes('dog')) return fallbackImages.dog;
    if (cleanCategory.includes('cat')) return fallbackImages.cat;
    if (cleanCategory.includes('fish')) return fallbackImages.fish;
    if (cleanCategory.includes('bird')) return fallbackImages.bird;
    if (cleanCategory.includes('rabbit')) return fallbackImages.rabbit;
    
    return fallbackImages.default;
  };

  // Build primary image URL
  const buildPrimaryUrl = (item) => {
    if (!item) return null;

    // Direct imageUrl
    if (item.imageUrl && item.imageUrl.startsWith('http')) {
      return item.imageUrl;
    }

    // Build from image path
    if (item.image) {
      const cleanPath = item.image.replace(/^\/+/, '');
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://furbabies-backend.onrender.com'
        : 'http://localhost:5000';
      
      return `${baseUrl}/api/images/gcs/${cleanPath}`;
    }

    return null;
  };

  // Set initial image URL when component mounts or item changes
  useEffect(() => {
    console.log('🔄 SafeImage: Setting up image for:', item?.name || 'Unknown item');
    
    setLoading(true);
    setError(false);
    
    const primaryUrl = buildPrimaryUrl(item);
    const fallbackUrl = getFallbackUrl(category);
    
    // Always start with fallback to ensure something loads
    setImageUrl(fallbackUrl);
    
    console.log('🎯 Primary URL:', primaryUrl);
    console.log('🎯 Fallback URL:', fallbackUrl);
    
    // Try primary URL if available
    if (primaryUrl) {
      // Create a test image to check if primary URL works
      const testImage = new Image();
      testImage.onload = () => {
        console.log('✅ Primary image loaded successfully');
        setImageUrl(primaryUrl);
        setLoading(false);
        setError(false);
      };
      testImage.onerror = () => {
        console.log('❌ Primary image failed, using fallback');
        setImageUrl(fallbackUrl);
        setLoading(false);
        setError(false);
      };
      testImage.src = primaryUrl;
    } else {
      console.log('⚠️ No primary URL, using fallback immediately');
      setImageUrl(fallbackUrl);
      setLoading(false);
      setError(false);
    }
  }, [item?.id, item?.image, item?.imageUrl, category]);

  // Handle image load success
  const handleImageLoad = (e) => {
    console.log('✅ Image displayed successfully:', e.target.src);
    setLoading(false);
    setError(false);
    onLoad?.(e);
  };

  // Handle image load error
  const handleImageError = (e) => {
    console.log('❌ Image display failed:', e.target.src);
    
    // If this wasn't already a fallback, try the fallback
    if (!e.target.src.includes('unsplash.com')) {
      console.log('🔄 Switching to fallback image');
      const fallbackUrl = getFallbackUrl(category);
      setImageUrl(fallbackUrl);
      setError(false);
    } else {
      console.log('💥 Even fallback failed!');
      setError(true);
    }
    
    setLoading(false);
    onError?.(e);
  };

  // Container styles
  const containerStyles = {
    position: 'relative',
    display: 'block',
    width: '100%',
    height: '100%',
    ...containerStyle
  };

  // Image styles
  const imageStyles = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    ...style
  };

  return (
    <div style={containerStyles}>
      {/* Loading spinner */}
      {loading && showSpinner && (
        <div 
          className="position-absolute top-50 start-50 translate-middle d-flex align-items-center justify-content-center"
          style={{ 
            zIndex: 10,
            backgroundColor: 'rgba(248, 249, 250, 0.9)',
            borderRadius: '8px',
            padding: '16px',
            minWidth: '120px'
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
              Loading...
            </div>
          </div>
        </div>
      )}
      
      {/* Main image */}
      <img
        {...props}
        src={imageUrl}
        alt={alt}
        className={className}
        style={imageStyles}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
        decoding="async"
        crossOrigin="anonymous"
      />
      
      {/* Error fallback */}
      {error && (
        <div 
          className="position-absolute top-50 start-50 translate-middle text-center"
          style={{ 
            zIndex: 5,
            color: '#6c757d',
            backgroundColor: 'rgba(248, 249, 250, 0.9)',
            borderRadius: '8px',
            padding: '16px'
          }}
        >
          <i className="fas fa-image fa-2x mb-2" style={{ opacity: 0.5 }}></i>
          <div style={{ fontSize: '0.875rem' }}>
            Image unavailable
          </div>
        </div>
      )}
    </div>
  );
};

export default SafeImage;