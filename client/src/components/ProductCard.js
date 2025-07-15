// client/src/components/ProductCard.js - UPDATED TO INCLUDE ProductImageManager
import React, { useState } from 'react';
import { Card, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getCardImageProps } from '../utils/imageUtils';
import ProductImageManager from './ProductImageManager';
import styles from './Card.module.css';

const ProductCard = ({ product }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showImageManager, setShowImageManager] = useState(false);

  const imageProps = getCardImageProps(product, 'medium');

  console.log('🛍️ ProductCard Debug:', {
    productName: product.name,
    productImage: product.image,
    productImageUrl: product.imageUrl,
    imageProps: imageProps,
    fullProductObject: product
  });

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    console.log('✅ ProductCard image loaded:', product.name, 'URL:', imageProps.src);
  };

  const handleImageError = (e) => {
    setImageLoaded(true);
    setImageError(true);
    console.log('❌ ProductCard image failed:', product.name, 'URL:', e.target.src);
    if (imageProps.onError) {
      imageProps.onError(e);
    }
  };

  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return `$${price.toFixed(2)}`;
    }
    return 'N/A';
  };

  return (
    <>
      <Card className={`h-100 shadow-sm ${styles.card} fade-in`}>
        <div className={`${styles.cardImgContainer || styles.productImgContainer} position-relative`}>
          {!imageLoaded && !imageError && (
            <div className="position-absolute top-50 start-50 translate-middle">
              <Spinner animation="border" size="sm" variant="primary" />
            </div>
          )}

          <Card.Img
            src={imageProps.src}
            alt={imageProps.alt || `${product.name} - ${product.category}`}
            className={`${styles.cardImg || styles.productImg} transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              width: '100%',
              height: '250px',
              objectFit: 'cover',
              objectPosition: 'center'
            }}
            loading={imageProps.loading}
          />

          {imageError && imageLoaded && (
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light border">
              <div className="text-center text-muted p-3">
                <i className="fas fa-box fa-2x text-primary opacity-50 mb-2" />
                <div className="small fw-semibold">{product.name}</div>
                <div className="small text-muted">Photo coming soon</div>
              </div>
            </div>
          )}

          <div className="position-absolute top-0 end-0 m-2">
            <span className={`badge ${product.inStock ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '0.7rem' }}>
              <i className={`fas ${product.inStock ? 'fa-check-circle' : 'fa-times-circle'} me-1`} />
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          {/* 🖼 Image Manager Trigger */}
          <div className="position-absolute top-0 start-0 m-2">
            <Button
              variant="light"
              size="sm"
              className="rounded-circle shadow-sm"
              onClick={() => setShowImageManager(true)}
              aria-label={`Manage images for ${product.name}`}
            >
              <i className="fas fa-edit text-primary" />
            </Button>
          </div>
        </div>

        <Card.Body className="d-flex flex-column">
          <Card.Title className="fw-bold text-dark mb-2">
            {product.name || 'Unnamed Product'}
            {imageError && (
              <small className="text-warning ms-2">
                <i className="fas fa-exclamation-triangle" title="Image unavailable" />
              </small>
            )}
          </Card.Title>

          <Card.Text className="text-muted mb-2 small">
            <span className="fw-semibold">{product.category}</span>
            {product.brand && <span className="ms-2">• {product.brand}</span>}
          </Card.Text>

          <Card.Text className="flex-grow-1 text-sm">
            {product.description && product.description.length > 100
              ? `${product.description.substring(0, 100)}...`
              : product.description || 'No description available.'}
          </Card.Text>

          <div className="d-flex justify-content-between align-items-center mt-auto">
            <span className="text-success fw-bold fs-5">
              {formatPrice(product.price)}
            </span>
            <Button
              as={Link}
              to={`/products/${product._id}`}
              variant="primary"
              size="sm"
              disabled={!product.inStock}
            >
              <i className="fas fa-info-circle me-2" />
              View Details
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* 🔧 Modal Image Manager */}
      <ProductImageManager
        show={showImageManager}
        onHide={() => setShowImageManager(false)}
        productId={product._id}
        productName={product.name}
      />
    </>
  );
};

export default ProductCard;
