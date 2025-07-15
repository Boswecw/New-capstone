// client/src/pages/Home.js - Updated with News Section
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { petAPI, productAPI } from '../services/api';
import HeroBanner from '../components/HeroBanner';
import SectionHeader from '../components/SectionHeader';
import PetCard from '../components/PetCard';
import ProductCard from '../components/ProductCard';
import NewsSection from '../components/NewsSection';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

// Toast container component
const ToastContainer = ({ toasts, removeToast }) => (
  <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 1050 }}>
    {toasts.map(toast => (
      <div 
        key={toast.id}
        className={`toast show mb-2 ${toast.type === 'error' ? 'bg-danger text-white' : 
                   toast.type === 'success' ? 'bg-success text-white' : 
                   toast.type === 'warning' ? 'bg-warning text-dark' : 'bg-info text-white'}`}
        role="alert"
      >
        <div className="d-flex">
          <div className="toast-body">
            <strong>{toast.title && `${toast.title}: `}</strong>
            {toast.message}
          </div>
          <button 
            type="button" 
            className="btn-close btn-close-white me-2 m-auto" 
            onClick={() => removeToast(toast.id)}
            aria-label="Close"
          ></button>
        </div>
      </div>
    ))}
  </div>
);

const Home = () => {
  // State management
  const [featuredPets, setFeaturedPets] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [petsError, setPetsError] = useState('');
  const [productsError, setProductsError] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Contexts
  const { toasts, addToast, removeToast } = useToast();
  const { user } = useAuth();

  // Toast helpers
  const showSuccess = useCallback((message, title = 'Success') => {
    addToast({ type: 'success', title, message });
  }, [addToast]);

  const showError = useCallback((message, title = 'Error') => {
    addToast({ type: 'error', title, message });
  }, [addToast]);

  const showInfo = useCallback((message, title = 'Info') => {
    addToast({ type: 'info', title, message });
  }, [addToast]);

  // Fetch featured pets
  const fetchFeaturedPets = useCallback(async () => {
    try {
      setPetsLoading(true);
      setPetsError('');
      console.log('🐾 Fetching featured pets...');

      const response = await petAPI.getAllPets({ 
        featured: true, 
        limit: 4,
        status: 'available'
      });

      if (response.data.success && response.data.data) {
        const pets = response.data.data;
        console.log('✅ Featured pets loaded:', pets.length);
        setFeaturedPets(pets);
        
        if (!isInitialLoad && pets.length > 0) {
          showSuccess(`Loaded ${pets.length} featured pets`, 'Pets Updated');
        }
      } else {
        console.warn('⚠️ No featured pets found');
        setFeaturedPets([]);
        showInfo('No featured pets available right now.');
      }
    } catch (err) {
      console.error('❌ Error loading featured pets:', err);
      const errorMessage = 'Unable to load featured pets at this time.';
      setPetsError(errorMessage);
      showError(errorMessage);
    } finally {
      setPetsLoading(false);
    }
  }, [isInitialLoad, showSuccess, showError, showInfo]);

  // Fetch featured products
  const fetchFeaturedProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      setProductsError('');
      console.log('🛍️ Fetching featured products...');

      const response = await productAPI.getAllProducts({ 
        featured: true, 
        limit: 4,
        inStock: true
      });

      if (response.data.success && response.data.data) {
        const products = response.data.data;
        console.log('✅ Featured products loaded:', products.length);
        setFeaturedProducts(products);
        
        if (!isInitialLoad && products.length > 0) {
          showSuccess(`Loaded ${products.length} featured products`, 'Products Updated');
        }
      } else {
        console.warn('⚠️ No featured products found');
        setFeaturedProducts([]);
        showInfo('No featured products available right now.');
      }
    } catch (err) {
      console.error('❌ Error loading featured products:', err);
      const errorMessage = 'Unable to load featured products at this time.';
      setProductsError(errorMessage);
      showError(errorMessage);
    } finally {
      setProductsLoading(false);
    }
  }, [isInitialLoad, showSuccess, showError, showInfo]);

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      console.log('🏠 Home: Initial data load starting...');
      
      // Load both in parallel for better performance
      await Promise.allSettled([
        fetchFeaturedPets(),
        fetchFeaturedProducts()
      ]);
      
      setIsInitialLoad(false);
      console.log('🏠 Home: Initial data load complete');
    };

    loadData();
  }, [fetchFeaturedPets, fetchFeaturedProducts]);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    showInfo('Refreshing featured content...');
    await Promise.allSettled([
      fetchFeaturedPets(),
      fetchFeaturedProducts()
    ]);
  }, [fetchFeaturedPets, fetchFeaturedProducts, showInfo]);

  // Add to favorites handler (future feature)
  const handleAddToFavorites = useCallback((pet) => {
    // TODO: Implement actual favorites functionality
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
          >
            <i className="fas fa-sync-alt me-2"></i>
            Refresh
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
              <Button variant="outline-primary" onClick={fetchFeaturedPets}>
                Try Again
              </Button>
            </div>
          </Alert>
        ) : featuredPets.length === 0 ? (
          <div className="text-center py-5">
            {petsLoading ? (
              <>
                <Spinner animation="border" className="mb-3" />
                <h5>Loading adorable pets...</h5>
              </>
            ) : (
              <>
                <i className="fas fa-paw fa-3x text-muted mb-3"></i>
                <h5>No featured pets available</h5>
                <p className="text-muted">Check back soon for new furry friends!</p>
                <Button as={Link} to="/browse" variant="primary">
                  Browse All Pets
                </Button>
              </>
            )}
          </div>
        ) : (
          <Row className="g-4">
            {featuredPets.map((pet) => (
              <Col key={pet._id} lg={3} md={6} sm={6}>
                <PetCard 
                  pet={pet} 
                  onAddToFavorites={handleAddToFavorites}
                  showFavoriteButton={!!user}
                />
              </Col>
            ))}
          </Row>
        )}

        {/* View All Pets Button */}
        {featuredPets.length > 0 && (
          <div className="text-center mt-4">
            <Button as={Link} to="/browse" variant="primary" size="lg">
              <i className="fas fa-paw me-2"></i>
              View All Pets
            </Button>
          </div>
        )}
      </Container>

      {/* Featured Products Section */}
      <Container className="py-5 bg-light">
        <SectionHeader 
          title="Featured Products" 
          subtitle="Everything your pet needs for a happy, healthy life" 
        />

        {productsError ? (
          <Alert variant="warning" className="text-center">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {productsError}
            <div className="mt-3">
              <Button as={Link} to="/products" variant="primary" className="me-2">
                Browse All Products
              </Button>
              <Button variant="outline-primary" onClick={fetchFeaturedProducts}>
                Try Again
              </Button>
            </div>
          </Alert>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-5">
            {productsLoading ? (
              <>
                <Spinner animation="border" className="mb-3" />
                <h5>Loading products...</h5>
              </>
            ) : (
              <>
                <i className="fas fa-shopping-bag fa-3x text-muted mb-3"></i>
                <h5>No featured products available</h5>
                <p className="text-muted">Check back soon for new products!</p>
                <Button as={Link} to="/products" variant="primary">
                  Browse All Products
                </Button>
              </>
            )}
          </div>
        ) : (
          <Row className="g-4">
            {featuredProducts.map((product) => (
              <Col key={product._id} lg={3} md={6} sm={6}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        )}

        {/* View All Products Button */}
        {featuredProducts.length > 0 && (
          <div className="text-center mt-4">
            <Button as={Link} to="/products" variant="primary" size="lg">
              <i className="fas fa-shopping-bag me-2"></i>
              View All Products
            </Button>
          </div>
        )}
      </Container>

      {/* ✅ NEWS SECTION - Added at the bottom */}
      <NewsSection />
    </div>
  );
};

export default Home;