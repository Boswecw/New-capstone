// client/src/pages/Browse.js - FIXED VERSION WITH PROPER SYNTAX (no unused vars)

import React, { useCallback } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  Badge, 
  Spinner, 
  Alert,
  Pagination,
  Dropdown
} from 'react-bootstrap';
import PetCard from '../components/PetCard';
import { usePetFilters } from '../hooks/usePetFilters';

const Browse = () => {
  const {
    results: pets,
    loading,
    error,
    pagination,
    totalResults,
    hasResults,
    filters,
    activeFiltersCount,
    setFilter,
    setSort,
    setPage,
    clearFilters,
    refetch
  } = usePetFilters();

  // ✅ FIXED: Filter handlers that reset page to 1 (handled in hook)
  const handleFilterChange = useCallback((key, value) => {
    setFilter(key, value);
    // Page reset is handled automatically in usePetFilters
  }, [setFilter]);

  // ✅ FIXED: Sort handler that resets page to 1 (handled in hook)
  const handleSortChange = useCallback((sortValue) => {
    setSort(sortValue);
    // Page reset is handled automatically in usePetFilters
  }, [setSort]);

  // ✅ IMPROVED: Page change with bounds checking
  const handlePageChange = useCallback((pageNumber) => {
    const total = Number(pagination?.totalPages || 1);
    const safePage = Math.max(1, Math.min(pageNumber, total));
    setPage(safePage);
  }, [setPage, pagination?.totalPages]);

  // ✅ IMPROVED: Safe pagination values with defaults
  const currentPage = Number(pagination?.currentPage || 1);
  const totalPages = Number(pagination?.totalPages || 1);

  // Helper function to get sort display text
  const getSortDisplayText = (sortValue) => {
    switch (sortValue) {
      case 'newest': return 'Newest First';
      case 'oldest': return 'Oldest First';
      case 'name': return 'Name A-Z';
      case 'type': return 'Pet Type';
      case 'featured': return 'Featured First';
      default: return 'Newest First';
    }
  };

  // Render pagination items with safe bounds
  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => i !== currentPage && handlePageChange(i)} // ✅ No-op if same page
        >
          {i}
        </Pagination.Item>
      );
    }

    return items;
  };

  return (
    <Container className="py-4">
      <Row>
        {/* Sidebar Filters */}
        <Col lg={3} className="mb-4">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-filter me-2"></i>
                Filters
              </h5>
              {activeFiltersCount > 0 && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={clearFilters}
                >
                  Clear All ({activeFiltersCount})
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              {/* Search */}
              <div className="mb-3">
                <Form.Label>Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search pets..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>

              {/* Type Filter */}
              <div className="mb-3">
                <Form.Label>Pet Type</Form.Label>
                <Form.Select
                  value={filters.type || 'all'}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="dog">Dogs</option>
                  <option value="cat">Cats</option>
                  <option value="bird">Birds</option>
                  <option value="fish">Fish</option>
                  <option value="rabbit">Rabbits</option>
                  <option value="hamster">Hamsters</option>
                  <option value="small-pet">Small Pets</option>
                  <option value="other">Other</option>
                </Form.Select>
              </div>

              {/* Size Filter */}
              <div className="mb-3">
                <Form.Label>Size</Form.Label>
                <Form.Select
                  value={filters.size || 'all'}
                  onChange={(e) => handleFilterChange('size', e.target.value)}
                >
                  <option value="all">All Sizes</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="extra-large">Extra Large</option>
                </Form.Select>
              </div>

              {/* Gender Filter */}
              <div className="mb-3">
                <Form.Label>Gender</Form.Label>
                <Form.Select
                  value={filters.gender || 'all'}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                >
                  <option value="all">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="unknown">Unknown</option>
                </Form.Select>
              </div>

              {/* Age Filter */}
              <div className="mb-3">
                <Form.Label>Age Group</Form.Label>
                <Form.Select
                  value={filters.age || 'all'}
                  onChange={(e) => handleFilterChange('age', e.target.value)}
                >
                  <option value="all">All Ages</option>
                  <option value="young">Young (Under 1 year)</option>
                  <option value="adult">Adult (1-7 years)</option>
                  <option value="senior">Senior (7+ years)</option>
                </Form.Select>
              </div>

              {/* Status Filter */}
              <div className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={filters.status || 'available'}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="available">Available</option>
                  <option value="pending">Pending</option>
                  <option value="adopted">Adopted</option>
                  <option value="all">All Statuses</option>
                </Form.Select>
              </div>

              {/* Featured Toggle */}
              <div className="mb-3">
                <Form.Check
                  type="switch"
                  id="featured-toggle"
                  label="Featured Pets Only"
                  checked={filters.featured === true}
                  onChange={(e) => handleFilterChange('featured', e.target.checked ? 'true' : null)}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Main Content */}
        <Col lg={9}>
          {/* Header with Sort and Results Info */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2>
                <i className="fas fa-paw me-2 text-primary"></i>
                Browse Pets
              </h2>
              <div className="text-muted">
                {loading ? (
                  'Loading...'
                ) : error ? (
                  'Error loading pets'
                ) : (
                  <>
                    {totalResults} pet{totalResults !== 1 ? 's' : ''} found
                    {activeFiltersCount > 0 && (
                      <Badge bg="primary" className="ms-2">
                        {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Sort Dropdown */}
            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary" size="sm">
                <i className="fas fa-sort me-1"></i>
                Sort: {getSortDisplayText(filters.sort)}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => handleSortChange('newest')}>
                  Newest First
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleSortChange('oldest')}>
                  Oldest First
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleSortChange('name')}>
                  Name A-Z
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleSortChange('type')}>
                  Pet Type
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleSortChange('featured')}>
                  Featured First
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>

          {/* Error State */}
          {error && (
            <Alert variant="danger" className="mb-4">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
              <div className="mt-2">
                <Button variant="outline-danger" size="sm" onClick={refetch}>
                  <i className="fas fa-redo me-1"></i>
                  Try Again
                </Button>
              </div>
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <div className="text-muted">Loading pets...</div>
            </div>
          )}

          {/* No Results */}
          {!loading && !error && !hasResults && (
            <div className="text-center py-5">
              <i className="fas fa-search fa-3x text-muted mb-3"></i>
              <h4 className="text-muted">No pets found</h4>
              <p className="text-muted mb-4">
                Try adjusting your search criteria or clearing filters.
              </p>
              {activeFiltersCount > 0 && (
                <Button variant="primary" onClick={clearFilters}>
                  <i className="fas fa-times me-1"></i>
                  Clear All Filters
                </Button>
              )}
            </div>
          )}

          {/* Pet Results Grid */}
          {!loading && !error && hasResults && (
            <>
              <Row className="g-4 mb-4">
                {pets.map((pet) => (
                  <Col key={pet._id} sm={6} lg={4}>
                    <PetCard
                      pet={pet}
                      showFavoriteButton={true}
                      showAdoptionStatus={true}
                    />
                  </Col>
                ))}
              </Row>

              {/* ✅ FIXED: Pagination with safe defaults and proper bounds checking */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center">
                  <Pagination>
                    <Pagination.First
                      disabled={currentPage <= 1}
                      onClick={() => handlePageChange(1)}
                    />
                    <Pagination.Prev
                      disabled={currentPage <= 1}
                      onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    />
                    
                    {renderPaginationItems()}
                    
                    <Pagination.Next
                      disabled={currentPage >= totalPages}
                      onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    />
                    <Pagination.Last
                      disabled={currentPage >= totalPages}
                      onClick={() => handlePageChange(totalPages)}
                    />
                  </Pagination>
                </div>
              )}

              {/* Results Summary */}
              <div className="text-center text-muted mt-3">
                Showing {pets.length} of {totalResults} pets
                {totalPages > 1 && (
                  <span> (Page {currentPage} of {totalPages})</span>
                )}
              </div>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Browse;
