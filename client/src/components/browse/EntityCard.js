
// client/src/components/browse/EntityCard.js - CLEAN VERSION
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
  const status = statusLogic ? statusLogic(item) : null;
  const title = item[titleField] || 'Unnamed';
  const subtitle = subtitleFields.map(field => item[field]).filter(Boolean).join(' • ');
  const price = priceField ? item[priceField] : null;
  const badge = badgeField ? item[badgeField] : null;

  return (
    <Card className="entity-card h-100 shadow-sm" style={{ cursor: 'pointer' }}>
      <div onClick={() => onClick && onClick(item._id)}>
        {/* Image container */}
        <div className="entity-card-image-container">
          <SafeImage
            item={item}
            category={imageCategory}
            size="card"
            className="entity-card-image"
            alt={title}
            showLoader={true}
          />
          
          {/* Hover overlay */}
          <div className="entity-card-overlay">
            <div className="entity-card-overlay-content">
              <i className="fas fa-eye"></i>
              <span>View Details</span>
            </div>
          </div>
        </div>

        {/* Card body */}
        <Card.Body className="d-flex flex-column">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div>
              {badge && (
                <Badge bg="secondary" className="mb-1">
                  {badge.charAt(0).toUpperCase() + badge.slice(1)}
                </Badge>
              )}
            </div>
            {status && (
              <Badge bg={status.variant}>
                <i className={`fas fa-${status.icon} me-1`}></i>
                {status.text}
              </Badge>
            )}
          </div>

          {/* Title and subtitle */}
          <h5 className="card-title mb-1">{title}</h5>
          {subtitle && (
            <p className="card-text text-muted small mb-2">{subtitle}</p>
          )}

          {/* Price */}
          {showPrice && price && (
            <div className="mb-2">
              <span className="h5 text-primary">${price}</span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-auto pt-2">
            <div className="d-flex gap-2">
              {showFavoriteButton && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle favorite
                  }}
                >
                  <i className="far fa-heart"></i>
                </Button>
              )}
              
              {showAddToCart && (
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-grow-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle add to cart
                  }}
                >
                  <i className="fas fa-shopping-cart me-1"></i>
                  Add to Cart
                </Button>
              )}
            </div>
          </div>
        </Card.Body>
      </div>
    </Card>
  );
};

export default EntityCard;