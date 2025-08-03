// client/src/pages/Browse.js - UPDATED to use petAPI with responsive PetCard
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import PetCard from '../components/PetCard';
import SectionHeader from '../components/SectionHeader';
import { petAPI } from '../services/api';
import useToast from '../hooks/useToast';

const Browse = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const { showError, showInfo } = useToast();

  useEffect(() => {
    const fetchFilteredPets = async () => {
      try {
        setLoading(true);
        const query = searchParams.toString();
        const response = await petAPI.getFilteredPets(query);

        if (response.data?.success && response.data.data?.length > 0) {
          setPets(response.data.data);
        } else {
          setPets([]);
          showInfo('No matching pets found.');
        }
      } catch (err) {
        console.error('❌ Error fetching filtered pets:', err);
        setError('Failed to load filtered pets.');
        showError('Failed to load filtered pets.');
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredPets();
  }, [searchParams, showError, showInfo]);

  return (
    <Container className="py-5">
      <SectionHeader
        title="Browse Pets"
        subtitle="Search for pets by type, age, or special features"
      />

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading pets...</p>
        </div>
      ) : error ? (
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      ) : pets.length === 0 ? (
        <Alert variant="info" className="text-center">
          No pets found matching your filters.
        </Alert>
      ) : (
        <Row>
          {pets.map((pet) => (
            <Col key={pet._id} lg={3} md={4} sm={6} className="mb-4">
              <PetCard pet={pet} showFavoriteButton={true} />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default Browse;
