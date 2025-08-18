// client/src/components/ProductCard.js - REFACTORED FOR Card.module.css
import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaStar, FaShoppingCart, FaHeart, FaBox } from 'react-icons/fa';
import { getProductImageUrl, FALLBACK_IMAGES } from '../config/imageConfig';
import styles from './Card.module.css';

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

  // ✅ IMAGE URL HANDLING
  const imageUrl = getProductImageUrl(product.image);
  const fallbackUrl = FALLBACK_IMAGES.product;

  // 🆕 DETERMINE IMAGE ASPECT RATIO for Card.module.css containers
  const getImageContainerClass = () => {
    const category = product.category?.toLowerCase();
    const name = product.name?.toLowerCase();
    
    // Portrait products (taller images) - uses .portrait from Card.module.css
    if (name?.includes('tower') || name?.includes('tall') || name?.includes('tree')) {
      return 'portrait';
    }
    if (category?.includes('furniture') || category?.includes('scratcher')) {
      return 'portrait';
    }
    
    // Tall products (very tall) - uses .tall from Card.module.css
    if (name?.includes('scratching post') || name?.includes('cat tree')) {
      return 'tall';
    }
    
    // Landscape products (wider images) - uses .landscape from Card.module.css
    if (name?.includes('bed') || name?.includes('mat') || name?.includes('blanket')) {
      return 'landscape';
    }
    if (category?.includes('bed') || category?.includes('mat')) {
      return 'landscape';
    }
    
    // Default to square - uses default .productImgContainer from Card.module.css
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
    <div 
      className={`${styles.enhancedCard} ${className}`}
      onClick={handleCardClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* 🆕 CARD.MODULE.CSS IMAGE CONTAINER - Responsive & Adaptive */}
      <div className={`${styles.productImgContainer} ${styles[imageContainerClass]}`}>
        {/* Stock Status Badge - Uses Card.module.css statusBadge */}
        {!product.inStock && (
          <div className={`${styles.statusBadge} ${styles.adopted}`}>
            Out of Stock
          </div>
        )}

        {/* Featured Badge */}
        {product.featured && (
          <div 
            className={styles.statusBadge}
            style={{ 
              top: 'var(--space-sm)', 
              left: 'var(--space-sm)', 
              right: 'auto',
              background: 'var(--color-primary)',
              color: 'var(--color-text-inverse)'
            }}
          >
            ⭐ Featured
          </div>
        )}

        <img
          src={imageUrl}
          alt={product.name}
          className={`${styles.productImg} ${imageLoaded ? '' : styles.loading}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
        
        {/* Favorite Button Overlay */}
        {showFavoriteButton && (
          <Button
            variant={isFavorited ? 'danger' : 'outline-danger'}
            size="sm"
            className="position-absolute rounded-circle"
            onClick={handleFavoriteClick}
            style={{ 
              top: 'var(--space-sm)',
              right: 'var(--space-sm)',
              width: '35px', 
              height: '35px',
              zIndex: 10,
              opacity: 0.9
            }}
          >
            <FaHeart size={14} />
          </Button>
        )}
      </div>

      {/* 🆕 CARD.MODULE.CSS BODY - Enhanced Styling */}
      <div className={styles.enhancedCardBody}>
        {/* Product Name - Uses Card.module.css title styling */}
        <h5 className={styles.enhancedCardTitle}>
          {product.name}
        </h5>

        {/* Brand & Category */}
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <small style={{ 
            color: 'var(--color-text-muted)',
            textTransform: 'capitalize',
            fontSize: 'var(--font-size-xs)'
          }}>
            {product.brand} • {product.category}
          </small>
        </div>

        {/* Star Rating */}
        <div style={{ 
          marginBottom: 'var(--space-md)', 
          display: 'flex', 
          justifyContent: 'center' 
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--space-xs)' 
          }}>
            {[1, 2, 3, 4, 5].map(star => (
              <FaStar
                key={star}
                style={{ 
                  color: star <= 4 ? 'var(--color-warning)' : 'var(--color-text-muted)',
                  fontSize: '12px'
                }}
              />
            ))}
            <small style={{ 
              color: 'var(--color-text-muted)', 
              marginLeft: 'var(--space-xs)' 
            }}>
              (4.0/5)
            </small>
          </div>
        </div>

        {/* Description - Uses Card.module.css text styling */}
        <p className={styles.enhancedCardText}>
          {product.description && product.description.length > 100 
            ? `${product.description.slice(0, 100)}...`
            : product.description || 'High-quality product for your beloved pet.'}
        </p>

        {/* 🆕 CARD.MODULE.CSS BADGES - Enhanced Badge System */}
        <div className={styles.enhancedBadges}>
          {product.inStock ? (
            <span 
              className={styles.enhancedBadge}
              style={{ 
                background: 'var(--color-success)',
                color: 'var(--color-text-inverse)'
              }}
            >
              ✅ In Stock
            </span>
          ) : (
            <span 
              className={styles.enhancedBadge}
              style={{ 
                background: 'var(--color-danger)',
                color: 'var(--color-text-inverse)'
              }}
            >
              ❌ Out of Stock
            </span>
          )}
          
          <span 
            className={styles.enhancedBadge}
            style={{ 
              background: 'var(--color-info)',
              color: 'var(--color-text-primary)'
            }}
          >
            <FaBox style={{ marginRight: 'var(--space-xs)' }} />
            {product.category}
          </span>
        </div>

        {/* Price */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: 'var(--space-md)' 
        }}>
          <div style={{ 
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-success)',
            fontSize: 'var(--font-size-xl)'
          }}>
            ${product.price?.toFixed(2) || '0.00'}
          </div>
        </div>

        {/* 🆕 CARD.MODULE.CSS BUTTONS - Enhanced Button System */}
        <div style={{ 
          display: 'grid', 
          gap: 'var(--space-sm)' 
        }}>
          {showAddToCart && (
            <button
              className={styles.enhancedButton}
              onClick={handleAddToCart}
              disabled={!product.inStock || isAddingToCart}
              style={{
                backgroundColor: product.inStock ? 'var(--color-success)' : 'var(--color-secondary)',
                borderColor: product.inStock ? 'var(--color-success)' : 'var(--color-secondary)',
                color: 'var(--color-text-inverse)',
                opacity: (!product.inStock || isAddingToCart) ? 0.6 : 1,
                cursor: (!product.inStock || isAddingToCart) ? 'not-allowed' : 'pointer'
              }}
            >
              <FaShoppingCart style={{ marginRight: 'var(--space-xs)' }} />
              {isAddingToCart ? 'Adding...' : 
               product.inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
          )}
          
          <Link 
            to={`/products/${product._id}`} 
            className={styles.enhancedButton}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'transparent',
              borderColor: 'var(--color-warning)',
              color: 'var(--color-warning)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FaBox style={{ marginRight: 'var(--space-xs)' }} />
            View Details
          </Link>
        </div>
      </div>

      {/* 🆕 CARD.MODULE.CSS FOOTER - Optional Enhanced Footer */}
      <div className={styles.cardFooter}>
        <small style={{ color: 'var(--color-text-muted)' }}>
          Product ID: {product._id?.slice(-6) || 'N/A'}
        </small>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--space-xs)' 
        }}>
          <FaStar style={{ color: 'var(--color-warning)', fontSize: '12px' }} />
          <small style={{ color: 'var(--color-text-secondary)' }}>4.0</small>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;