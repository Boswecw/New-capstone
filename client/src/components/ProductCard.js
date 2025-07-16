// client/src/components/ProductCard.js - UPDATED VERSION
import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import SafeImage from './SafeImage';
import { getCardImageProps } from '../utils/imageUtils';

const ProductCard = ({ product }) => {
  const imageProps = getCardImageProps(product, 'medium');

  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return `$${price.toFixed(2)}`;
    }
    return 'N/A';
  };

  return (
    <Card className="h-100 shadow-sm">
      <div className="position-relative" style={{ height: '250px', overflow: 'hidden' }}>
        <SafeImage
          src={imageProps.src}
          alt={imageProps.alt}
          className="w-100 h-100"
          style={{ objectFit: 'cover' }}
          showSpinner={true}
        />
        
        {/* Badges */}
        <div className="position-absolute top-0 end-0 p-2">
          {product.featured && (
            <Badge bg="warning">
              <i className="fas fa-star"></i> Featured
            </Badge>
          )}
          {!product.inStock && (
            <Badge bg="danger">
              <i className="fas fa-exclamation-triangle"></i> Out of Stock
            </Badge>
          )}
        </div>
      </div>

      <Card.Body className="d-flex flex-column">
        <Card.Title className="text-primary mb-2">
          <i className="fas fa-shopping-cart me-1"></i>
          {product.name || 'Product'}
        </Card.Title>
        
        <div className="mb-2">
          <small className="text-muted">
            <i className="fas fa-tag me-1"></i>
            {product.category} • {product.brand}
          </small>
        </div>
        
        <Card.Text className="flex-grow-1">
          {product.description 
            ? product.description.substring(0, 100) + (product.description.length > 100 ? '...' : '')
            : 'Quality pet product for your furry friend.'
          }
        </Card.Text>
        
        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="h5 text-success mb-0">
              {formatPrice(product.price)}
            </span>
            <small className={`text-${product.inStock ? 'success' : 'danger'}`}>
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </small>
          </div>
          
          <Link to={`/products/${product._id}`} className="btn btn-primary w-100">
            <i className="fas fa-eye me-1"></i>
            View Details
          </Link>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;