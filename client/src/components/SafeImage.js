// src/components/SafeImage.js
import React, { useState, useEffect } from 'react';
import {
  buildImageUrl,
  buildPetImageUrl,
  buildProductImageUrl,
  validateImageUrl,
  DEFAULT_PET_IMAGE,
  DEFAULT_PRODUCT_IMAGE
} from '../utils/imageUtils';

/**
 * SafeImage component that handles image loading with fallbacks.
 *
 * Props:
 * - src?: string                 Explicit image URL/path
 * - item?: object                Entity object (may contain image fields)
 * - entityType?: 'pet'|'product' Used to choose URL builder & default fallback (default: 'pet')
 * - alt?: string                 Alt text
 * - className?: string           CSS class for the container
 * - style?: object               Inline styles for the <img>
 * - showLoader?: boolean         Show loading placeholder (default: false)
 * - fallback?: string            Custom fallback image
 * - onLoad?: (evt) => void       Callback when image loads
 * - onError?: (err) => void      Callback when image fails
 * - optimization?: object        Reserved for future use (sizes, fit, etc.)
 * - ...imgProps                  Spread onto <img>
 */
const SafeImage = ({
  src,
  item,
  entityType = 'pet',
  alt = '',
  className = '',
  style = {},
  showLoader = false,
  fallback,
  onLoad,
  onError,
  optimization = {},
  ...imgProps
}) => {
  const [imageSrc, setImageSrc] = useState('');
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Determine the best candidate for the source image.
  const resolveSource = () => {
    if (src) return src;
    if (item) {
      // Try a few common fields
      return item.image || item.imageUrl || item.imagePath || '';
    }
    return '';
  };

  // Determine fallback based on entity type if not explicitly provided.
  const resolveFallback = () => {
    if (fallback) return fallback;
    return entityType === 'product' ? DEFAULT_PRODUCT_IMAGE : DEFAULT_PET_IMAGE;
  };

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      const candidate = resolveSource();
      const fb = resolveFallback();

      if (!candidate) {
        if (!isMounted) return;
        setImageSrc(fb);
        setLoading(false);
        return;
      }

      setLoading(true);
      setImageError(false);

      try {
        // Build the image URL based on entity type
        const imageUrl =
          entityType === 'product'
            ? buildProductImageUrl(candidate, fb)
            : entityType === 'pet'
              ? buildPetImageUrl(candidate, fb)
              : buildImageUrl(candidate);

        // Validate the image URL
        const isValid = await validateImageUrl(imageUrl);

        if (!isMounted) return;

        if (isValid) {
          setImageSrc(imageUrl);
        } else {
          setImageSrc(fb);
          setImageError(true);
          onError && onError(new Error(`Failed to load image: ${imageUrl}`));
        }
        setLoading(false);
      } catch (error) {
        if (!isMounted) return;
        const fb = resolveFallback();
        setImageSrc(fb);
        setImageError(true);
        setLoading(false);
        onError && onError(error);
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, item, entityType, fallback]);

  const handleLoad = (event) => {
    setLoading(false);
    onLoad && onLoad(event);
  };

  const handleError = () => {
    if (!imageError) {
      const fb = resolveFallback();
      setImageSrc(fb);
      setImageError(true);
      onError && onError(new Error('Image failed to load'));
    }
  };

  const imageStyle = {
    opacity: loading ? 0.7 : 1,
    transition: 'opacity 0.3s ease',
    ...style
  };

  return (
    <div className={`safe-image-container ${className}`} style={{ position: 'relative' }}>
      {showLoader && loading && (
        <div
          className="image-loading-placeholder"
          style={{
            position: 'absolute',
            inset: 0,
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
