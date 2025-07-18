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
  Badge,
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

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedBreed, setSelectedBreed] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [showFilters, setShowFilters] = useState(false);
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
    const params = new URLSearchParams(location.search);
    const type = params.get("type") || "";
    const breed = params.get("breed") || "";
    const age = params.get("age") || "";
    const gender = params.get("gender") || "";
    const size = params.get("size") || "";
    const search = params.get("search") || "";

    setSelectedType(type);
    setSelectedBreed(breed);
    setAgeRange(age);
    setSelectedGender(gender);
    setSelectedSize(size);
    setSearchTerm(search);
    setHasSearched(!!search);

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
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedType, selectedBreed, ageRange, selectedGender, selectedSize, setSearchParams, hasSearched]);

  const handleSearch = (e) => {
    e.preventDefault();
    setHasSearched(true);
    fetchPets(true);
  };

  const handleFilterChange = (type, value) => {
    if (type === "type") {
      setSelectedType(value);
      if (value !== selectedType) setSelectedBreed("");
    } else if (type === "breed") setSelectedBreed(value);
    else if (type === "age") setAgeRange(value);
    else if (type === "gender") setSelectedGender(value);
    else if (type === "size") setSelectedSize(value);
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

  const clearSearch = () => {
    setSearchTerm("");
    setHasSearched(false);
  };

  const handleRetry = () => {
    fetchPets();
  };

  return (
    <Container className="py-4">
      <Row>
        <Col>
          {/* Your UI code here like search, filters, pet listing */}
          {/* I kept the core logic only to focus on the fix */}
        </Col>
      </Row>
    </Container>
  );
};

export default Browse;
