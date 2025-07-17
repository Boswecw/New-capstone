// client/src/components/SafeImage.js

import React, { useState, useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import classNames from 'classnames';
import styles from './Card.module.css'; // Assuming fit-mode classes live here

const fallbackImages = {
  dog: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop&q=80&auto=format',
  cat: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=300&fit=crop&q=80&auto=format',
  fish: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80&auto=format',
  bird: 'https://images.unsplash.com/photo-1520637836862-4d197d17c448?w=400&h=300&fit=crop&q=80&auto=format',
  rabbit: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop&q=80&auto=format',
  product: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80&auto=format',
  default: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400&h=300&fit=crop&q=80&auto=format'
};

const getFallbackUrl = (category) => {
  const cat = category?.toLowerCase() || 'default';
  if (fallbackImages[cat]) return fallbackImages[cat];
  if (cat.includes('dog')) return fallbackImages.dog;
  if (cat.includes('cat')) return fallbackImages.cat;
  if (cat.includes('fish')) return fallbackImages.fish;
  if (cat.includes('bird')) return fallbackImages.bird;
  if (cat.includes('rabbit')) return fallbackImages.rabbit;
  return fallbackImages.default;
};

const buildPrimaryUrl = (item) => {
  if (!item) return null;

  if (item.imageUrl && item.imageUrl.startsWith('http')) {
    return item.imageUrl;
  }

  if (item.image) {
    const cleanPath = item.image.replace(/^\/+/, '');
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://furbabies-backend.onrender.com'
      : 'http://localhost:5000';
    return `${baseUrl}/api/images/gcs/${cleanPath}`;
  }

  return null;
};

const SafeImage = ({
  item,
  category = 'default',
  alt = 'Image',
  className = '',
  fitMode = 'contain', // NEW: accepts 'contain' | 'cover' | 'fill' | 'scale-down'
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

    const primaryUrl = buildPrimaryUrl(item);
    const fallbackUrl = getFallbackUrl(category);

    setImageUrl(fallbackUrl);

    if (primaryUrl) {
      const testImage = new Image();
      testImage.onload = () => {
        setImageUrl(primaryUrl);
        setLoading(false);
        setError(false);
      };
      testImage.onerror = () => {
        setImageUrl(fallbackUrl);
        setLoading(false);
        setError(false);
      };
      testImage.src = primaryUrl;
    } else {
      setImageUrl(fallbackUrl);
      setLoading(false);
      setError(false);
    }
  }, [item?.id, item?.image, item?.imageUrl, category]);

  const handleImageLoad = (e) => {
    setLoading(false);
    setError(false);
    onLoad?.(e);
  };

  const handleImageError = (e) => {
    if (!e.target.src.includes('unsplash.com')) {
      const fallbackUrl = getFallbackUrl(category);
      setImageUrl(fallbackUrl);
    } else {
      setError(true);
    }
    setLoading(false);
    onError?.(e);
  };

  const containerStyles = {
    position: 'relative',
    display: 'block',
    width: '100%',
    height: '100%',
    ...containerStyle,
  };

  const imageClasses = classNames(
    className,
    styles[`fit-${fitMode}`] // dynamically applies .fit-contain, etc.
  );

  const imageStyles = {
    width: '100%',
    height: '100%',
    display: 'block',
    ...style, // no objectFit here!
  };

  return (
    <div style={containerStyles}>
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
        style={imageStyles}
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
