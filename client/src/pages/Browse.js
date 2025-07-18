import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Spinner,
  Alert,
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

  const fetchPets = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = { status: 'available', limit: 50 };

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
    }
  };

  useEffect(() => {
    fetchPets();
  }, [location.search]);

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <h2 className="mb-4">Browse Pets</h2>

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
        </Col>
      </Row>
    </Container>
  );
};

export default Browse;
