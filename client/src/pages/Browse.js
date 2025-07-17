// client/src/pages/Browse.js - VERSION WITHOUT react-icons

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Spinner, 
  Alert, 
  Form, 
  Button, 
  InputGroup, 
  Badge,
  Card
} from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import PetCard from '../components/PetCard';
import { petAPI } from '../services/api';

const Browse = () => {
  // State management
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');
  const [selectedBreed, setSelectedBreed] = useState(searchParams.get('breed') || '');
  const [ageRange, setAgeRange] = useState(searchParams.get('age') || '');
  const [selectedGender, setSelectedGender] = useState(searchParams.get('gender') || '');
  const [selectedSize, setSelectedSize] = useState(searchParams.get('size') || '');
  const [showFilters, setShowFilters] = useState(false);

  // Filter options
  const petTypes = useMemo(() => [
    { value: '', label: 'All Pets' },
    { value: 'dog', label: 'Dogs' },
    { value: 'cat', label: 'Cats' },
    { value: 'fish', label: 'Fish & Aquatic' },
    { value: 'small-pet', label: 'Small Pets' },
    { value: 'bird', label: 'Birds' }
  ], []);

  const ageRanges = useMemo(() => [
    { value: '', label: 'Any Age' },
    { value: '6 months', label: '6 Months' },
    { value: 'puppy', label: 'Puppy/Kitten (0-1 year)' },
    { value: 'young', label: 'Young (1-3 years)' },
    { value: 'adult', label: 'Adult (3-7 years)' },
    { value: 'senior', label: 'Senior (7+ years)' }
  ], []);

  const genderOptions = useMemo(() => [
    { value: '', label: 'Any Gender' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'unknown', label: 'Unknown' }
  ], []);

  const sizeOptions = useMemo(() => [
    { value: '', label: 'Any Size' },
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' }
  ], []);

  // FIXED: Complete fetchPets function
  const fetchPets = useCallback(async (attempt = 1) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000 * attempt;

    try {
      console.log(`🔍 Fetching pets (attempt ${attempt}/${MAX_RETRIES})`);
      setLoading(true);
      setError(null);

      // Build query parameters for ALL available pets
      const queryParams = {
        // Always get available pets first
        available: true,
        // Add limit for performance (can be adjusted)
        limit: 50
      };

      // Add filters if they exist
      if (searchTerm.trim()) queryParams.search = searchTerm.trim();
      if (selectedType) queryParams.type = selectedType;
      if (selectedBreed.trim()) queryParams.breed = selectedBreed.trim();
      if (ageRange) queryParams.age = ageRange;
      if (selectedGender) queryParams.gender = selectedGender;
      if (selectedSize) queryParams.size = selectedSize;

      console.log('📋 Query params:', queryParams);

      // Make API call
      const response = await petAPI.getAllPets(queryParams);
      
      console.log('📡 API Response:', response);

      // Handle different response structures
      let petsData = [];
      if (response.data?.data) {
        petsData = response.data.data;
      } else if (response.data?.pets) {
        petsData = response.data.pets;
      } else if (Array.isArray(response.data)) {
        petsData = response.data;
      } else {
        console.warn('⚠️ Unexpected response structure:', response);
        petsData = [];
      }

      setPets(petsData);
      setRetryAttempts(0);
      
      console.log(`✅ Successfully loaded ${petsData.length} pets`);

    } catch (err) {
      console.error(`❌ Error fetching pets (attempt ${attempt}):`, err);
      
      if (attempt < MAX_RETRIES) {
        console.log(`🔄 Retrying in ${RETRY_DELAY}ms...`);
        setRetryAttempts(attempt);
        setTimeout(() => fetchPets(attempt + 1), RETRY_DELAY);
      } else {
        const errorMessage = err.response?.data?.message || 
                           err.message || 
                           'Failed to load pets. Please try again later.';
        setError(errorMessage);
        setRetryAttempts(0);
      }
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedType, selectedBreed, ageRange, selectedGender, selectedSize]);

  // Handle search form submission
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    updateUrlParams();
    fetchPets();
  }, [fetchPets]);

  // Update URL parameters
  const updateUrlParams = useCallback(() => {
    const newParams = new URLSearchParams();
    
    if (searchTerm.trim()) newParams.set('search', searchTerm.trim());
    if (selectedType) newParams.set('type', selectedType);
    if (selectedBreed.trim()) newParams.set('breed', selectedBreed.trim());
    if (ageRange) newParams.set('age', ageRange);
    if (selectedGender) newParams.set('gender', selectedGender);
    if (selectedSize) newParams.set('size', selectedSize);
    
    setSearchParams(newParams);
  }, [searchTerm, selectedType, selectedBreed, ageRange, selectedGender, selectedSize, setSearchParams]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedBreed('');
    setAgeRange('');
    setSelectedGender('');
    setSelectedSize('');
    setSearchParams(new URLSearchParams());
    fetchPets();
  }, [setSearchParams, fetchPets]);

  // Get active filters for display
  const activeFilters = useMemo(() => {
    const filters = [];
    if (searchTerm.trim()) filters.push(`Search: "${searchTerm}"`);
    if (selectedType) filters.push(`Type: ${petTypes.find(t => t.value === selectedType)?.label}`);
    if (selectedBreed.trim()) filters.push(`Breed: ${selectedBreed}`);
    if (ageRange) filters.push(`Age: ${ageRanges.find(a => a.value === ageRange)?.label}`);
    if (selectedGender) filters.push(`Gender: ${genderOptions.find(g => g.value === selectedGender)?.label}`);
    if (selectedSize) filters.push(`Size: ${sizeOptions.find(s => s.value === selectedSize)?.label}`);
    return filters;
  }, [searchTerm, selectedType, selectedBreed, ageRange, selectedGender, selectedSize, petTypes, ageRanges, genderOptions, sizeOptions]);

  // Initial load and URL parameter changes
  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  // Manual retry function
  const handleRetry = () => {
    setRetryAttempts(0);
    fetchPets();
  };

  return (
    <Container fluid className="py-4">
      <Row className="justify-content-center">
        <Col xl={10}>
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="display-5 fw-bold text-primary mb-2">
              <i className="fas fa-paw me-2"></i>
              Browse Our Pets
            </h1>
            <p className="lead text-muted">Find your perfect companion from our loving pets waiting for homes</p>
          </div>

          {/* Search Form */}
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <Form onSubmit={handleSearch}>
                <InputGroup size="lg">
                  <Form.Control
                    type="text"
                    placeholder="Search pets by name, breed, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Search pets"
                  />
                  <Button variant="primary" type="submit" disabled={loading}>
                    <i className="fas fa-search me-1"></i>
                    Search
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowFilters(!showFilters)}
                    title={showFilters ? 'Hide filters' : 'Show filters'}
                    aria-expanded={showFilters}
                  >
                    <i className="fas fa-filter me-1"></i>
                    Filters
                  </Button>
                </InputGroup>
              </Form>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="mt-3 p-3 bg-light rounded">
                  <Row>
                    <Col md={4} className="mb-3">
                      <Form.Label className="fw-semibold">Pet Type</Form.Label>
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
                    <Col md={4} className="mb-3">
                      <Form.Label className="fw-semibold">Breed</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter breed..."
                        value={selectedBreed}
                        onChange={(e) => setSelectedBreed(e.target.value)}
                        aria-label="Filter by breed"
                      />
                    </Col>
                    <Col md={4} className="mb-3">
                      <Form.Label className="fw-semibold">Age Range</Form.Label>
                      <Form.Select
                        value={ageRange}
                        onChange={(e) => setAgeRange(e.target.value)}
                        aria-label="Filter by age range"
                      >
                        {ageRanges.map(age => (
                          <option key={age.value} value={age.value}>
                            {age.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label className="fw-semibold">Gender</Form.Label>
                      <Form.Select
                        value={selectedGender}
                        onChange={(e) => setSelectedGender(e.target.value)}
                        aria-label="Filter by gender"
                      >
                        {genderOptions.map(gender => (
                          <option key={gender.value} value={gender.value}>
                            {gender.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label className="fw-semibold">Size</Form.Label>
                      <Form.Select
                        value={selectedSize}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        aria-label="Filter by size"
                      >
                        {sizeOptions.map(size => (
                          <option key={size.value} value={size.value}>
                            {size.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Row>
                  
                  {/* Filter Actions */}
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      {activeFilters.length > 0 && (
                        <div>
                          <small className="text-muted me-2">Active filters:</small>
                          {activeFilters.map((filter, index) => (
                            <Badge key={index} bg="secondary" className="me-1 mb-1">
                              {filter}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <Button variant="outline-danger" size="sm" onClick={clearFilters}>
                        <i className="fas fa-times me-1"></i>
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Results Section */}
          <Row>
            <Col>
              {/* Loading State */}
              {loading && (
                <div className="text-center py-5">
                  <Spinner animation="border" size="lg" className="text-primary mb-3" />
                  <p className="text-muted">
                    {retryAttempts > 0 ? `Retrying... (${retryAttempts}/3)` : 'Loading pets...'}
                  </p>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <Alert variant="danger" className="text-center">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <strong>Error: </strong>{error}
                  <div className="mt-3">
                    <Button variant="outline-danger" onClick={handleRetry}>
                      Try Again
                    </Button>
                  </div>
                </Alert>
              )}

              {/* Results */}
              {!loading && !error && (
                <>
                  {/* Results Summary */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3 className="h5 mb-0">
                      {pets.length} {pets.length === 1 ? 'Pet' : 'Pets'} Found
                    </h3>
                    {activeFilters.length > 0 && (
                      <Button variant="outline-primary" size="sm" onClick={clearFilters}>
                        <i className="fas fa-times me-1"></i>
                        Clear All Filters
                      </Button>
                    )}
                  </div>

                  {/* Pet Grid */}
                  {pets.length > 0 ? (
                    <Row>
                      {pets.map((pet) => (
                        <Col key={pet._id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                          <PetCard pet={pet} />
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <div className="text-center py-5">
                      <i className="fas fa-paw display-1 text-muted mb-3"></i>
                      <h4>No pets found</h4>
                      <p className="text-muted mb-4">
                        {activeFilters.length > 0
                          ? "Try adjusting your search criteria or clear some filters to see more results."
                          : "There are no pets available at the moment. Please check back later!"
                        }
                      </p>
                      {activeFilters.length > 0 && (
                        <Button variant="outline-primary" onClick={clearFilters}>
                          <i className="fas fa-times me-1"></i>
                          Clear All Filters
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default Browse;