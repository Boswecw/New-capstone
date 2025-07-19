// client/src/pages/Browse.js - Pet browsing page using SafeImage
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert, Badge, Pagination } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { petAPI } from '../services/api';
import SafeImage from '../components/SafeImage';

const Browse = () => {
  // State management
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    age: 'all',
    gender: 'all',
    size: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Available filter options
  const petTypes = ['dog', 'cat', 'bird', 'fish', 'rabbit', 'hamster', 'other'];
  const ageRanges = ['puppy/kitten', 'young', 'adult', 'senior'];
  const genders = ['male', 'female'];
  const sizes = ['small', 'medium', 'large', 'extra-large'];

  // Fetch pets with filters
  const fetchPets = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🐾 Browse: Fetching pets...', { filters, page });
      
      // Build query parameters
      const queryParams = {
        page,
        limit: itemsPerPage,
        ...filters
      };
      
      // Remove 'all' values and empty strings
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === 'all' || queryParams[key] === '') {
          delete queryParams[key];
        }
      });
      
      const response = await petAPI.getAllPets(queryParams);
      
      if (response.data?.success) {
        setPets(response.data.data || []);
        setPagination(response.data.pagination || {});
        console.log(`✅ Loaded ${response.data.data?.length || 0} pets`);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch pets');
      }
      
    } catch (err) {
      console.error('❌ Error fetching pets:', err);
      setError('Unable to load pets. Please try again.');
      setPets([]);
    } finally {
      setLoading(false);
    }
  }, [filters, itemsPerPage]);

  // Load initial data
  useEffect(() => {
    fetchPets(currentPage);
  }, [fetchPets, currentPage]);

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      age: 'all',
      gender: 'all',
      size: 'all',
      sortBy: 'name',
      sortOrder: 'asc'
    });
    setCurrentPage(1);
  };

  // Format age for display
  const formatAge = (age) => {
    if (!age) return 'Unknown';
    return age.charAt(0).toUpperCase() + age.slice(1);
  };

  // Get pet status badge
  const getPetStatusBadge = (pet) => {
    if (pet.adopted) {
      return <Badge bg="success">Adopted</Badge>;
    } else if (pet.featured) {
      return <Badge bg="warning">Featured</Badge>;
    } else if (pet.available === false) {
      return <Badge bg="secondary">Not Available</Badge>;
    } else {
      return <Badge bg="primary">Available</Badge>;
    }
  };

  // Render pagination
  const renderPagination = () => {
    if (!pagination.totalPages || pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    const currentPageNum = pagination.currentPage || 1;
    const totalPages = pagination.totalPages;

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
          Find your perfect companion! Each pet is looking for their forever home.
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            {/* Search */}
            <Col md={3} className="mb-3">
              <Form.Group>
                <Form.Label>Search Pets</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by name..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </Form.Group>
            </Col>

            {/* Pet Type */}
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

            {/* Age */}
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

            {/* Gender */}
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

            {/* Size */}
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

            {/* Clear Filters */}
            <Col md={1} className="mb-3 d-flex align-items-end">
              <Button variant="outline-secondary" onClick={clearFilters} className="w-100">
                Clear
              </Button>
            </Col>
          </Row>

          {/* Sort Options */}
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Sort By</Form.Label>
                <Form.Select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <option value="name">Name</option>
                  <option value="age">Age</option>
                  <option value="type">Pet Type</option>
                  <option value="createdAt">Date Added</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Order</Form.Label>
                <Form.Select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                >
                  <option value="asc">A to Z</option>
                  <option value="desc">Z to A</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={7} className="d-flex align-items-end">
              {pagination.totalItems && (
                <small className="text-muted">
                  Showing {pets.length} of {pagination.totalItems} pets
                </small>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="text-muted">Loading adorable pets...</p>
        </div>
      )}

      {/* Pets Grid */}
      {!loading && !error && (
        <>
          {pets.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-heart-broken fa-3x text-muted mb-3"></i>
              <h4 className="text-muted">No pets found</h4>
              <p className="text-muted">Try adjusting your search criteria to find more pets.</p>
            </div>
          ) : (
            <Row>
              {pets.map((pet) => (
                <Col key={pet._id} lg={3} md={4} sm={6} className="mb-4">
                  <Card className="h-100 shadow-sm pet-card">
                    {/* Pet Image - USING UNIFIED SAFEIMAGE */}
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
                          {pet.name}
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
                          variant={pet.adopted ? "outline-secondary" : "primary"}
                          className="w-100"
                          disabled={pet.adopted}
                        >
                          {pet.adopted ? (
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