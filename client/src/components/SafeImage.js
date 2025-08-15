// src/components/SafeImage.js

import React, { useState, useEffect } from 'react';
import {
  buildPetImageUrl,
  buildProductImageUrl,
  validateImageUrl,
  DEFAULT_PET_IMAGE,
  DEFAULT_PRODUCT_IMAGE
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
 * @param {string} props.entityType - Type of entity the image represents ('pet' | 'product')
 * @param {Object} props.item - Entity item that may contain image information
 * @param {Object} props.optimization - Image optimization options
*/
const SafeImage = ({
  src,
  alt = '',
  fallback,
  className = '',
  style = {},
  onLoad,
  onError,
  entityType = 'pet',
  item,
  optimization = {},
  ...imgProps
}) => {
  const [imageSrc, setImageSrc] = useState('');
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const resolvedFallback = fallback || (entityType === 'product' ? DEFAULT_PRODUCT_IMAGE : DEFAULT_PET_IMAGE);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      let source = src;
      if (!source && item) {
        source = entityType === 'product' ? item?.imageUrl : item?.image;
      }

      if (!source) {
        setImageSrc(resolvedFallback);
        setLoading(false);
        return;
      }

      setLoading(true);
      setImageError(false);

      try {
        const builder = entityType === 'product' ? buildProductImageUrl : buildPetImageUrl;
        const imageUrl = builder(source, resolvedFallback);

        const isValid = await validateImageUrl(imageUrl);

        if (isMounted) {
          if (isValid) {
            setImageSrc(imageUrl);
          } else {
            setImageSrc(resolvedFallback);
            setImageError(true);
            if (onError) {
              onError(new Error(`Failed to load image: ${imageUrl}`));
            }
          }
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setImageSrc(resolvedFallback);
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
  }, [src, item, fallback, entityType, onError]);

  const handleLoad = (event) => {
    setLoading(false);
    if (onLoad) {
      onLoad(event);
    }
  };

  const handleError = (event) => {
    if (!imageError) {
      setImageSrc(resolvedFallback);
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
        {...imgProps}
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
