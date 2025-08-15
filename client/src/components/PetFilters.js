
// client/src/components/PetFilters.js
import React from 'react';
import { Card, Form, Button, Badge, Row, Col, Accordion } from 'react-bootstrap';
import { usePetFilters } from '../hooks/usePetFilters';

const PetFilters = () => {
  const {
    filters,
    setFilter,
    clearFilters,
    filterCounts,
    activeFilterCount,
    loading,
    totalResults,
    lastSearchTime
  } = usePetFilters();

  // ✅ ENHANCED: Filter option builder with counts
  const buildFilterOptions = (type, counts = {}) => {
    const options = [{ value: 'all', label: 'All', count: totalResults }];
    
    Object.entries(counts).forEach(([value, count]) => {
      if (value && count > 0) {
        options.push({
          value,
          label: value.charAt(0).toUpperCase() + value.slice(1),
          count
        });
      }
    });
    
    return options.sort((a, b) => {
      if (a.value === 'all') return -1;
      if (b.value === 'all') return 1;
      return b.count - a.count; // Sort by count descending
    });
  };

  return (
    <Card className="filter-panel mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0">Filter Pets</h5>
          {totalResults > 0 && (
            <small className="text-muted">
              {totalResults} pets found
              {lastSearchTime > 0 && ` (${lastSearchTime}ms)`}
            </small>
          )}
        </div>
        <div>
          {activeFilterCount > 0 && (
            <Badge bg="primary" className="me-2">
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}
            </Badge>
          )}
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={clearFilters}
            disabled={activeFilterCount === 0 || loading}
          >
            Clear All
          </Button>
        </div>
      </Card.Header>

      <Card.Body>
        {/* Search Input */}
        <Form.Group className="mb-3">
          <Form.Label>Search</Form.Label>
          <Form.Control
            type="text"
            placeholder="Search by name, breed, or description..."
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            disabled={loading}
          />
        </Form.Group>

        {/* Quick Filters */}
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={filters.category}
                onChange={(e) => setFilter('category', e.target.value)}
                disabled={loading}
              >
                {buildFilterOptions('categories', filterCounts.categories).map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          
          <Col md={6}>
            <Form.Group>
              <Form.Label>Type</Form.Label>
              <Form.Select
                value={filters.type}
                onChange={(e) => setFilter('type', e.target.value)}
                disabled={loading}
              >
                {buildFilterOptions('types', filterCounts.types).map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        {/* Advanced Filters */}
        <Accordion>
          <Accordion.Item eventKey="0">
            <Accordion.Header>Advanced Filters</Accordion.Header>
            <Accordion.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Size</Form.Label>
                    <Form.Select
                      value={filters.size}
                      onChange={(e) => setFilter('size', e.target.value)}
                      disabled={loading}
                    >
                      {buildFilterOptions('sizes', filterCounts.sizes).map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label} ({option.count})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Gender</Form.Label>
                    <Form.Select
                      value={filters.gender}
                      onChange={(e) => setFilter('gender', e.target.value)}
                      disabled={loading}
                    >
                      {buildFilterOptions('genders', filterCounts.genders).map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label} ({option.count})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {/* Featured Toggle */}
              <Form.Check
                type="checkbox"
                label="Featured pets only"
                checked={filters.featured === true}
                onChange={(e) => setFilter('featured', e.target.checked ? true : null)}
                disabled={loading}
              />
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        {/* Loading indicator */}
        {loading && (
          <div className="text-center mt-3">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Filtering...</span>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default PetFilters;
