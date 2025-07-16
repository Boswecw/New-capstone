// client/src/pages/Home.js - FIXED VERSION for Random Featured Display
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
  const [petsLoading, setPetsLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [petsError, setPetsError] = useState(null);
  const [productsError, setProductsError] = useState(null);

  // Toast notifications
  const { toasts, showSuccess, showError, showInfo, removeToast } = useToast();

  // ⭐ FIXED: Fetch featured pets using the new featured endpoint
  const fetchFeaturedPets = useCallback(async () => {
    try {
      setPetsLoading(true);
      setPetsError(null);
      console.log('🏠 Home: Fetching 4 random featured pets...');
      
      // ⭐ NEW: Use dedicated featured endpoint for random selection
      const response = await fetch('/api/pets/featured?limit=4');
      const data = await response.json();
      
      if (data.success && data.data?.length > 0) {
        setFeaturedPets(data.data);
        console.log(`✅ Loaded ${data.data.length} random featured pets:`, data.data.map(p => p.name));
        showSuccess(`${data.data.length} featured pets loaded!`, 'Pets Updated');
      } else {
        setPetsError('No featured pets available at this time.');
        showInfo('No featured pets available right now. Check back soon!');
        console.log('⚠️ No featured pets returned from API');
      }
    } catch (err) {
      console.error('❌ Error loading featured pets:', err);
      const errorMessage = 'Unable to load featured pets at this time.';
      setPetsError(errorMessage);
      showError(errorMessage, 'Loading Error');
    } finally {
      setPetsLoading(false);
    }
  }, [showSuccess, showError, showInfo]);

  // ⭐ FIXED: Fetch featured products using the new featured endpoint
  const fetchFeaturedProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      setProductsError(null);
      console.log('🏠 Home: Fetching 4 random featured products...');
      
      // ⭐ NEW: Use dedicated featured endpoint for random selection
      const response = await fetch('/api/products/featured?limit=4');
      const data = await response.json();
      
      if (data.success && data.data?.length > 0) {
        setFeaturedProducts(data.data);
        console.log(`✅ Loaded ${data.data.length} random featured products:`, data.data.map(p => p.name));
        showSuccess(`${data.data.length} featured products loaded!`, 'Products Updated');
      } else {
        setProductsError('No featured products available at this time.');
        showInfo('No featured products available right now.');
        console.log('⚠️ No featured products returned from API');
      }
    } catch (err) {
      console.error('❌ Error loading featured products:', err);
      const errorMessage = 'Unable to load featured products at this time.';
      setProductsError(errorMessage);
      showError(errorMessage, 'Loading Error');
    } finally {
      setProductsLoading(false);
    }
  }, [showSuccess, showError, showInfo]);

  // Load all data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      console.log('🏠 Home: Loading initial featured content...');
      
      // Load both in parallel for better performance
      await Promise.allSettled([
        fetchFeaturedPets(),
        fetchFeaturedProducts()
      ]);
      
      console.log('🏠 Home: Initial data load complete');
    };

    loadInitialData();
  }, []); // Empty dependency array - only run on mount

  // ⭐ NEW: Manual refresh handler to get new random selection
  const handleRefreshPets = useCallback(async () => {
    showInfo('Getting new featured pets...');
    await fetchFeaturedPets();
  }, [fetchFeaturedPets, showInfo]);

  const handleRefreshProducts = useCallback(async () => {
    showInfo('Getting new featured products...');
    await fetchFeaturedProducts();
  }, [fetchFeaturedProducts, showInfo]);

  const handleRefreshAll = useCallback(async () => {
    showInfo('Refreshing all featured content...');
    await Promise.allSettled([
      fetchFeaturedPets(),
      fetchFeaturedProducts()
    ]);
  }, [fetchFeaturedPets, fetchFeaturedProducts, showInfo]);

  // Add to favorites handler (future feature)
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
          <div className="d-flex gap-2">
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={handleRefreshPets}
              disabled={petsLoading}
            >
              <i className={`fas ${petsLoading ? 'fa-spinner fa-spin' : 'fa-sync-alt'} me-2`}></i>
              {petsLoading ? 'Loading...' : 'New Pets'}
            </Button>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={handleRefreshAll}
              disabled={petsLoading || productsLoading}
            >
              <i className={`fas ${(petsLoading || productsLoading) ? 'fa-spinner fa-spin' : 'fa-refresh'} me-2`}></i>
              Refresh All
            </Button>
          </div>
        </div>

        {petsError ? (
          <Alert variant="warning" className="text-center">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {petsError}
            <div className="mt-3">
              <Button as={Link} to="/browse" variant="primary" className="me-2">
                Browse All Pets
              </Button>
              <Button variant="outline-primary" onClick={fetchFeaturedPets} disabled={petsLoading}>
                Try Again
              </Button>
            </div>
          </Alert>
        ) : petsLoading ? (
          <Alert variant="info" className="text-center">
            <i className="fas fa-spinner fa-spin me-2"></i>
            Loading featured pets...
          </Alert>
        ) : featuredPets.length === 0 ? (
          <Alert variant="warning" className="text-center">
            <i className="fas fa-info-circle me-2"></i>
            No featured pets available at this time.
            <div className="mt-3">
              <Button as={Link} to="/browse" variant="primary">
                Browse All Available Pets
              </Button>
            </div>
          </Alert>
        ) : (
          <Row>
            {featuredPets.map((pet, index) => (
              <Col key={pet._id} lg={3} md={6} className="mb-4">
                <PetCard 
                  pet={pet} 
                  priority={index < 2} // Optimize loading for first 2 images
                  onAddToFavorites={() => handleAddToFavorites(pet)}
                />
              </Col>
            ))}
          </Row>
        )}

        <div className="text-center mt-4">
          <Button as={Link} to="/browse" variant="primary" size="lg">
            <i className="fas fa-paw me-2"></i>
            View All Pets ({featuredPets.length > 0 ? 'More Available' : 'Browse Now'})
          </Button>
        </div>
      </Container>

      {/* Featured Products Section */}
      <Container className="py-5 bg-light">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <SectionHeader 
            title="Featured Products" 
            subtitle="Quality supplies for your furry friends" 
          />
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={handleRefreshProducts}
            disabled={productsLoading}
          >
            <i className={`fas ${productsLoading ? 'fa-spinner fa-spin' : 'fa-sync-alt'} me-2`}></i>
            {productsLoading ? 'Loading...' : 'New Products'}
          </Button>
        </div>

        {productsError ? (
          <Alert variant="warning" className="text-center">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {productsError}
            <div className="mt-3">
              <Button as={Link} to="/products" variant="primary" className="me-2">
                Browse All Products
              </Button>
              <Button variant="outline-primary" onClick={fetchFeaturedProducts} disabled={productsLoading}>
                Try Again
              </Button>
            </div>
          </Alert>
        ) : productsLoading ? (
          <Alert variant="info" className="text-center">
            <i className="fas fa-spinner fa-spin me-2"></i>
            Loading featured products...
          </Alert>
        ) : featuredProducts.length === 0 ? (
          <Alert variant="warning" className="text-center">
            <i className="fas fa-info-circle me-2"></i>
            No featured products available at this time.
            <div className="mt-3">
              <Button as={Link} to="/products" variant="primary">
                Browse All Products
              </Button>
            </div>
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
            Shop All Products ({featuredProducts.length > 0 ? 'More Available' : 'Browse Now'})
          </Button>
        </div>
      </Container>

      {/* News Section */}
      <NewsSection />
    </div>
  );
};

export default Home;