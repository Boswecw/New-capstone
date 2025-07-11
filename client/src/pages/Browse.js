// client/src/pages/Browse.js - Updated with data extraction fix and safety checks
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Spinner, Alert, Form, Button, InputGroup } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';
import PetCard from '../components/PetCard';
import { petAPI } from '../services/api';

const Browse = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');
  const [selectedBreed, setSelectedBreed] = useState(searchParams.get('breed') || '');
  const [ageRange, setAgeRange] = useState(searchParams.get('age') || '');
  const [showFilters, setShowFilters] = useState(false);

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

  const fetchPets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        ...(searchTerm && { search: searchTerm }),
        ...(selectedType && { type: selectedType }),
        ...(selectedBreed && { breed: selectedBreed }),
        ...(ageRange && { age: ageRange })
      };

      console.log('🔍 Fetching pets with params:', params);
      const response = await petAPI.getAllPets(params);
      console.log('🐾 Browse pets response:', response.data);

      setPets(response.data?.data || []);
    } catch (err) {
      console.error('Error fetching pets:', err);
      setError('Failed to load pets. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedType, selectedBreed, ageRange]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedType) params.set('type', selectedType);
    if (selectedBreed) params.set('breed', selectedBreed);
    if (ageRange) params.set('age', ageRange);

    setSearchParams(params);
  }, [searchTerm, selectedType, selectedBreed, ageRange, setSearchParams]);

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
    setSelectedType(searchParams.get('type') || '');
    setSelectedBreed(searchParams.get('breed') || '');
    setAgeRange(searchParams.get('age') || '');
  }, [searchParams]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedBreed('');
    setAgeRange('');
    setShowFilters(false);
  };

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

      {(searchTerm || selectedType || selectedBreed || ageRange) && (
        <Row className="justify-content-center mb-3">
          <Col xl={10}>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <small className="text-muted">Active filters:</small>
              {searchTerm && (
                <span className="badge bg-primary">Search: {searchTerm}</span>
              )}
              {selectedType && (
                <span className="badge bg-success">Type: {petTypes.find(t => t.value === selectedType)?.label}</span>
              )}
              {selectedBreed && (
                <span className="badge bg-info">Breed: {selectedBreed}</span>
              )}
              {ageRange && (
                <span className="badge bg-warning">Age: {ageRanges.find(a => a.value === ageRange)?.label}</span>
              )}
            </div>
          </Col>
        </Row>
      )}

      <Row className="justify-content-center">
        <Col xl={10}>
          {loading && (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" size="lg" />
              <p className="mt-3 text-muted">Loading pets...</p>
            </div>
          )}

          {error && (
            <Alert variant="danger" className="text-center">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          {!loading && !error && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  {pets.length} {pets.length === 1 ? 'Pet' : 'Pets'} Found
                </h5>
              </div>

              {Array.isArray(pets) && pets.length > 0 ? (
                <Row>
                  {pets.map((pet) => (
                    <Col key={pet._id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                      <PetCard pet={pet} />
                    </Col>
                  ))}
                </Row>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-search fa-3x text-muted mb-3"></i>
                  <h4 className="text-muted">No pets found</h4>
                  <p className="text-muted">
                    Try adjusting your search criteria or <Button variant="link" onClick={clearFilters} className="p-0">clear all filters</Button>
                  </p>
                </div>
              )}
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Browse;
