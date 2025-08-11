import React, { useState } from 'react';
import { Card, Badge, Button, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import SafeImage from './SafeImage';
import styles from './Card.module.css';

const ProductCard = ({ 
  product, 
  size = 'medium', 
  showFullDescription = false,
  className = '',
  onAddToCart,
  onAddToWishlist,
  showActions = true
}) => {
  const [containerType, setContainerType] = useState('square');

  if (!product) {
    console.warn('⚠️ ProductCard: product prop is undefined or null');
    return (
      <Card className={`h-100 ${styles.enhancedCard} ${className}`}>
        <Card.Body className="d-flex align-items-center justify-content-center">
          <div className="text-center text-muted">
            <i className="fas fa-exclamation-triangle fa-2x mb-2"></i>
            <div>Product data unavailable</div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  const safeProduct = {
    ...product,
    _id: product?._id ?? 'unknown',
    name: product?.name ?? 'Unknown Product',
    description: product?.description ?? 'Quality product for your beloved pet!',
    price: product?.price ?? 0,
    category: product?.category ?? 'product',
    brand: product?.brand ?? '',
    inStock: product?.inStock !== false
  };

  const formatPrice = (price) =>
    typeof price === 'number' ? `$${price.toFixed(2)}` : (price ? String(price) : 'Price unavailable');

  return (
    <Card className={`h-100 ${styles.enhancedCard} ${className}`} data-testid={`product-card-${safeProduct._id}`}>
      <div className={`${styles.productImgContainer} ${styles[containerType]}`}>
        <SafeImage
          item={safeProduct}
          category={safeProduct.category}
          size="card"
          showLoader={true}
          className={styles.productImg}
          onContainerTypeDetected={setContainerType}
        />
      </div>

      <Card.Body className={`d-flex flex-column ${styles.enhancedCardBody}`}>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className={`mb-0 ${styles.enhancedCardTitle}`} style={{ textAlign: 'left', flex: 1 }}>
            {safeProduct.name}
          </Card.Title>
          {safeProduct.price && (
            <Badge bg="success" className={`ms-2 ${styles.enhancedBadge}`}>
              {formatPrice(safeProduct.price)}
            </Badge>
          )}
        </div>

        <Card.Text className={`text-muted small mb-2 flex-grow-1 ${styles.enhancedCardText}`}>
          {showFullDescription
            ? safeProduct.description
            : (typeof safeProduct.description === 'string' && safeProduct.description.length > 100
              ? safeProduct.description.substring(0, 100) + '...'
              : safeProduct.description)}
        </Card.Text>

        <div className={styles.enhancedBadges}>
          {safeProduct.category && (
            <Badge bg="info" className={styles.enhancedBadge}>
              {safeProduct.category}
            </Badge>
          )}
          {safeProduct.brand && (
            <Badge bg="secondary" className={styles.enhancedBadge}>
              {safeProduct.brand}
            </Badge>
          )}
          {!safeProduct.inStock && (
            <Badge bg="danger" className={styles.enhancedBadge}>
              Out of Stock
            </Badge>
          )}
        </div>

        {showActions && (
          <Row className="g-2 mt-auto">
            <Col>
              <Button
                as={Link}
                to={`/products/${safeProduct._id}`}
                variant="outline-primary"
                size="sm"
                className={`w-100 ${styles.enhancedButton}`}
              >
                <i className="fas fa-info-circle me-1"></i>
                Details
              </Button>
            </Col>
            <Col>
              <Button
                variant="warning"
                size="sm"
                className={`w-100 ${styles.enhancedButton}`}
                onClick={() => onAddToCart && onAddToCart(safeProduct)}
                disabled={!safeProduct.inStock}
                title={!safeProduct.inStock ? 'Out of Stock' : ''}
              >
                <i className="fas fa-shopping-cart me-1"></i>
                Add to Cart
              </Button>
            </Col>
            <Col xs="auto">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => onAddToWishlist && onAddToWishlist(safeProduct)}
              >
                <i className="fas fa-heart"></i>
              </Button>
            </Col>
          </Row>
        )}
      </Card.Body>
    </Card>
  );
};

ProductCard.propTypes = {
  product: PropTypes.object.isRequired,
  size: PropTypes.string,
  showFullDescription: PropTypes.bool,
  className: PropTypes.string,
  onAddToCart: PropTypes.func,
  onAddToWishlist: PropTypes.func,
  showActions: PropTypes.bool
};

export default ProductCard;
