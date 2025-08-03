
import React from 'react';
import { Badge, Button } from 'react-bootstrap';

const BrowseHeader = ({ config, filters, totalCount, onReset, onQuickAction }) => {
  const getActiveFilterBadges = () => {
    const badges = [];
    
    Object.entries(filters || {}).forEach(([key, value]) => {
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
              ⭐ Featured
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

  // ✅ FIX: Handle both string and function subtitles safely
  const getSubtitle = () => {
    if (!config?.subtitle) return '';
    
    // If subtitle is a function, call it with totalCount
    if (typeof config.subtitle === 'function') {
      return config.subtitle(totalCount || 0);
    }
    
    // If subtitle is a string, use it directly
    return config.subtitle;
  };

  // ✅ FIX: Safe defaults for config
  const safeConfig = {
    title: config?.title || 'Browse Items',
    subtitle: getSubtitle(),
    icon: config?.icon || 'fas fa-list',
    quickActions: config?.quickActions || []
  };

  return (
    <div className="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 className="h2 mb-2">
          <i className={`${safeConfig.icon} me-2`}></i>
          {safeConfig.title}
          {getActiveFilterBadges()}
        </h1>
        {safeConfig.subtitle && (
          <p className="text-muted mb-0">
            {safeConfig.subtitle}
          </p>
        )}
      </div>
      
      {safeConfig.quickActions.length > 0 && (
        <div className="d-flex gap-2">
          {safeConfig.quickActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'outline-primary'}
              size="sm"
              onClick={() => onQuickAction?.(action.action)}
            >
              {action.icon && <i className={`fas fa-${action.icon} me-1`}></i>}
              {action.text || action.label}
            </Button>
          ))}
          
          {/* Reset button */}
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={onReset}
          >
            <i className="fas fa-undo me-1"></i>
            Reset
          </Button>
        </div>
      )}
    </div>
  );
};

export default BrowseHeader;