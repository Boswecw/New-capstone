import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import styles from './Card.module.css';

const ProductCard = ({ product }) => {
  // ✅ FIXED: Self-sufficient - get imageUrl from product object like PetCard
  const getImageUrl = () => {
    if (!product) return 'https://via.placeholder.com/300x200?text=Product+Image';
    
    // Try multiple image fields from the API response
    const imageUrl = product.imageUrl || product.image;
    
    if (!imageUrl) {
      return 'https://via.placeholder.com/300x200?text=Product+Image';
    }
    
    // If it's already a full URL, use it
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // If it's just a path, construct the full URL
    return `https://storage.googleapis.com/furbabies-petstore/${imageUrl}`;
  };

  const formatPrice = (price) =>
    typeof price === 'number' ? `${price.toFixed(2)}` : 'N/A';

  return (
    <Card className={`h-100 shadow-sm ${styles.card}`}>
      {/* ✅ FIXED: Use CSS module classes - no inline styles */}
      <div className={styles.productImgContainer}>
        <Card.Img
          src={getImageUrl()}
          alt={product.title || product.name || 'Product Image'}
          className={styles.productImg}
          onError={(e) => {
            console.log('🚫 Product image failed to load:', e.target.src);
            e.target.src = 'https://via.placeholder.com/300x200?text=Product+Image';
          }}
          onLoad={(e) => {
            console.log('🖼️ Product image loaded:', product.title || product.name);
          }}
        />
      </div>

      <Card.Body className={`d-flex flex-column ${styles.cardBody}`}>
        <Card.Title className={styles.cardTitle}>
          {product.title || product.name || 'Unnamed Product'}
        </Card.Title>
        
        <Card.Text className={`${styles.cardText} flex-grow-1`}>
          {product.description || 'High-quality product for your beloved pets'}
        </Card.Text>
        
        <div className="d-flex justify-content-between align-items-center mt-auto">
          <span className="text-success fw-bold fs-5">
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