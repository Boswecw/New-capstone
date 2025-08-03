// client/src/pages/Browse.js - USING ALL BOOTSTRAP IMPORTS
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import BrowseLayout from '../components/browse/BrowseLayout';
import { ENTITY_CONFIGS } from '../config/entityConfigs';
import { petAPI } from '../services/api';
import PetCard from '../components/PetCard';

const Browse = () => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    // Simple delay to show initial spinner
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Loading state using Spinner in Row/Col
  if (isInitialLoading) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col xs="auto" className="text-center">
            <Spinner animation="border" variant="primary" size="lg" />
            <p className="mt-3 text-muted">Preparing pet browser...</p>
          </Col>
        </Row>
      </Container>
    );
  }

  // Main content
  return (
    <>
      <Container className="py-3">
        <Row>
          <Col>
            <Alert variant="info" className="mb-4">
              <i className="fas fa-info-circle me-2"></i>
              Browse our available pets and find your perfect companion!
            </Alert>
          </Col>
        </Row>
      </Container>
      
      <BrowseLayout
        entityConfig={ENTITY_CONFIGS.pets}
        apiService={petAPI}
        ItemCard={PetCard}
        useInfiniteScroll={true}
        itemsPerPage={12}
      />
    </>
  );
};

export default Browse;