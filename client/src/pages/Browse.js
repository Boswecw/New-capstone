// client/src/pages/Browse.js - WITH SAFE URL SYNC IMPLEMENTED
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Alert, Card, Form, Button, Badge,
  ButtonGroup, Spinner, Pagination, InputGroup
} from 'react-bootstrap';
import { usePetFilters } from '../hooks/usePetFilters';
import { useURLSync } from '../hooks/useURLSync';
import PetCard from '../components/PetCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Browse = () => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(true); // ✅ USED: Toggle filters on mobile

  const {
    filters,
    results: pets,
    loading,
    error,
    pagination,
    filterCounts,      // ✅ USED: Show counts for each filter option
    activeFilterCount, // ✅ USED: Show number of active filters
    lastSearchTime,    // ✅ USED: Show search performance
    setFilter,
    setMultipleFilters,
    clearFilters,
    setPage,
    setSort,
    hasResults,
    hasFilters,
    totalResults
  } = usePetFilters();

  // ✅ SAFE URL SYNC: Replace inline URL sync with robust hook
  useURLSync(filters, setMultipleFilters);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    const normalized =
      ['category', 'type', 'size', 'gender', 'age', 'breed'].includes(key)
        ? (value === 'all' ? null : value)
        : key === 'search'
          ? (value?.trim() ? value.trim() : null)
          : key === 'featured'
            ? (value === 'true' ? true : value === 'false' ? false : null)
            : value;
    setFilter(key, normalized);
  }, [setFilter]);

  const handleClearFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  const handlePageChange = useCallback((page) => {
    setPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setPage]);

  const handleSortChange = useCallback((sortValue) => {
    setSort(sortValue);
  }, [setSort]);

  // ✅ USE showFilters: Toggle filters on mobile
  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  if (isInitialLoading) {
    return <LoadingSpinner message="Loading available pets..." noContainer />;
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger" className="text-center">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row>
        {/* Filter Sidebar - ✅ USES showFilters */}
        <Col lg={3} className={`mb-4 ${showFilters ? '' : 'd-none d-lg-block'}`}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                Filters
                {/* ✅ USES activeFilterCount: Show active filter count */}
                {activeFilterCount > 0 && (
                  <Badge bg="primary" className="ms-2">
                    {activeFilterCount}
                  </Badge>
                )}
              </h5>
              {hasFilters && (
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={handleClearFilters}
                >
                  Clear All
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              {/* ✅ USES InputGroup: Enhanced search with icon */}
              <Form.Group className="mb-3">
                <Form.Label>Search</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="fas fa-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search pets..."
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                  {filters.search && (
                    <Button 
                      variant="outline-secondary"
                      onClick={() => handleFilterChange('search', '')}
                    >
                      <i className="fas fa-times"></i>
                    </Button>
                  )}
                </InputGroup>
              </Form.Group>

              {/* ✅ USES filterCounts: Show counts for each filter option */}
              <Form.Group className="mb-3">
                <Form.Label>Pet Type</Form.Label>
                <Form.Select
                  value={filters.type || 'all'}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="all">
                    All Types {filterCounts?.type?.all && `(${filterCounts.type.all})`}
                  </option>
                  <option value="dog">
                    Dogs {filterCounts?.type?.dog && `(${filterCounts.type.dog})`}
                  </option>
                  <option value="cat">
                    Cats {filterCounts?.type?.cat && `(${filterCounts.type.cat})`}
                  </option>
                  <option value="bird">
                    Birds {filterCounts?.type?.bird && `(${filterCounts.type.bird})`}
                  </option>
                  <option value="fish">
                    Fish {filterCounts?.type?.fish && `(${filterCounts.type.fish})`}
                  </option>
                  <option value="rabbit">
                    Rabbits {filterCounts?.type?.rabbit && `(${filterCounts.type.rabbit})`}
                  </option>
                  <option value="hamster">
                    Hamsters {filterCounts?.type?.hamster && `(${filterCounts.type.hamster})`}
                  </option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={filters.status || 'all'}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="all">
                    All Status {filterCounts?.status?.all && `(${filterCounts.status.all})`}
                  </option>
                  <option value="available">
                    Available {filterCounts?.status?.available && `(${filterCounts.status.available})`}
                  </option>
                  <option value="adopted">
                    Adopted {filterCounts?.status?.adopted && `(${filterCounts.status.adopted})`}
                  </option>
                  <option value="pending">
                    Pending {filterCounts?.status?.pending && `(${filterCounts.status.pending})`}
                  </option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Age</Form.Label>
                <Form.Select
                  value={filters.age || 'all'}
                  onChange={(e) => handleFilterChange('age', e.target.value)}
                >
                  <option value="all">All Ages</option>
                  <option value="puppy">Puppy</option>
                  <option value="kitten">Kitten</option>
                  <option value="baby">Baby</option>
                  <option value="young">Young</option>
                  <option value="adult">Adult</option>
                  <option value="senior">Senior</option>
                  <option value="mature">Mature</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Size</Form.Label>
                <Form.Select
                  value={filters.size || 'all'}
                  onChange={(e) => handleFilterChange('size', e.target.value)}
                >
                  <option value="all">All Sizes</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
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
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label={
                    <span>
                      Featured Pets Only
                      {/* ✅ USES Badge: Show featured count */}
                      {filterCounts?.featured && (
                        <Badge bg="warning" text="dark" className="ms-2">
                          {filterCounts.featured}
                        </Badge>
                      )}
                    </span>
                  }
                  checked={filters.featured === true}
                  onChange={(e) => handleFilterChange('featured', e.target.checked ? 'true' : null)}
                />
              </Form.Group>

              {/* ✅ USES lastSearchTime: Show search performance */}
              {lastSearchTime && (
                <div className="mt-3 pt-3 border-top">
                  <small className="text-muted">
                    <i className="fas fa-clock me-1"></i>
                    Search completed in {lastSearchTime}ms
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Results */}
        <Col lg={9}>
          {/* Mobile Filter Toggle - ✅ USES showFilters */}
          <div className="d-lg-none mb-3">
            <Button 
              variant="outline-primary" 
              onClick={toggleFilters}
              className="w-100"
            >
              <i className={`fas fa-filter me-2`}></i>
              {showFilters ? 'Hide' : 'Show'} Filters
              {/* ✅ USES activeFilterCount in mobile toggle */}
              {activeFilterCount > 0 && (
                <Badge bg="primary" className="ms-2">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Results Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
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
                {/* ✅ USES lastSearchTime in results header */}
                {lastSearchTime && (
                  <span className="ms-2">
                    • Loaded in {lastSearchTime}ms
                  </span>
                )}
              </small>
            </div>

            {/* Sort and View Controls */}
            <div className="d-flex gap-3 align-items-center">
              <Form.Select
                style={{ width: '150px' }}
                value={filters.sort || 'newest'}
                onChange={(e) => handleSortChange(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
              </Form.Select>

              <ButtonGroup>
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <i className="fas fa-th"></i>
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <i className="fas fa-list"></i>
                </Button>
              </ButtonGroup>
            </div>
          </div>

          {/* Active Filters Display - ✅ USES activeFilterCount & Badge */}
          {hasFilters && (
            <div className="mb-3">
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <small className="text-muted me-2">Active filters:</small>
                {filters.search && (
                  <Badge bg="secondary" className="d-flex align-items-center">
                    Search: "{filters.search}"
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 ms-1 text-white"
                      onClick={() => handleFilterChange('search', '')}
                    >
                      <i className="fas fa-times" style={{fontSize: '10px'}}></i>
                    </Button>
                  </Badge>
                )}
                {filters.type && filters.type !== 'all' && (
                  <Badge bg="secondary" className="d-flex align-items-center">
                    Type: {filters.type}
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 ms-1 text-white"
                      onClick={() => handleFilterChange('type', 'all')}
                    >
                      <i className="fas fa-times" style={{fontSize: '10px'}}></i>
                    </Button>
                  </Badge>
                )}
                {filters.status && filters.status !== 'all' && (
                  <Badge bg="secondary" className="d-flex align-items-center">
                    Status: {filters.status}
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 ms-1 text-white"
                      onClick={() => handleFilterChange('status', 'all')}
                    >
                      <i className="fas fa-times" style={{fontSize: '10px'}}></i>
                    </Button>
                  </Badge>
                )}
                {filters.featured === true && (
                  <Badge bg="warning" text="dark" className="d-flex align-items-center">
                    Featured Only
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 ms-1"
                      onClick={() => handleFilterChange('featured', null)}
                    >
                      <i className="fas fa-times" style={{fontSize: '10px'}}></i>
                    </Button>
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading pets...</p>
            </div>
          ) : hasResults ? (
            /* Results */
            <>
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

              {/* Pagination */}
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

                    {(() => {
                      const currentPage = pagination.currentPage || 1;
                      const totalPages = pagination.totalPages || 1;
                      const maxVisible = 5;
                      
                      let startPage = Math.max(1, currentPage - 2);
                      let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                      
                      if (endPage - startPage < maxVisible - 1) {
                        startPage = Math.max(1, endPage - maxVisible + 1);
                      }
                      
                      const pages = [];
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <Pagination.Item
                            key={i}
                            active={i === currentPage}
                            onClick={() => handlePageChange(i)}
                          >
                            {i}
                          </Pagination.Item>
                        );
                      }
                      return pages;
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
        </Col>
      </Row>
    </Container>
  );
};

export default Browse;