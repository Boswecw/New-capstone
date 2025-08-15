// src/components/SafeImage.js

import React, { useState, useEffect } from 'react';
import { 
  buildImageUrl, 
  buildPetImageUrl, 
  validateImageUrl, 
  DEFAULT_PET_IMAGE 
} from '../utils/imageUtils';

/**
 * SafeImage component that handles image loading with fallbacks
 * @param {Object} props - Component props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Alt text for accessibility
 * @param {string} props.fallback - Custom fallback image
 * @param {string} props.className - CSS classes
 * @param {Object} props.style - Inline styles
 * @param {Function} props.onLoad - Callback when image loads successfully
 * @param {Function} props.onError - Callback when image fails to load
 * @param {boolean} props.isPet - Whether this is a pet image (uses pet-specific URL building)
 * @param {Object} props.optimization - Image optimization options
 */
const SafeImage = ({
  src,
  alt = '',
  fallback = DEFAULT_PET_IMAGE,
  className = '',
  style = {},
  onLoad,
  onError,
  isPet = false,
  optimization = {},
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState('');
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      if (!src) {
        setImageSrc(fallback);
        setLoading(false);
        return;
      }

      setLoading(true);
      setImageError(false);

      try {
        // Build the image URL based on type
        const imageUrl = isPet ? buildPetImageUrl(src, fallback) : buildImageUrl(src);
        
        // Validate the image URL
        const isValid = await validateImageUrl(imageUrl);
        
        if (isMounted) {
          if (isValid) {
            setImageSrc(imageUrl);
          } else {
            setImageSrc(fallback);
            setImageError(true);
            if (onError) {
              onError(new Error(`Failed to load image: ${imageUrl}`));
            }
          }
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setImageSrc(fallback);
          setImageError(true);
          setLoading(false);
          if (onError) {
            onError(error);
          }
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [src, fallback, isPet, onError]);

  const handleLoad = (event) => {
    setLoading(false);
    if (onLoad) {
      onLoad(event);
    }
  };

  const handleError = (event) => {
    if (!imageError) {
      setImageSrc(fallback);
      setImageError(true);
      if (onError) {
        onError(new Error(`Image failed to load: ${src}`));
      }
    }
  };

  const imageStyle = {
    opacity: loading ? 0.7 : 1,
    transition: 'opacity 0.3s ease',
    ...style
  };

  return (
    <div className={`safe-image-container ${className}`} style={{ position: 'relative' }}>
      {loading && (
        <div 
          className="image-loading-placeholder"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: '#666'
          }}
        >
          Loading...
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        style={imageStyle}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      {imageError && (
        <div 
          className="image-error-indicator"
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            background: 'rgba(255, 0, 0, 0.7)',
            color: 'white',
            padding: '2px 4px',
            fontSize: '10px',
            borderRadius: '2px'
          }}
          title="Image failed to load"
        >
          !
        </div>
      )}
    </div>
  );
};

export default SafeImage;