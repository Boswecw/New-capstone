// client/src/pages/Pets.js - Main pets page using SafeImage
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { petAPI } from '../services/api';
import SafeImage from '../components/SafeImage';

const Pets = () => {
  // State management
  const [featuredPets, setFeaturedPets] = useState([]);
  const [allPets, setAllPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  // Pet statistics
  const [stats, setStats] = useState({
    totalPets: 0,
    availablePets: 0,
    adoptedPets: 0,
    featuredPets: 0
  });

  // Fetch featured pets
  const fetchFeaturedPets = useCallback(async () => {
    try {
      console.log('🌟 Fetching featured pets...');
      const response = await petAPI.getFeaturedPets(6);
      
      if (response.data?.success) {
        setFeaturedPets(response.data.data || []);
        console.log(`✅ Loaded ${response.data.data?.length || 0} featured pets`);
      }
    } catch (err) {
      console.error('❌ Error fetching featured pets:', err);
    }
  }, []);

  // Fetch all pets with basic filtering
  const fetchAllPets = useCallback(async () => {
    try {
      console.log('🐾 Fetching all pets...');
      
      const queryParams = {};
      if (searchTerm) queryParams.search = searchTerm;
      if (selectedType !== 'all') queryParams.type = selectedType;
      
      const response = await petAPI.getAllPets(queryParams);
      
      if (response.data?.success) {
        const pets = response.data.data || [];
        setAllPets(pets);
        
        // Calculate statistics
        const totalPets = pets.length;
        const availablePets = pets.filter(pet => !pet.adopted).length;
        const adoptedPets = pets.filter(pet => pet.adopted).length;
        const featuredPets = pets.filter(pet => pet.featured).length;
        
        setStats({
          totalPets,
          availablePets,
          adoptedPets,
          featuredPets
        });
        
        console.log(`✅ Loaded ${totalPets} pets total`);
      }
    } catch (err) {
      console.error('❌ Error fetching pets:', err);
      setError('Unable to load pets. Please try again.');
    }
  }, [searchTerm, selectedType]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          fetchFeaturedPets(),
          fetchAllPets()
        ]);
      } catch (err) {
        console.error('❌ Error loading initial data:', err);
        setError('Unable to load pet data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchFeaturedPets, fetchAllPets]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchAllPets();
  };

  // Get pet types for filter
  const petTypes = ['dog', 'cat', 'bird', 'fish', 'rabbit', 'hamster', 'other'];

  // Format age
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
    } else {
      return <Badge bg="primary">Available</Badge>;
    }
  };

  return (
    <Container className="py-4">
      {/* Hero Section */}
      <div className="text-center mb-5">
        <h1 className="display-3 mb-3">
          <i className="fas fa-heart text-danger me-3"></i>
          Find Your Perfect Companion
        </h1>
        <p className="lead text-muted mb-4">
          Every pet deserves a loving home. Browse our wonderful animals looking for their forever families.
        </p>
        
        {/* Search Bar */}
        <Card className="shadow-sm mb-4">
          <Card.Body>
            <Form onSubmit={handleSearch}>
              <Row className="align-items-end">
                <Col md={5} className="mb-2">
                  <Form.Group>
                    <Form.Label>Search Pets</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Search by name, breed, or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={3} className="mb-2">
                  <Form.Group>
                    <Form.Label>Pet Type</Form.Label>
                    <Form.Select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
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
                <Col md={2} className="mb-2">
                  <Button type="submit" variant="primary" className="w-100">
                    <i className="fas fa-search me-2"></i>
                    Search
                  </Button>
                </Col>
                <Col md={2} className="mb-2">
                  <Button 
                    as={Link} 
                    to="/browse" 
                    variant="outline-secondary" 
                    className="w-100"
                  >
                    <i className="fas fa-filter me-2"></i>
                    Advanced
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
      </div>

      {/* Statistics Cards */}
      <Row className="mb-5">
        <Col md={3} className="mb-3">
          <Card className="text-center h-100 shadow-sm">
            <Card.Body>
              <div className="text-primary mb-2">
                <i className="fas fa-paw fa-2x"></i>
              </div>
              <h4 className="text-primary">{loading ? '...' : stats.totalPets}</h4>
              <p className="text-muted mb-0">Total Pets</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center h-100 shadow-sm">
            <Card.Body>
              <div className="text-success mb-2">
                <i className="fas fa-home fa-2x"></i>
              </div>
              <h4 className="text-success">{loading ? '...' : stats.availablePets}</h4>
              <p className="text-muted mb-0">Available</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center h-100 shadow-sm">
            <Card.Body>
              <div className="text-info mb-2">
                <i className="fas fa-heart fa-2x"></i>
              </div>
              <h4 className="text-info">{loading ? '...' : stats.adoptedPets}</h4>
              <p className="text-muted mb-0">Happy Homes</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center h-100 shadow-sm">
            <Card.Body>
              <div className="text-warning mb-2">
                <i className="fas fa-star fa-2x"></i>
              </div>
              <h4 className="text-warning">{loading ? '...' : stats.featuredPets}</h4>
              <p className="text-muted mb-0">Featured</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

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
          <p className="text-muted">Loading our wonderful pets...</p>
        </div>
      )}

      {/* Featured Pets Section */}
      {!loading && featuredPets.length > 0 && (
        <div className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>
              <i className="fas fa-star text-warning me-2"></i>
              Featured Pets
            </h2>
            <Button as={Link} to="/browse?featured=true" variant="outline-primary">
              View All Featured
            </Button>
          </div>
          
          <Row>
            {featuredPets.map((pet) => (
              <Col key={pet._id} lg={4} md={6} className="mb-4">
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
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Card.Title className="h5 mb-0">
                        {pet.name}
                      </Card.Title>
                      {getPetStatusBadge(pet)}
                    </div>
                    
                    <Card.Text className="text-muted small mb-2 flex-grow-1">
                      {pet.description || pet.bio || 'A wonderful pet looking for a loving home!'}
                    </Card.Text>
                    
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
                      </Row>
                    </div>
                    
                    <Button
                      as={Link}
                      to={`/pets/${pet._id}`}
                      variant={pet.adopted ? "outline-secondary" : "primary"}
                      className="mt-auto"
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
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Recent Pets Section */}
      {!loading && allPets.length > 0 && (
        <div className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>
              <i className="fas fa-clock text-info me-2"></i>
              {searchTerm || selectedType !== 'all' ? 'Search Results' : 'Recent Additions'}
            </h2>
            <Button as={Link} to="/browse" variant="outline-primary">
              Browse All Pets
            </Button>
          </div>
          
          {allPets.length === 0 && (searchTerm || selectedType !== 'all') ? (
            <Alert variant="info" className="text-center">
              <i className="fas fa-search me-2"></i>
              No pets found matching your search criteria. Try adjusting your filters.
            </Alert>
          ) : (
            <Row>
              {allPets.slice(0, 8).map((pet) => (
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
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <Card.Title className="h6 mb-0">
                          {pet.name}
                        </Card.Title>
                        {getPetStatusBadge(pet)}
                      </div>
                      
                      <Card.Text className="text-muted small mb-2 flex-grow-1 line-clamp-2">
                        {pet.description || pet.bio || 'Looking for a loving home!'}
                      </Card.Text>
                      
                      <div className="mb-2">
                        <small className="text-muted">
                          <i className="fas fa-paw me-1"></i>
                          {pet.type ? pet.type.charAt(0).toUpperCase() + pet.type.slice(1) : 'Pet'}
                          {pet.age && (
                            <>
                              <span className="mx-1">•</span>
                              {formatAge(pet.age)}
                            </>
                          )}
                        </small>
                      </div>
                      
                      <Button
                        as={Link}
                        to={`/pets/${pet._id}`}
                        variant={pet.adopted ? "outline-secondary" : "primary"}
                        size="sm"
                        className="mt-auto"
                        disabled={pet.adopted}
                      >
                        {pet.adopted ? 'Adopted' : 'Learn More'}
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
          
          {allPets.length > 8 && (
            <div className="text-center mt-4">
              <Button as={Link} to="/browse" variant="primary" size="lg">
                <i className="fas fa-arrow-right me-2"></i>
                View All {allPets.length} Pets
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Call to Action */}
      {!loading && (
        <Card className="bg-light text-center shadow-sm">
          <Card.Body className="py-5">
            <h3 className="mb-3">Ready to Find Your New Best Friend?</h3>
            <p className="lead text-muted mb-4">
              Browse our full collection of amazing pets or learn more about the adoption process.
            </p>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <Button as={Link} to="/browse" variant="primary" size="lg">
                <i className="fas fa-search me-2"></i>
                Browse All Pets
              </Button>
              <Button as={Link} to="/about" variant="outline-primary" size="lg">
                <i className="fas fa-info-circle me-2"></i>
                Adoption Process
              </Button>
              <Button as={Link} to="/contact" variant="outline-secondary" size="lg">
                <i className="fas fa-envelope me-2"></i>
                Contact Us
              </Button>
            </div>
          </Card.Body>
        </Card>
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
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </Container>
  );
};

export default Pets;