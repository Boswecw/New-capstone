// client/src/components/SafeImage.js
import React, { useState, useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import classNames from 'classnames';
import styles from './Card.module.css'; // .fit-contain, .fit-cover, etc.

// Static fallback images
const fallbackImages = {
  dog: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop&q=80&auto=format',
  cat: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=300&fit=crop&q=80&auto=format',
  fish: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80&auto=format',
  rabbit: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop&q=80&auto=format',
  product: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80&auto=format',
  default: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80&auto=format',
};

const getFallbackUrl = (category) => {
  const cat = category?.toLowerCase() || 'default';
  return (
    fallbackImages[cat] ||
    (cat.includes('dog') && fallbackImages.dog) ||
    (cat.includes('cat') && fallbackImages.cat) ||
    (cat.includes('fish') && fallbackImages.fish) ||
    (cat.includes('rabbit') && fallbackImages.rabbit) ||
    fallbackImages.default
  );
};

const buildPrimaryUrl = (item) => {
  if (!item) return null;

  // If absolute URL already present
  if (item.imageUrl && item.imageUrl.startsWith('http')) {
    return item.imageUrl;
  }

  // Build GCS proxy path
  if (item.image) {
    const cleanPath = item.image.replace(/^\/+/, '');
    const baseUrl = 'https://furbabies-backend.onrender.com'; // 🔧 Force production backend
    return `${baseUrl}/api/images/gcs/${cleanPath}`;
  }

  return null;
};

const SafeImage = ({
  item,
  category = 'default',
  alt = 'Image',
  className = '',
  fitMode = 'contain',
  containerStyle = {},
  style = {},
  onLoad,
  onError,
  showSpinner = true,
  ...props
}) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);

    const fallbackUrl = getFallbackUrl(category);
    const primaryUrl = buildPrimaryUrl(item);

    setImageUrl(fallbackUrl);

    if (primaryUrl) {
      const testImage = new Image();
      testImage.onload = () => {
        setImageUrl(primaryUrl);
        setLoading(false);
      };
      testImage.onerror = () => {
        setImageUrl(fallbackUrl);
        setLoading(false);
      };
      testImage.src = primaryUrl;
    } else {
      setImageUrl(fallbackUrl);
      setLoading(false);
    }
  }, [item, category]);

  const handleImageLoad = (e) => {
    setLoading(false);
    setError(false);
    onLoad?.(e);
  };

  const handleImageError = (e) => {
    const fallbackUrl = getFallbackUrl(category);
    if (!e.target.src.includes('unsplash.com')) {
      setImageUrl(fallbackUrl);
    } else {
      setError(true);
    }
    setLoading(false);
    onError?.(e);
  };

  const imageClasses = classNames(className, styles[`fit-${fitMode}`]);

  return (
    <div
      style={{
        position: 'relative',
        display: 'block',
        width: '100%',
        height: '100%',
        ...containerStyle
      }}
    >
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
            <Spinner animation="border" size="sm" className="mb-2" style={{ color: '#6c757d' }} />
            <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>Loading...</div>
          </div>
        </div>
      )}

      <img
        {...props}
        src={imageUrl}
        alt={alt}
        className={imageClasses}
        style={{ width: '100%', height: '100%', display: 'block', ...style }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
        decoding="async"
        crossOrigin="anonymous"
      />

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
          <i className="fas fa-image fa-2x mb-2" style={{ opacity: 0.5 }} />
          <div style={{ fontSize: '0.875rem' }}>Image unavailable</div>
        </div>
      )}
    </div>
  );
};

export default SafeImage;
