
// client/src/components/browse/FilterSidebar.js
import React from 'react';
import { Card, Form } from 'react-bootstrap';

const FilterSidebar = ({ config, filters, stats, onFilterChange, onSearch }) => {
  const renderFilterInput = (key, filterConfig) => {
    const value = filters[key] || '';
    
    switch (filterConfig.type) {
      case 'text':
        return (
          <Form.Control
            type="text"
            placeholder={filterConfig.placeholder}
            value={value}
            onChange={(e) => key === 'search' ? onSearch(e.target.value) : onFilterChange(key, e.target.value)}
          />
        );
      
      case 'select':
        return (
          <Form.Select
            value={value}
            onChange={(e) => onFilterChange(key, e.target.value)}
          >
            {filterConfig.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h6 className="mb-0">
            <i className="fas fa-filter me-2"></i>
            Filters
          </h6>
        </Card.Header>
        <Card.Body className="p-3">
          {Object.entries(config).map(([key, filterConfig]) => (
            <Form.Group key={key} className="mb-3">
              <Form.Label className="fw-bold small">
                {filterConfig.label}
              </Form.Label>
              {renderFilterInput(key, filterConfig)}
            </Form.Group>
          ))}
        </Card.Body>
      </Card>

      {/* Stats Card */}
      {stats && Object.keys(stats).length > 0 && (
        <Card className="shadow-sm mt-3">
          <Card.Header>
            <h6 className="mb-0">
              <i className="fas fa-chart-bar me-2"></i>
              Quick Stats
            </h6>
          </Card.Header>
          <Card.Body className="p-3">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="d-flex justify-content-between mb-1">
                <small className="text-muted">{key}:</small>
                <small className="fw-bold">{value}</small>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}
    </>
  );
};

export default FilterSidebar;