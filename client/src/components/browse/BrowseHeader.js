// client/src/components/browse/BrowseHeader.js - FULLY UPDATED

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

  const getSubtitle = () => {
    if (!config?.subtitle) return '';
    return typeof config.subtitle === 'function'
      ? config.subtitle(totalCount || 0)
      : config.subtitle;
  };

  const safeConfig = {
    title: config?.title || 'Browse Items',
    subtitle: getSubtitle(),
    icon: config?.icon || 'fas fa-list',
    quickActions: config?.quickActions || []
  };

  const isActive = (actionId) => {
    const match = safeConfig.quickActions.find((a) => a.action === actionId);
    if (!match || !match.filters) return false;

    return Object.entries(match.filters).every(([key, val]) => filters[key] === val);
  };

  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap mb-3">
        <div className="me-3">
          <h1 className="h2 mb-2">
            <i className={`${safeConfig.icon} me-2`}></i>
            {safeConfig.title}
            {getActiveFilterBadges()}
          </h1>
          {safeConfig.subtitle && (
            <p className="text-muted mb-0">{safeConfig.subtitle}</p>
          )}
        </div>

        {safeConfig.quickActions.length > 0 && (
          <div className="d-flex flex-wrap gap-2 justify-content-start justify-content-md-end mt-3 mt-md-0">
            {safeConfig.quickActions.map((action, index) => (
              <Button
                key={index}
                variant={isActive(action.action) ? 'primary' : (action.variant || 'outline-primary')}
                size="sm"
                onClick={() => onQuickAction?.(action)}
              >
                {action.icon && <span className="me-1">{action.icon}</span>}
                {action.text || action.label}
              </Button>
            ))}
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
    </div>
  );
};

export default BrowseHeader;
