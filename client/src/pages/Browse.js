// client/src/pages/Browse.js - Corrected with Image Loading Fixes and Better Error Handling

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { FaSearch, FaFilter, FaTimes, FaPaw, FaExclamationTriangle } from 'react-icons/fa';
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
    { value: 'bird', label: 'Birds' },
    { value: 'small-pet', label: 'Small Pets' },
    { value: 'rabbit', label: 'Rabbits' },
    { value: 'reptile', label: 'Reptiles' }
  ], []);

  const ageRanges = useMemo(() => [
    { value: '', label: 'Any Age' },
    { value: 'puppy', label: 'Puppy/Kitten (0-1 year)' },
    { value: 'young', label: 'Young (1-3 years)' },
    { value: 'adult', label: 'Adult (3-7 years)' },
    { value: 'senior', label: 'Senior (7+ years)' }
  ], []);

  const genderOptions = useMemo(() => [
    { value: '', label: 'Any Gender' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' }
  ], []);

  const sizeOptions = useMemo(() => [
    { value: '', label: 'Any Size' },
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'extra-large', label: 'Extra Large' }
  ], []);

  // Enhanced fetch function with retry logic and better error handling
  const fetchPets = useCallback(async (attempt = 1) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000 * attempt; // Exponential backoff

    try {
      console.log(`🔍 Fetching pets (attempt ${attempt}/${MAX_RETRIES})`);
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedType) params.type = selectedType;
      if (selectedBreed.trim()) params.breed = selectedBreed.trim();
      if (ageRange) params.age = ageRange;
      if (selectedGender) params.gender = selectedGender;
      if (selectedSize) params.size = selectedSize;
      
      // Add status filter to only get available pets
      params.status = 'available';
      
      console.log('🐕 Fetching pets with params:', params);
      
      const response = await petAPI.getAllPets(params);
      console.log('🐾 Browse pets response:', response.data);

      // Enhanced data extraction with safety checks
      let petsData = [];
      if (response?.data?.success && Array.isArray(response.data.data)) {
        petsData = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        petsData = response.data;
      } else if (response?.pets && Array.isArray(response.pets)) {
        petsData = response.pets;
      }

      // Process pets data to ensure proper image URLs
      const processedPets = petsData.map(pet => ({
        ...pet,
        imageUrl: pet.imageUrl || (pet.image ? `https://storage.googleapis.com/furbabies-petstore/${pet.image}` : null),
        hasValidImage: !!(pet.imageUrl || pet.image)
      }));

      setPets(processedPets);
      setRetryAttempts(0);
      
      console.log(`✅ Successfully loaded ${processedPets.length} pets`);
      
    } catch (err) {
      console.error(`❌ Error fetching pets (attempt ${attempt}):`, err);
      
      if (attempt < MAX_RETRIES) {
        console.log(`🔄 Retrying in ${RETRY_DELAY}ms...`);
        setRetryAttempts(attempt);
        
        setTimeout(() => {
          fetchPets(attempt + 1);
        }, RETRY_DELAY);
        
        return;
      }
      
      // Final error after all retries
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Failed to load pets. Please check your connection and try again.';
      
      setError(errorMessage);
      setRetryAttempts(0);
      console.error('🚨 All retry attempts failed:', errorMessage);
      
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedType, selectedBreed, ageRange, selectedGender, selectedSize]);

  // Update URL parameters when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (selectedType) params.set('type', selectedType);
    if (selectedBreed.trim()) params.set('breed', selectedBreed.trim());
    if (ageRange) params.set('age', ageRange);
    if (selectedGender) params.set('gender', selectedGender);
    if (selectedSize) params.set('size', selectedSize);

    setSearchParams(params);
  }, [searchTerm, selectedType, selectedBreed, ageRange, selectedGender, selectedSize, setSearchParams]);

  // Initialize filters from URL parameters
  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
    setSelectedType(searchParams.get('type') || '');
    setSelectedBreed(searchParams.get('breed') || '');
    setAgeRange(searchParams.get('age') || '');
    setSelectedGender(searchParams.get('gender') || '');
    setSelectedSize(searchParams.get('size') || '');
  }, [searchParams]);

  // Fetch pets when component mounts or filters change
  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedBreed('');
    setAgeRange('');
    setSelectedGender('');
    setSelectedSize('');
    setShowFilters(false);
  }, []);

  // Handle search form submission
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    fetchPets();
  }, [fetchPets]);

  // Manual retry function
  const handleRetry = useCallback(() => {
    fetchPets();
  }, [fetchPets]);

  // Get active filters for display
  const activeFilters = useMemo(() => {
    const filters = [];
    if (searchTerm.trim()) filters.push({ type: 'Search', value: searchTerm.trim() });
    if (selectedType) filters.push({ type: 'Type', value: petTypes.find(p => p.value === selectedType)?.label || selectedType });
    if (selectedBreed.trim()) filters.push({ type: 'Breed', value: selectedBreed.trim() });
    if (ageRange) filters.push({ type: 'Age', value: ageRanges.find(a => a.value === ageRange)?.label || ageRange });
    if (selectedGender) filters.push({ type: 'Gender', value: genderOptions.find(g => g.value === selectedGender)?.label || selectedGender });
    if (selectedSize) filters.push({ type: 'Size', value: sizeOptions.find(s => s.value === selectedSize)?.label || selectedSize });
    return filters;
  }, [searchTerm, selectedType, selectedBreed, ageRange, selectedGender, selectedSize, petTypes, ageRanges, genderOptions, sizeOptions]);

  return (
    <Container fluid className="py-4">
      <Row className="justify-content-center">
        <Col xl={10}>
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="display-5 fw-bold text-primary mb-2">
              <FaPaw className="me-2" />
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
                    <FaSearch className="me-1" />
                    Search
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowFilters(!showFilters)}
                    title={showFilters ? 'Hide filters' : 'Show filters'}
                    aria-expanded={showFilters}
                  >
                    <FaFilter className="me-1" />
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
                        placeholder="Enter breed (optional)"
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
                          <option key={age.value} value={age.value}>{age.label}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={4} className="mb-3">
                      <Form.Label className="fw-semibold">Gender</Form.Label>
                      <Form.Select
                        value={selectedGender}
                        onChange={(e) => setSelectedGender(e.target.value)}
                        aria-label="Filter by gender"
                      >
                        {genderOptions.map(gender => (
                          <option key={gender.value} value={gender.value}>{gender.label}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={4} className="mb-3">
                      <Form.Label className="fw-semibold">Size</Form.Label>
                      <Form.Select
                        value={selectedSize}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        aria-label="Filter by size"
                      >
                        {sizeOptions.map(size => (
                          <option key={size.value} value={size.value}>{size.label}</option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Row>
                  <div className="d-flex justify-content-between align-items-center">
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      onClick={clearFilters}
                      className="d-inline-flex align-items-center"
                    >
                      <FaTimes className="me-1" /> Clear All Filters
                    </Button>
                    <small className="text-muted">
                      {pets.length} {pets.length === 1 ? 'pet' : 'pets'} found
                    </small>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Active Filters Display */}
          {activeFilters.length > 0 && (
            <div className="mb-3">
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <small className="text-muted fw-semibold">Active filters:</small>
                {activeFilters.map((filter, index) => (
                  <Badge key={index} bg="primary" className="fs-6">
                    {filter.type}: {filter.value}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" role="status" className="mb-3">
                <span className="visually-hidden">Loading pets...</span>
              </Spinner>
              <p className="text-muted">
                {retryAttempts > 0 ? `Retrying... (${retryAttempts}/3)` : 'Loading available pets...'}
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <Alert variant="danger" className="text-center">
              <FaExclamationTriangle className="me-2" />
              <strong>Oops! Something went wrong.</strong>
              <div className="mt-2">{error}</div>
              <Button variant="outline-danger" size="sm" className="mt-3" onClick={handleRetry}>
                Try Again
              </Button>
            </Alert>
          )}

          {/* Pets Grid */}
          {!loading && !error && (
            <>
              {Array.isArray(pets) && pets.length > 0 ? (
                <Row className="g-4">
                  {pets.map((pet) => (
                    <Col key={pet._id} xs={12} sm={6} md={4} lg={3}>
                      <PetCard pet={pet} />
                    </Col>
                  ))}
                </Row>
              ) : (
                <div className="text-center py-5">
                  <div className="mb-4">
                    <FaSearch size={64} className="text-muted opacity-50" />
                  </div>
                  <h4 className="text-muted mb-3">No pets found</h4>
                  <p className="text-muted mb-4">
                    {activeFilters.length > 0 
                      ? "Try adjusting your search criteria or clear some filters to see more results."
                      : "There are no pets available at the moment. Please check back later!"
                    }
                  </p>
                  {activeFilters.length > 0 && (
                    <Button variant="outline-primary" onClick={clearFilters}>
                      <FaTimes className="me-1" /> Clear All Filters
                    </Button>
                  )}
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