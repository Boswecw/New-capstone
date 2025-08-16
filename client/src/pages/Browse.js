// client/src/pages/Browse.js - FIXED VERSION (Like Home Page)
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert, Button, Form, Card, Badge } from 'react-bootstrap';
import { useSearchParams, Link } from 'react-router-dom';
import { petAPI } from '../services/api';
import PetCard from '../components/PetCard';
import HeroBanner from '../components/HeroBanner';
import usePetFilters from '../hooks/usePetFilters';

const Browse = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [searchParams, setSearchParams] = useSearchParams();

  // Use the pet filters hook
  const {
    filters,
    filteredPets,
    filterOptions,
    hasActiveFilters,
    updateFilter,
    resetFilters
  } = usePetFilters(pets);

  // Get initial filter values from URL
  useEffect(() => {
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const age = searchParams.get('age');
    
    if (type) updateFilter('species', type);
    if (status) updateFilter('status', status);
    if (age) updateFilter('age', age);
  }, [searchParams, updateFilter]);

  // Fetch pets data - SAME PATTERN AS HOME PAGE
  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        setError('');
        
        console.log('🔍 Fetching pets for browse page...');
        
        // Use the same API call as Home page
        const response = await petAPI.getAllPets({
          limit: 50, // Get more pets for browsing
          status: 'available' // Default to available pets
        });

        console.log('Browse pets response:', response.data);

        // ✅ SAME DATA HANDLING AS HOME PAGE
        const petsData = response.data?.data || [];
        setPets(petsData);
        
        console.log(`✅ Loaded ${petsData.length} pets for browsing`);
        
      } catch (error) {
        console.error('❌ Error fetching pets:', error);
        setError('Failed to load pets. Please try again later.');
        setPets([]); // Ensure pets is always an array
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, []);

  const handleFilterChange = (filterKey, value) => {
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

  const handleResetFilters = () => {
    resetFilters();
    setSearchParams({});
  };

  // Loading state - SAME AS HOME PAGE
  if (loading) {
    return (
      <>
        <HeroBanner
          variant="simple"
          title="Browse Our Pets"
          subtitle="Finding the perfect pets for you..."
          showLogo={false}
          showStats={false}
        />
        <Container className="py-5 text-center">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3 text-muted">Loading amazing pets...</p>
        </Container>
      </>
    );
  }

  // Error state - SAME AS HOME PAGE
  if (error) {
    return (
      <>
        <HeroBanner
          variant="simple"
          title="Browse Our Pets"
          subtitle="Something went wrong, but don't worry!"
          showLogo={false}
        />
        <Container className="py-5">
          <Alert variant="danger" className="text-center">
            <Alert.Heading>Oops! Something went wrong</Alert.Heading>
            <p>{error}</p>
            <Button variant="outline-danger" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <div>
      {/* Hero Banner */}
      <HeroBanner
        variant="simple"
        title="Browse Our Pets"
        subtitle={`Discover ${pets.length} amazing pets looking for their forever homes`}
        showLogo={false}
        primaryButtonText="View Featured Pets"
        primaryButtonLink="/pets/featured"
        showStats={false}
        backgroundGradient="linear-gradient(135deg, #28a745 0%, #20c997 70%, #17a2b8 100%)"
        minHeight="300px"
      />

      <Container className="py-5">
        <Row>
          {/* Filters Sidebar */}
          <Col lg={3} className="mb-4">
            <Card className="h-fit">
              <Card.Header className="bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="fas fa-filter me-2"></i>
                    Filters
                  </h5>
                  {hasActiveFilters && (
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={handleResetFilters}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </Card.Header>
              <Card.Body>
                {/* Pet Type Filter */}
                <div className="mb-3">
                  <Form.Label className="fw-bold">Pet Type</Form.Label>
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
                </div>

                {/* Age Filter */}
                <div className="mb-3">
                  <Form.Label className="fw-bold">Age</Form.Label>
                  <Form.Select
                    value={filters.age || ''}
                    onChange={(e) => handleFilterChange('age', e.target.value)}
                  >
                    <option value="">All Ages</option>
                    {filterOptions.ages.map(age => (
                      <option key={age} value={age}>
                        {age.charAt(0).toUpperCase() + age.slice(1)}
                      </option>
                    ))}
                  </Form.Select>
                </div>

                {/* Size Filter */}
                <div className="mb-3">
                  <Form.Label className="fw-bold">Size</Form.Label>
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
                </div>

                {/* Gender Filter */}
                <div className="mb-3">
                  <Form.Label className="fw-bold">Gender</Form.Label>
                  <Form.Select
                    value={filters.gender || ''}
                    onChange={(e) => handleFilterChange('gender', e.target.value)}
                  >
                    <option value="">All Genders</option>
                    {filterOptions.genders.map(gender => (
                      <option key={gender} value={gender}>
                        {gender.charAt(0).toUpperCase() + gender.slice(1)}
                      </option>
                    ))}
                  </Form.Select>
                </div>

                {/* Search Filter */}
                <div className="mb-3">
                  <Form.Label className="fw-bold">Search</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Search by name, breed..."
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                  <div className="mt-3">
                    <small className="text-muted d-block mb-2">Active Filters:</small>
                    <div className="d-flex flex-wrap gap-1">
                      {Object.entries(filters).map(([key, value]) => {
                        if (value && value !== '' && value !== 'available') {
                          return (
                            <Badge 
                              key={key}
                              bg="primary" 
                              className="d-flex align-items-center gap-1"
                            >
                              {value}
                              <i 
                                className="fas fa-times"
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleFilterChange(key, '')}
                              />
                            </Badge>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Pet Results */}
          <Col lg={9}>
            {/* Results Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h4 className="mb-1">
                  {hasActiveFilters ? 'Filtered Results' : 'All Available Pets'}
                </h4>
                <p className="text-muted mb-0">
                  Showing {filteredPets.length} of {pets.length} pets
                </p>
              </div>
              
              <div className="d-flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <i className="fas fa-th me-1" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <i className="fas fa-list me-1" />
                  List
                </Button>
              </div>
            </div>

            {/* No Results */}
            {filteredPets.length === 0 ? (
              <Card className="text-center py-5">
                <Card.Body>
                  <i className="fas fa-search fa-3x text-muted mb-3" />
                  <h4>No pets found</h4>
                  <p className="text-muted mb-3">
                    Try adjusting your filters or search terms
                  </p>
                  {hasActiveFilters && (
                    <Button variant="primary" onClick={handleResetFilters}>
                      Clear All Filters
                    </Button>
                  )}
                </Card.Body>
              </Card>
            ) : (
              /* Pet Grid/List - SAME PETCARD AS HOME PAGE */
              <Row className={viewMode === 'grid' ? 'g-4' : 'g-3'}>
                {filteredPets.map((pet) => (
                  <Col 
                    key={pet._id} 
                    xs={12}
                    sm={viewMode === 'grid' ? 6 : 12}
                    md={viewMode === 'grid' ? 6 : 12}
                    lg={viewMode === 'grid' ? 4 : 12}
                    className="d-flex"
                  >
                    <PetCard 
                      pet={pet} 
                      showFavoriteButton={true}
                      showAdoptionStatus={true}
                      className="h-100 w-100"
                      variant={viewMode === 'list' ? 'horizontal' : 'vertical'}
                    />
                  </Col>
                ))}
              </Row>
            )}

            {/* Load More Button (for future pagination) */}
            {filteredPets.length > 0 && filteredPets.length >= 20 && (
              <div className="text-center mt-5">
                <Button variant="outline-primary" size="lg">
                  <i className="fas fa-plus me-2" />
                  Load More Pets
                </Button>
              </div>
            )}
          </Col>
        </Row>

        {/* Call to Action */}
        {pets.length > 0 && (
          <Card className="mt-5 bg-light">
            <Card.Body className="text-center py-4">
              <h4>Can't Find the Perfect Pet?</h4>
              <p className="text-muted mb-3">
                Don't worry! New pets arrive regularly. Sign up for notifications or contact us directly.
              </p>
              <div className="d-flex gap-2 justify-content-center flex-wrap">
                <Link to="/contact" className="btn btn-primary">
                  <i className="fas fa-envelope me-2" />
                  Contact Us
                </Link>
                <Link to="/about" className="btn btn-outline-primary">
                  <i className="fas fa-info-circle me-2" />
                  Learn More
                </Link>
              </div>
            </Card.Body>
          </Card>
        )}
      </Container>
    </div>
  );
};

export default Browse;