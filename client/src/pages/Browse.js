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
  Card,
} from "react-bootstrap";
import { useSearchParams, useLocation } from "react-router-dom";
import PetCard from "../components/PetCard";
import { petAPI } from "../services/api";

const Browse = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [searching, setSearching] = useState(false);

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "");
  const [selectedBreed, setSelectedBreed] = useState(searchParams.get("breed") || "");
  const [ageRange, setAgeRange] = useState(searchParams.get("age") || "");
  const [selectedGender, setSelectedGender] = useState(searchParams.get("gender") || "");
  const [selectedSize, setSelectedSize] = useState(searchParams.get("size") || "");
  const [hasSearched, setHasSearched] = useState(false);

  const petTypes = useMemo(() => [
    { value: "", label: "All Pets" },
    { value: "dog", label: "Dogs" },
    { value: "cat", label: "Cats" },
    { value: "fish", label: "Fish & Aquatic" },
    { value: "small-pet", label: "Small Pets" },
    { value: "bird", label: "Birds" },
  ], []);

  const ageRanges = useMemo(() => [
    { value: "", label: "Any Age" },
    { value: "puppy", label: "Puppy/Kitten (0-1 year)" },
    { value: "young", label: "Young (1-3 years)" },
    { value: "adult", label: "Adult (3-7 years)" },
    { value: "senior", label: "Senior (7+ years)" },
  ], []);

  const genderOptions = useMemo(() => [
    { value: "", label: "Any Gender" },
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "unknown", label: "Unknown" },
  ], []);

  const sizeOptions = useMemo(() => [
    { value: "", label: "Any Size" },
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
  ], []);

  const fetchPets = async (isSearch = false) => {
    try {
      if (isSearch) setSearching(true);
      else setLoading(true);
      setError(null);

      const queryParams = { status: 'available', limit: 50 };
      if (hasSearched && searchTerm.trim()) queryParams.search = searchTerm.trim();
      if (selectedType) queryParams.type = selectedType;
      if (selectedBreed) queryParams.breed = selectedBreed;
      if (ageRange) queryParams.age = ageRange;
      if (selectedGender) queryParams.gender = selectedGender;
      if (selectedSize) queryParams.size = selectedSize;

      const response = await petAPI.getAllPets(queryParams);

      if (response?.data?.success || response?.data?.data) {
        const enrichedPets = (response.data.data || []).map(pet => {
          const cleanImage = pet.image?.replace(/^\/+/, '');
          const imageUrl = pet.imageUrl?.startsWith('http')
            ? pet.imageUrl
            : cleanImage
              ? `${process.env.NODE_ENV === 'production'
                  ? 'https://furbabies-backend.onrender.com'
                  : 'http://localhost:5000'
                }/api/images/gcs/${cleanImage}`
              : null;

          return {
            ...pet,
            imageUrl: imageUrl || pet.imageUrl || pet.image || '',
          };
        });

        setPets(enrichedPets);
      } else {
        setPets([]);
        setError('Unexpected response format from server');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load pets. Please try again.');
      setPets([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, [location.search]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams();
      if (hasSearched && searchTerm) params.set("search", searchTerm);
      if (selectedType) params.set("type", selectedType);
      if (selectedBreed) params.set("breed", selectedBreed);
      if (ageRange) params.set("age", ageRange);
      if (selectedGender) params.set("gender", selectedGender);
      if (selectedSize) params.set("size", selectedSize);
      setSearchParams(params);
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedType, selectedBreed, ageRange, selectedGender, selectedSize, setSearchParams, hasSearched]);

  const handleSearch = (e) => {
    e.preventDefault();
    setHasSearched(true);
    fetchPets(true);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("");
    setSelectedBreed("");
    setAgeRange("");
    setSelectedGender("");
    setSelectedSize("");
    setHasSearched(false);
    setSearchParams({});
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">Browse Pets</h2>

      <Form onSubmit={handleSearch} className="mb-4">
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Search pets by name, breed, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="submit" variant="primary">Search</Button>
          <Button variant="outline-secondary" onClick={clearFilters}>Clear</Button>
        </InputGroup>
      </Form>

      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={3} className="mb-2">
              <Form.Select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                {petTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3} className="mb-2">
              <Form.Select value={ageRange} onChange={(e) => setAgeRange(e.target.value)}>
                {ageRanges.map((age) => (
                  <option key={age.value} value={age.value}>{age.label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3} className="mb-2">
              <Form.Select value={selectedGender} onChange={(e) => setSelectedGender(e.target.value)}>
                {genderOptions.map((gender) => (
                  <option key={gender.value} value={gender.value}>{gender.label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3} className="mb-2">
              <Form.Select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)}>
                {sizeOptions.map((size) => (
                  <option key={size.value} value={size.value}>{size.label}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

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
