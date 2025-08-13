// client/src/components/SafeImage.js - FIXED VERSION

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import performanceTracker from '../utils/performanceMonitor';

const GCS_BASE = 'https://storage.googleapis.com/furbabies-petstore';

// 🎯 FIX: Normalize any non-HTTP URL to absolute GCS URL
const normalizeToAbsolute = (src) => {
  if (!src) return '';
  if (typeof src !== 'string') return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  const clean = src.replace(/^\/+/, '');
  return `${GCS_BASE}/${clean}`;
};

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
      console.log('🖼️ SafeImage: No item provided');
      setError(true);
      setLoading(false);
      return;
    }

    let url = '';

    // 1) First priority: server-supplied imageUrl (normalize it)
    if (item.imageUrl && typeof item.imageUrl === 'string') {
      url = item.imageUrl;
      console.log('🖼️ SafeImage: Using server imageUrl (will be normalized):', url);
    }
    // 2) Second priority: raw image field from DB
    else if (item.image && typeof item.image === 'string') {
      url = item.image;
      console.log('🖼️ SafeImage: Using image field (will be normalized):', url);
    }
    // 3) Third priority: photos array (mainly for pets)
    else if (Array.isArray(item.photos) && item.photos.length > 0) {
      const photo = item.photos[0];
      url = (typeof photo === 'object' ? photo.url : photo) || '';
      console.log('🖼️ SafeImage: Using photos array (will be normalized):', url);
    }
    // 4) No image found
    else {
      console.log('🖼️ SafeImage: No image found for:', item.name || 'unnamed item');
      setImageUrl('');
      setLoading(false);
      setError(true);
      return;
    }

    // 🎯 CRITICAL FIX: Normalize to absolute URL
    const finalUrl = normalizeToAbsolute(url);
    console.log('🖼️ SafeImage Final URL:', item?.name || 'item', '->', finalUrl);
    
    if (!finalUrl || finalUrl.trim() === '') {
      console.log('🖼️ SafeImage: Empty URL after normalization');
      setImageUrl('');
      setLoading(false);
      setError(true);
      return;
    }

    setImageUrl(finalUrl);
    setLoading(false);
    setError(false);
  }, [item, category]);

  const handleImageLoad = (e) => {
    console.log('✅ SafeImage: Image loaded successfully:', imageUrl);
    
    // aspect ratio detection for container type
    const img = e.target;
    if (img.naturalWidth && img.naturalHeight) {
      const aspectRatio = img.naturalWidth / img.naturalHeight;

      let detectedType = 'square';
      if (aspectRatio > 1.5) detectedType = 'landscape';
      else if (aspectRatio < 0.6) detectedType = 'tall';
      else if (aspectRatio < 0.8) detectedType = 'portrait';

      if (onContainerTypeChange) {
        onContainerTypeChange(detectedType);
      }
    }

    setLoading(false);
    setError(false);

    // performance tracking (success)
    const loadTime = Date.now() - loadStartTime.current;
    performanceTracker?.trackImageLoad?.(imageUrl, true, loadTime);
  };

  const handleImageError = (e) => {
    console.log('❌ SafeImage: Image failed to load:', imageUrl);
    console.log('❌ SafeImage: Error details:', e.target.src);
    
    setError(true);
    setLoading(false);

    // performance tracking (fail)
    const loadTime = Date.now() - loadStartTime.current;
    performanceTracker?.trackImageLoad?.(imageUrl, false, loadTime);
  };

  // Loading state
  if (loading) {
    return (
      <div
        className={`d-flex align-items-center justify-content-center bg-light ${className}`}
        style={{ ...style }}
        data-testid="safe-image-loading"
      >
        <div className="text-center text-muted">
          <div className="spinner-border spinner-border-sm mb-2" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div style={{ fontSize: '0.875rem' }}>Loading image...</div>
        </div>
      </div>
    );
  }

  // Error state - show fallback UI
  if (error || !imageUrl) {
    const entityType = category || (item?.price !== undefined ? 'product' : 'pet') || 'general';
    const entityName = item?.name || item?.title || 'item';
    
    return (
      <div
        className={`d-flex align-items-center justify-content-center bg-light ${className}`}
        style={{ ...style }}
        data-testid="safe-image-fallback"
      >
        <div className="text-center text-muted">
          <i 
            className={`fas ${entityType === 'product' ? 'fa-box' : entityType === 'pet' ? 'fa-paw' : 'fa-image'} fa-2x mb-2 opacity-50`}
            aria-hidden="true"
          ></i>
          <div style={{ fontSize: '0.875rem' }}>
            {entityType === 'product' ? 'Product image' : 
             entityType === 'pet' ? 'Pet photo' : 'Image'} unavailable
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
              {entityName}
            </div>
          )}
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
    if (validHtmlProps.has(key)) {
      validImgProps[key] = otherProps[key];
    }
  });

  return (
    <img
      src={imageUrl}
      alt={alt || item?.name || item?.title || 'Image'}
      className={className}
      style={style}
      onLoad={handleImageLoad}
      onError={handleImageError}
      loading="lazy"
      decoding="async"
      data-testid="safe-image-loaded"
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