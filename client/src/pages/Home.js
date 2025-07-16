// client/src/pages/Home.js - FIXED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// Components
import HeroBanner from '../components/HeroBanner';
import SectionHeader from '../components/SectionHeader';
import PetCard from '../components/PetCard';
import ProductCard from '../components/ProductCard';
import NewsSection from '../components/NewsSection';
import ToastContainer from '../components/ToastContainer';

// Services & Hooks
import { petAPI, productAPI } from '../services/api';
import useToast from '../hooks/useToast';

const Home = () => {
  // State management
  const [featuredPets, setFeaturedPets] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [petsError, setPetsError] = useState(null);
  const [productsError, setProductsError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [loading, setLoading] = useState(true);

  // Toast notifications
  const { toasts, showSuccess, showError, showInfo, removeToast } = useToast();

  // Fetch home data with correct API methods
  const fetchHomeData = useCallback(async () => {
    try {
      setLoading(true);
      setPetsError(null);
      setProductsError(null);
      
      console.log('🏠 Home: Fetching random pets and products...');
      
      // Use the correct API methods
      const [petsResponse, productsResponse] = await Promise.allSettled([
        petAPI.getRandomPets ? petAPI.getRandomPets(4) : petAPI.getAllPets({ limit: 4, featured: true }),
        productAPI.getRandomProducts ? productAPI.getRandomProducts(4) : productAPI.getAllProducts({ limit: 4, featured: true })
      ]);

      // Handle pets response
      if (petsResponse.status === 'fulfilled') {
        const pets = petsResponse.value.data?.data || petsResponse.value.data?.pets || [];
        setFeaturedPets(pets);
        console.log('✅ Featured pets loaded:', pets.length);
      } else {
        console.error('❌ Error fetching pets:', petsResponse.reason);
        setPetsError('Unable to load featured pets at this time.');
      }

      // Handle products response
      if (productsResponse.status === 'fulfilled') {
        const products = productsResponse.value.data?.data || productsResponse.value.data?.products || [];
        setFeaturedProducts(products);
        console.log('✅ Featured products loaded:', products.length);
      } else {
        console.error('❌ Error fetching products:', productsResponse.reason);
        setProductsError('Unable to load featured products at this time.');
      }

      setIsInitialLoad(false);
      
    } catch (err) {
      console.error('❌ Error fetching home data:', err);
      setPetsError('Unable to load featured pets at this time.');
      setProductsError('Unable to load featured products at this time.');
      showError('Failed to load home page data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Load data on component mount
  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    showInfo('Refreshing featured content...');
    await fetchHomeData();
    showSuccess('Content refreshed successfully!');
  }, [fetchHomeData, showInfo, showSuccess]);

  // Add to favorites handler
  const handleAddToFavorites = useCallback((pet) => {
    showSuccess(`${pet.name} added to favorites!`, 'Added to Favorites');
    console.log('Adding to favorites:', pet.name);
  }, [showSuccess]);

  return (
    <div className="home-page">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Hero section */}
      <HeroBanner />

      {/* Featured Pets Section */}
      <Container className="py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <SectionHeader 
            title="Featured Pets" 
            subtitle="Meet our adorable pets looking for loving homes" 
          />
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <i className="fas fa-sync-alt me-2"></i>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {petsError ? (
          <Alert variant="warning" className="text-center">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {petsError}
            <div className="mt-3">
              <Button as={Link} to="/browse" variant="primary" className="me-2">
                Browse All Pets
              </Button>
              <Button variant="outline-primary" onClick={fetchHomeData}>
                Try Again
              </Button>
            </div>
          </Alert>
        ) : loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading featured pets...</p>
          </div>
        ) : featuredPets.length === 0 ? (
          <Alert variant="info" className="text-center">
            <i className="fas fa-info-circle me-2"></i>
            No featured pets available at the moment. Check back soon!
          </Alert>
        ) : (
          <Row>
            {featuredPets.map((pet, index) => (
              <Col key={pet._id} lg={3} md={6} className="mb-4">
                <PetCard 
                  pet={pet} 
                  priority={index < 2} 
                  onAddToFavorites={() => handleAddToFavorites(pet)}
                />
              </Col>
            ))}
          </Row>
        )}

        <div className="text-center mt-4">
          <Button as={Link} to="/browse" variant="primary" size="lg">
            <i className="fas fa-paw me-2"></i>
            View All Pets
          </Button>
        </div>
      </Container>

      {/* Featured Products Section */}
      <Container className="py-5 bg-light">
        <SectionHeader 
          title="Featured Products" 
          subtitle="Quality supplies for your furry friends" 
        />

        {productsError ? (
          <Alert variant="warning" className="text-center">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {productsError}
            <div className="mt-3">
              <Button as={Link} to="/products" variant="primary" className="me-2">
                Browse All Products
              </Button>
              <Button variant="outline-primary" onClick={fetchHomeData}>
                Try Again
              </Button>
            </div>
          </Alert>
        ) : loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading featured products...</p>
          </div>
        ) : featuredProducts.length === 0 ? (
          <Alert variant="info" className="text-center">
            <i className="fas fa-info-circle me-2"></i>
            No featured products available at the moment. Check back soon!
          </Alert>
        ) : (
          <Row>
            {featuredProducts.map((product) => (
              <Col key={product._id} lg={3} md={6} className="mb-4">
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        )}

        <div className="text-center mt-4">
          <Button as={Link} to="/products" variant="primary" size="lg">
            <i className="fas fa-shopping-bag me-2"></i>
            Shop All Products
          </Button>
        </div>
      </Container>

      {/* News Section */}
      <NewsSection />
    </div>
  );
};

export default Home;