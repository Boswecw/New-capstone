// client/src/components/ProductCard.js
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FaShoppingCart,
  FaHeart,
  FaStar,          // <- actively used below
  FaCheck,
  FaTimes,
  FaTag,
  FaBox,
} from "react-icons/fa";

// Build URL / fallbacks
const buildProductImageUrl = (imagePath, productName) => {
  if (!imagePath)
    return `https://via.placeholder.com/300x200?text=${encodeURIComponent(
      productName || "Product"
    )}`;
  if (imagePath.startsWith("http")) return imagePath;
  return `https://storage.googleapis.com/furbabies-petstore/${imagePath}`;
};

const FALLBACK_IMAGES = {
  "Dog Care": "https://via.placeholder.com/300x200?text=Dog+Care",
  "Cat Care": "https://via.placeholder.com/300x200?text=Cat+Care",
  "Aquarium & Fish Care": "https://via.placeholder.com/300x200?text=Fish+Care",
  "Grooming & Health": "https://via.placeholder.com/300x200?text=Grooming",
  "Training & Behavior": "https://via.placeholder.com/300x200?text=Training",
  product: "https://via.placeholder.com/300x200?text=Product",
};

// Small star rating renderer that uses FaStar
const StarRating = ({ rating = 0, reviewCount = 0 }) => {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5;

  const stars = Array.from({ length: 5 }, (_, i) => {
    if (i < full) {
      return <FaStar key={i} className="text-warning" size={12} aria-hidden="true" />;
    }
    if (i === full && hasHalf) {
      // visually indicate half by lowering opacity
      return <FaStar key={i} className="text-warning" size={12} style={{ opacity: 0.5 }} aria-hidden="true" />;
    }
    return <FaStar key={i} className="text-muted" size={12} aria-hidden="true" />;
  });

  return (
    <div className="star-rating">
      <div className="stars">{stars}</div>
      {reviewCount > 0 && <small className="review-count">({reviewCount})</small>}
    </div>
  );
};

const ProductCard = ({
  product,
  showAddToCart = true,
  showFavoriteButton = false,
  showActions = true,
  className = "",
  onClick,
  onAddToCart,
  onFavorite,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const safeProduct = useMemo(
    () => ({
      ...product,
      name: String(product?.name || "Unknown Product"),
      brand: String(product?.brand || "Generic"),
      category: String(product?.category || "Product"),
      price: Number(product?.price) || 0,
      description: String(product?.description || "Quality product for your pet."),
      inStock: Boolean(product?.inStock !== false),
      featured: Boolean(product?.featured),
      onSale: Boolean(product?.onSale),
      rating: Number(product?.rating) || 0,
      reviewCount: Number(product?.reviewCount) || 0,
    }),
    [product]
  );

  const imageUrl = useMemo(
    () => buildProductImageUrl(safeProduct.image, safeProduct.name),
    [safeProduct.image, safeProduct.name]
  );
  const fallbackUrl = useMemo(
    () => FALLBACK_IMAGES[safeProduct.category] || FALLBACK_IMAGES.product,
    [safeProduct.category]
  );

  const handleImageError = (e) => {
    if (!imageError && e.target.src !== fallbackUrl) {
      setImageError(true);
      e.target.src = fallbackUrl;
    }
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorited((v) => {
      const next = !v;
      onFavorite && onFavorite(safeProduct, next);
      return next;
    });
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!safeProduct.inStock || isAddingToCart) return;
    setIsAddingToCart(true);
    try {
      onAddToCart && (await onAddToCart(safeProduct));
    } finally {
      setIsAddingToCart(false);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);

  return (
    <div
      className={`enhanced-card product-card hover-lift ${className}`}
      onClick={() => onClick && onClick(safeProduct)}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {/* Image */}
      <div className="product-img-container square">
        <img
          src={imageUrl}
          alt={safeProduct.name}
          className="product-img img-cover"
          onError={handleImageError}
          loading="lazy"
          decoding="async"
        />

        {/* Sale Badge */}
        {safeProduct.onSale && (
          <div className="badge-sale">
            <FaTag className="sale-icon" aria-hidden="true" />
            <span className="sale-text">Sale</span>
          </div>
        )}

        {/* Stock Badge */}
        <div className={`badge-stock ${safeProduct.inStock ? "in-stock" : "out-of-stock"}`}>
          {safeProduct.inStock ? (
            <>
              <FaCheck className="stock-icon" aria-hidden="true" /> In Stock
            </>
          ) : (
            <>
              <FaTimes className="stock-icon" aria-hidden="true" /> Out of Stock
            </>
          )}
        </div>

        {/* Favorite */}
        {showFavoriteButton && (
          <button
            type="button"
            className={`btn-favorite ${isFavorited ? "favorited" : ""}`}
            onClick={handleFavoriteClick}
            aria-pressed={isFavorited}
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <FaHeart size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="enhanced-card-body">
        <h5 className="enhanced-card-title">{safeProduct.name}</h5>

        <div className="product-price mb-2">
          <span className="current-price">{formatPrice(safeProduct.price)}</span>
          {safeProduct.onSale && (
            <span className="original-price">{formatPrice(safeProduct.price * 1.2)}</span>
          )}
        </div>

        {/* Rating uses FaStar (prevents no-unused-vars) */}
        {safeProduct.rating > 0 && (
          <div className="rating-container mb-3">
            <StarRating rating={safeProduct.rating} reviewCount={safeProduct.reviewCount} />
          </div>
        )}

        <p className="enhanced-card-text">
          {safeProduct.description.length > 80
            ? `${safeProduct.description.slice(0, 80)}...`
            : safeProduct.description}
        </p>

        {/* Meta */}
        <div className="product-meta d-flex justify-content-between align-items-center mt-2">
          <small className="text-muted">by {safeProduct.brand}</small>
          <small className="text-muted">
            <FaBox className="me-1" aria-hidden="true" />
            {safeProduct.category}
          </small>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="card-actions mt-3">
            {showAddToCart && (
              <button
                className={`enhanced-button w-100 ${
                  safeProduct.inStock ? "btn-success" : "btn-secondary"
                }`}
                onClick={handleAddToCart}
                disabled={!safeProduct.inStock || isAddingToCart}
              >
                <FaShoppingCart className="me-2" aria-hidden="true" />
                {isAddingToCart
                  ? "Adding..."
                  : !safeProduct.inStock
                  ? "Out of Stock"
                  : "Add to Cart"}
              </button>
            )}

            <Link
              to={`/products/${safeProduct._id}`}
              className="enhanced-button btn-outline w-100 mt-2"
              onClick={(e) => e.stopPropagation()}
            >
              <FaBox className="me-2" aria-hidden="true" />
              View Details
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
