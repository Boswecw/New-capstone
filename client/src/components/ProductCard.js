// client/src/components/ProductCard.js
import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { FaStar, FaShoppingCart } from 'react-icons/fa';
import { getProductImageUrl, FALLBACK_IMAGES } from '../config/imageConfig';

const ProductCard = ({ product, onAddToCart, onClick }) => {
  // Get the correct image URL using our hardcoded mapping
  const imageUrl = getProductImageUrl(product.image);
  const fallbackUrl = FALLBACK_IMAGES.product;

  const handleImageError = (e) => {
    if (e.target.src !== fallbackUrl) {
      e.target.src = fallbackUrl;
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation(); // Prevent card click when clicking add to cart
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(product);
    }
  };

  return (
    <Card 
      className="h-100 shadow-sm product-card" 
      onClick={handleCardClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="position-relative">
        <Card.Img
          variant="top"
          src={imageUrl}
          alt={product.name}
          onError={handleImageError}
          style={{
            height: '200px',
            objectFit: 'cover',
            objectPosition: 'center'
          }}
        />
        {product.featured && (
          <Badge 
            bg="primary"
            className="position-absolute top-0 start-0 m-2"
          >
            Featured
          </Badge>
        )}
        {!product.inStock && (
          <Badge 
            bg="danger"
            className="position-absolute top-0 end-0 m-2"
          >
            Out of Stock
          </Badge>
        )}
      </div>

      <Card.Body className="d-flex flex-column">
        <Card.Title className="mb-2 text-truncate">
          {product.name}
        </Card.Title>

        <div className="mb-2">
          <small className="text-muted">
            {product.category} • {product.brand}
          </small>
        </div>

        <Card.Text className="text-muted small flex-grow-1">
          {product.description}
        </Card.Text>

        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="fw-bold text-success fs-5">
              ${product.price.toFixed(2)}
            </div>
            <div className="d-flex align-items-center">
              <FaStar className="text-warning me-1" />
              <small className="text-muted">4.5</small>
            </div>
          </div>

          <Button
            variant={product.inStock ? "primary" : "secondary"}
            size="sm"
            className="w-100"
            onClick={handleAddToCart}
            disabled={!product.inStock}
          >
            <FaShoppingCart className="me-1" />
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;