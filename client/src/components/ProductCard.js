// client/src/components/ProductCard.js
// Fixed: Removed unused Badge import
import React, { useState } from 'react';
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
      <div className="star-rating">
        <div className="stars">
          {stars}
        </div>
        {reviewCount > 0 && (
          <small className="review-count">({reviewCount})</small>
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
    <div 
      className={`enhanced-card product-card hover-lift ${className}`}
      onClick={handleCardClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className={`product-img-container ${imageContainerClass}`}>
        <img
          src={imageUrl}
          alt={safeProduct.name}
          className={`product-img img-cover ${imageLoaded ? '' : 'loading'}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />

        {/* Sale Badge */}
        {safeProduct.onSale && (
          <div className="badge-sale">
            <FaTag className="sale-icon" />
            <span className="sale-text">Sale!</span>
          </div>
        )}

        {/* Stock Status */}
        <div className={`badge-stock ${safeProduct.inStock ? 'in-stock' : 'out-of-stock'}`}>
          {safeProduct.inStock ? (
            <>
              <FaCheck className="stock-icon" />
              <span className="stock-text">In Stock</span>
            </>
          ) : (
            <>
              <FaTimes className="stock-icon" />
              <span className="stock-text">Out of Stock</span>
            </>
          )}
        </div>

        {/* Favorite Button */}
        {showFavoriteButton && (
          <button
            className={`btn-favorite ${isFavorited ? 'favorited' : ''}`}
            onClick={handleFavoriteClick}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <FaHeart size={14} />
          </button>
        )}
      </div>

      <div className="enhanced-card-body">
        {/* Product Header */}
        <div className="product-header mb-3">
          <h5 className="enhanced-card-title">
            {safeProduct.name}
          </h5>
          <small className="product-brand">
            by {safeProduct.brand}
          </small>
        </div>

        {/* Category Badge */}
        <div className="category-container mb-3">
          <span className="enhanced-badge badge-secondary">
            <FaBox className="badge-icon" />
            <span className="badge-text">{safeProduct.category}</span>
          </span>
        </div>

        {/* Rating */}
        {safeProduct.rating > 0 && (
          <div className="rating-container mb-3">
            {renderStarRating(safeProduct.rating, safeProduct.reviewCount)}
          </div>
        )}

        {/* Description */}
        <p className="enhanced-card-text">
          {safeProduct.description && safeProduct.description.length > 80 
            ? `${safeProduct.description.slice(0, 80)}...`
            : safeProduct.description}
        </p>

        {/* Product Badges */}
        <div className="enhanced-badges mb-3">
          {safeProduct.featured && (
            <span className="enhanced-badge badge-primary">
              <FaStar className="badge-icon" />
              <span className="badge-text">Featured</span>
            </span>
          )}
          {safeProduct.inStock && (
            <span className="enhanced-badge badge-success">
              <FaCheck className="badge-icon" />
              <span className="badge-text">Available</span>
            </span>
          )}
          {safeProduct.rating >= 4 && (
            <span className="enhanced-badge badge-warning">
              <FaStar className="badge-icon" />
              <span className="badge-text">Top Rated</span>
            </span>
          )}
        </div>

        {/* Price */}
        <div className="product-price mb-3">
          <div className="current-price">
            {formatPrice(safeProduct.price)}
          </div>
          {safeProduct.onSale && (
            <div className="original-price">
              {formatPrice(safeProduct.price * 1.2)}
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="card-actions mb-3">
            {showAddToCart && (
              <button
                className={`enhanced-button mb-2 w-100 ${
                  safeProduct.inStock ? 'btn-success' : 'btn-secondary'
                }`}
                onClick={handleAddToCart}
                disabled={!safeProduct.inStock || isAddingToCart}
              >
                <FaShoppingCart className="me-2" />
                <span>
                  {isAddingToCart ? 'Adding...' : 
                   !safeProduct.inStock ? 'Out of Stock' : 
                   'Add to Cart'}
                </span>
              </button>
            )}
            
            <Link 
              to={`/products/${safeProduct._id}`} 
              className="enhanced-button btn-outline w-100"
              onClick={(e) => e.stopPropagation()}
            >
              <FaBox className="me-2" />
              View Details
            </Link>
          </div>
        )}

        {/* Quick Product Info */}
        <div className="product-info-grid">
          <div className="info-item">
            <small className="info-label">Brand</small>
            <small className="info-value">{safeProduct.brand}</small>
          </div>
          <div className="info-item">
            <small className="info-label">Stock</small>
            <small className={`info-value ${safeProduct.inStock ? 'text-success' : 'text-danger'}`}>
              {safeProduct.inStock ? 'Available' : 'Out'}
            </small>
          </div>
          <div className="info-item">
            <small className="info-label">Rating</small>
            <small className="info-value">
              {safeProduct.rating > 0 ? `${safeProduct.rating.toFixed(1)}★` : 'New'}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;