// client/src/components/ProductCard.js - Updated for perfect image sizing

import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ProxyImage from './ProxyImage';
import styles from './Card.module.css';

const ProductCard = ({ product, className = "" }) => {
  if (!product) {
    return (
      <Card className={`${styles.card} ${className} h-100`}>
        <div className={styles.cardImgContainer}>
          <div className="text-center text-muted p-4">
            <i className="fas fa-box fa-2x mb-2" style={{ color: '#dee2e6' }}></i>
            <p className="mb-0">Product information unavailable</p>
          </div>
        </div>
        <Card.Body className={styles.cardBody}>
          <Card.Title className={styles.cardTitle}>Product Not Found</Card.Title>
          <Card.Text className={styles.cardText}>
            This product's information is currently unavailable.
          </Card.Text>
        </Card.Body>
      </Card>
    );
  }

  // Format price
  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return `$${price.toFixed(2)}`;
    }
    if (typeof price === 'string' && !isNaN(parseFloat(price))) {
      return `$${parseFloat(price).toFixed(2)}`;
    }
    return 'Price N/A';
  };

  // Get category icon
  const getCategoryIcon = () => {
    const category = product.category?.toLowerCase() || '';
    const icons = {
      'dog care': 'fas fa-dog',
      'dog food': 'fas fa-dog',
      'cat care': 'fas fa-cat',
      'cat food': 'fas fa-cat',
      'grooming': 'fas fa-cut',
      'training': 'fas fa-graduation-cap',
      'aquarium': 'fas fa-fish',
      'food': 'fas fa-utensils',
      'treats': 'fas fa-cookie',
      'toys': 'fas fa-ball-pile',
      'toy': 'fas fa-ball-pile',
      'accessories': 'fas fa-collar',
      'health': 'fas fa-heartbeat',
      'supplies': 'fas fa-box',
      'bedding': 'fas fa-bed',
      'carriers': 'fas fa-suitcase',
      'leashes': 'fas fa-link',
      'collars': 'fas fa-circle'
    };
    
    for (const [key, icon] of Object.entries(icons)) {
      if (category.includes(key)) return icon;
    }
    return 'fas fa-box';
  };

  // Get stock status
  const getStockStatus = () => {
    if (product.inStock === false) {
      return { 
        text: 'Out of Stock', 
        variant: 'danger',
        className: styles.statusBadge + ' ' + styles.unavailable
      };
    }
    
    if (product.stock) {
      if (product.stock <= 5) {
        return { 
          text: 'Low Stock', 
          variant: 'warning',
          className: styles.statusBadge + ' ' + styles.pending
        };
      }
      return { 
        text: 'In Stock', 
        variant: 'success',
        className: styles.statusBadge + ' ' + styles.available
      };
    }
    
    return { 
      text: 'Available', 
      variant: 'success',
      className: styles.statusBadge + ' ' + styles.available
    };
  };

  // Get rating stars
  const renderRating = (rating = 0) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<i key={i} className="fas fa-star text-warning"></i>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<i key={i} className="fas fa-star-half-alt text-warning"></i>);
      } else {
        stars.push(<i key={i} className="far fa-star text-muted"></i>);
      }
    }
    
    return stars;
  };

  const stockStatus = getStockStatus();
  const categoryIcon = getCategoryIcon();
  const isInStock = product.inStock !== false;

  return (
    <Card className={`${styles.card} ${className} h-100`}>
      {/* Enhanced Image Container for Products */}
      <div className={styles.productImgContainer}>
        <ProxyImage
          item={product}
          category={product.category?.toLowerCase() || 'product'}
          alt={`${product.name} - ${product.category}`}
          size="card-md"
          className={`${styles.productImg} ${styles.contain}`} // Use contain for products
          containerStyle={{ 
            width: '100%', 
            height: '100%'
          }}
          priority={false}
          lazy={true}
          fallbackType="unsplash"
        />
        
        {/* Stock Status Badge */}
        <div className={stockStatus.className}>
          {stockStatus.text}
        </div>
        
        {/* Category Icon */}
        <div className="position-absolute bottom-0 start-0 p-2">
          <div 
            className="d-flex align-items-center justify-content-center"
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '50%',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              border: '1px solid rgba(255,255,255,0.8)'
            }}
          >
            <i className={`${categoryIcon} text-primary`} style={{ fontSize: '14px' }}></i>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <Card.Body className={styles.cardBody}>
        <div className="d-flex flex-column h-100">
          {/* Header */}
          <div className="mb-2">
            <Card.Title className={styles.cardTitle}>
              {product.name}
            </Card.Title>
            {product.category && (
              <Card.Subtitle className={`${styles.cardSubtitle} text-muted`}>
                {product.category}
              </Card.Subtitle>
            )}
          </div>

          {/* Product Details */}
          <div className="mb-3 flex-grow-1">
            {/* Price and Rating */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <div className="h5 mb-0 text-primary fw-bold">
                  {formatPrice(product.price)}
                </div>
                {product.originalPrice && product.originalPrice > product.price && (
                  <small className="text-muted text-decoration-line-through">
                    {formatPrice(product.originalPrice)}
                  </small>
                )}
              </div>
              
              {product.rating && (
                <div className="d-flex align-items-center">
                  <div className="me-1">
                    {renderRating(product.rating)}
                  </div>
                  <small className="text-muted">
                    ({product.reviewCount || 0})
                  </small>
                </div>
              )}
            </div>
            
            {/* Description */}
            {product.description && (
              <Card.Text className={styles.cardText}>
                {product.description}
              </Card.Text>
            )}

            {/* Additional Info */}
            {product.brand && (
              <div className="mb-2">
                <small className="text-muted">Brand: </small>
                <strong className="text-dark">{product.brand}</strong>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-auto">
            <div className="d-grid gap-2">
              <Link 
                to={`/products/${product._id}`} 
                className="btn btn-outline-primary"
                style={{
                  borderRadius: '8px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="fas fa-eye me-2"></i>
                View Details
              </Link>
              
              {isInStock && (
                <Button 
                  variant="primary"
                  size="sm"
                  style={{
                    borderRadius: '8px',
                    fontWeight: '500'
                  }}
                  onClick={() => {
                    // Add to cart functionality
                    console.log('Add to cart:', product.name);
                  }}
                >
                  <i className="fas fa-shopping-cart me-2"></i>
                  Add to Cart
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;