// client/src/pages/Browse.js - UPDATED VERSION

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Card,
} from "react-bootstrap";
import { useSearchParams } from "react-router-dom";

// ✅ EXPLICIT IMPORT - This ensures we get the updated PetCard with SafeImage
import PetCard from "../components/PetCard";
import { petAPI } from "../services/api";

const Browse = () => {
  console.log('🔍 Browse component loaded - PetCard should now use SafeImage');
  
  // State management
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter states
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [selectedType, setSelectedType] = useState(
    searchParams.get("type") || ""
  );
  const [selectedBreed, setSelectedBreed] = useState(
    searchParams.get("breed") || ""
  );
  const [ageRange, setAgeRange] = useState(searchParams.get("age") || "");
  const [selectedGender, setSelectedGender] = useState(
    searchParams.get("gender") || ""
  );
  const [selectedSize, setSelectedSize] = useState(
    searchParams.get("size") || ""
  );
  const [showFilters, setShowFilters] = useState(false);

  // Filter options
  const petTypes = useMemo(
    () => [
      { value: "", label: "All Pets" },
      { value: "dog", label: "Dogs" },
      { value: "cat", label: "Cats" },
      { value: "fish", label: "Fish & Aquatic" },
      { value: "small-pet", label: "Small Pets" },
      { value: "bird", label: "Birds" },
    ],
    []
  );

  const ageRanges = useMemo(
    () => [
      { value: "", label: "Any Age" },
      { value: "6 months", label: "6 Months" },
      { value: "puppy", label: "Puppy/Kitten (0-1 year)" },
      { value: "young", label: "Young (1-3 years)" },
      { value: "adult", label: "Adult (3-7 years)" },
      { value: "senior", label: "Senior (7+ years)" },
    ],
    []
  );

  const genderOptions = useMemo(
    () => [
      { value: "", label: "Any Gender" },
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
      { value: "unknown", label: "Unknown" },
    ],
    []
  );

  const sizeOptions = useMemo(
    () => [
      { value: "", label: "Any Size" },
      { value: "small", label: "Small" },
      { value: "medium", label: "Medium" },
      { value: "large", label: "Large" },
    ],
    []
  );

  // Fetch pets function
  const fetchPets = useCallback(
    async (attempt = 1) => {
      const MAX_RETRIES = 3;
      const RETRY_DELAY = 1000 * attempt;

      try {
        console.log(`🔍 Browse: Fetching pets (attempt ${attempt}/${MAX_RETRIES})`);
        setLoading(true);
        setError(null);

        // Build query parameters
        const queryParams = {
          available: true,
          limit: 50,
        };

        // Add filters if they exist
        if (searchTerm.trim()) {
          queryParams.search = searchTerm.trim();
        }
        if (selectedType) {
          queryParams.species = selectedType;
        }
        if (selectedBreed) {
          queryParams.breed = selectedBreed;
        }
        if (ageRange) {
          queryParams.age = ageRange;
        }
        if (selectedGender) {
          queryParams.gender = selectedGender;
        }
        if (selectedSize) {
          queryParams.size = selectedSize;
        }

        console.log('🔍 Browse: Query params:', queryParams);

        const response = await petAPI.getAllPets(queryParams);
        
        if (response.success && response.data) {
          setPets(response.data);
          console.log(`✅ Browse: Loaded ${response.data.length} pets`);
        } else {
          console.warn('⚠️ Browse: No pets returned from API');
          setPets([]);
        }
        
        setRetryAttempts(0);
      } catch (err) {
        console.error('❌ Browse: Error fetching pets:', err);
        setError(err.message || 'Failed to load pets');
        
        if (attempt < MAX_RETRIES) {
          setTimeout(() => {
            setRetryAttempts(attempt);
            fetchPets(attempt + 1);
          }, RETRY_DELAY);
        }
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, selectedType, selectedBreed, ageRange, selectedGender, selectedSize]
  );

  // Load pets on mount and when filters change
  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (selectedType) params.set("type", selectedType);
    if (selectedBreed) params.set("breed", selectedBreed);
    if (ageRange) params.set("age", ageRange);
    if (selectedGender) params.set("gender", selectedGender);
    if (selectedSize) params.set("size", selectedSize);
    
    setSearchParams(params);
  }, [searchTerm, selectedType, selectedBreed, ageRange, selectedGender, selectedSize, setSearchParams]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchPets();
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case "type":
        setSelectedType(value);
        break;
      case "breed":
        setSelectedBreed(value);
        break;
      case "age":
        setAgeRange(value);
        break;
      case "gender":
        setSelectedGender(value);
        break;
      case "size":
        setSelectedSize(value);
        break;
      default:
        break;
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("");
    setSelectedBreed("");
    setAgeRange("");
    setSelectedGender("");
    setSelectedSize("");
    setSearchParams({});
  };

  // Handle retry
  const handleRetry = () => {
    setRetryAttempts(0);
    fetchPets();
  };

  // Active filters for display
  const activeFilters = [
    searchTerm && `Search: "${searchTerm}"`,
    selectedType && `Type: ${petTypes.find(t => t.value === selectedType)?.label}`,
    selectedBreed && `Breed: ${selectedBreed}`,
    ageRange && `Age: ${ageRanges.find(a => a.value === ageRange)?.label}`,
    selectedGender && `Gender: ${genderOptions.find(g => g.value === selectedGender)?.label}`,
    selectedSize && `Size: ${sizeOptions.find(s => s.value === selectedSize)?.label}`,
  ].filter(Boolean);

  return (
    <Container className="py-4">
      <Row>
        <Col>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h2 mb-1">Browse Pets</h1>
              <p className="text-muted mb-0">
                Find your perfect companion from our available pets
              </p>
            </div>
            <Button
              variant="outline-primary"
              onClick={() => setShowFilters(!showFilters)}
            >
              <i className="fas fa-filter me-2"></i>
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>

          {/* Search Bar */}
          <Form onSubmit={handleSearch} className="mb-4">
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search pets by name, breed, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="primary" type="submit">
                <i className="fas fa-search"></i>
              </Button>
            </InputGroup>
          </Form>

          {/* Filters */}
          {showFilters && (
            <Card className="mb-4">
              <Card.Body>
                <h5 className="card-title mb-3">Filter Options</h5>
                <Row>
                  <Col md={6} lg={3} className="mb-3">
                    <Form.Group>
                      <Form.Label>Pet Type</Form.Label>
                      <Form.Select
                        value={selectedType}
                        onChange={(e) => handleFilterChange("type", e.target.value)}
                      >
                        {petTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6} lg={3} className="mb-3">
                    <Form.Group>
                      <Form.Label>Age Range</Form.Label>
                      <Form.Select
                        value={ageRange}
                        onChange={(e) => handleFilterChange("age", e.target.value)}
                      >
                        {ageRanges.map((age) => (
                          <option key={age.value} value={age.value}>
                            {age.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6} lg={3} className="mb-3">
                    <Form.Group>
                      <Form.Label>Gender</Form.Label>
                      <Form.Select
                        value={selectedGender}
                        onChange={(e) => handleFilterChange("gender", e.target.value)}
                      >
                        {genderOptions.map((gender) => (
                          <option key={gender.value} value={gender.value}>
                            {gender.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6} lg={3} className="mb-3">
                    <Form.Group>
                      <Form.Label>Size</Form.Label>
                      <Form.Select
                        value={selectedSize}
                        onChange={(e) => handleFilterChange("size", e.target.value)}
                      >
                        {sizeOptions.map((size) => (
                          <option key={size.value} value={size.value}>
                            {size.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Active Filters Display */}
                {activeFilters.length > 0 && (
                  <div className="mt-3">
                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <small className="text-muted">Active filters:</small>
                      {activeFilters.map((filter, index) => (
                        <Badge key={index} bg="secondary" className="me-1">
                          {filter}
                        </Badge>
                      ))}
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={clearFilters}
                      >
                        <i className="fas fa-times me-1"></i>
                        Clear All
                      </Button>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Results Section */}
          <Row>
            <Col>
              {/* Loading State */}
              {loading && (
                <div className="text-center py-5">
                  <Spinner
                    animation="border"
                    size="lg"
                    className="text-primary mb-3"
                  />
                  <p className="text-muted">
                    {retryAttempts > 0
                      ? `Retrying... (${retryAttempts}/3)`
                      : "Loading pets..."}
                  </p>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <Alert variant="danger" className="text-center">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <strong>Error: </strong>
                  {error}
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
                      {pets.length} {pets.length === 1 ? "Pet" : "Pets"} Found
                    </h3>
                    {activeFilters.length > 0 && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={clearFilters}
                      >
                        <i className="fas fa-times me-1"></i>
                        Clear All Filters
                      </Button>
                    )}
                  </div>

                  {/* Pet Grid */}
                  {pets.length > 0 ? (
                    <Row>
                      {pets.map((pet) => {
                        console.log(`🐾 Rendering pet: ${pet.name} with SafeImage`);
                        return (
                          <Col
                            key={pet._id}
                            xs={12}
                            sm={6}
                            md={4}
                            lg={3}
                            className="mb-4"
                          >
                            <PetCard pet={pet} />
                          </Col>
                        );
                      })}
                    </Row>
                  ) : (
                    <div className="text-center py-5">
                      <i className="fas fa-paw display-1 text-muted mb-3"></i>
                      <h4>No pets found</h4>
                      <p className="text-muted mb-4">
                        {activeFilters.length > 0
                          ? "Try adjusting your search criteria or clear some filters to see more results."
                          : "There are no pets available at the moment. Please check back later!"}
                      </p>
                      {activeFilters.length > 0 && (
                        <Button
                          variant="outline-primary"
                          onClick={clearFilters}
                        >
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