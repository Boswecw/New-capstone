// client/src/components/ProductCard.js - UPDATED WITH SAFEIMAGE INTEGRATION
import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import SafeImage from './SafeImage';

const ProductCard = ({ product, priority = false }) => {
  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return `$${price.toFixed(2)}`;
    }
    return 'Price N/A';
  };

  const handleImageLoad = () => {
    console.log('✅ ProductCard image loaded:', product.name);
  };

  const handleImageError = () => {
    console.log('❌ ProductCard image failed:', product.name);
  };

  return (
    <Card className="h-100 product-card shadow-sm">
      <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
        <SafeImage
          src={product.imageUrl || product.image}
          alt={`${product.name} - ${product.category || 'Product'}`}
          type="product"
          fallbackText={product.name || "Product"}
          loading={priority ? "eager" : "lazy"}
          style={{ 
            height: '200px', 
            width: '100%',
            objectFit: 'cover'
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>
      
      <Card.Body className="d-flex flex-column">
        <Card.Title className="text-truncate" title={product.name}>
          {product.name}
        </Card.Title>
        
        <Card.Text className="text-muted small mb-2">
          {product.category && product.brand 
            ? `${product.category} • ${product.brand}`
            : product.category || product.brand || 'Pet Product'
          }
        </Card.Text>
        
        <Card.Text className="fw-bold text-primary fs-5 mb-3">
          {formatPrice(product.price)}
        </Card.Text>
        
        {product.description && (
          <Card.Text className="text-muted small mb-3" style={{ 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {product.description}
          </Card.Text>
        )}
        
        <div className="mt-auto">
          {product.inStock === false && (
            <div className="text-danger small mb-2">
              <i className="fas fa-exclamation-triangle me-1"></i>
              Out of Stock
            </div>
          )}
          
          <Button 
            variant={product.inStock === false ? "secondary" : "primary"}
            className="w-100"
            as={Link}
            to={`/products/${product._id}`}
            disabled={product.inStock === false}
          >
            {product.inStock === false ? 'Out of Stock' : 'View Details'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;