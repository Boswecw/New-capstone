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
 * SafeImage component that handles image loading with fallbacks
 * @param {Object} props - Component props
 * This component attempts to build a valid image URL for different entity
 * types (pets, products, etc.) while falling back to sensible defaults when
 * an image cannot be loaded. It also optionally shows a loading indicator.
 *
 * @param {Object} props
 * @param {string} [props.src] - Explicit image URL/path. If omitted, the
 *   component will attempt to derive the URL from `item.image` or
 *   `item.imageUrl`.
 * @param {Object} [props.item] - Entity object that may contain image fields.
 * @param {string} [props.entityType='pet'] - Entity type used to determine
 *   which URL builder and default fallback image to use.
 * @param {string} [props.alt] - Alt text for accessibility.
 * @param {string} [props.className] - CSS classes applied to the container.
 * @param {Object} [props.style] - Inline styles applied to the `<img>` tag.
 * @param {boolean} [props.showLoader=false] - Whether to display a loading
 *   placeholder while the image is loading.
 * @param {Object} [props.imgProps] - Additional props spread onto the `<img>`
 *   element.
 * @param {Function} [props.onLoad] - Callback when image loads successfully.
 * @param {Function} [props.onError] - Callback when image fails to load.
 */
const SafeImage = ({
  src,
  item,
  entityType = 'pet',
  alt = '',
  className = '',
  style = {},
  showLoader = false,
  imgProps = {},
  fallback,
  onLoad,
  onError,
  ...rest
}) => {
  const [imageSrc, setImageSrc] = useState('');
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Determine the best candidate for the source image.
  const resolveSource = () => {
    if (src) return src;
    if (item) {
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

        if (isMounted) {
          if (isValid) {
            setImageSrc(imageUrl);
          } else {
            setImageSrc(fb);
            setImageError(true);
            onError && onError(new Error(`Failed to load image: ${imageUrl}`));
          }
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setImageSrc(fb);
          setImageError(true);
          setLoading(false);
          onError && onError(error);
        }
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
      setImageSrc(resolveFallback());
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
        {...rest}
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