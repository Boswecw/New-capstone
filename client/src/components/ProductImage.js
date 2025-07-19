// client/src/components/ProductImage.js - Product image component with fallback
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// Get correct backend URL
const getBackendUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://furbabies-backend.onrender.com';
  }
  return 'http://localhost:5000';
};

// Fallback images for different product categories
const FALLBACK_IMAGES = {
  food: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&h=300&fit=crop&q=80',
  toy: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&q=80',
  accessory: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80',
  grooming: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&h=300&fit=crop&q=80',
  health: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=300&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80'
};

const ProductImage = ({ 
  product, 
  className = '', 
  style = {},
  size = 'medium',
  alt,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState('');
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Build image URL based on product data
  useEffect(() => {
    const buildImageUrl = () => {
      if (!product) {
        return FALLBACK_IMAGES.default;
      }

      // Check various possible image fields
      const imagePath = product.image || product.imageUrl || product.imagePath || product.photo;
      
      if (!imagePath || typeof imagePath !== 'string') {
        console.warn(`❌ No valid image path for product: ${product.name}`);
        return getFallbackImage(product);
      }

      // Clean the image path
      let cleanPath = imagePath.trim();
      
      // Remove leading slashes
      cleanPath = cleanPath.replace(/^\/+/, '');
      
      // If it's already a full URL (http/https), use it directly
      if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
        return cleanPath;
      }

      // Build proxy URL
      const backendUrl = getBackendUrl();
      
      // If the path doesn't start with product/, add it
      if (!cleanPath.startsWith('product/')) {
        cleanPath = `product/${cleanPath}`;
      }
      
      const proxyUrl = `${backendUrl}/api/images/gcs/${cleanPath}`;
      console.log(`🖼️ Product image URL for ${product.name}:`, proxyUrl);
      
      return proxyUrl;
    };

    const url = buildImageUrl();
    setImageSrc(url);
    setImageError(false);
    setLoading(true);
  }, [product]);

  // Get fallback image based on product category
  const getFallbackImage = (product) => {
    const category = product?.category?.toLowerCase() || 'default';
    
    // Map category to fallback image
    if (category.includes('food') || category.includes('treat')) {
      return FALLBACK_IMAGES.food;
    } else if (category.includes('toy')) {
      return FALLBACK_IMAGES.toy;
    } else if (category.includes('groom')) {
      return FALLBACK_IMAGES.grooming;
    } else if (category.includes('health') || category.includes('medication')) {
      return FALLBACK_IMAGES.health;
    } else if (category.includes('collar') || category.includes('leash') || category.includes('harness')) {
      return FALLBACK_IMAGES.accessory;
    }
    
    return FALLBACK_IMAGES.default;
  };

  // Handle image load error
  const handleImageError = (e) => {
    if (!imageError) {
      console.warn(`❌ Failed to load product image for ${product?.name}:`, imageSrc);
      console.log('🔄 Switching to fallback image');
      
      const fallbackUrl = getFallbackImage(product);
      setImageSrc(fallbackUrl);
      setImageError(true);
    }
  };

  // Handle successful image load
  const handleImageLoad = () => {
    console.log(`✅ Product image loaded successfully for ${product?.name}`);
    setLoading(false);
  };

  // Size configurations
  const sizeStyles = {
    small: { width: '150px', height: '150px' },
    medium: { width: '250px', height: '200px' },
    large: { width: '400px', height: '300px' },
    card: { width: '100%', height: '200px' }
  };

  const imageStyle = {
    objectFit: 'cover',
    borderRadius: '8px',
    transition: 'opacity 0.3s ease',
    ...sizeStyles[size],
    ...style
  };

  const altText = alt || product?.name || 'Product image';

  return (
    <div className={`product-image-container ${className}`} style={{ position: 'relative' }}>
      {loading && (
        <div 
          style={{
            ...imageStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            color: '#6c757d'
          }}
        >
          Loading...
        </div>
      )}
      
      <img
        src={imageSrc}
        alt={altText}
        className={className}
        style={{
          ...imageStyle,
          opacity: loading ? 0 : 1
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        {...props}
      />
    </div>
  );
};

ProductImage.propTypes = {
  product: PropTypes.object.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'card']),
  alt: PropTypes.string
};

export default ProductImage;