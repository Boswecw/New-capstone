// client/src/components/ProductCard.js
import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button } from 'react-bootstrap';
import SafeImage from './SafeImage';

const ProductCard = ({ product, showAddToCart = true, className }) => {
  return (
    <Card className={className || ''}>
      <div style={{ height: 220, overflow: 'hidden' }}>
        <SafeImage
          src={product.image || product.imagePath || product.imageUrl}
          entityType="product"
        />
      </div>
      <Card.Body>
        <Card.Title>{product.name}</Card.Title>
        <Card.Text className="text-muted mb-2">{product.description}</Card.Text>
        {showAddToCart && <Button variant="primary">Add to Cart</Button>}
      </Card.Body>
    </Card>
  );
};

ProductCard.propTypes = {
  product: PropTypes.object.isRequired,
  showAddToCart: PropTypes.bool,
  className: PropTypes.string,
};

export default ProductCard;
