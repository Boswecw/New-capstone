// client/src/components/ProductCard.js

import React from 'react';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import SafeImage from './SafeImage';
import styles from './Card.module.css';
import classNames from 'classnames';

const ProductCard = ({ product, className = "", fitMode = "contain" }) => {
  if (!product) {
    return (
      <Card className={`${styles.card} ${className} h-100`}>
        <div className={styles.productImgContainer}>
          <div className="text-center text-muted p-4">
            <i className="fas fa-box fa-2x mb-2" style={{ color: '#dee2e6' }}></i>
            <p className="mb-0">Product information unavailable</p>
          </div>
        </div>
        <Card.Body className={styles.cardBody}>
          <Card.Title className={styles.cardTitle}>Product Not Found</Card.Title>
          <Card.Text className={styles.cardText}>
            This product's information is currently unavailable.
          </Card.Text>
        </Card.Body>
      </Card>
    );
  }

  // 🔢 Format price
  const formatPrice = (price) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return !isNaN(num) ? `$${num.toFixed(2)}` : 'Price N/A';
  };

  // 🧩 Match icon based on category keywords
  const getCategoryIcon = () => {
    const category = product.category?.toLowerCase() || '';
    const iconMap = {
      dog: 'fas fa-dog',
      cat: 'fas fa-cat',
      grooming: 'fas fa-cut',
      training: 'fas fa-graduation-cap',
      aquarium: 'fas fa-fish',
      food: 'fas fa-utensils',
      treat: 'fas fa-cookie',
      toy: 'fas fa-ball-pile',
      accessory: 'fas fa-collar',
      health: 'fas fa-heartbeat',
      supply: 'fas fa-box',
      bedding: 'fas fa-bed',
      carrier: 'fas fa-suitcase',
      leash: 'fas fa-link',
      collar: 'fas fa-circle'
    };
    return Object.entries(iconMap).find(([key]) => category.includes(key))?.[1] || 'fas fa-box';
  };

  // 📦 Stock status object
  const getStockStatus = () => {
    if (product.inStock === false) {
      return { text: 'Out of Stock', className: `${styles.statusBadge} ${styles.unavailable}` };
    }
    if (product.stock <= 5) {
      return { text: 'Low Stock', className: `${styles.statusBadge} ${styles.pending}` };
    }
    return { text: 'In Stock', className: `${styles.statusBadge} ${styles.available}` };
  };

  const categoryIcon = getCategoryIcon();
  const stockStatus = getStockStatus();
  const isAvailable = product.inStock !== false;

  const imageClass = classNames(styles.productImg, {
    [styles['fit-contain']]: fitMode === 'contain',
    [styles['fit-cover']]: fitMode === 'cover',
    [styles['fit-fill']]: fitMode === 'fill',
    [styles['fit-scale-down']]: fitMode === 'scale-down',
  });

  return (
    <Card className={`${styles.card} ${className} h-100`}>
      <div className={styles.productImgContainer}>
        <SafeImage
          item={product}
          category="product"
          alt={product.name}
          className={imageClass}
          showSpinner
          onLoad={() => console.log(`✅ Loaded: ${product.name}`)}
          onError={() => console.warn(`❌ Failed: ${product.name}`)}
        />

        <div className={stockStatus.className}>{stockStatus.text}</div>

        <div className="position-absolute bottom-0 start-0 p-2">
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              width: 32,
              height: 32,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '50%',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              border: '1px solid rgba(255,255,255,0.8)'
            }}
          >
            <i className={`${categoryIcon} text-primary`} style={{ fontSize: 14 }} />
          </div>
        </div>
      </div>

      <Card.Body className={styles.cardBody}>
        <div className="d-flex flex-column h-100">
          <div className="mb-2">
            <Card.Title className={styles.cardTitle}>{product.name}</Card.Title>
            {product.category && (
              <Card.Subtitle className={`${styles.cardSubtitle} text-muted`}>
                {product.category}
              </Card.Subtitle>
            )}
          </div>

          <div className="mb-3 flex-grow-1">
            <div className="row g-2 mb-2">
              <div className="col-6">
                <small className="text-muted">Price</small>
                <strong className="text-primary h5 d-block">{formatPrice(product.price)}</strong>
              </div>
              <div className="col-6">
                <small className="text-muted">Stock</small>
                <strong className="text-dark">{product.stock || 'Available'}</strong>
              </div>
            </div>
            {product.description && (
              <Card.Text className={styles.cardText}>
                {product.description.length > 100
                  ? product.description.slice(0, 100) + '...'
                  : product.description}
              </Card.Text>
            )}
          </div>

          <div className="mt-auto">
            <Link
              to={`/products/${product._id}`}
              className={`btn ${isAvailable ? 'btn-primary' : 'btn-outline-secondary'} w-100`}
            >
              <i className={`fas ${isAvailable ? 'fa-shopping-cart' : 'fa-info-circle'} me-2`} />
              {isAvailable ? 'View Product' : 'Out of Stock'}
            </Link>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;
