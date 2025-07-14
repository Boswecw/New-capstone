// client/src/components/SafeImage.js - ROBUST IMAGE COMPONENT
import React, { useState, useEffect } from 'react';

const SafeImage = ({ 
  src, 
  alt, 
  className = "", 
  style = {}, 
  fallbackText = "Image",
  type = "product", // 'product', 'pet', 'general'
  onLoad,
  onError,
  loading = "lazy",
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reliable fallback images with multiple backup options
  const getFallbackImage = (type, text) => {
    const encodedText = encodeURIComponent(text);
    
    // Primary fallbacks using via.placeholder.com
    const primaryFallbacks = {
      product: `https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=${encodedText}`,
      pet: `https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=🐾+${encodedText}`,
      general: `https://via.placeholder.com/300x200/f5f5f5/999999?text=${encodedText}`
    };

    // Secondary fallbacks using picsum.photos with blur for aesthetic appeal
    const secondaryFallbacks = {
      product: `https://picsum.photos/400/300?blur=2&random=${Math.floor(Math.random() * 1000)}`,
      pet: `https://picsum.photos/400/300?blur=2&random=${Math.floor(Math.random() * 1000)}`,
      general: `https://picsum.photos/300/200?blur=2&random=${Math.floor(Math.random() * 1000)}`
    };

    // Ultimate fallback using data URIs (always works)
    const dataUriFallbacks = {
      product: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='100%25' height='100%25' fill='%234ECDC4'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='Arial, sans-serif' font-size='16' fill='%23FFFFFF'%3E🛍️ Product%3C/text%3E%3C/svg%3E",
      pet: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23FF6B6B'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='Arial, sans-serif' font-size='16' fill='%23FFFFFF'%3E🐾 Pet%3C/text%3E%3C/svg%3E",
      general: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='Arial, sans-serif' font-size='16' fill='%23999999'%3ENo Image%3C/text%3E%3C/svg%3E"
    };

    return {
      primary: primaryFallbacks[type] || primaryFallbacks.general,
      secondary: secondaryFallbacks[type] || secondaryFallbacks.general,
      ultimate: dataUriFallbacks[type] || dataUriFallbacks.general
    };
  };

  const handleError = (event) => {
    console.warn(`🚫 Image failed to load: ${imageSrc}`);
    
    if (!hasError) {
      setHasError(true);
      const fallback = getFallbackImage(type, fallbackText);
      
      // Try primary fallback first
      if (!imageSrc.includes('placeholder')) {
        setImageSrc(fallback.primary);
      } else if (!imageSrc.includes('picsum')) {
        // If placeholder failed, try picsum
        setImageSrc(fallback.secondary);
      } else {
        // If all external services fail, use data URI
        setImageSrc(fallback.ultimate);
      }
    }
    setIsLoading(false);
    
    // Call parent's onError handler if provided
    if (onError) {
      onError(event);
    }
  };

  const handleLoad = (event) => {
    setIsLoading(false);
    console.log(`✅ Image loaded successfully: ${imageSrc}`);
    
    // Call parent's onLoad handler if provided
    if (onLoad) {
      onLoad(event);
    }
  };

  // Reset state when src prop changes
  useEffect(() => {
    if (src !== imageSrc && !hasError) {
      setImageSrc(src);
      setHasError(false);
      setIsLoading(true);
    }
  }, [src]);

  return (
    <div className={`safe-image-container ${className}`} style={style}>
      {isLoading && (
        <div 
          className="image-loading-placeholder d-flex align-items-center justify-content-center bg-light"
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            minHeight: '200px', 
            zIndex: 1,
            ...style 
          }}
        >
          <div className="text-muted">Loading...</div>
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`img-fluid ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={{ 
          ...style, 
          width: '100%', 
          height: 'auto',
          transition: 'opacity 0.3s ease-in-out'
        }}
        onError={handleError}
        onLoad={handleLoad}
        loading={loading}
        {...props}
      />
    </div>
  );
};

export default SafeImage;