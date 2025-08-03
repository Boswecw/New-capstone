import React, { useState } from 'react'; // 🆕 Add useState for container state
import { Card, Badge, Button, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import SafeImage from './SafeImage';
import styles from './Card.module.css'; // ✅ Import enhanced CSS module

const ProductCard = ({ 
  product, 
  size = 'medium', 
  showFullDescription = false,
  className = '',
  onAddToCart,
  onAddToWishlist,
  showActions = true
}) => {
  // 🆕 NEW: State to track what type of container to use
  const [containerType, setContainerType] = useState('square');

  // Format price
  const formatPrice = (price) => {
    return typeof price === 'number' ? 
      `${price.toFixed(2)}` : 
      (price ? String(price) : 'Price unavailable');
  };

  return (
    <Card className={`h-100 shadow-sm product-card ${styles.enhancedCard} ${className}`}>
      {/* 🆕 ENHANCED: Dynamic container that adapts to image aspect ratio */}
      <div className={`${styles.productImgContainer} ${styles[containerType]}`}>
        <SafeImage
          item={product}
          category={product.category || 'product'}
          size="card"
          showLoader={true}
          className={styles.productImg}
          onContainerTypeDetected={setContainerType} // 🆕 NEW: Tell SafeImage to update our container
        />
      </div>
      
      <Card.Body className={`d-flex flex-column ${styles.enhancedCardBody}`}>
        {/* Product Name & Price */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className={`mb-0 ${styles.enhancedCardTitle}`} style={{ textAlign: 'left', flex: 1 }}>
            {product.name}
          </Card.Title>
          {product.price && (
            <Badge bg="success" className={`ms-2 ${styles.enhancedBadge}`}>
              {formatPrice(product.price)}
            </Badge>
          )}
        </div>
        
        {/* Product Description */}
        <Card.Text className={`text-muted small mb-2 flex-grow-1 ${styles.enhancedCardText}`}>
          {showFullDescription 
            ? (product.description || 'Quality product for your beloved pet!')
            : (product.description || 'Quality product for your beloved pet!').length > 100 
              ? (product.description || 'Quality product for your beloved pet!').substring(0, 100) + '...'
              : (product.description || 'Quality product for your beloved pet!')
          }
        </Card.Text>
        
        {/* Product Categories/Tags */}
        {(product.category || product.brand) && (
          <div className={styles.enhancedBadges}>
            {product.category && (
              <Badge bg="primary" className={styles.enhancedBadge}>
                {product.category}
              </Badge>
            )}
            {product.brand && (
              <Badge bg="secondary" className={styles.enhancedBadge}>
                {product.brand}
              </Badge>
            )}
            {product.inStock === false && (
              <Badge bg="warning" className={styles.enhancedBadge}>
                Out of Stock
              </Badge>
            )}
          </div>
        )}
        
        {/* Action Buttons */}
        {showActions && (
          <div className="mt-auto">
            <Row className="g-2">
              <Col>
                <Button
                  as={Link}
                  to={`/products/${product._id}`}
                  variant="outline-primary"
                  className={`w-100 ${styles.enhancedButton}`}
                  style={{ background: 'transparent', color: '#0d6efd' }}
                >
                  Details
                </Button>
              </Col>
              {onAddToCart && (
                <Col>
                  <Button
                    onClick={() => onAddToCart(product)}
                    variant="primary"
                    className={`w-100 ${styles.enhancedButton}`}
                  >
                    <i className="fas fa-cart-plus me-1"></i>
                    Cart
                  </Button>
                </Col>
              )}
            </Row>
            
            {/* Wishlist Button */}
            {onAddToWishlist && (
              <Button
                onClick={() => onAddToWishlist(product)}
                variant="outline-secondary"
                size="sm"
                className={`mt-2 w-100 ${styles.enhancedButton}`}
                style={{ borderRadius: '20px' }}
              >
                <i className="fas fa-heart me-1"></i>
                Wishlist
              </Button>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

ProductCard.propTypes = {
  product: PropTypes.object.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  showFullDescription: PropTypes.bool,
  className: PropTypes.string,
  onAddToCart: PropTypes.func,
  onAddToWishlist: PropTypes.func,
  showActions: PropTypes.bool
};

export default ProductCard;