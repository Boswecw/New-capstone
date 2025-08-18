// client/src/components/ProductCard.js
import React, { useState } from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaShoppingCart, 
  FaHeart, 
  FaStar, 
  FaCheck, 
  FaTimes,
  FaTag,
  FaBox
} from 'react-icons/fa';

// Fallback image handling
const buildProductImageUrl = (imagePath, productName) => {
  if (!imagePath) return `https://via.placeholder.com/300x200?text=${encodeURIComponent(productName || 'Product')}`;
  if (imagePath.startsWith('http')) return imagePath;
  return `https://storage.googleapis.com/furbabies-petstore/${imagePath}`;
};

const FALLBACK_IMAGES = {
  'Dog Care': 'https://via.placeholder.com/300x200?text=Dog+Care',
  'Cat Care': 'https://via.placeholder.com/300x200?text=Cat+Care',
  'Aquarium & Fish Care': 'https://via.placeholder.com/300x200?text=Fish+Care',
  'Grooming & Health': 'https://via.placeholder.com/300x200?text=Grooming',
  'Training & Behavior': 'https://via.placeholder.com/300x200?text=Training',
  product: 'https://via.placeholder.com/300x200?text=Product'
};

const ProductCard = ({ 
  product, 
  showAddToCart = true,
  showFavoriteButton = false,
  showActions = true,
  className = '',
  variant = 'vertical',
  onClick,
  onAddToCart,
  onFavorite
}) => {
  const [imageError, setImageError] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const safeProduct = {
    ...product,
    name: String(product.name || 'Unknown Product'),
    brand: String(product.brand || 'Generic'),
    category: String(product.category || 'Product'),
    price: Number(product.price) || 0,
    description: String(product.description || 'Quality product for your pet.'),
    inStock: Boolean(product.inStock !== false), // Default to true unless explicitly false
    featured: Boolean(product.featured),
    onSale: Boolean(product.onSale),
    rating: Number(product.rating) || 0,
    reviewCount: Number(product.reviewCount) || 0
  };

  const getImageUrl = () => buildProductImageUrl(safeProduct.image, safeProduct.name);
  const getFallbackUrl = () => FALLBACK_IMAGES[safeProduct.category] || FALLBACK_IMAGES.product;

  const imageUrl = getImageUrl();
  const fallbackUrl = getFallbackUrl();

  const getImageContainerClass = () => {
    const category = safeProduct.category?.toLowerCase();
    if (category?.includes('food') || category?.includes('treat')) return 'portrait';
    if (category?.includes('tank') || category?.includes('aquarium')) return 'landscape';
    if (category?.includes('toy') && category?.includes('large')) return 'tall';
    return 'square';
  };

  const handleImageError = (e) => {
    if (!imageError && e.target.src !== fallbackUrl) {
      setImageError(true);
      e.target.src = fallbackUrl;
    }
  };

  const handleImageLoad = () => setImageLoaded(true);

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    if (onFavorite) onFavorite(safeProduct, !isFavorited);
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!safeProduct.inStock || isAddingToCart) return;
    
    setIsAddingToCart(true);
    try {
      if (onAddToCart) await onAddToCart(safeProduct);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleCardClick = () => onClick && onClick(safeProduct);

  const renderStarRating = (rating, reviewCount) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="text-warning" size={12} />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStar key={i} className="text-warning" size={12} style={{ opacity: 0.5 }} />);
      } else {
        stars.push(<FaStar key={i} className="text-muted" size={12} />);
      }
    }

    return (
      <div className="d-flex align-items-center gap-1">
        {stars}
        {reviewCount > 0 && (
          <small className="text-muted ms-1">({reviewCount})</small>
        )}
      </div>
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const imageContainerClass = getImageContainerClass();

  return (
    <Card 
      className={`card enhanced-card ${className}`}
      onClick={handleCardClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className={`product-img-container ${imageContainerClass}`}>
        <img
          src={imageUrl}
          alt={safeProduct.name}
          className={`product-img ${imageLoaded ? '' : 'loading'}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />

        {/* Sale Badge */}
        {safeProduct.onSale && (
          <div className="badge statusBadge" style={{ 
            position: 'absolute', 
            top: '8px', 
            left: '8px', 
            background: '#dc3545',
            color: 'white'
          }}>
            <FaTag className="me-1" />
            Sale!
          </div>
        )}

        {/* Stock Status */}
        <div className="badge statusBadge" style={{ 
          position: 'absolute', 
          top: '8px', 
          right: '8px',
          background: safeProduct.inStock ? '#28a745' : '#6c757d',
          color: 'white'
        }}>
          {safeProduct.inStock ? (
            <>
              <FaCheck className="me-1" />
              In Stock
            </>
          ) : (
            <>
              <FaTimes className="me-1" />
              Out of Stock
            </>
          )}
        </div>

        {/* Favorite Button */}
        {showFavoriteButton && (
          <Button
            variant={isFavorited ? 'danger' : 'outline-danger'}
            size="sm"
            className="position-absolute bottom-0 end-0 m-2 rounded-circle"
            onClick={handleFavoriteClick}
            style={{ width: '35px', height: '35px', zIndex: 10, opacity: 0.9 }}
          >
            <FaHeart size={14} />
          </Button>
        )}
      </div>

      <Card.Body className="card-body">
        {/* Product Header */}
        <div className="mb-2">
          <Card.Title 
            className="card-title"
            style={{ 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              marginBottom: '4px'
            }}
          >
            {safeProduct.name}
          </Card.Title>
          <small className="text-muted d-block">
            by {safeProduct.brand}
          </small>
        </div>

        {/* Category Badge */}
        <div className="mb-2">
          <Badge bg="secondary" className="enhanced-badge">
            <FaBox className="me-1" />
            {safeProduct.category}
          </Badge>
        </div>

        {/* Rating */}
        {safeProduct.rating > 0 && (
          <div className="mb-2 d-flex justify-content-center">
            {renderStarRating(safeProduct.rating, safeProduct.reviewCount)}
          </div>
        )}

        {/* Description */}
        <Card.Text 
          className="card-text"
          style={{ 
            display: 'block', 
            whiteSpace: 'normal', 
            wordWrap: 'break-word',
            fontSize: '0.9rem',
            lineHeight: '1.4'
          }}
        >
          {safeProduct.description && safeProduct.description.length > 80 
            ? `${safeProduct.description.slice(0, 80)}...`
            : safeProduct.description}
        </Card.Text>

        {/* Badges */}
        <div className="enhanced-badges mb-3">
          {safeProduct.featured && (
            <Badge bg="primary" className="enhanced-badge">
              <FaStar className="me-1" />
              Featured
            </Badge>
          )}
          {safeProduct.inStock && (
            <Badge bg="success" className="enhanced-badge">
              <FaCheck className="me-1" />
              Available
            </Badge>
          )}
          {safeProduct.rating >= 4 && (
            <Badge bg="warning" className="enhanced-badge">
              <FaStar className="me-1" />
              Top Rated
            </Badge>
          )}
        </div>

        {/* Price */}
        <div className="text-center mb-3">
          <div className="fw-bold text-success fs-4">
            {formatPrice(safeProduct.price)}
          </div>
          {safeProduct.onSale && (
            <small className="text-muted text-decoration-line-through">
              {formatPrice(safeProduct.price * 1.2)}
            </small>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="d-grid gap-2">
            {showAddToCart && (
              <Button
                variant={safeProduct.inStock ? "success" : "secondary"}
                className="enhanced-button"
                onClick={handleAddToCart}
                disabled={!safeProduct.inStock || isAddingToCart}
                style={{ textDecoration: 'none' }}
              >
                <FaShoppingCart className="me-2" />
                {isAddingToCart ? 'Adding...' : 
                 !safeProduct.inStock ? 'Out of Stock' : 
                 'Add to Cart'}
              </Button>
            )}
            
            <Link 
              to={`/products/${safeProduct._id}`} 
              className="btn btn-outline-primary enhanced-button"
              onClick={(e) => e.stopPropagation()}
              style={{ textDecoration: 'none' }}
            >
              <FaBox className="me-2" />
              View Details
            </Link>
          </div>
        )}

        {/* Quick Product Info */}
        <div className="mt-3 pt-2 border-top">
          <div className="row text-center">
            <div className="col-4">
              <small className="text-muted d-block">Brand</small>
              <small className="fw-bold">{safeProduct.brand}</small>
            </div>
            <div className="col-4">
              <small className="text-muted d-block">Stock</small>
              <small className={`fw-bold ${safeProduct.inStock ? 'text-success' : 'text-danger'}`}>
                {safeProduct.inStock ? 'Available' : 'Out'}
              </small>
            </div>
            <div className="col-4">
              <small className="text-muted d-block">Rating</small>
              <small className="fw-bold">
                {safeProduct.rating > 0 ? `${safeProduct.rating.toFixed(1)}★` : 'New'}
              </small>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;