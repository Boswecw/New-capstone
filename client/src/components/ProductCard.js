// client/src/components/ProductCard.js - UPDATED WITH SAFEIMAGE

import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import SafeImage from './SafeImage'; // ← Changed from ProxyImage to SafeImage
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

  const categoryIcon = getCategoryIcon();
  const stockStatus = getStockStatus();
  const isAvailable = product.inStock !== false;

  return (
    <Card className={`${styles.card} ${className} h-100`}>
      {/* Image Container with SafeImage */}
      <div className={styles.productImgContainer}>
        <SafeImage
          item={product}
          category="product"
          alt={product.name}
          className={styles.productImg}
          showSpinner={true}
          onLoad={() => console.log(`✅ Product image loaded for: ${product.name}`)}
          onError={() => console.log(`❌ Product image failed for: ${product.name}`)}
        />
        
        {/* Stock Badge */}
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
            <div className="row g-2 mb-2">
              <div className="col-6">
                <small className="text-muted d-block">Price</small>
                <strong className="text-primary h5 mb-0">{formatPrice(product.price)}</strong>
              </div>
              <div className="col-6">
                <small className="text-muted d-block">Stock</small>
                <strong className="text-dark">
                  {product.stock || 'Available'}
                </strong>
              </div>
            </div>

            {product.description && (
              <Card.Text className={styles.cardText}>
                {product.description.length > 100 
                  ? `${product.description.substring(0, 100)}...` 
                  : product.description}
              </Card.Text>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-auto">
            <Link 
              to={`/products/${product._id}`}
              className={`btn ${isAvailable ? 'btn-primary' : 'btn-outline-secondary'} w-100`}
            >
              {isAvailable ? (
                <>
                  <i className="fas fa-shopping-cart me-2"></i>
                  View Product
                </>
              ) : (
                <>
                  <i className="fas fa-info-circle me-2"></i>
                  Out of Stock
                </>
              )}
            </Link>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;