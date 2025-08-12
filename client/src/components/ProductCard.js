// client/src/components/ProductCard.js
import React, { useState } from 'react';
import { Card, Badge, Button, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import SafeImage from './SafeImage';
import { useCart } from '../contexts/CartContext'; // ✅ added

const ProductCard = ({
  product,
  size = 'medium',
  showFullDescription = false,
  className = '',
  onAddToWishlist,
  showActions = true
}) => {
  const [containerType, setContainerType] = useState('square');
  const { addToCart } = useCart(); // ✅ added

  if (!product) {
    console.warn('⚠️ ProductCard: product prop is undefined or null');
    return (
      <Card className={`h-100 ${className}`}>
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

  // ✅ native add-to-cart handler using CartContext
  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!safeProduct.inStock) return;
    const ok = await addToCart(safeProduct._id, 1);
    if (ok) {
      // optional UX hook (toast/snackbar elsewhere)
      // console.log('Added to cart:', safeProduct.name);
    }
  };

  return (
    <Card
      className={`h-100 shadow-sm ${className}`}
      data-testid={`product-card-${safeProduct._id}`}
      style={{ transition: 'transform 0.2s ease-in-out' }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      {/* Image Container */}
      <div
        style={{ height: '200px', overflow: 'hidden', position: 'relative' }}
        className={containerType}
      >
        <SafeImage
          item={safeProduct}
          category={safeProduct.category}
          size="card"
          showLoader={true}
          className="w-100 h-100"
          style={{ objectFit: 'cover' }}
          onContainerTypeDetected={setContainerType}
        />

        {/* Featured Badge */}
        {safeProduct.featured && (
          <Badge bg="warning" className="position-absolute top-0 start-0 m-2">
            <i className="fas fa-star me-1"></i>
            Featured
          </Badge>
        )}

        {/* Stock Status Badge */}
        <div className="position-absolute top-0 end-0 m-2">
          {safeProduct.inStock ? (
            <Badge bg="success">In Stock</Badge>
          ) : (
            <Badge bg="danger">Out of Stock</Badge>
          )}
        </div>
      </div>

      <Card.Body className="d-flex flex-column">
        {/* Header with name and price */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title
            className="mb-0 flex-grow-1"
            style={{ textAlign: 'left', fontSize: '1.1rem', fontWeight: 600 }}
          >
            {safeProduct.name}
          </Card.Title>
          {safeProduct.price > 0 && (
            <Badge bg="success" className="ms-2 fs-6">
              {formatPrice(safeProduct.price)}
            </Badge>
          )}
        </div>

        {/* Brand and Category */}
        <div className="text-muted small mb-2">
          {safeProduct.brand} • {safeProduct.category}
        </div>

        {/* Description */}
        <Card.Text className="text-muted small mb-2 flex-grow-1">
          {showFullDescription
            ? safeProduct.description
            : (typeof safeProduct.description === 'string' && safeProduct.description.length > 100
              ? `${safeProduct.description.substring(0, 100)}...`
              : safeProduct.description)}
        </Card.Text>

        {/* Badges */}
        <div className="mb-2">
          {safeProduct.category && (
            <Badge bg="info" className="me-1">
              {safeProduct.category}
            </Badge>
          )}
          {safeProduct.brand && safeProduct.brand !== 'Generic' && (
            <Badge bg="secondary" className="me-1">
              {safeProduct.brand}
            </Badge>
          )}
          {!safeProduct.inStock && <Badge bg="danger">Out of Stock</Badge>}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <Row className="g-2 mt-auto">
            <Col>
              <Button
                as={Link}
                to={`/products/${safeProduct._id}`}
                variant="outline-primary"
                size="sm"
                className="w-100"
              >
                <i className="fas fa-info-circle me-1"></i>
                Details
              </Button>
            </Col>
            <Col>
              {/* ✅ uses CartContext */}
              <Button
                variant={safeProduct.inStock ? "primary" : "secondary"}
                size="sm"
                className="w-100"
                onClick={handleAddToCart}
                disabled={!safeProduct.inStock}
                title={!safeProduct.inStock ? 'Out of Stock' : 'Add to Cart'}
              >
                <i className="fas fa-shopping-cart me-1"></i>
                {safeProduct.inStock ? 'Add to Cart' : 'Out of Stock'}
              </Button>

            </Col>
            <Col xs="auto">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => onAddToWishlist && onAddToWishlist(safeProduct)}
                title="Add to Wishlist"
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
  onAddToWishlist: PropTypes.func,
  showActions: PropTypes.bool
};

export default ProductCard;
