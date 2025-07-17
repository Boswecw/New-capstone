// client/src/components/ProductCard.js - UPDATED with ProxyImage
import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ProxyImage from './ProxyImage';

const ProductCard = ({ product }) => {
  if (!product) {
    return (
      <Card className="h-100 shadow-sm">
        <div className="p-4 text-center text-muted">
          <i className="fas fa-box fa-2x mb-2"></i>
          <p>Product information unavailable</p>
        </div>
      </Card>
    );
  }

  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return `$${price.toFixed(2)}`;
    }
    return 'Price N/A';
  };

  const getCategoryIcon = () => {
    const category = product.category?.toLowerCase() || '';
    const icons = {
      'dog care': 'fas fa-dog',
      'cat care': 'fas fa-cat',
      'grooming': 'fas fa-cut',
      'training': 'fas fa-graduation-cap',
      'aquarium': 'fas fa-fish',
      'food': 'fas fa-utensils',
      'toys': 'fas fa-ball-pile',
      'accessories': 'fas fa-collar'
    };
    
    for (const [key, icon] of Object.entries(icons)) {
      if (category.includes(key)) return icon;
    }
    return 'fas fa-box';
  };

  const categoryIcon = getCategoryIcon();

  return (
    <Card className="h-100 shadow-sm">
      {/* Image Container with Badge Overlays */}
      <div className="position-relative" style={{ height: '250px' }}>
        <ProxyImage
          item={product}
          category="product"
          alt={`${product.name} - ${product.category}`}
          containerStyle={{ height: '100%' }}
          style={{ borderRadius: '0.375rem 0.375rem 0 0' }}
        />
        
        {/* Stock Status Badge */}
        <div className="position-absolute top-0 end-0 p-2">
          {product.inStock ? (
            <Badge bg="success">
              <i className="fas fa-check-circle me-1"></i>
              In Stock
            </Badge>
          ) : (
            <Badge bg="danger">
              <i className="fas fa-times-circle me-1"></i>
              Out of Stock
            </Badge>
          )}
        </div>
        
        {/* Featured Badge */}
        {product.featured && (
          <div className="position-absolute top-0 start-0 p-2">
            <Badge bg="warning" text="dark">
              <i className="fas fa-star me-1"></i>
              Featured
            </Badge>
          </div>
        )}
      </div>

      <Card.Body className="d-flex flex-column">
        {/* Product Name */}
        <Card.Title className="text-primary mb-2 d-flex align-items-center">
          <i className={`${categoryIcon} me-2`}></i>
          {product.name || 'Product'}
        </Card.Title>
        
        {/* Product Details */}
        <div className="mb-2">
          <small className="text-muted d-block">
            <i className="fas fa-tag me-1"></i>
            {product.category || 'General'} {product.brand && `• ${product.brand}`}
          </small>
          
          {product.weight && (
            <small className="text-muted d-block">
              <i className="fas fa-weight me-1"></i>
              {product.weight}
            </small>
          )}
        </div>
        
        {/* Description */}
        <Card.Text className="flex-grow-1 text-muted">
          {product.description 
            ? (product.description.length > 100 
                ? product.description.substring(0, 100) + '...'
                : product.description)
            : 'Quality pet product for your furry friend.'
          }
        </Card.Text>
        
        {/* Price and Action */}
        <div className="mt-auto">
          {/* Price Row */}
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="h5 text-success mb-0">
              {formatPrice(product.price)}
            </span>
            <small className={`text-${product.inStock ? 'success' : 'danger'}`}>
              <i className={`fas fa-${product.inStock ? 'check' : 'times'}-circle me-1`}></i>
              {product.inStock ? 'Available' : 'Out of Stock'}
            </small>
          </div>
          
          {/* Action Button */}
          {product.inStock ? (
            <Link to={`/products/${product._id}`} className="btn btn-primary w-100">
              <i className="fas fa-shopping-cart me-2"></i>
              View Details
            </Link>
          ) : (
            <Button variant="outline-secondary" disabled className="w-100">
              <i className="fas fa-ban me-2"></i>
              Currently Unavailable
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;