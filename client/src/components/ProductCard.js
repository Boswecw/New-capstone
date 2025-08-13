// client/src/components/ProductCard.js
import React, { useState } from 'react';
import { Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { normalizeImageUrl } from '../utils/image';
import styles from './Card.module.css';

const ProductCard = ({ product }) => {
  const [containerType, setContainerType] = useState('square');
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const imageSrc = normalizeImageUrl(product?.image || product?.imageUrl) || 
                   'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop&q=80';

  const handleImageLoad = (e) => {
    const img = e.target;
    if (img.naturalWidth && img.naturalHeight) {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      
      let detectedType = 'square';
      if (aspectRatio > 1.5) {
        detectedType = 'landscape';
      } else if (aspectRatio < 0.6) {
        detectedType = 'tall';
      } else if (aspectRatio < 0.8) {
        detectedType = 'portrait';
      }
      
      setContainerType(detectedType);
      console.log(`🛍️ Product "${product?.name}" - Aspect ratio: ${aspectRatio.toFixed(2)}, Container: ${detectedType}`);
    }
    setImageLoaded(true);
  };

  const handleImageError = (e) => {
    e.currentTarget.src = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop&q=80';
    setImageLoaded(true);
  };

  return (
    <Card className={`${styles.enhancedCard} h-100`}>
      <div className={`${styles.productImgContainer} ${styles[containerType]}`}>
        <img
          src={imageSrc}
          alt={product?.name || product?.title || 'Product'}
          className={`${styles.productImg} ${!imageLoaded ? styles.loading : ''}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        {!imageLoaded && (
          <div className={styles.imageError}>
            <i className="fas fa-box"></i>
            <span>Loading...</span>
          </div>
        )}
      </div>
      
      <Card.Body className={styles.enhancedCardBody}>
        <Card.Title className={styles.enhancedCardTitle}>
          {product?.name || product?.title || 'Unnamed Product'}
        </Card.Title>
        
        <div className={styles.enhancedBadges}>
          <Badge className={styles.enhancedBadge} bg="info">
            {product?.category || 'Product'}
          </Badge>
          {product?.brand && (
            <Badge className={styles.enhancedBadge} bg="secondary">
              {product.brand}
            </Badge>
          )}
          {product?.featured && (
            <Badge className={styles.enhancedBadge} bg="warning" text="dark">
              <i className="fas fa-star me-1"></i>Featured
            </Badge>
          )}
          {product?.inStock !== undefined && (
            <Badge 
              className={styles.enhancedBadge} 
              bg={product.inStock ? 'success' : 'danger'}
            >
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </Badge>
          )}
        </div>
        
        {product?.category && (
          <div className="mb-2">
            <small className="text-muted">
              <i className="fas fa-tag me-1"></i>
              Category: {product.category}
            </small>
          </div>
        )}
        
        {product?.brand && (
          <div className="mb-2">
            <small className="text-muted">
              <i className="fas fa-building me-1"></i>
              Brand: {product.brand}
            </small>
          </div>
        )}
        
        {product?.description && (
          <Card.Text className={styles.enhancedCardText}>
            {product.description.length > 100 
              ? `${product.description.substring(0, 100)}...` 
              : product.description}
          </Card.Text>
        )}
        
        <div className="text-center mb-3">
          <span className="text-success fw-bold fs-4">
            ${product?.price || '0.00'}
          </span>
        </div>
        
        <Link 
          to={`/products/${product?._id}`} 
          className={`btn btn-success ${styles.enhancedButton} w-100`}
        >
          <i className="fas fa-shopping-cart me-2"></i>
          View Details
        </Link>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;