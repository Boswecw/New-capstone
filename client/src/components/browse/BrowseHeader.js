
// client/src/components/browse/BrowseHeader.js
import React from 'react';
import { Badge, Button } from 'react-bootstrap';

const BrowseHeader = ({ config, filters, totalCount, onReset, onQuickAction }) => {
  const getActiveFilterBadges = () => {
    const badges = [];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        if (key === 'search') {
          badges.push(
            <Badge key={key} bg="info" className="ms-2">
              "{value}"
            </Badge>
          );
        } else if (key === 'featured' && value === 'true') {
          badges.push(
            <Badge key={key} bg="warning" className="ms-2">
              <i className="fas fa-star me-1"></i>Featured
            </Badge>
          );
        } else {
          badges.push(
            <Badge key={key} bg="primary" className="ms-2">
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </Badge>
          );
        }
      }
    });
    
    return badges;
  };

  return (
    <div className="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 className="h2 mb-2">
          <i className={`${config.icon} me-2`}></i>
          {config.title}
          {getActiveFilterBadges()}
        </h1>
        <p className="text-muted mb-0">
          {config.subtitle(totalCount)}
        </p>
      </div>
      
      <div className="d-flex gap-2">
        {config.quickActions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant}
            size="sm"
            onClick={() => onQuickAction(action.action)}
          >
            <i className={`fas fa-${action.icon} me-1`}></i>
            {action.text}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default BrowseHeader;