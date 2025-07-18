// client/src/pages/Home.js - ORIGINAL DESIGN RESTORED with ESLint fix
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Alert, Button, Spinner } from 'react-bootstrap';
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
  const [loadingPhase, setLoadingPhase] = useState('Starting...');

  // Toast notifications
  const { toasts, showSuccess, showError, showInfo, removeToast } = useToast();

  // 🔧 ENHANCED: API call with retry logic
  const apiCallWithRetry = useCallback(async (apiCall, retryCount = 0, maxRetries = 3) => {
    try {
      return await apiCall();
    } catch (error) {
      if (error.response?.status === 429 && retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000; // Exponential backoff with jitter
        console.log(`⏳ Rate limited, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return apiCallWithRetry(apiCall, retryCount + 1, maxRetries);
      }
      throw error;
    }
  }, []);

  // 🔧 ENHANCED: Fetch featured pets with retry logic
  const fetchFeaturedPets = useCallback(async () => {
    try {
      setPetsLoading(true);
      setPetsError(null);
      console.log('🏠 Home: Fetching 4 random featured pets...');
      
      const response = await apiCallWithRetry(() => petAPI.getFeaturedPets(4));
      
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
      const errorMessage = err.response?.status === 429 
        ? 'Server is busy. Please try again in a moment.'
        : 'Unable to load featured pets at this time.';
      setPetsError(errorMessage);
      showError(errorMessage, 'Loading Error');
    } finally {
      setPetsLoading(false);
    }
  }, [apiCallWithRetry, showSuccess, showError, showInfo]);

  // 🔧 ENHANCED: Fetch featured products with retry logic
  const fetchFeaturedProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      setProductsError(null);
      console.log('🏠 Home: Fetching 4 random featured products...');
      
      const response = await apiCallWithRetry(() => productAPI.getFeaturedProducts(4));
      
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
      const errorMessage = err.response?.status === 429 
        ? 'Server is busy. Please try again in a moment.'
        : 'Unable to load featured products at this time.';
      setProductsError(errorMessage);
      showError(errorMessage, 'Loading Error');
    } finally {
      setProductsLoading(false);
    }
  }, [apiCallWithRetry, showSuccess, showError, showInfo]);

  // 🔧 OPTIMIZED: Staggered loading to prevent simultaneous API calls
  useEffect(() => {
    const loadHomePageContent = async () => {
      console.log('🏠 Home: Starting staggered content loading...');
      
      try {
        // Phase 1: Load pets first
        setLoadingPhase('Loading featured pets...');
        await fetchFeaturedPets();
        
        // Phase 2: Wait 800ms, then load products
        setLoadingPhase('Loading featured products...');
        await new Promise(resolve => setTimeout(resolve, 800));
        await fetchFeaturedProducts();
        
        // Phase 3: Complete
        setLoadingPhase('Content loaded successfully!');
        console.log('🏠 Home: All content loaded successfully');
        
        // Clear loading phase after 2 seconds
        setTimeout(() => setLoadingPhase(''), 2000);
        
      } catch (error) {
        console.error('❌ Home: Error during staggered loading:', error);
        setLoadingPhase('Error loading content');
        showError('Some content failed to load. Please try refreshing the page.', 'Loading Error');
      }
    };

    loadHomePageContent();
  }, [fetchFeaturedPets, fetchFeaturedProducts, showError]); // ✅ Added missing dependencies

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
    setLoadingPhase('Refreshing all content...');
    
    try {
      // Staggered refresh
      await fetchFeaturedPets();
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchFeaturedProducts();
      
      setLoadingPhase('All content refreshed!');
      setTimeout(() => setLoadingPhase(''), 2000);
    } catch (error) {
      setLoadingPhase('Error refreshing content');
      setTimeout(() => setLoadingPhase(''), 2000);
    }
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

      {/* Loading Phase Indicator */}
      {loadingPhase && (
        <Container className="py-2">
          <Alert variant="info" className="text-center mb-0">
            <i className="fas fa-info-circle me-2"></i>
            {loadingPhase}
          </Alert>
        </Container>
      )}

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
              {petsLoading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              as={Link} 
              to="/browse"
            >
              <i className="fas fa-paw me-2"></i>
              Browse All Pets
            </Button>
          </div>
        </div>

        {/* Pets Content */}
        {petsLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <h5 className="mt-3">Loading featured pets...</h5>
            <p className="text-muted">Finding adorable pets for adoption</p>
          </div>
        ) : petsError ? (
          <Alert variant="warning" className="text-center">
            <Alert.Heading>
              <i className="fas fa-exclamation-triangle me-2"></i>
              Unable to Load Featured Pets
            </Alert.Heading>
            <p>{petsError}</p>
            <Button variant="outline-warning" onClick={handleRefreshPets} className="me-2">
              <i className="fas fa-redo me-2"></i>
              Try Again
            </Button>
            <Button variant="primary" as={Link} to="/browse">
              <i className="fas fa-search me-2"></i>
              Browse All Pets
            </Button>
          </Alert>
        ) : featuredPets.length === 0 ? (
          <Alert variant="info" className="text-center">
            <Alert.Heading>
              <i className="fas fa-info-circle me-2"></i>
              No Featured Pets Available
            </Alert.Heading>
            <p>Check back soon for new featured pets!</p>
            <Button variant="outline-info" onClick={handleRefreshPets} className="me-2">
              <i className="fas fa-sync-alt me-2"></i>
              Refresh
            </Button>
            <Button variant="primary" as={Link} to="/browse">
              <i className="fas fa-search me-2"></i>
              Browse All Pets
            </Button>
          </Alert>
        ) : (
          <Row>
            {featuredPets.map((pet) => (
              <Col key={pet._id} lg={3} md={6} className="mb-4">
                <PetCard 
                  pet={pet} 
                  onAddToFavorites={handleAddToFavorites}
                  showFavoriteButton={true}
                />
              </Col>
            ))}
          </Row>
        )}
      </Container>

      {/* Featured Products Section */}
      <Container className="py-5 bg-light">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <SectionHeader 
            title="Featured Products" 
            subtitle="Everything your pet needs for a happy life" 
          />
          <div className="d-flex gap-2">
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={handleRefreshProducts}
              disabled={productsLoading}
            >
              <i className={`fas ${productsLoading ? 'fa-spinner fa-spin' : 'fa-sync-alt'} me-2`}></i>
              {productsLoading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              as={Link} 
              to="/products"
            >
              <i className="fas fa-shopping-bag me-2"></i>
              Shop All Products
            </Button>
          </div>
        </div>

        {/* Products Content */}
        {productsLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <h5 className="mt-3">Loading featured products...</h5>
            <p className="text-muted">Finding the best products for your pets</p>
          </div>
        ) : productsError ? (
          <Alert variant="warning" className="text-center">
            <Alert.Heading>
              <i className="fas fa-exclamation-triangle me-2"></i>
              Unable to Load Featured Products
            </Alert.Heading>
            <p>{productsError}</p>
            <Button variant="outline-warning" onClick={handleRefreshProducts} className="me-2">
              <i className="fas fa-redo me-2"></i>
              Try Again
            </Button>
            <Button variant="primary" as={Link} to="/products">
              <i className="fas fa-search me-2"></i>
              Browse All Products
            </Button>
          </Alert>
        ) : featuredProducts.length === 0 ? (
          <Alert variant="info" className="text-center">
            <Alert.Heading>
              <i className="fas fa-info-circle me-2"></i>
              No Featured Products Available
            </Alert.Heading>
            <p>Check back soon for new featured products!</p>
            <Button variant="outline-info" onClick={handleRefreshProducts} className="me-2">
              <i className="fas fa-sync-alt me-2"></i>
              Refresh
            </Button>
            <Button variant="primary" as={Link} to="/products">
              <i className="fas fa-search me-2"></i>
              Browse All Products
            </Button>
          </Alert>
        ) : (
          <Row>
            {featuredProducts.map((product) => (
              <Col key={product._id} lg={3} md={6} className="mb-4">
                <ProductCard 
                  product={product} 
                  showAddToCart={true}
                />
              </Col>
            ))}
          </Row>
        )}
      </Container>

      {/* News Section */}
      <Container className="py-5">
        <NewsSection />
      </Container>

      {/* Call to Action Section */}
      <Container className="py-5 bg-primary text-white">
        <Row className="text-center">
          <Col>
            <h2 className="display-4 mb-3">Ready to Find Your Perfect Pet?</h2>
            <p className="lead mb-4">
              Join thousands of happy families who found their furry companions through FurBabies
            </p>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <Button 
                variant="light" 
                size="lg" 
                as={Link} 
                to="/browse"
                className="px-4 py-2"
              >
                <i className="fas fa-search me-2"></i>
                Browse Pets
              </Button>
              <Button 
                variant="outline-light" 
                size="lg" 
                as={Link} 
                to="/contact"
                className="px-4 py-2"
              >
                <i className="fas fa-heart me-2"></i>
                Learn More
              </Button>
              <Button 
                variant="warning" 
                size="lg" 
                onClick={handleRefreshAll}
                className="px-4 py-2"
                disabled={petsLoading || productsLoading}
              >
                <i className={`fas ${petsLoading || productsLoading ? 'fa-spinner fa-spin' : 'fa-sync-alt'} me-2`}></i>
                {petsLoading || productsLoading ? 'Loading...' : 'Refresh All'}
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Home;