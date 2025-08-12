// client/src/pages/Browse.js - INTEGRATED WITH usePetFilters
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Alert, 
  Card,
  Form,
  Button,
  Badge,
  ButtonGroup,
  Spinner,
  Pagination,
  InputGroup
} from 'react-bootstrap';
import { usePetFilters } from '../hooks/usePetFilters';
import PetCard from '../components/PetCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Browse = () => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [showFilters, setShowFilters] = useState(true);

  const {
    filters,
    results: pets,
    loading,
    error,
    pagination,
    filterCounts,
    activeFilterCount,
    lastSearchTime,
    setFilter,
    clearFilters,
    setPage,
    setSort,
    hasResults,
    hasFilters,
    totalResults
  } = usePetFilters();

  useEffect(() => {
    // Simple delay to show initial spinner only on first load
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Show initial loading spinner
  if (isInitialLoading) {
    return <LoadingSpinner message="Loading available pets..." noContainer />;
  }

  const handleFilterChange = (key, value) => {
    setFilter(key, value);
  };

  const handleClearFilters = () => {
    clearFilters();
  };

  const handlePageChange = (page) => {
    setPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (sortValue) => {
    setSort(sortValue);
  };

  // Filter options
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'dog', label: 'Dogs' },
    { value: 'cat', label: 'Cats' },
    { value: 'bird', label: 'Birds' },
    { value: 'fish', label: 'Fish' },
    { value: 'small-pet', label: 'Small Pets' },
    { value: 'reptile', label: 'Reptiles' }
  ];

  const sizeOptions = [
    { value: 'all', label: 'All Sizes' },
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'extra-large', label: 'Extra Large' }
  ];

  const genderOptions = [
    { value: 'all', label: 'Any Gender' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' }
  ];

  const ageOptions = [
    { value: 'all', label: 'All Ages' },
    { value: 'puppy', label: 'Puppy/Kitten' },
    { value: 'young', label: 'Young' },
    { value: 'adult', label: 'Adult' },
    { value: 'senior', label: 'Senior' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'name-asc', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' },
    { value: 'age-asc', label: 'Age: Young to Old' },
    { value: 'age-desc', label: 'Age: Old to Young' }
  ];

  return (
    <div className="browse-page">
      {/* Header */}
      <Container className="py-3">
        <Row>
          <Col>
            <Alert variant="info" className="mb-4">
              <i className="fas fa-info-circle me-2"></i>
              Browse our available pets and find your perfect companion!
              {totalResults > 0 && (
                <Badge bg="primary" className="ms-2">
                  {totalResults} pets available
                </Badge>
              )}
            </Alert>
          </Col>
        </Row>

        {/* Filter Toggle & Results Summary */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <i className={`fas fa-filter me-2`}></i>
                  {showFilters ? 'Hide' : 'Show'} Filters
                  {activeFilterCount > 0 && (
                    <Badge bg="primary" className="ms-2">{activeFilterCount}</Badge>
                  )}
                </Button>

                {hasFilters && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleClearFilters}
                  >
                    <i className="fas fa-times me-2"></i>
                    Clear All Filters
                  </Button>
                )}

                {lastSearchTime > 0 && (
                  <small className="text-muted">
                    Search completed in {lastSearchTime}ms
                  </small>
                )}
              </div>

              {/* View Mode & Sort */}
              <div className="d-flex align-items-center gap-3">
                <ButtonGroup size="sm">
                  <Button
                    variant={viewMode === 'grid' ? 'primary' : 'outline-primary'}
                    onClick={() => setViewMode('grid')}
                  >
                    <i className="fas fa-th"></i>
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'primary' : 'outline-primary'}
                    onClick={() => setViewMode('list')}
                  >
                    <i className="fas fa-list"></i>
                  </Button>
                </ButtonGroup>

                <Form.Select
                  size="sm"
                  value={filters.sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      <Container fluid>
        <Row>
          {/* Filters Sidebar */}
          {showFilters && (
            <Col lg={3} className="mb-4">
              <Card className="sticky-top" style={{ top: '20px' }}>
                <Card.Header>
                  <h5 className="mb-0">
                    <i className="fas fa-search me-2"></i>
                    Search & Filters
                  </h5>
                </Card.Header>
                <Card.Body>
                  {/* Search */}
                  <div className="mb-3">
                    <Form.Label>Search</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Search by name, breed..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                      />
                      <InputGroup.Text>
                        <i className="fas fa-search"></i>
                      </InputGroup.Text>
                    </InputGroup>
                  </div>

                  {/* Category */}
                  <div className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                      {categoryOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                          {filterCounts[option.value] && filterCounts[option.value] > 0 && 
                            ` (${filterCounts[option.value]})`
                          }
                        </option>
                      ))}
                    </Form.Select>
                  </div>

                  {/* Size */}
                  <div className="mb-3">
                    <Form.Label>Size</Form.Label>
                    <Form.Select
                      value={filters.size}
                      onChange={(e) => handleFilterChange('size', e.target.value)}
                    >
                      {sizeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Form.Select>
                  </div>

                  {/* Gender */}
                  <div className="mb-3">
                    <Form.Label>Gender</Form.Label>
                    <Form.Select
                      value={filters.gender}
                      onChange={(e) => handleFilterChange('gender', e.target.value)}
                    >
                      {genderOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Form.Select>
                  </div>

                  {/* Age */}
                  <div className="mb-3">
                    <Form.Label>Age Group</Form.Label>
                    <Form.Select
                      value={filters.age}
                      onChange={(e) => handleFilterChange('age', e.target.value)}
                    >
                      {ageOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Form.Select>
                  </div>

                  {/* Featured Only */}
                  <div className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="featured-only"
                      label="Featured pets only"
                      checked={filters.featured === true}
                      onChange={(e) => handleFilterChange('featured', e.target.checked ? true : null)}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          )}

          {/* Results */}
          <Col lg={showFilters ? 9 : 12}>
            <Container>
              {/* Loading State */}
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">Searching for pets...</p>
                </div>
              ) : error ? (
                /* Error State */
                <Alert variant="danger" className="text-center">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              ) : hasResults ? (
                /* Results */
                <>
                  {/* Results Header */}
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4>
                      {totalResults} Pet{totalResults !== 1 ? 's' : ''} Found
                      {hasFilters && (
                        <small className="text-muted ms-2">
                          (filtered results)
                        </small>
                      )}
                    </h4>
                    <small className="text-muted">
                      Page {pagination.currentPage || 1} of {pagination.totalPages || 1}
                    </small>
                  </div>

                  {/* Pet Grid/List */}
                  <Row className={viewMode === 'grid' ? 'g-4' : 'g-2'}>
                    {pets.map(pet => (
                      <Col 
                        key={pet._id} 
                        xs={12} 
                        sm={viewMode === 'grid' ? 6 : 12}
                        md={viewMode === 'grid' ? 4 : 12}
                        lg={viewMode === 'grid' ? 4 : 12}
                        xl={viewMode === 'grid' ? 3 : 12}
                      >
                        <PetCard 
                          pet={pet} 
                          viewMode={viewMode}
                          showFullDetails={viewMode === 'list'}
                        />
                      </Col>
                    ))}
                  </Row>

                  {/* Fixed Pagination */}
                  {pagination?.totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-5">
                      <Pagination>
                        <Pagination.First
                          disabled={pagination.currentPage === 1}
                          onClick={() => handlePageChange(1)}
                        />
                        <Pagination.Prev
                          disabled={pagination.currentPage === 1}
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                        />

                        {/* Fixed Page Numbers with proper validation */}
                        {(() => {
                          const currentPage = pagination.currentPage || 1;
                          const totalPages = pagination.totalPages || 1;
                          const maxVisiblePages = Math.min(totalPages, 5);
                          
                          return [...Array(maxVisiblePages)].map((_, index) => {
                            const pageNum = currentPage <= 3 
                              ? index + 1 
                              : currentPage - 2 + index;
                            
                            // Ensure pageNum is valid
                            if (pageNum > totalPages || pageNum < 1 || isNaN(pageNum)) return null;

                            return (
                              <Pagination.Item
                                key={`page-${pageNum}`}
                                active={pageNum === currentPage}
                                onClick={() => handlePageChange(pageNum)}
                              >
                                {pageNum}
                              </Pagination.Item>
                            );
                          }).filter(Boolean);
                        })()}

                        <Pagination.Next
                          disabled={pagination.currentPage === pagination.totalPages}
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                        />
                        <Pagination.Last
                          disabled={pagination.currentPage === pagination.totalPages}
                          onClick={() => handlePageChange(pagination.totalPages)}
                        />
                      </Pagination>
                    </div>
                  )}
                </>
              ) : (
                /* No Results */
                <div className="text-center py-5">
                  <i className="fas fa-search fa-3x text-muted mb-3"></i>
                  <h4>No pets found</h4>
                  <p className="text-muted">
                    {hasFilters 
                      ? "Try adjusting your filters to see more results."
                      : "There are no pets available at the moment."
                    }
                  </p>
                  {hasFilters && (
                    <Button variant="outline-primary" onClick={handleClearFilters}>
                      <i className="fas fa-times me-2"></i>
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}
            </Container>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Browse;