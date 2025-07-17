// client/src/pages/Home.js - FIXED VERSION using proper API services
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

  // ✅ FIXED: Use proper API service for featured pets
  const fetchFeaturedPets = useCallback(async () => {
    try {
      setPetsLoading(true);
      setPetsError(null);
      console.log('🏠 Home: Fetching 4 random featured pets...');
      
      // ✅ FIXED: Use petAPI service with full backend URL
      const response = await petAPI.getFeaturedPets(4);
      
      if (response.data?.success && response.data.data?.length > 0) {
        setFeaturedPets(response.data.data);
        console.log(`✅ Loaded ${response.data.data.length} random featured pets:`, response.data.data.map(p => p.name));
        showSuccess(`${response.data.data.length} featured pets loaded!`, 'Pets Updated');
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

  // ✅ FIXED: Use proper API service for featured products
  const fetchFeaturedProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      setProductsError(null);
      console.log('🏠 Home: Fetching 4 random featured products...');
      
      // ✅ FIXED: Use productAPI service with full backend URL
      const response = await productAPI.getFeaturedProducts(4);
      
      if (response.data?.success && response.data.data?.length > 0) {
        setFeaturedProducts(response.data.data);
        console.log(`✅ Loaded ${response.data.data.length} random featured products:`, response.data.data.map(p => p.name));
        showSuccess(`${response.data.data.length} featured products loaded!`, 'Products Updated');
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

  // Manual refresh handlers
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
              <i className="fas fa-redo me-2"></i>
              Refresh All
            </Button>
          </div>
        </div>

        {petsError ? (
          <Alert variant="warning" className="text-center">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {petsError}
            <div className="mt-2">
              <Button variant="outline-warning" size="sm" onClick={handleRefreshPets}>
                <i className="fas fa-retry me-1"></i>
                Try Again
              </Button>
            </div>
          </Alert>
        ) : (
          <Row className="g-4">
            {petsLoading ? (
              // Loading placeholders
              [...Array(4)].map((_, index) => (
                <Col key={index} lg={3} md={6} sm={6}>
                  <div className="card h-100 placeholder-glow">
                    <div className="placeholder bg-light" style={{ height: '250px' }}></div>
                    <div className="card-body">
                      <h5 className="placeholder-glow">
                        <span className="placeholder col-8"></span>
                      </h5>
                      <p className="placeholder-glow">
                        <span className="placeholder col-7"></span>
                        <span className="placeholder col-4"></span>
                        <span className="placeholder col-6"></span>
                      </p>
                    </div>
                  </div>
                </Col>
              ))
            ) : featuredPets.length > 0 ? (
              featuredPets.map((pet) => (
                <Col key={pet._id} lg={3} md={6} sm={6}>
                  <PetCard 
                    pet={pet} 
                    onAddToFavorites={handleAddToFavorites}
                    showQuickActions={true}
                  />
                </Col>
              ))
            ) : (
              <Col xs={12}>
                <Alert variant="info" className="text-center">
                  <i className="fas fa-paw fa-3x mb-3 text-muted"></i>
                  <h5>No Featured Pets Available</h5>
                  <p>Check back soon for more adorable pets looking for homes!</p>
                  <Button variant="primary" onClick={handleRefreshPets}>
                    <i className="fas fa-sync-alt me-2"></i>
                    Check Again
                  </Button>
                </Alert>
              </Col>
            )}
          </Row>
        )}

        <div className="text-center mt-4">
          <Link to="/pets" className="btn btn-primary btn-lg">
            <i className="fas fa-heart me-2"></i>
            Browse All Pets
          </Link>
        </div>
      </Container>

      {/* Featured Products Section */}
      <Container className="py-5 bg-light">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <SectionHeader 
            title="Featured Products" 
            subtitle="Everything your pet needs to stay happy and healthy" 
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
            <div className="mt-2">
              <Button variant="outline-warning" size="sm" onClick={handleRefreshProducts}>
                <i className="fas fa-retry me-1"></i>
                Try Again
              </Button>
            </div>
          </Alert>
        ) : (
          <Row className="g-4">
            {productsLoading ? (
              // Loading placeholders
              [...Array(4)].map((_, index) => (
                <Col key={index} lg={3} md={6} sm={6}>
                  <div className="card h-100 placeholder-glow">
                    <div className="placeholder bg-light" style={{ height: '250px' }}></div>
                    <div className="card-body">
                      <h5 className="placeholder-glow">
                        <span className="placeholder col-6"></span>
                      </h5>
                      <p className="placeholder-glow">
                        <span className="placeholder col-8"></span>
                        <span className="placeholder col-5"></span>
                      </p>
                    </div>
                  </div>
                </Col>
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <Col key={product._id} lg={3} md={6} sm={6}>
                  <ProductCard product={product} />
                </Col>
              ))
            ) : (
              <Col xs={12}>
                <Alert variant="info" className="text-center">
                  <i className="fas fa-shopping-cart fa-3x mb-3 text-muted"></i>
                  <h5>No Featured Products Available</h5>
                  <p>Check back soon for great pet products!</p>
                  <Button variant="primary" onClick={handleRefreshProducts}>
                    <i className="fas fa-sync-alt me-2"></i>
                    Check Again
                  </Button>
                </Alert>
              </Col>
            )}
          </Row>
        )}

        <div className="text-center mt-4">
          <Link to="/products" className="btn btn-success btn-lg">
            <i className="fas fa-shopping-bag me-2"></i>
            Shop All Products
          </Link>
        </div>
      </Container>

      {/* News Section */}
      <NewsSection />
    </div>
  );
};

export default Home;