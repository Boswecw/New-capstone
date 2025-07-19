import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Spinner,
  Alert,
  Form,
  Button,
  InputGroup,
} from "react-bootstrap";
import { useLocation } from "react-router-dom";
import PetCard from "../components/PetCard";
import { petAPI } from "../services/api";

const Browse = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedBreed, setSelectedBreed] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

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

  const fetchPets = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = { status: "available", limit: 50, ...params };
      const response = await petAPI.getAllPets(queryParams);
      if (response?.data?.success || response?.data?.data) {
        setPets(response.data.data || []);
      } else {
        setPets([]);
        setError("Unexpected response format from server");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load pets. Please try again.");
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filters = {
      type: params.get("type") || "",
      breed: params.get("breed") || "",
      age: params.get("age") || "",
      gender: params.get("gender") || "",
      size: params.get("size") || "",
      search: params.get("search") || "",
    };

    setSelectedType(filters.type);
    setSelectedBreed(filters.breed);
    setAgeRange(filters.age);
    setSelectedGender(filters.gender);
    setSelectedSize(filters.size);
    setSearchTerm(filters.search);
    setHasSearched(!!filters.search);

    fetchPets(filters);
  }, [location.search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setHasSearched(true);
    updateSearchParams();
  };

  const updateSearchParams = () => {
    const params = new URLSearchParams();
    if (hasSearched && searchTerm) params.set("search", searchTerm);
    if (selectedType) params.set("type", selectedType);
    if (selectedBreed) params.set("breed", selectedBreed);
    if (ageRange) params.set("age", ageRange);
    if (selectedGender) params.set("gender", selectedGender);
    if (selectedSize) params.set("size", selectedSize);
    window.history.replaceState({}, '', `${location.pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("");
    setSelectedBreed("");
    setAgeRange("");
    setSelectedGender("");
    setSelectedSize("");
    setHasSearched(false);
    window.history.replaceState({}, '', location.pathname);
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">Browse Pets</h2>
      <Form onSubmit={handleSearch} className="mb-3">
        <InputGroup>
          <Form.Control
            placeholder="Search by name or description"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="submit" variant="primary">
            Search
          </Button>
          <Button variant="secondary" onClick={clearFilters} className="ms-2">
            Clear
          </Button>
        </InputGroup>
      </Form>
      <Row className="mb-3">
        <Col md>
          <Form.Select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            {petTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md>
          <Form.Select
            value={ageRange}
            onChange={(e) => setAgeRange(e.target.value)}
          >
            {ageRanges.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md>
          <Form.Select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
          >
            {genderOptions.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md>
          <Form.Select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
          >
            {sizeOptions.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p>Loading pets...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : pets.length === 0 ? (
        <p className="text-muted">No pets found.</p>
      ) : (
        <Row>
          {pets.map((pet) => (
            <Col key={pet._id} xs={12} sm={6} md={4} lg={3} className="mb-4">
              <PetCard pet={pet} />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default Browse;
