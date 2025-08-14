// client/src/components/SafeImage.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { buildImageUrl, getFallbackUrl } from '../utils/imageBuilder';
import { generateAltText } from '../utils/imageUtils';

const SafeImage = ({
  src,
  item,
  entityType = 'default',
  // Use undefined instead of null to satisfy react/no-typos and prop-types
  category,
  alt,
  className = '',
  style = {},
  imgProps = {},
  onLoad,
  onError,
  showLoader = true,
  showErrorMessage = true,
}) => {
  const [loading, setLoading] = useState(Boolean(showLoader));
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(null);

  const maxRetries = 2;

  const computedAlt = useMemo(() => {
    if (alt && typeof alt === 'string') return alt;
    return generateAltText(item, entityType) || 'Image';
  }, [alt, item, entityType]);

  const getImageSource = useCallback(() => {
    if (src) {
      return buildImageUrl(src, { entityType, category });
    }
    if (item) {
      const itemImagePath = item.image || item.imageUrl || item.photo || item.picture;
      const itemEntityType = entityType || item.type || 'default';
      const itemCategory = category || item.category;
      return buildImageUrl(itemImagePath, {
        entityType: itemEntityType,
        category: itemCategory,
      });
    }
    return getFallbackUrl(entityType, category);
  }, [src, item, entityType, category]);

  // Initialize / update source when inputs change
  useEffect(() => {
    const newSrc = getImageSource();
    if (newSrc !== currentSrc) {
      setCurrentSrc(newSrc);
      setLoading(Boolean(showLoader));
      setError(false);
      setRetryCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getImageSource, showLoader]);

  const handleLoad = useCallback(
    (ev) => {
      setLoading(false);
      if (typeof onLoad === 'function') onLoad(ev);
    },
    [onLoad],
  );

  const handleError = useCallback(
    (ev) => {
      // eslint-disable-next-line no-console
      console.warn('🖼️ SafeImage failed to load:', {
        src: currentSrc,
        entityType,
        category,
        retryCount,
      });

      setLoading(false);

      if (retryCount < maxRetries) {
        setTimeout(() => {
          const fallbackSrc = getFallbackUrl(entityType, category);
          if (fallbackSrc !== currentSrc) {
            setCurrentSrc(fallbackSrc);
            setRetryCount((prev) => prev + 1);
            setLoading(Boolean(showLoader));
            setError(false);
          } else {
            setError(true);
          }
        }, 500 * (retryCount + 1));
      } else {
        setError(true);
      }

      if (typeof onError === 'function') onError(ev);
    },
    [category, currentSrc, entityType, onError, retryCount, showLoader],
  );

  return (
    <div className={`safe-image-container ${className}`.trim()} style={style}>
      {loading && showLoader && (
        <div className="safe-image-loader" aria-live="polite">
          <div className="spinner" />
          <span>Loading...</span>
        </div>
      )}

      <img
        {...imgProps}
        src={currentSrc || getFallbackUrl(entityType, category)}
        alt={computedAlt}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        crossOrigin="anonymous"
        style={{
          opacity: loading ? 0.3 : 1,
          transition: 'opacity 0.3s ease-in-out',
          ...(imgProps.style || {}),
        }}
      />

      {error && showErrorMessage && (
        <div className="safe-image-error" role="status" aria-live="polite">
          <i className="fas fa-exclamation-triangle" aria-hidden="true" />
          <span> Image unavailable</span>
        </div>
      )}
    </div>
  );
};

SafeImage.propTypes = {
  src: PropTypes.string,
  item: PropTypes.shape({
    image: PropTypes.string,
    imageUrl: PropTypes.string,
    imagePath: PropTypes.string,
    photo: PropTypes.string,
    picture: PropTypes.string,
    type: PropTypes.string,
    category: PropTypes.string,
  }),
  entityType: PropTypes.string,
  // No direct `null` usage in prop-types to satisfy react/no-typos
  category: PropTypes.string,
  alt: PropTypes.string,
  className: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types
  style: PropTypes.object,
  // eslint-disable-next-line react/forbid-prop-types
  imgProps: PropTypes.object,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  showLoader: PropTypes.bool,
  showErrorMessage: PropTypes.bool,
};

export default SafeImage;
