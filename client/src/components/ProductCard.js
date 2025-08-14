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
          // products JSON has product.image = "product/<filename>"
          item={product}
          src={product.image || product.imagePath || product.imageUrl}
          entityType="product"
          category={product.category}
          alt={`${product.name || 'Product'} image`}
          imgProps={{ style: { objectFit: 'cover', width: '100%', height: '100%' } }}
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
