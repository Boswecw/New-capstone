// client/src/components/SafeImage.js

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import performanceTracker from '../utils/performanceMonitor';

const GCS_BASE = 'https://storage.googleapis.com/furbabies-petstore';

const SafeImage = ({
  item,
  category = 'general',
  className = '',
  style = {},
  alt = '',
  onContainerTypeChange, // custom callback (doesn't forward to <img/>)
  size = 'medium',
  ...otherProps
}) => {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // for performance tracking
  const loadStartTime = useRef(Date.now());

  useEffect(() => {
    loadStartTime.current = Date.now(); // reset timer on item/category change

    if (!item) {
      setError(true);
      setLoading(false);
      return;
    }

    let url = '';

    // 1) prefer server-supplied imageUrl
    if (item.imageUrl) {
      url = item.imageUrl;
    }
    // 2) raw image field from DB
    else if (item.image) {
      if (typeof item.image === 'string' && item.image.startsWith('http')) {
        url = item.image;
      } else if (typeof item.image === 'string') {
        const clean = item.image.replace(/^\/+/, '');
        url = `${GCS_BASE}/${clean}`;
      }
    }
    // 3) photos array (pets often)
    else if (Array.isArray(item.photos) && item.photos.length > 0) {
      url = item.photos[0]?.url || item.photos[0];
    }
    // 4) smart fallback
    else {
      if (category === 'product' || item.category === 'product' || item.price !== undefined) {
        const productName = (item.name || 'placeholder').toLowerCase().replace(/[^a-z0-9]/g, '-');
        url = `${GCS_BASE}/product/${productName}.jpg`;
      } else {
        const fallbackCategory = category || 'general';
        url = `${GCS_BASE}/${fallbackCategory}/placeholder.png`;
      }
    }

    // eslint-disable-next-line no-console
    console.log('🖼️ SafeImage URL:', item?.name || 'item', '->', url);

    setImageUrl(url);
    setLoading(false);
    setError(false);
  }, [item, category]);

  const handleImageLoad = (e) => {
    // aspect ratio detection
    const img = e.target;
    const aspectRatio = img.naturalWidth / img.naturalHeight;

    let detectedType = 'square';
    if (aspectRatio > 1.5) detectedType = 'landscape';
    else if (aspectRatio < 0.6) detectedType = 'tall';
    else if (aspectRatio < 0.8) detectedType = 'portrait';

    if (onContainerTypeChange) onContainerTypeChange(detectedType);

    setLoading(false);
    setError(false);

    // performance tracking (success)
    const loadTime = Date.now() - loadStartTime.current;
    performanceTracker?.trackImageLoad?.(imageUrl, true, loadTime);
  };

  const handleImageError = () => {
    setError(true);
    setLoading(false);

    // performance tracking (fail)
    const loadTime = Date.now() - loadStartTime.current;
    performanceTracker?.trackImageLoad?.(imageUrl, false, loadTime);
  };

  if (loading) {
    return (
      <div
        className={`d-flex align-items-center justify-content-center bg-light ${className}`}
        style={{ ...style }}
      >
        <div className="text-center text-muted">
          <div className="spinner-border spinner-border-sm mb-2" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div
        className={`d-flex align-items-center justify-content-center bg-light ${className}`}
        style={{ ...style }}
      >
        <div className="text-center text-muted">
          <i className="fas fa-image fa-2x mb-2 opacity-50"></i>
          <div>No image available</div>
        </div>
      </div>
    );
  }

  // Only forward valid <img> attributes (avoid React DOM warnings)
  const validImgProps = {};
  const validHtmlProps = new Set([
    'alt', 'src', 'className', 'style',
    'onLoad', 'onError', 'onClick',
    'onMouseEnter', 'onMouseLeave',
    'id', 'role', 'aria-label', 'title',
    'width', 'height', 'loading', 'decoding',
    'crossOrigin', 'referrerPolicy', 'draggable'
  ]);

  Object.keys(otherProps).forEach((key) => {
    if (validHtmlProps.has(key)) validImgProps[key] = otherProps[key];
  });

  return (
    <img
      src={imageUrl}
      alt={alt || item?.name || 'Image'}
      className={className}
      style={style}
      onLoad={handleImageLoad}
      onError={handleImageError}
      loading="lazy"
      decoding="async"
      {...validImgProps}
    />
  );
};

SafeImage.propTypes = {
  item: PropTypes.object.isRequired,
  category: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  alt: PropTypes.string,
  onContainerTypeChange: PropTypes.func,
  size: PropTypes.string
};

export default SafeImage;
