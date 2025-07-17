// client/src/components/ProductCard.js - Updated with optimized image handling

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
  const getRatingStars = (rating) => {
    if (!rating) return null;
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <i key={i} className="fas fa-star text-warning"></i>
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <i key="half" className="fas fa-star-half-alt text-warning"></i>
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <i key={`empty-${i}`} className="far fa-star text-muted"></i>
      );
    }
    
    return stars;
  };

  const categoryIcon = getCategoryIcon();
  const stockStatus = getStockStatus();
  const isAvailable = product.inStock !== false;
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <Card className={`${styles.card} ${className} h-100`}>
      {/* Image Container with Badges */}
      <div className={styles.productImgContainer}>
        <ProxyImage
          item={product}
          category="product"
          alt={`${product.name} - ${product.category}`}
          size="card-md"
          className={styles.productImg}
          containerStyle={{ 
            width: '100%', 
            height: '100%',
            borderRadius: '0'
          }}
          priority={false}
          lazy={true}
        />
        
        {/* Stock Status Badge */}
        <div className={stockStatus.className}>
          {stockStatus.text}
        </div>
        
        {/* Discount Badge */}
        {hasDiscount && (
          <div className="position-absolute top-0 start-0 m-2">
            <Badge bg="danger" className="px-2 py-1">
              <i className="fas fa-tag me-1"></i>
              Sale
            </Badge>
          </div>
        )}
        
        {/* Category Icon */}
        <div className="position-absolute bottom-0 start-0 p-2">
          <div 
            className="d-flex align-items-center justify-content-center"
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '50%',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
            {product.brand && (
              <Card.Subtitle className={`${styles.cardSubtitle} text-muted`}>
                by {product.brand}
              </Card.Subtitle>
            )}
          </div>

          {/* Product Details */}
          <div className="mb-3 flex-grow-1">
            {/* Category */}
            {product.category && (
              <div className="mb-2">
                <small className="text-muted d-block">Category</small>
                <strong className="text-dark">{product.category}</strong>
              </div>
            )}

            {/* Rating */}
            {product.rating && (
              <div className="mb-2">
                <div className="d-flex align-items-center gap-1">
                  <div className="d-flex">
                    {getRatingStars(product.rating)}
                  </div>
                  <small className="text-muted">
                    ({product.rating.toFixed(1)})
                    {product.reviewCount && ` · ${product.reviewCount} reviews`}
                  </small>
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <Card.Text className={styles.cardText}>
                {product.description}
              </Card.Text>
            )}

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className="mb-2">
                <small className="text-muted d-block mb-1">Features</small>
                <div className="d-flex flex-wrap gap-1">
                  {product.features.slice(0, 3).map((feature, index) => (
                    <Badge key={index} bg="light" text="dark" className="small">
                      {feature}
                    </Badge>
                  ))}
                  {product.features.length > 3 && (
                    <Badge bg="light" text="muted" className="small">
                      +{product.features.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Size/Weight */}
            {(product.size || product.weight) && (
              <div className="mb-2">
                <small className="text-muted d-block">
                  {product.size && product.weight ? 'Size & Weight' : 
                   product.size ? 'Size' : 'Weight'}
                </small>
                <strong className="text-dark">
                  {[product.size, product.weight].filter(Boolean).join(' · ')}
                </strong>
              </div>
            )}
          </div>

          {/* Price and Actions */}
          <div className={styles.cardFooter}>
            <div className="d-flex justify-content-between align-items-center w-100">
              {/* Price */}
              <div>
                <div className="d-flex align-items-center gap-2">
                  <span className="h5 mb-0 text-primary fw-bold">
                    {formatPrice(product.price)}
                  </span>
                  {hasDiscount && (
                    <span className="text-muted text-decoration-line-through small">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
                {product.stock && (
                  <small className="text-muted">
                    {product.stock} in stock
                  </small>
                )}
              </div>
              
              {/* Actions */}
              <div className="d-flex gap-2">
                <Link
                  to={`/products/${product._id}`}
                  className={`${styles.cardButton} ${styles.secondary}`}
                  style={{ textDecoration: 'none' }}
                >
                  <i className="fas fa-info-circle me-1"></i>
                  Details
                </Link>
                
                {isAvailable && (
                  <Button
                    variant="primary"
                    size="sm"
                    className={styles.cardButton}
                    onClick={() => {
                      // Add to cart functionality
                      console.log('Add to cart:', product._id);
                    }}
                  >
                    <i className="fas fa-shopping-cart me-1"></i>
                    Add to Cart
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;