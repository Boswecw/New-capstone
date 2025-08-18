// client/src/pages/Pets.js - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert, Button, Form, Card, Badge } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { FaSearch, FaFilter, FaTh, FaList, FaHeart } from 'react-icons/fa';

// API, hooks and components
import { api } from '../services/api';
import PetCard from '../components/PetCard';
import usePetFilters from '../hooks/usePetFilters';

const Pets = () => {
  // ✅ CRITICAL FIX: Initialize as empty array, not null
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [searchParams, setSearchParams] = useSearchParams();

  // ✅ FIXED: Properly destructure the usePetFilters hook
  const {
    filters,
    sortBy,
    sortOrder,
    filteredPets,
    filterOptions,
    filterStats,
    hasActiveFilters,
    updateFilter,
    resetFilters,
    setSortBy,
    setSortOrder
  } = usePetFilters(pets, {
    species: searchParams.get('type') || '',
    status: searchParams.get('status') || 'available',
    age: searchParams.get('age') || '',
    search: searchParams.get('search') || ''
  });

  // ✅ FIXED: Fetch pets with proper error handling
  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        setError('');
        
        console.log('🐾 Pets: Fetching pets data...');
        
        const response = await api.get('/pets', {
          params: {
            limit: 100,
            page: 1
          }
        });

        console.log('🐾 Pets: API response structure:', response.data);

        // ✅ CRITICAL: Handle different response structures safely
        let petsData = [];
        
        if (response?.data?.success && Array.isArray(response.data.data)) {
          // Structure: { success: true, data: [...] }
          petsData = response.data.data;
          console.log('✅ Pets: Using response.data.data (success wrapper)');
        } else if (Array.isArray(response?.data?.data)) {
          // Structure: { data: [...] }
          petsData = response.data.data;
          console.log('✅ Pets: Using response.data.data');
        } else if (Array.isArray(response?.data)) {
          // Structure: direct array
          petsData = response.data;
          console.log('✅ Pets: Using response.data (direct array)');
        } else {
          // Fallback: log the structure and use empty array
          console.warn('⚠️ Pets: Unexpected API response structure:', response);
          petsData = [];
        }
        
        // ✅ CRITICAL: Always set an array, never null/undefined
        setPets(petsData);
        console.log(`✅ Pets: Loaded ${petsData.length} pets successfully`);
        
      } catch (error) {
        console.error('❌ Pets: Error fetching pets:', error);
        setError('Failed to load pets. Please try again later.');
        // ✅ CRITICAL: Always set empty array on error
        setPets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, []);

  // Handle filter changes
  const handleFilterChange = (filterKey, value) => {
    console.log('🔄 Filter change:', filterKey, '=', value);
    updateFilter(filterKey, value);
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== '' && value !== 'all') {
      newParams.set(filterKey === 'species' ? 'type' : filterKey, value);
    } else {
      newParams.delete(filterKey === 'species' ? 'type' : filterKey);
    }
    setSearchParams(newParams);
  };

  const handleSearch = (searchTerm) => {
    console.log('🔍 Search:', searchTerm);
    handleFilterChange('search', searchTerm);
  };

  const handleSort = (newSortBy) => {
    console.log('📊 Sort change:', newSortBy);
    setSortBy(newSortBy);
    
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortOrder('desc');
    }
  };

  const handleResetFilters = () => {
    console.log('🔄 Resetting filters');
    resetFilters();
    setSearchParams(new URLSearchParams());
  };

  // Loading state
  if (loading) {
    return (
      <div className="pets-page">
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col md={6} className="text-center">
              <Spinner animation="border" variant="primary" size="lg" />
              <p className="mt-3 text-muted">Loading amazing pets...</p>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="pets-page">
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col md={8}>
              <Alert variant="danger" className="text-center">
                <h5>Oops! Something went wrong</h5>
                <p>{error}</p>
                <Button 
                  variant="primary" 
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </Alert>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <div className="pets-page">
      {/* Hero Banner */}
      <div className="pets-hero">
        <Container>
          <Row className="text-center py-5">
            <Col>
              <h1 className="display-4 fw-bold text-white mb-3">
                Find Your Perfect Companion
              </h1>
              <p className="lead text-white-50">
                {filterStats.total} adorable pets are waiting for loving homes
              </p>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="py-4">
        {/* Filters Section */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Body>
            <Row className="align-items-center">
              {/* Search */}
              <Col md={4} className="mb-3 mb-md-0">
                <div className="position-relative">
                  <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                  <Form.Control
                    type="text"
                    placeholder="Search pets by name, breed..."
                    value={filters.search || ''}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="ps-5"
                  />
                </div>
              </Col>

              {/* Type Filter */}
              <Col md={2} className="mb-3 mb-md-0">
                <Form.Select
                  value={filters.species || ''}
                  onChange={(e) => handleFilterChange('species', e.target.value)}
                >
                  <option value="">All Types</option>
                  {filterOptions.species.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              {/* Status Filter */}
              <Col md={2} className="mb-3 mb-md-0">
                <Form.Select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="available">Available</option>
                  <option value="pending">Pending</option>
                  <option value="adopted">Adopted</option>
                </Form.Select>
              </Col>

              {/* Size Filter */}
              <Col md={2} className="mb-3 mb-md-0">
                <Form.Select
                  value={filters.size || ''}
                  onChange={(e) => handleFilterChange('size', e.target.value)}
                >
                  <option value="">All Sizes</option>
                  {filterOptions.sizes.map(size => (
                    <option key={size} value={size}>
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              {/* Reset Button */}
              <Col md={2}>
                {hasActiveFilters && (
                  <Button
                    variant="outline-secondary"
                    onClick={handleResetFilters}
                    className="w-100"
                  >
                    <FaFilter className="me-1" />
                    Reset
                  </Button>
                )}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Results Header */}
        <Row className="align-items-center mb-4">
          <Col md={6}>
            <div className="results-info">
              <h4>
                {hasActiveFilters ? (
                  <>
                    {filterStats.filtered} of {filterStats.total} pets
                    <Badge bg="primary" className="ms-2">Filtered</Badge>
                  </>
                ) : (
                  <>All {filterStats.total} pets</>
                )}
              </h4>
              <small className="text-muted">
                {filterStats.available} available • {filterStats.adopted} adopted • {filterStats.pending} pending
              </small>
            </div>
          </Col>

          <Col md={6}>
            <div className="d-flex justify-content-end align-items-center gap-3">
              {/* Sort Options */}
              <div className="sort-controls">
                <Form.Select
                  value={sortBy}
                  onChange={(e) => handleSort(e.target.value)}
                  size="sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="age">Age</option>
                  <option value="breed">Breed</option>
                  <option value="featured">Featured</option>
                </Form.Select>
              </div>

              {/* View Mode Toggle */}
              <div className="view-toggle">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <FaTh />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="ms-1"
                >
                  <FaList />
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {/* Pets Grid/List */}
        {filteredPets.length === 0 ? (
          <Row className="justify-content-center">
            <Col md={6} className="text-center py-5">
              <div className="no-pets-message">
                <FaHeart size={48} className="text-muted mb-3" />
                <h3>No pets found</h3>
                <p className="text-muted">
                  {hasActiveFilters 
                    ? "Try adjusting your filters to see more pets."
                    : "No pets are currently available. Check back soon!"}
                </p>
                {hasActiveFilters && (
                  <Button variant="primary" onClick={handleResetFilters}>
                    Show All Pets
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        ) : (
          <Row className={`pets-${viewMode}`}>
            {filteredPets.map((pet, index) => {
              // ✅ CRITICAL DEBUG: Log what we're passing to PetCard
              console.log(`🐾 Pet ${index}:`, {
                name: pet.name,
                nameType: typeof pet.name,
                nameIsArray: Array.isArray(pet.name),
                nameValue: pet.name,
                fullPet: pet
              });
              
              return (
                <Col
                  key={pet._id}
                  xs={12}
                  sm={viewMode === 'grid' ? 6 : 12}
                  md={viewMode === 'grid' ? 4 : 12}
                  lg={viewMode === 'grid' ? 3 : 12}
                  className="mb-4"
                >
                  <PetCard
                    pet={pet}
                    showFavoriteButton={true}
                    showActions={true}
                    compact={viewMode === 'list'}
                  />
                </Col>
              );
            })}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default Pets;