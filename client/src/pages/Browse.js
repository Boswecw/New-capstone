// client/src/pages/Browse.js - Enhanced with consolidated functionality
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Spinner, Alert, Form, Button, InputGroup } from 'react-bootstrap';
import { useSearchParams, useLocation } from 'react-router-dom';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';
import PetCard from '../components/PetCard';
import * as petService from '../services/petService';

const Browse = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedBreed, setSelectedBreed] = useState(searchParams.get('breed') || '');
  const [ageRange, setAgeRange] = useState(searchParams.get('age') || '');
  const [showFilters, setShowFilters] = useState(false);

  // Available filter options
  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'dog', label: 'Dogs' },
    { value: 'cat', label: 'Cats' },
    { value: 'aquatic', label: 'Aquatic' }
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

      const params = {
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedBreed && { breed: selectedBreed }),
        ...(ageRange && { age: ageRange })
      };

      const response = await petService.searchPets(params);
      setPets(response.data || []);
    } catch (err) {
      console.error('Error fetching pets:', err);
      setError('Failed to load pets. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, selectedBreed, ageRange]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedBreed) params.set('breed', selectedBreed);
    if (ageRange) params.set('age', ageRange);
    
    setSearchParams(params);
  }, [searchTerm, selectedCategory, selectedBreed, ageRange, setSearchParams]);

  // Fetch pets when filters change
  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    fetchPets();
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedBreed('');
    setAgeRange('');
    setSearchParams({});
  };

  // Determine page title based on route
  const getPageTitle = () => {
    if (location.pathname.includes('/pets')) return 'Available Pets';
    if (selectedCategory) return `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}s for Adoption`;
    return 'Browse Pets for Adoption';
  };

  const getPageSubtitle = () => {
    const totalPets = pets.length;
    if (totalPets === 0) return 'No pets found matching your criteria';
    if (totalPets === 1) return '1 pet found';
    return `${totalPets} pets found`;
  };

  return (
    <Container className="py-4">
      {/* Page Header */}
      <div className="text-center mb-4">
        <h1 className="display-4 text-primary mb-2">{getPageTitle()}</h1>
        <p className="lead text-muted">{getPageSubtitle()}</p>
      </div>

      {/* Search and Filter Section */}
      <Row className="mb-4">
        <Col lg={8} className="mx-auto">
          {/* Search Form */}
          <Form onSubmit={handleSearch} className="mb-3">
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search by pet name, breed, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search pets"
              />
              <Button 
                variant="primary" 
                type="submit"
                disabled={loading}
                aria-label="Search"
              >
                <FaSearch />
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => setShowFilters(!showFilters)}
                aria-label={showFilters ? 'Hide filters' : 'Show filters'}
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
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    aria-label="Filter by pet category"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
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
      {(searchTerm || selectedCategory || selectedBreed || ageRange) && (
        <Row className="mb-3">
          <Col>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <small className="text-muted">Active filters:</small>
              {searchTerm && (
                <span className="badge bg-primary">Search: {searchTerm}</span>
              )}
              {selectedCategory && (
                <span className="badge bg-secondary">
                  Category: {categories.find(c => c.value === selectedCategory)?.label}
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
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
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
        <>
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
            <Row>
              {pets.map((pet) => (
                <Col key={pet._id} sm={6} md={4} lg={3} className="mb-4">
                  <PetCard pet={pet} />
                </Col>
              ))}
            </Row>
          )}
        </>
      )}

      {/* Load More / Pagination could be added here */}
      {pets.length > 0 && pets.length % 12 === 0 && (
        <div className="text-center mt-4">
          <Button variant="outline-primary" size="lg">
            Load More Pets
          </Button>
        </div>
      )}
    </Container>
  );
};

export default Browse;