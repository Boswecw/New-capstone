// components/ProductCard.js
// ProductCard.js – Updated to use Card.module.css
import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import styles from './Card.module.css';

const ProductCard = ({ product }) => {
  if (!product) return null;

  const formatPrice = (price) => {
    return typeof price === 'number'
      ? `$${price.toFixed(2)}`
      : '$0.00';
  };

  return (
    <Card className="h-100 shadow-sm">
      <div className={styles.cardImgContainer}>
        <Card.Img
          variant="top"
          src={product.imageUrl || 'https://via.placeholder.com/300x200?text=Product+Image'}
          alt={product.name || 'Product Image'}
          className={styles.cardImgTop}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x200?text=Product+Image';
          }}
        />
      </div>
      <Card.Body className="d-flex flex-column">
        <Card.Title className="d-flex align-items-center">
          <i className="fas fa-box-open me-2 text-primary"></i>
          {product.name || 'Unnamed Product'}
        </Card.Title>
        <Card.Text className="text-muted flex-grow-1">
          {product.description || 'No description available.'}
        </Card.Text>
        <div className="d-flex justify-content-between align-items-center mt-auto">
          <span className="h5 text-primary mb-0">
            {formatPrice(product.price)}
          </span>
          <Button
            as={Link}
            to={`/products/${product._id}`}
            variant="outline-primary"
            size="sm"
          >
            View Details
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;
