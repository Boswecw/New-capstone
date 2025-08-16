// client/src/components/ProductCard.js - ENHANCED VERSION (Works with your CSS)
import React, { useState } from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaStar, FaShoppingCart, FaHeart, FaBox } from 'react-icons/fa';
import { getProductImageUrl, FALLBACK_IMAGES } from '../config/imageConfig';

const ProductCard = ({ 
  product, 
  onAddToCart, 
  onClick,
  showAddToCart = true,
  showFavoriteButton = false,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // ✅ SAME IMAGE HANDLING AS BEFORE
  const imageUrl = getProductImageUrl(product.image);
  const fallbackUrl = FALLBACK_IMAGES.product;

  // 🆕 DETERMINE IMAGE ASPECT RATIO for dynamic containers
  const getImageContainerClass = () => {
    const category = product.category?.toLowerCase();
    const name = product.name?.toLowerCase();
    
    // Portrait products (taller images)
    if (name?.includes('tower') || name?.includes('tall') || name?.includes('tree')) {
      return 'portrait';
    }
    if (category?.includes('furniture') || category?.includes('scratcher')) {
      return 'portrait';
    }
    
    // Landscape products (wider images)
    if (name?.includes('bed') || name?.includes('mat') || name?.includes('blanket')) {
      return 'landscape';
    }
    if (category?.includes('bed') || category?.includes('mat')) {
      return 'landscape';
    }
    
    // Default to square
    return 'square';
  };

  const handleImageError = (e) => {
    if (!imageError && e.target.src !== fallbackUrl) {
      setImageError(true);
      e.target.src = fallbackUrl;
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product.inStock || isAddingToCart) return;
    
    setIsAddingToCart(true);
    try {
      if (onAddToCart) {
        await onAddToCart(product);
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorited(!isFavorited);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(product);
    }
  };

  const imageContainerClass = getImageContainerClass();

  return (
    <Card 
      className={`enhancedCard modernPetCard ${className}`}
      onClick={handleCardClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* 🆕 DYNAMIC IMAGE CONTAINER - Uses your CSS classes */}
      <div className={`productImgContainer ${imageContainerClass}`}>
        <img
          src={imageUrl}
          alt={product.name}
          className={`productImg ${imageLoaded ? '' : 'loading'}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
        
        {/* Favorite Button Overlay */}
        {showFavoriteButton && (
          <Button
            variant={isFavorited ? 'danger' : 'outline-danger'}
            size="sm"
            className="position-absolute top-0 end-0 m-2 rounded-circle"
            onClick={handleFavoriteClick}
            style={{ 
              width: '35px', 
              height: '35px',
              zIndex: 10,
              opacity: 0.9
            }}
          >
            <FaHeart size={14} />
          </Button>
        )}

        {/* Stock Status Overlay */}
        {!product.inStock && (
          <div 
            className="position-absolute top-0 start-0 m-2"
            style={{ zIndex: 10 }}
          >
            <Badge bg="danger" className="enhancedBadge">
              Out of Stock
            </Badge>
          </div>
        )}
      </div>

      {/* 🆕 ENHANCED CARD BODY - Uses your CSS classes */}
      <Card.Body className="enhancedCardBody">
        {/* Product Name */}
        <Card.Title className="enhancedCardTitle">
          {product.name}
        </Card.Title>

        {/* Brand & Category */}
        <div className="mb-3">
          <small className="text-muted text-capitalize">
            {product.brand} • {product.category}
          </small>
        </div>

        {/* Star Rating */}
        <div className="mb-3 d-flex justify-content-center">
          <div className="d-flex align-items-center gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <FaStar
                key={star}
                className={star <= 4 ? 'text-warning' : 'text-muted'}
                size={12}
              />
            ))}
            <small className="text-muted ms-1">(4.0/5)</small>
          </div>
        </div>

        {/* Description */}
        <Card.Text className="enhancedCardText">
          {product.description && product.description.length > 100 
            ? `${product.description.slice(0, 100)}...`
            : product.description || 'High-quality product for your beloved pet.'}
        </Card.Text>

        {/* 🆕 ENHANCED BADGES - Uses your CSS classes */}
        <div className="enhancedBadges">
          {product.featured && (
            <Badge bg="primary" className="enhancedBadge">
              ⭐ Featured
            </Badge>
          )}
          
          {product.inStock ? (
            <Badge bg="success" className="enhancedBadge">
              ✅ In Stock
            </Badge>
          ) : (
            <Badge bg="danger" className="enhancedBadge">
              ❌ Out of Stock
            </Badge>
          )}
          
          <Badge bg="info" className="enhancedBadge">
            <FaBox className="me-1" />
            {product.category}
          </Badge>
        </div>

        {/* Price */}
        <div className="text-center mb-3">
          <div className="fw-bold text-success fs-4">
            ${product.price?.toFixed(2) || '0.00'}
          </div>
        </div>

        {/* 🆕 ENHANCED BUTTONS - Uses your CSS classes */}
        <div className="d-grid gap-2">
          {showAddToCart && (
            <Button
              variant={product.inStock ? "success" : "secondary"}
              className="enhancedButton"
              onClick={handleAddToCart}
              disabled={!product.inStock || isAddingToCart}
              style={{
                backgroundColor: product.inStock ? '#28a745' : '#6c757d',
                borderColor: product.inStock ? '#28a745' : '#6c757d',
                boxShadow: product.inStock ? '0 2px 8px rgba(40, 167, 69, 0.3)' : 'none'
              }}
            >
              <FaShoppingCart className="me-2" />
              {isAddingToCart ? 'Adding...' : 
               product.inStock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          )}
          
          <Link 
            to={`/products/${product._id}`} 
            className="btn btn-outline-warning enhancedButton"
            onClick={(e) => e.stopPropagation()}
            style={{
              borderColor: '#ffc107',
              color: '#ffc107',
              boxShadow: '0 2px 8px rgba(255, 193, 7, 0.2)'
            }}
          >
            <FaBox className="me-2" />
            View Details
          </Link>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;