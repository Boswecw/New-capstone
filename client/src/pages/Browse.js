// client/src/pages/Browse.js - FIXED ESLint no-unused-vars error
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert, Badge, Pagination } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { petAPI } from '../services/api';
import SafeImage from '../components/SafeImage';

const Browse = () => {
  const [searchParams] = useSearchParams(); // ✅ FIXED: Removed unused setSearchParams
  const navigate = useNavigate(); // ✅ FIXED: Now actually used in the component
  
  // State management
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [filterStats, setFilterStats] = useState({});
  
  // Initialize filters from URL params
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    type: searchParams.get('type') || 'all',
    age: searchParams.get('age') || 'all',
    gender: searchParams.get('gender') || 'all',
    size: searchParams.get('size') || 'all',
    breed: searchParams.get('breed') || 'all',
    featured: searchParams.get('featured') || 'all',
    sort: searchParams.get('sort') || 'newest'
  });
  
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const itemsPerPage = 12;

  // Available filter options
  const petTypes = ['dog', 'cat', 'bird', 'fish', 'rabbit', 'hamster', 'other'];
  const ageRanges = ['puppy/kitten', 'young', 'adult', 'senior'];
  const genders = ['male', 'female'];
  const sizes = ['small', 'medium', 'large'];
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'name', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' },
    { value: 'featured', label: 'Featured First' }
  ];

  // ✅ FIXED: Now using navigate for programmatic navigation
  const handlePetClick = useCallback((petId) => {
    navigate(`/pets/${petId}`);
  }, [navigate]);

  const handleFilterReset = useCallback(() => {
    const newFilters = {
      search: '',
      type: 'all',
      age: 'all',
      gender: 'all',
      size: 'all',
      breed: 'all',
      featured: 'all',
      sort: 'newest'
    };
    setFilters(newFilters);
    setCurrentPage(1);
    
    // ✅ FIXED: Using navigate to reset URL
    navigate('/browse', { replace: true });
  }, [navigate]);

  // Update URL when filters change
  const updateURL = useCallback((newFilters, page = 1) => {
    const params = new URLSearchParams();
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, value);
      }
    });
    
    if (page > 1) {
      params.set('page', page.toString());
    }

    const newURL = params.toString() ? `/browse?${params.toString()}` : '/browse';
    
    // ✅ FIXED: Using navigate to update URL
    navigate(newURL, { replace: true });
  }, [navigate]);

  // Fetch pets with current filters
  const fetchPets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Browsing pets with filters:', filters);
      
      const queryParams = {
        page: currentPage,
        limit: itemsPerPage,
        ...filters
      };
      
      // Remove 'all' values from query
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === 'all' || queryParams[key] === '') {
          delete queryParams[key];
        }
      });
      
      const response = await petAPI.getAllPets(queryParams);
      
      if (response?.data?.success) {
        setPets(response.data.data || []);
        setPagination(response.data.pagination || {});
        setFilterStats(response.data.stats || {});
        console.log(`✅ Loaded ${response.data.data?.length || 0} pets`);
      } else {
        throw new Error('Failed to fetch pets');
      }
      
    } catch (err) {
      console.error('❌ Error fetching pets:', err);
      setError('Failed to load pets. Please try again.');
      setPets([]);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  // Handle filter changes
  const handleFilterChange = useCallback((filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    updateURL(newFilters, 1);
  }, [filters, updateURL]);

  // Handle page changes
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    updateURL(filters, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filters, updateURL]);

  // Handle search
  const handleSearch = useCallback((searchTerm) => {
    const newFilters = { ...filters, search: searchTerm };
    setFilters(newFilters);
    setCurrentPage(1);
    updateURL(newFilters, 1);
  }, [filters, updateURL]);

  // Load pets when filters or page change
  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  // Generate pagination items
  const paginationItems = useMemo(() => {
    const items = [];
    const totalPages = pagination.totalPages || 1;
    const current = currentPage;
    
    if (totalPages <= 1) return items;
    
    // Previous button
    items.push(
      <Pagination.Prev 
        key="prev"
        disabled={current === 1}
        onClick={() => handlePageChange(current - 1)}
      />
    );
    
    // Page numbers
    for (let page = 1; page <= totalPages; page++) {
      if (
        page === 1 || 
        page === totalPages || 
        (page >= current - 2 && page <= current + 2)
      ) {
        items.push(
          <Pagination.Item
            key={page}
            active={page === current}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </Pagination.Item>
        );
      } else if (
        page === current - 3 || 
        page === current + 3
      ) {
        items.push(<Pagination.Ellipsis key={`ellipsis-${page}`} />);
      }
    }
    
    // Next button
    items.push(
      <Pagination.Next 
        key="next"
        disabled={current === totalPages}
        onClick={() => handlePageChange(current + 1)}
      />
    );
    
    return items;
  }, [pagination.totalPages, currentPage, handlePageChange]);

  // Loading state
  if (loading && pets.length === 0) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status" className="mb-3" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <h4>Finding adorable pets...</h4>
          <p className="text-muted">Please wait while we search our database.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-2">
            <i className="fas fa-search me-2"></i>
            Browse Pets
          </h1>
          <p className="text-muted mb-0">
            {pagination.total 
              ? `Found ${pagination.total} adorable pet${pagination.total > 1 ? 's' : ''} waiting for homes` 
              : 'Discover your perfect companion'}
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="d-flex gap-2">
          <Button 
            variant="outline-primary" 
            onClick={handleFilterReset}
            size="sm"
          >
            <i className="fas fa-undo me-1"></i>
            Reset Filters
          </Button>
          <Button 
            variant="outline-success" 
            onClick={() => handleFilterChange('featured', 'true')}
            size="sm"
          >
            <i className="fas fa-star me-1"></i>
            Featured Only
          </Button>
        </div>
      </div>

      <Row>
        {/* Filters Sidebar */}
        <Col lg={3} className="mb-4">
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0">
                <i className="fas fa-filter me-2"></i>
                Filter Pets
              </h6>
            </Card.Header>
            <Card.Body className="p-3">
              {/* Search */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small">Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by name, breed..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </Form.Group>

              {/* Pet Type */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small">Pet Type</Form.Label>
                <Form.Select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="all">All Types</option>
                  {petTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}s
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* Age */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small">Age</Form.Label>
                <Form.Select
                  value={filters.age}
                  onChange={(e) => handleFilterChange('age', e.target.value)}
                >
                  <option value="all">All Ages</option>
                  {ageRanges.map(age => (
                    <option key={age} value={age}>
                      {age.charAt(0).toUpperCase() + age.slice(1)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* Gender */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small">Gender</Form.Label>
                <Form.Select
                  value={filters.gender}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                >
                  <option value="all">All Genders</option>
                  {genders.map(gender => (
                    <option key={gender} value={gender}>
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* Size */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small">Size</Form.Label>
                <Form.Select
                  value={filters.size}
                  onChange={(e) => handleFilterChange('size', e.target.value)}
                >
                  <option value="all">All Sizes</option>
                  {sizes.map(size => (
                    <option key={size} value={size}>
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* Sort */}
              <Form.Group className="mb-0">
                <Form.Label className="fw-bold small">Sort By</Form.Label>
                <Form.Select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Card.Body>
          </Card>

          {/* Filter Stats */}
          {filterStats && Object.keys(filterStats).length > 0 && (
            <Card className="shadow-sm mt-3">
              <Card.Header>
                <h6 className="mb-0">
                  <i className="fas fa-chart-bar me-2"></i>
                  Quick Stats
                </h6>
              </Card.Header>
              <Card.Body className="p-3">
                {Object.entries(filterStats).map(([key, value]) => (
                  <div key={key} className="d-flex justify-content-between mb-1">
                    <small className="text-muted">{key}:</small>
                    <small className="fw-bold">{value}</small>
                  </div>
                ))}
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Results */}
        <Col lg={9}>
          {/* Results Header */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              {loading && <Spinner size="sm" animation="border" className="me-2" />}
              <span className="text-muted">
                {pagination.total > 0 
                  ? `Showing ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, pagination.total)} of ${pagination.total} pets`
                  : 'No pets found'
                }
              </span>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <i className="fas fa-sync-alt me-1"></i>
                Refresh
              </Button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <Alert variant="danger" className="mb-4">
              <Alert.Heading>
                <i className="fas fa-exclamation-triangle me-2"></i>
                Error Loading Pets
              </Alert.Heading>
              <p className="mb-0">{error}</p>
              <hr />
              <Button variant="outline-danger" onClick={fetchPets}>
                <i className="fas fa-redo me-2"></i>
                Try Again
              </Button>
            </Alert>
          )}

          {/* No Results */}
          {!loading && !error && pets.length === 0 && (
            <Alert variant="info" className="text-center">
              <Alert.Heading>
                <i className="fas fa-search me-2"></i>
                No Pets Found
              </Alert.Heading>
              <p>Try adjusting your filters or search terms to find more pets.</p>
              <Button variant="primary" onClick={handleFilterReset}>
                <i className="fas fa-undo me-2"></i>
                Reset All Filters
              </Button>
            </Alert>
          )}

          {/* Pet Grid */}
          {pets.length > 0 && (
            <>
              <Row>
                {pets.map((pet) => (
                  <Col key={pet._id} sm={6} lg={4} className="mb-4">
                    <Card 
                      className="h-100 shadow-sm pet-card"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handlePetClick(pet._id)} // ✅ FIXED: Now using navigate
                    >
                      <div className="position-relative">
                        <SafeImage
                          item={pet}
                          category={pet.type || 'pet'}
                          size="card"
                          className="card-img-top"
                          style={{ height: '200px', objectFit: 'cover' }}
                          alt={`Photo of ${pet.name}`}
                        />
                        
                        {/* Status Badges */}
                        <div className="position-absolute top-0 start-0 p-2">
                          {pet.featured && (
                            <Badge bg="warning" className="me-1">
                              <i className="fas fa-star me-1"></i>
                              Featured
                            </Badge>
                          )}
                          {pet.adopted && (
                            <Badge bg="success">
                              <i className="fas fa-heart me-1"></i>
                              Adopted
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Card.Body className="d-flex flex-column">
                        <Card.Title className="h5 mb-2">{pet.name}</Card.Title>
                        <Card.Text className="text-muted mb-2">
                          {pet.breed} • {pet.age} • {pet.gender}
                        </Card.Text>
                        
                        {pet.description && (
                          <Card.Text className="small mb-3 flex-grow-1">
                            {pet.description.length > 100 
                              ? `${pet.description.substring(0, 100)}...` 
                              : pet.description
                            }
                          </Card.Text>
                        )}

                        <div className="d-flex justify-content-between align-items-center mt-auto">
                          <small className="text-muted">
                            <i className="fas fa-map-marker-alt me-1"></i>
                            {pet.location || 'FurBabies'}
                          </small>
                          
                          <Button 
                            size="sm" 
                            variant={pet.adopted ? "success" : "primary"}
                            disabled={pet.adopted}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click
                              handlePetClick(pet._id);
                            }}
                          >
                            {pet.adopted ? (
                              <>
                                <i className="fas fa-heart me-1"></i>
                                Adopted
                              </>
                            ) : (
                              <>
                                <i className="fas fa-info-circle me-1"></i>
                                Details
                              </>
                            )}
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination size="lg">
                    {paginationItems}
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Col>
      </Row>

      {/* Floating Action Button for Mobile */}
      <div className="d-lg-none">
        <Button
          variant="primary"
          className="position-fixed bottom-0 end-0 m-3 rounded-circle"
          style={{ zIndex: 1000, width: '60px', height: '60px' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <i className="fas fa-arrow-up"></i>
        </Button>
      </div>
    </Container>
  );
};

export default Browse;