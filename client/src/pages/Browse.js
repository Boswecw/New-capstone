// client/src/pages/Browse.js - Fixed filtering to match actual pet data
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Spinner, Alert, Form, Button, InputGroup } from 'react-bootstrap';
import { useSearchParams, useLocation } from 'react-router-dom';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';
import PetCard from '../components/PetCard';
import { petAPI } from '../services/api';

const Browse = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Search and filter states - FIXED: Use 'type' instead of 'category'
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');
  const [selectedBreed, setSelectedBreed] = useState(searchParams.get('breed') || '');
  const [ageRange, setAgeRange] = useState(searchParams.get('age') || '');
  const [showFilters, setShowFilters] = useState(false);

  // ✅ FIXED: Updated to match actual pet types in your database
  const petTypes = [
    { value: '', label: 'All Pets' },
    { value: 'dog', label: 'Dogs' },
    { value: 'cat', label: 'Cats' },
    { value: 'fish', label: 'Fish & Aquatic' },
    { value: 'bird', label: 'Birds' },
    { value: 'small-pet', label: 'Small Pets' }
  ];

  const ageRanges = [
    { value: '', label: 'Any Age' },
    { value: 'puppy', label: 'Puppy/Kitten (0-1 year)' },
    { value: 'young', label: 'Young (1-3 years)' },
    { value: 'adult', label: 'Adult (3-7 years)' },
    { value: 'senior', label: 'Senior (7+ years)' }
  ];

  // Fetch pets based on current filters
  const fetchPets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ FIXED: Send 'type' parameter instead of 'category'
      const params = {
        ...(searchTerm && { search: searchTerm }),
        ...(selectedType && { type: selectedType }),
        ...(selectedBreed && { breed: selectedBreed }),
        ...(ageRange && { age: ageRange })
      };

      console.log('🔍 Fetching pets with params:', params);
      const response = await petAPI.getAllPets(params);
      console.log('🐾 Browse pets response:', response);
      
      setPets(response.data || []);
    } catch (err) {
      console.error('Error fetching pets:', err);
      setError('Failed to load pets. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedType, selectedBreed, ageRange]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedType) params.set('type', selectedType);
    if (selectedBreed) params.set('breed', selectedBreed);
    if (ageRange) params.set('age', ageRange);
    
    setSearchParams(params);
  }, [searchTerm, selectedType, selectedBreed, ageRange, setSearchParams]);

  // Fetch pets when filters change
  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedBreed('');
    setAgeRange('');
    setShowFilters(false);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchPets();
  };

  return (
    <Container fluid className="py-4">
      <Row className="justify-content-center">
        <Col xl={10}>
          <h1 className="mb-4 text-center">
            <i className="fas fa-paw me-2"></i>Browse Pets
          </h1>

          {/* Search and Filter Bar */}
          <Form onSubmit={handleSearch} className="mb-4">
            <InputGroup size="lg">
              <Form.Control
                type="text"
                placeholder="Search pets by name, breed, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search pets"
              />
              <Button variant="primary" type="submit">
                <FaSearch />
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => setShowFilters(!showFilters)}
                title={showFilters ? 'Hide filters' : 'Show filters'}
                aria-expanded={showFilters}
              >
                <FaFilter />
              </Button>
            </InputGroup>
          </Form>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="p-3 bg-light rounded mb-3">
              <Row>
                <Col md={4} className="mb-2">
                  <Form.Select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    aria-label="Filter by pet type"
                  >
                    {petTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={4} className="mb-2">
                  <Form.Control
                    type="text"
                    placeholder="Breed (optional)"
                    value={selectedBreed}
                    onChange={(e) => setSelectedBreed(e.target.value)}
                    aria-label="Filter by breed"
                  />
                </Col>
                <Col md={4} className="mb-2">
                  <Form.Select
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                    aria-label="Filter by age range"
                  >
                    {ageRanges.map(age => (
                      <option key={age.value} value={age.value}>{age.label}</option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>
              <div className="text-end">
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  onClick={clearFilters}
                  className="d-inline-flex align-items-center gap-1"
                >
                  <FaTimes /> Clear Filters
                </Button>
              </div>
            </div>
          )}
        </Col>
      </Row>

      {/* Active Filters Display */}
      {(searchTerm || selectedType || selectedBreed || ageRange) && (
        <Row className="justify-content-center mb-3">
          <Col xl={10}>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <small className="text-muted">Active filters:</small>
              {searchTerm && (
                <span className="badge bg-primary">Search: {searchTerm}</span>
              )}
              {selectedType && (
                <span className="badge bg-secondary">
                  Type: {petTypes.find(t => t.value === selectedType)?.label}
                </span>
              )}
              {selectedBreed && (
                <span className="badge bg-secondary">Breed: {selectedBreed}</span>
              )}
              {ageRange && (
                <span className="badge bg-secondary">
                  Age: {ageRanges.find(a => a.value === ageRange)?.label}
                </span>
              )}
            </div>
          </Col>
        </Row>
      )}

      {/* Error Message */}
      {error && (
        <Row className="justify-content-center">
          <Col xl={10}>
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading pets...</span>
          </Spinner>
          <p className="mt-2 text-muted">Finding amazing pets for you...</p>
        </div>
      )}

      {/* Pet Results */}
      {!loading && (
        <Row className="justify-content-center">
          <Col xl={10}>
            {pets.length === 0 ? (
              <div className="text-center py-5">
                <div className="mb-4">
                  <i className="fas fa-paw fa-3x text-muted mb-3"></i>
                  <h3 className="text-muted">No pets found</h3>
                  <p className="text-muted">
                    Try adjusting your search criteria or{' '}
                    <Button variant="link" onClick={clearFilters} className="p-0">
                      clear all filters
                    </Button>
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <small className="text-muted">
                    {pets.length} pet{pets.length !== 1 ? 's' : ''} found
                  </small>
                </div>
                <Row>
                  {pets.map((pet) => (
                    <Col key={pet._id} sm={6} md={4} lg={3} className="mb-4">
                      <PetCard pet={pet} />
                    </Col>
                  ))}
                </Row>
              </>
            )}
          </Col>
        </Row>
      )}

      {/* Load More / Pagination */}
      {pets.length > 0 && pets.length % 12 === 0 && (
        <Row className="justify-content-center">
          <Col xl={10}>
            <div className="text-center mt-4">
              <Button variant="outline-primary" size="lg">
                Load More Pets
              </Button>
            </div>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Browse;