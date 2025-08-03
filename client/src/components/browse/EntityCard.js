// client/src/components/browse/EntityCard.js - FIXED VERSION
import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import SafeImage from '../SafeImage';

const EntityCard = ({
  item,
  imageCategory,
  titleField,
  subtitleFields = [],
  priceField,
  badgeField,
  statusLogic,
  showFavoriteButton = false,
  showAddToCart = false,
  showPrice = false,
  onClick
}) => {
  // ✅ FIX: Add null/undefined checks for item
  if (!item) {
    console.warn('EntityCard: item prop is undefined');
    return (
      <Card className="h-100">
        <Card.Body className="d-flex align-items-center justify-content-center">
          <div className="text-muted">Loading...</div>
        </Card.Body>
      </Card>
    );
  }

  // ✅ FIX: Safely access properties with fallbacks
  const status = statusLogic ? statusLogic(item) : null;
  const title = item[titleField] || 'Unnamed';
  const subtitle = subtitleFields
    .map(field => item[field])
    .filter(Boolean)
    .join(' • ');
  const price = priceField ? item[priceField] : null;
  
  // ✅ FIX: Safe access to badgeField (this was likely line 31)
  const badge = badgeField ? item[badgeField] : null;

  return (
    <Card className="h-100 shadow-sm border-0" onClick={onClick}>
      {/* Image Section */}
      <div style={{ height: '200px', overflow: 'hidden' }}>
        <SafeImage
          src={item.imageUrl || item.image}
          fallbackCategory={imageCategory || item.type || 'default'}
          alt={title}
          className="card-img-top"
          style={{
            height: '100%',
            width: '100%',
            objectFit: 'cover'
          }}
        />
      </div>

      {/* Card Body */}
      <Card.Body className="d-flex flex-column">
        {/* Title */}
        <Card.Title className="mb-2 fw-bold">
          {title}
        </Card.Title>

        {/* Subtitle */}
        {subtitle && (
          <Card.Text className="text-muted small mb-2">
            {subtitle}
          </Card.Text>
        )}

        {/* Badge */}
        {badge && (
          <div className="mb-2">
            <Badge bg="primary" className="me-1">
              {badge}
            </Badge>
          </div>
        )}

        {/* Status Badge */}
        {status && (
          <div className="mb-2">
            <Badge 
              bg={status.available ? 'success' : 'warning'}
              className="me-1"
            >
              {status.available ? 'Available' : 'Pending'}
            </Badge>
          </div>
        )}

        {/* Price */}
        {showPrice && price && (
          <div className="mb-2">
            <span className="fw-bold text-success">
              ${price}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-auto">
          {showFavoriteButton && (
            <Button
              variant="outline-danger"
              size="sm"
              className="me-2"
            >
              <i className="fas fa-heart"></i>
            </Button>
          )}
          
          {showAddToCart && (
            <Button
              variant="primary"
              size="sm"
            >
              <i className="fas fa-cart-plus me-1"></i>
              Add to Cart
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default EntityCard;