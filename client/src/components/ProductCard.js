import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import styles from './Card.module.css'; // Make sure this path is correct

const ProductCard = ({ product, imageUrl }) => {
  const formatPrice = (price) =>
    typeof price === 'number' ? `$${price.toFixed(2)}` : 'N/A';

  return (
    <Card className={`h-100 shadow-sm ${styles.card}`}>
      <div className={styles.productImgContainer}>
        <Card.Img
          src={imageUrl || 'https://via.placeholder.com/300x200?text=Product+Image'}
          alt={product.name || 'Product Image'}
          className={styles.productImg}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x200?text=Product+Image';
          }}
        />
      </div>

      <Card.Body className={`d-flex flex-column ${styles.cardBody}`}>
        <Card.Title className={styles.cardTitle}>
          {product.name || 'Unnamed Product'}
        </Card.Title>
        <Card.Text className={`${styles.cardText} flex-grow-1`}>
          {product.description || 'No description available'}
        </Card.Text>
        <div className="d-flex justify-content-between align-items-center">
          <span className="text-success fw-bold">{formatPrice(product.price)}</span>
          <Button
            as={Link}
            to={`/products/${product._id}`}
            variant="outline-primary"
            size="sm"
          >
            View
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;
