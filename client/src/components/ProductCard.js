// client/src/components/ProductCard.js - UPDATED WITH CONSOLIDATED IMAGE UTILITY
import React, { useState } from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getImageUrl, generateAltText } from '../utils/imageUtils';
import styles from './Card.module.css';

const ProductCard = ({ product }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // ✅ FIXED: Use consolidated image utility with proper fallbacks
  const imageSrc = getImageUrl(
    product?.image || product?.imageUrl || product?.photo,
    'product',
    product?.category
  );

  // Generate proper alt text
  const altText = generateAltText(
    product, 
    `${product?.name || 'Product'} - ${product?.category || 'Pet Product'}`
  );

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = (e) => {
    console.warn(`🖼️ Product image failed to load for ${product?.name}:`, imageSrc);
    setImageError(true);
    setImageLoaded(true);
    
    // Set fallback image
    const fallbackSrc = getImageUrl(null, 'product', product?.category);
    if (e.currentTarget.src !== fallbackSrc) {
      e.currentTarget.src = fallbackSrc;
    }
  };

  // Format price display
  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return price.toFixed(2);
    }
    if (typeof price === 'string') {
      const numPrice = parseFloat(price);
      return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
    }
    return '0.00';
  };

  // Stock status configuration
  const getStockInfo = (inStock, quantity = null) => {
    if (inStock === true || inStock === 'true') {
      return { 
        variant: 'success', 
        icon: 'check-circle', 
        text: quantity ? `${quantity} in stock` : 'In Stock' 
      };
    } else if (inStock === false || inStock === 'false') {
      return { variant: 'danger', icon: 'times-circle', text: 'Out of Stock' };
    } else {
      return { variant: 'warning', icon: 'question-circle', text: 'Stock Unknown' };
    }
  };

  const stockInfo = getStockInfo(product?.inStock, product?.quantity);

  return (
    <Card className={`${styles.enhancedCard} h-100`}>
      <div className={`${styles.productImgContainer} ${styles.square}`}>
        <img
          src={imageSrc}
          alt={altText}
          className={`${styles.productImg} ${!imageLoaded ? styles.loading : ''}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        {!imageLoaded && (
          <div className={styles.imageError} aria-live="polite">
            <i className="fas fa-box" aria-hidden="true"></i>
            <span>Loading...</span>
          </div>
        )}
        {imageError && imageLoaded && (
          <div className={styles.imageError} aria-live="polite">
            <i className="fas fa-exclamation-triangle" aria-hidden="true"></i>
            <span>Using fallback image</span>
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
              <i className="fas fa-star me-1" aria-hidden="true"></i>
              Featured
            </Badge>
          )}
          
          <Badge 
            className={styles.enhancedBadge} 
            bg={stockInfo.variant}
          >
            <i className={`fas fa-${stockInfo.icon} me-1`} aria-hidden="true"></i>
            {stockInfo.text}
          </Badge>
        </div>
        
        {/* Product Details */}
        {product?.category && (
          <div className="mb-2">
            <small className="text-muted">
              <i className="fas fa-tag me-1" aria-hidden="true"></i>
              Category: {product.category}
            </small>
          </div>
        )}
        
        {product?.brand && (
          <div className="mb-2">
            <small className="text-muted">
              <i className="fas fa-building me-1" aria-hidden="true"></i>
              Brand: {product.brand}
            </small>
          </div>
        )}

        {product?.weight && (
          <div className="mb-2">
            <small className="text-muted">
              <i className="fas fa-weight me-1" aria-hidden="true"></i>
              Weight: {product.weight}
            </small>
          </div>
        )}

        {product?.size && (
          <div className="mb-2">
            <small className="text-muted">
              <i className="fas fa-ruler me-1" aria-hidden="true"></i>
              Size: {product.size}
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

        {/* Features/Benefits */}
        {product?.features && product.features.length > 0 && (
          <div className="mb-3">
            <small className="text-muted d-block mb-1">Key Features:</small>
            <div className="d-flex flex-wrap gap-1">
              {product.features.slice(0, 2).map((feature, index) => (
                <Badge 
                  key={index} 
                  bg="light" 
                  text="dark" 
                  className="text-capitalize"
                  style={{ fontSize: '0.75rem' }}
                >
                  {feature}
                </Badge>
              ))}
              {product.features.length > 2 && (
                <Badge bg="light" text="muted" style={{ fontSize: '0.75rem' }}>
                  +{product.features.length - 2} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Rating Display */}
        {product?.rating && product.rating > 0 && (
          <div className="mb-3 text-center">
            <small className="text-muted d-block">Customer Rating</small>
            <div className="text-warning">
              {[...Array(5)].map((_, i) => (
                <i 
                  key={i} 
                  className={`${i < Math.floor(product.rating) ? 'fas' : 'far'} fa-star me-1`}
                ></i>
              ))}
              <span className="text-muted ms-1">
                ({product.rating.toFixed(1)})
              </span>
            </div>
          </div>
        )}
        
        {/* Price Section */}
        <div className="text-center mb-3">
          <div className="d-flex justify-content-center align-items-center">
            <span className="text-success fw-bold fs-4">
              ${formatPrice(product?.price)}
            </span>
            {product?.originalPrice && product.originalPrice > product.price && (
              <span className="text-muted text-decoration-line-through ms-2">
                ${formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          {product?.originalPrice && product.originalPrice > product.price && (
            <small className="text-danger">
              Save ${formatPrice(product.originalPrice - product.price)}
            </small>
          )}
        </div>

        {/* Action Buttons */}
        <div className="d-grid gap-2">
          <Link 
            to={`/products/${product?._id}`} 
            className={`btn btn-primary ${styles.enhancedButton}`}
          >
            <i className="fas fa-eye me-2" aria-hidden="true"></i>
            View Details
          </Link>
          
          {(product?.inStock === true || product?.inStock === 'true') && (
            <Button
              variant="success"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Add to cart functionality
                console.log('Add to cart:', product._id);
              }}
            >
              <i className="fas fa-shopping-cart me-2" aria-hidden="true"></i>
              Add to Cart
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;