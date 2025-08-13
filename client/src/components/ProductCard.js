// client/src/components/ProductCard.js - UPDATED FOR IMPROVED SAFEIMAGE

import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import SafeImage from './SafeImage';
import { useCart } from '../contexts/CartContext';
import styles from './Card.module.css';

// Helper function to safely pick the best image URL
const pickImage = (product) => {
  const raw = product.imageUrl || product.image || (Array.isArray(product.images) && product.images.length ? product.images[0] : "");
  if (!raw) return "";
  
  const isAbsolute = /^https?:\/\//i.test(raw);
  return isAbsolute ? raw : `/api/images/resolve?src=${encodeURIComponent(raw)}`;
};

const ProductCard = ({
  product,
  showFullDescription = false,
  className = '',
  onAddToWishlist,
  showActions = true
}) => {
  const { addToCart } = useCart();

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
    inStock: product?.inStock !== false,
    image: product?.image || product?.imageUrl || null
  };

  const formatPrice = (price) =>
    typeof price === 'number' ? `$${price.toFixed(2)}` : (price ? String(price) : 'Price unavailable');

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!safeProduct.inStock) return;
    await addToCart(safeProduct._id, 1);
  };

  const handleAddToWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToWishlist) {
      onAddToWishlist(safeProduct);
    }
  };

  return (
    <Card
      className={`h-100 shadow-sm ${styles.enhancedCard} ${className}`}
      data-testid={`product-card-${safeProduct._id}`}
      style={{ transition: 'transform 0.2s ease-in-out' }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      {/* Product image with normalized URL */}
      <div className={`${styles.productImgContainer} position-relative`}>
        <SafeImage
          alt={safeProduct.name}
          src={pickImage(safeProduct)}
          size="large"
          className={`${styles.productImg} w-100`}
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

        {/* Quick Action Overlay (shows on hover) */}
        {showActions && (
          <div className="position-absolute bottom-0 start-0 end-0 p-2 opacity-0 bg-dark bg-opacity-75 transition-opacity"
               style={{ transition: 'opacity 0.2s ease' }}
               onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
               onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}>
            <div className="d-flex gap-1 justify-content-center">
              <Button
                variant="light"
                size="sm"
                onClick={handleAddToCart}
                disabled={!safeProduct.inStock}
                title="Add to Cart"
              >
                <i className="fas fa-shopping-cart"></i>
              </Button>
              <Button
                variant="light"
                size="sm"
                onClick={handleAddToWishlist}
                title="Add to Wishlist"
              >
                <i className="fas fa-heart"></i>
              </Button>
              <Button
                variant="light"
                size="sm"
                as={Link}
                to={`/products/${safeProduct._id}`}
                title="View Details"
              >
                <i className="fas fa-eye"></i>
              </Button>
            </div>
          </div>
        )}
      </div>

      <Card.Body className={`${styles.enhancedCardBody} d-flex flex-column`}>
        {/* Header with name and price */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className={`${styles.enhancedCardTitle} mb-0 flex-grow-1`}>
            <Link 
              to={`/products/${safeProduct._id}`} 
              className="text-decoration-none text-dark"
            >
              {safeProduct.name}
            </Link>
          </Card.Title>
          {safeProduct.price > 0 && (
            <Badge bg="success" className="ms-2 fs-6">
              {formatPrice(safeProduct.price)}
            </Badge>
          )}
        </div>

        {/* Brand and Category */}
        <div className="text-muted small mb-2">
          {safeProduct.brand && (
            <>
              <span className="fw-semibold">{safeProduct.brand}</span>
              <span className="mx-1">•</span>
            </>
          )}
          <span className="text-capitalize">{safeProduct.category}</span>
        </div>

        {/* Description */}
        <Card.Text className={`${styles.enhancedCardText} flex-grow-1`}>
          {showFullDescription
            ? safeProduct.description
            : safeProduct.description.length > 100 
            ? `${safeProduct.description.substring(0, 100)}...`
            : safeProduct.description
          }
        </Card.Text>

        {/* Rating (if available) */}
        {safeProduct.rating && safeProduct.rating > 0 && (
          <div className="mb-2">
            <div className="d-flex align-items-center">
              <div className="text-warning me-1">
                {[...Array(5)].map((_, i) => (
                  <i 
                    key={i} 
                    className={`fas fa-star ${i < Math.floor(safeProduct.rating) ? '' : 'text-muted'}`}
                  ></i>
                ))}
              </div>
              <small className="text-muted">
                ({safeProduct.reviewCount || 0} reviews)
              </small>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="mt-auto pt-2">
            <div className="d-grid gap-2">
              <Button
                variant={safeProduct.inStock ? "primary" : "secondary"}
                size="sm"
                onClick={handleAddToCart}
                disabled={!safeProduct.inStock}
              >
                <i className="fas fa-shopping-cart me-1"></i>
                {safeProduct.inStock ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              
              <div className="d-flex gap-1">
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  className="flex-grow-1"
                  as={Link}
                  to={`/products/${safeProduct._id}`}
                >
                  <i className="fas fa-info-circle me-1"></i>
                  Details
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleAddToWishlist}
                  title="Add to Wishlist"
                >
                  <i className="fas fa-heart"></i>
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

ProductCard.propTypes = {
  product: PropTypes.object.isRequired,
  showFullDescription: PropTypes.bool,
  className: PropTypes.string,
  onAddToWishlist: PropTypes.func,
  showActions: PropTypes.bool
};

export default ProductCard;