// client/src/components/ProductCard.js - Reusable product card component using SafeImage
import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import SafeImage from './SafeImage';

const ProductCard = ({ 
  product, 
  size = 'medium', 
  showFullDescription = false,
  className = '',
  onAddToCart,
  onAddToWishlist,
  showActions = true
}) => {
  // Format price
  const formatPrice = (price) => {
    return typeof price === 'number' ? `$${price.toFixed(2)}` : 'Price N/A';
  };

  // Get stock status
  const getStockStatus = () => {
    if (product.inStock === false) {
      return { variant: 'danger', text: 'Out of Stock', icon: 'times-circle' };
    } else if (product.lowStock) {
      return { variant: 'warning', text: 'Low Stock', icon: 'exclamation-triangle' };
    } else {
      return { variant: 'success', text: 'In Stock', icon: 'check-circle' };
    }
  };

  // Handle add to cart
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart && product.inStock !== false) {
      onAddToCart(product);
    }
  };

  // Handle add to wishlist
  const handleAddToWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToWishlist) {
      onAddToWishlist(product);
    }
  };

  const stockStatus = getStockStatus();

  return (
    <Card className={`h-100 shadow-sm product-card ${className}`}>
      {/* Product Image */}
      <div className="position-relative">
        <SafeImage
          item={product}
          category="product"
          size={size}
          className="card-img-top"
          showLoader={true}
        />
        
        {/* Featured/Sale Badges */}
        <div className="position-absolute top-0 start-0 p-2">
          {product.featured && (
            <Badge bg="warning" className="me-1">
              <i className="fas fa-star me-1"></i>
              Featured
            </Badge>
          )}
          {product.onSale && (
            <Badge bg="danger">
              <i className="fas fa-percent me-1"></i>
              Sale
            </Badge>
          )}
        </div>

        {/* Quick Actions (Wishlist) */}
        {showActions && (
          <div className="position-absolute top-0 end-0 p-2">
            <Button
              variant="light"
              size="sm"
              className="rounded-circle"
              onClick={handleAddToWishlist}
              style={{ width: '36px', height: '36px' }}
            >
              <i className="fas fa-heart text-muted"></i>
            </Button>
          </div>
        )}
      </div>
      
      <Card.Body className="d-flex flex-column">
        {/* Product Title */}
        <Card.Title className="h6 mb-2">
          <Link 
            to={`/products/${product._id}`} 
            className="text-decoration-none text-dark"
          >
            {product.name}
          </Link>
        </Card.Title>
        
        {/* Product Description */}
        <Card.Text className="text-muted small mb-2 flex-grow-1">
          {showFullDescription 
            ? (product.description || 'No description available')
            : (product.description && product.description.length > 100
                ? `${product.description.substring(0, 100)}...`
                : product.description || 'No description available'
              )
          }
        </Card.Text>
        
        {/* Category and Brand */}
        <div className="mb-2">
          {product.category && (
            <Badge bg="secondary" className="me-2">
              <i className="fas fa-tag me-1"></i>
              {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
            </Badge>
          )}
          {product.brand && (
            <Badge bg="info">
              <i className="fas fa-building me-1"></i>
              {product.brand}
            </Badge>
          )}
        </div>

        {/* Rating */}
        {product.rating && (
          <div className="mb-2">
            <div className="d-flex align-items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <i 
                  key={star}
                  className={`fas fa-star ${
                    star <= (product.rating.average || 0) 
                      ? 'text-warning' 
                      : 'text-muted opacity-25'
                  }`}
                  style={{ fontSize: '0.8rem' }}
                ></i>
              ))}
              <small className="text-muted ms-2">
                ({product.rating.count || 0})
              </small>
            </div>
          </div>
        )}

        {/* Price and Stock Status */}
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div>
            {product.originalPrice && product.originalPrice > product.price ? (
              <>
                <span className="h6 text-primary mb-0">
                  {formatPrice(product.price)}
                </span>
                <small className="text-muted text-decoration-line-through ms-2">
                  {formatPrice(product.originalPrice)}
                </small>
              </>
            ) : (
              <span className="h6 text-primary mb-0">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          
          <Badge bg={stockStatus.variant}>
            <i className={`fas fa-${stockStatus.icon} me-1`}></i>
            {stockStatus.text}
          </Badge>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="mt-auto">
            <div className="d-grid gap-2">
              <Button
                variant={product.inStock === false ? "outline-secondary" : "primary"}
                size="sm"
                onClick={handleAddToCart}
                disabled={product.inStock === false}
              >
                {product.inStock === false ? (
                  <>
                    <i className="fas fa-times me-2"></i>
                    Out of Stock
                  </>
                ) : (
                  <>
                    <i className="fas fa-shopping-cart me-2"></i>
                    Add to Cart
                  </>
                )}
              </Button>
              
              <Button
                as={Link}
                to={`/products/${product._id}`}
                variant="outline-primary"
                size="sm"
              >
                <i className="fas fa-info-circle me-2"></i>
                View Details
              </Button>
            </div>
          </div>
        )}

        {/* Additional Info */}
        {(product.views || product.sales) && (
          <div className="mt-2 pt-2 border-top">
            <div className="d-flex justify-content-between">
              {product.views && (
                <small className="text-muted">
                  <i className="fas fa-eye me-1"></i>
                  {product.views} views
                </small>
              )}
              {product.sales && (
                <small className="text-muted">
                  <i className="fas fa-shopping-bag me-1"></i>
                  {product.sales} sold
                </small>
              )}
            </div>
          </div>
        )}
      </Card.Body>

      {/* Custom CSS for hover effects */}
      <style jsx>{`
        .product-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: none;
        }
        
        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
        }
        
        .product-card .card-img-top {
          transition: transform 0.3s ease;
        }
        
        .product-card:hover .card-img-top {
          transform: scale(1.05);
        }
      `}</style>
    </Card>
  );
};

ProductCard.propTypes = {
  product: PropTypes.object.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'card']),
  showFullDescription: PropTypes.bool,
  className: PropTypes.string,
  onAddToCart: PropTypes.func,
  onAddToWishlist: PropTypes.func,
  showActions: PropTypes.bool
};

export default ProductCard;