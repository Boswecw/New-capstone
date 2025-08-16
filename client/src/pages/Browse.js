// client/src/pages/Browse.js - ESLint Compliant Version
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import PetCard from '../components/PetCard';
import usePetFilters from '../hooks/usePetFilters';

const Browse = () => {
  const [pets, setPets] = useState([]); // Always initialize as array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use the pet filters hook - only extract what we actually use
  const {
    filters,
    sortBy,
    filteredPets,
    filterOptions,
    hasActiveFilters,
    updateFilter,
    resetFilters,
    setSortBy
  } = usePetFilters(pets);

  // Fetch pets data - FIXED TO HANDLE API RESPONSE CORRECTLY
  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/pets');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const apiResponse = await response.json();
        console.log('API Response:', apiResponse);
        
        // ✅ CRITICAL FIX: Extract the data array from the API response
        if (apiResponse.success && Array.isArray(apiResponse.data)) {
          setPets(apiResponse.data); // Set just the pets array, not the whole response
        } else {
          console.error('Invalid API response format:', apiResponse);
          setPets([]); // Fallback to empty array
          setError('Invalid data format received from server');
        }
        
      } catch (err) {
        console.error('Error fetching pets:', err);
        setError(err.message || 'Failed to fetch pets');
        setPets([]); // Ensure pets is always an array even on error
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, []);

  const handlePetClick = (pet) => {
    // Navigate to pet detail page
    window.location.href = `/pets/${pet._id}`;
  };

  // Loading state
  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" size="lg" />
          <h4 className="mt-3">Loading pets...</h4>
          <p className="text-muted">Finding your perfect companion...</p>
        </div>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          <Alert.Heading>Oops! Something went wrong</Alert.Heading>
          <p>{error}</p>
          <Button 
            variant="outline-danger" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  // No pets found
  if (!loading && pets.length === 0) {
    return (
      <Container className="py-5">
        <Alert variant="info" className="text-center">
          <Alert.Heading>No pets found</Alert.Heading>
          <p>We don't have any pets available right now. Please check back later!</p>
          <Link to="/" className="btn btn-primary">
            Go to Homepage
          </Link>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      {/* Header */}
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold">Browse Our Pets</h1>
        <p className="lead text-muted">
          Find your perfect companion from our {pets.length} available pets
        </p>
      </div>

      {/* Filter Controls */}
      <Row className="mb-4">
        <Col md={3}>
          <h5>Filter Options</h5>
          
          {/* Type Filter */}
          <div className="mb-3">
            <label className="form-label">Pet Type</label>
            <select 
              className="form-select"
              value={filters.species || ''}
              onChange={(e) => updateFilter('species', e.target.value)}
            >
              <option value="">All Types</option>
              {filterOptions.species.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="mb-3">
            <label className="form-label">Status</label>
            <select 
              className="form-select"
              value={filters.status || ''}
              onChange={(e) => updateFilter('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="pending">Pending</option>
              <option value="adopted">Adopted</option>
            </select>
          </div>

          {/* Age Filter */}
          <div className="mb-3">
            <label className="form-label">Age</label>
            <select 
              className="form-select"
              value={filters.age || ''}
              onChange={(e) => updateFilter('age', e.target.value)}
            >
              <option value="">All Ages</option>
              {filterOptions.ages.map(age => (
                <option key={age} value={age}>{age}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={resetFilters}
              className="w-100"
            >
              Reset Filters
            </Button>
          )}
        </Col>

        <Col md={9}>
          {/* Sort Controls */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <span className="text-muted">
                Showing {filteredPets.length} of {pets.length} pets
              </span>
            </div>
            <div className="d-flex gap-2">
              <select 
                className="form-select form-select-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
                <option value="price">Adoption Fee</option>
              </select>
            </div>
          </div>

          {/* Pet Grid */}
          {filteredPets.length === 0 ? (
            <Alert variant="info">
              No pets match your current filters. Try adjusting your search criteria.
            </Alert>
          ) : (
            <Row>
              {filteredPets.map((pet) => (
                <Col key={pet._id} lg={4} md={6} className="mb-4">
                  <PetCard 
                    pet={pet} 
                    onClick={handlePetClick}
                  />
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Browse;