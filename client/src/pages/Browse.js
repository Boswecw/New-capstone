// client/src/pages/Browse.js - FIXED Pet browsing with proper filtering
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert, Badge, Pagination } from 'react-bootstrap';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { petAPI } from '../services/api';
import SafeImage from '../components/SafeImage';

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
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
  const sizes = ['small', 'medium', 'large', 'extra-large'];
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'name_asc', label: 'Name A-Z' },
    { value: 'name_desc', label: 'Name Z-A' }
  ];

  // Build API query parameters (memoized to prevent unnecessary re-renders)
  const apiParams = useMemo(() => {
    const params = {
      page: currentPage,
      limit: itemsPerPage
    };

    // Add filters that aren't 'all' or empty
    if (filters.search && filters.search.trim()) {
      params.search = filters.search.trim();
    }
    
    if (filters.type && filters.type !== 'all') {
      params.type = filters.type;
    }
    
    if (filters.age && filters.age !== 'all') {
      params.age = filters.age;
    }
    
    if (filters.gender && filters.gender !== 'all') {
      params.gender = filters.gender;
    }
    
    if (filters.size && filters.size !== 'all') {
      params.size = filters.size;
    }
    
    if (filters.breed && filters.breed !== 'all') {
      params.breed = filters.breed;
    }
    
    if (filters.featured && filters.featured !== 'all') {
      params.featured = filters.featured === 'true';
    }
    
    if (filters.sort && filters.sort !== 'newest') {
      params.sort = filters.sort;
    }

    console.log('🔍 API Parameters:', params);
    return params;
  }, [filters, currentPage, itemsPerPage]);

  // Update URL when filters change
  useEffect(() => {
    const newSearchParams = new URLSearchParams();
    
    // Add non-default filters to URL
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value && value !== 'all' && value !== '') {
        newSearchParams.set(key, value);
      }
    });
    
    // Add page if not first page
    if (currentPage > 1) {
      newSearchParams.set('page', currentPage.toString());
    }
    
    // Update URL without causing a page reload
    const newUrl = newSearchParams.toString();
    const currentUrl = searchParams.toString();
    
    if (newUrl !== currentUrl) {
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [filters, currentPage, setSearchParams, searchParams]);

  // Fetch pets with current filters
  const fetchPets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🐾 Browse: Fetching pets with filters...', apiParams);
      
      const response = await petAPI.getAllPets(apiParams);
      
      if (response.data?.success) {
        const petsData = response.data.data || [];
        const paginationData = response.data.pagination || {};
        
        setPets(petsData);
        setPagination(paginationData);
        
        // Calculate filter statistics
        setFilterStats({
          total: paginationData.total || petsData.length,
          showing: petsData.length,
          pages: paginationData.pages || 1
        });
        
        console.log(`✅ Loaded ${petsData.length} pets (Total: ${paginationData.total || 'unknown'})`);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch pets');
      }
      
    } catch (err) {
      console.error('❌ Error fetching pets:', err);
      
      // Provide specific error messages
      let errorMessage = 'Unable to load pets. Please try again.';
      if (err.response?.status === 500) {
        errorMessage = 'Server error. Please try again in a few moments.';
      } else if (err.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setPets([]);
      setPagination({});
      setFilterStats({});
    } finally {
      setLoading(false);
    }
  }, [apiParams]);

  // Fetch pets when API parameters change
  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    console.log(`🔧 Filter change: ${filterName} = ${value}`);
    
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    
    // Reset to first page when filters change
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    console.log(`📄 Page change: ${page}`);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear all filters
  const clearFilters = () => {
    console.log('🧹 Clearing all filters');
    
    const defaultFilters = {
      search: '',
      type: 'all',
      age: 'all',
      gender: 'all',
      size: 'all',
      breed: 'all',
      featured: 'all',
      sort: 'newest'
    };
    
    setFilters(defaultFilters);
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some(key => {
      const value = filters[key];
      return value && value !== 'all' && value !== '' && value !== 'newest';
    });
  }, [filters]);

  // Format age for display
  const formatAge = (age) => {
    if (!age) return 'Unknown';
    return age.charAt(0).toUpperCase() + age.slice(1);
  };

  // Get pet status badge
  const getPetStatusBadge = (pet) => {
    if (pet.adopted || pet.status === 'adopted') {
      return <Badge bg="success">Adopted</Badge>;
    } else if (pet.featured) {
      return <Badge bg="warning">Featured</Badge>;
    } else if (pet.available === false || pet.status === 'unavailable') {
      return <Badge bg="secondary">Not Available</Badge>;
    } else {
      return <Badge bg="primary">Available</Badge>;
    }
  };

  // Render pagination
  const renderPagination = () => {
    if (!pagination.pages || pagination.pages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    const currentPageNum = currentPage;
    const totalPages = pagination.pages;

    // Calculate page range
    let startPage = Math.max(1, currentPageNum - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    pages.push(
      <Pagination.Prev
        key="prev"
        disabled={currentPageNum === 1}
        onClick={() => handlePageChange(currentPageNum - 1)}
      />
    );

    // First page and ellipsis
    if (startPage > 1) {
      pages.push(
        <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        pages.push(<Pagination.Ellipsis key="ellipsis-start" />);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Pagination.Item
          key={i}
          active={i === currentPageNum}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    // Last page and ellipsis
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<Pagination.Ellipsis key="ellipsis-end" />);
      }
      pages.push(
        <Pagination.Item key={totalPages} onClick={() => handlePageChange(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }

    // Next button
    pages.push(
      <Pagination.Next
        key="next"
        disabled={currentPageNum === totalPages}
        onClick={() => handlePageChange(currentPageNum + 1)}
      />
    );

    return (
      <div className="d-flex justify-content-center mt-4">
        <Pagination>{pages}</Pagination>
      </div>
    );
  };

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="display-4 mb-3">
          <i className="fas fa-heart text-danger me-3"></i>
          Browse Pets
        </h1>
        <p className="lead text-muted">
          Find your perfect companion! Use the filters below to narrow your search.
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fas fa-filter me-2"></i>
            Search & Filter
          </h5>
          {hasActiveFilters && (
            <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
              <i className="fas fa-times me-1"></i>
              Clear All
            </Button>
          )}
        </Card.Header>
        <Card.Body>
          {/* Search Row */}
          <Row className="mb-3">
            <Col md={8}>
              <Form.Group>
                <Form.Label>Search Pets</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by name, breed, or description..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Sort By</Form.Label>
                <Form.Select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {/* Filter Row */}
          <Row>
            <Col md={2} className="mb-3">
              <Form.Group>
                <Form.Label>Pet Type</Form.Label>
                <Form.Select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="all">All Types</option>
                  {petTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={2} className="mb-3">
              <Form.Group>
                <Form.Label>Age</Form.Label>
                <Form.Select
                  value={filters.age}
                  onChange={(e) => handleFilterChange('age', e.target.value)}
                >
                  <option value="all">All Ages</option>
                  {ageRanges.map((age) => (
                    <option key={age} value={age}>
                      {formatAge(age)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={2} className="mb-3">
              <Form.Group>
                <Form.Label>Gender</Form.Label>
                <Form.Select
                  value={filters.gender}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                >
                  <option value="all">All Genders</option>
                  {genders.map((gender) => (
                    <option key={gender} value={gender}>
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={2} className="mb-3">
              <Form.Group>
                <Form.Label>Size</Form.Label>
                <Form.Select
                  value={filters.size}
                  onChange={(e) => handleFilterChange('size', e.target.value)}
                >
                  <option value="all">All Sizes</option>
                  {sizes.map((size) => (
                    <option key={size} value={size}>
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={2} className="mb-3">
              <Form.Group>
                <Form.Label>Featured</Form.Label>
                <Form.Select
                  value={filters.featured}
                  onChange={(e) => handleFilterChange('featured', e.target.value)}
                >
                  <option value="all">All Pets</option>
                  <option value="true">Featured Only</option>
                  <option value="false">Not Featured</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={2} className="mb-3">
              <Form.Group>
                <Form.Label>Breed</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter breed..."
                  value={filters.breed === 'all' ? '' : filters.breed}
                  onChange={(e) => handleFilterChange('breed', e.target.value || 'all')}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Filter Summary */}
          {(filterStats.total !== undefined || hasActiveFilters) && (
            <Row className="mt-3">
              <Col>
                <div className="d-flex align-items-center text-muted">
                  <i className="fas fa-info-circle me-2"></i>
                  {loading ? (
                    'Searching...'
                  ) : filterStats.total !== undefined ? (
                    `Showing ${filterStats.showing} of ${filterStats.total} pets${hasActiveFilters ? ' (filtered)' : ''}`
                  ) : (
                    'No results'
                  )}
                  
                  {hasActiveFilters && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 ms-2"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>
            <i className="fas fa-exclamation-triangle me-2"></i>
            Search Error
          </Alert.Heading>
          <p className="mb-0">{error}</p>
          <hr />
          <div className="d-flex gap-2">
            <Button variant="outline-danger" size="sm" onClick={fetchPets}>
              <i className="fas fa-redo me-1"></i>
              Try Again
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
              <i className="fas fa-times me-1"></i>
              Clear Filters
            </Button>
          </div>
        </Alert>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="text-muted">Finding adorable pets...</p>
        </div>
      )}

      {/* Pets Grid */}
      {!loading && !error && (
        <>
          {pets.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-search fa-3x text-muted mb-3"></i>
              <h4 className="text-muted">No pets found</h4>
              <p className="text-muted">
                {hasActiveFilters 
                  ? 'Try adjusting your search criteria or clear some filters.'
                  : 'It looks like there are no pets available at the moment.'
                }
              </p>
              {hasActiveFilters && (
                <Button variant="primary" onClick={clearFilters}>
                  <i className="fas fa-times me-2"></i>
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <Row>
              {pets.map((pet) => (
                <Col key={pet._id} lg={3} md={4} sm={6} className="mb-4">
                  <Card className="h-100 shadow-sm pet-card">
                    {/* Pet Image */}
                    <SafeImage
                      item={pet}
                      category={pet.type || 'pet'}
                      size="card"
                      className="card-img-top"
                      showLoader={true}
                    />
                    
                    <Card.Body className="d-flex flex-column">
                      {/* Pet Name and Status */}
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <Card.Title className="h5 mb-0">
                          {pet.name || pet.displayName}
                        </Card.Title>
                        {getPetStatusBadge(pet)}
                      </div>
                      
                      {/* Pet Details */}
                      <Card.Text className="text-muted small mb-2 flex-grow-1">
                        {pet.description || pet.bio || 'A wonderful pet looking for a loving home!'}
                      </Card.Text>
                      
                      {/* Pet Attributes */}
                      <div className="mb-3">
                        <Row className="g-1">
                          <Col xs={6}>
                            <small className="text-muted">
                              <i className="fas fa-paw me-1"></i>
                              {pet.type ? pet.type.charAt(0).toUpperCase() + pet.type.slice(1) : 'Pet'}
                            </small>
                          </Col>
                          <Col xs={6}>
                            <small className="text-muted">
                              <i className="fas fa-birthday-cake me-1"></i>
                              {formatAge(pet.age)}
                            </small>
                          </Col>
                          {pet.gender && (
                            <Col xs={6}>
                              <small className="text-muted">
                                <i className={`fas ${pet.gender === 'male' ? 'fa-mars' : 'fa-venus'} me-1`}></i>
                                {pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1)}
                              </small>
                            </Col>
                          )}
                          {pet.size && (
                            <Col xs={6}>
                              <small className="text-muted">
                                <i className="fas fa-ruler me-1"></i>
                                {pet.size.charAt(0).toUpperCase() + pet.size.slice(1)}
                              </small>
                            </Col>
                          )}
                        </Row>
                      </div>

                      {/* Traits/Tags */}
                      {pet.traits && pet.traits.length > 0 && (
                        <div className="mb-3">
                          {pet.traits.slice(0, 3).map((trait, index) => (
                            <Badge key={index} bg="light" text="dark" className="me-1 mb-1">
                              {trait}
                            </Badge>
                          ))}
                          {pet.traits.length > 3 && (
                            <Badge bg="light" text="dark">
                              +{pet.traits.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {/* Action Button */}
                      <div className="mt-auto">
                        <Button
                          as={Link}
                          to={`/pets/${pet._id}`}
                          variant={pet.adopted || pet.status === 'adopted' ? "outline-secondary" : "primary"}
                          className="w-100"
                          disabled={pet.adopted || pet.status === 'adopted'}
                        >
                          {pet.adopted || pet.status === 'adopted' ? (
                            <>
                              <i className="fas fa-heart me-2"></i>
                              Adopted
                            </>
                          ) : (
                            <>
                              <i className="fas fa-info-circle me-2"></i>
                              Learn More
                            </>
                          )}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {/* Pagination */}
          {renderPagination()}
        </>
      )}

      {/* Custom CSS for better visual appeal */}
      <style jsx>{`
        .pet-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: none;
        }
        
        .pet-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
        }
      `}</style>
    </Container>
  );
};

export default Browse;