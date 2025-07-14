// client/src/pages/Home.js - Fixed for Deployment (No External SectionHeader Import)
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// Components
import HeroBanner from '../components/HeroBanner';
import PetCard from '../components/PetCard';
import ProductCard from '../components/ProductCard';
// import NewsSection from '../components/NewsSection'; // Commented out for now

// Services & Hooks
import { petAPI, productAPI } from '../services/api';

// Inline SectionHeader component to avoid import issues
const SectionHeader = ({ title, subtitle }) => (
  <div className="section-header mb-4 text-center">
    <h2 className="section-title mb-2">{title}</h2>
    {subtitle && <p className="section-subtitle text-muted">{subtitle}</p>}
    <hr className="w-25 mx-auto my-4" style={{height: '2px', backgroundColor: '#007bff'}} />
  </div>
);

// Simple toast hook replacement
const useToast = () => ({
  toasts: [],
  showSuccess: (msg) => console.log('✅ Success:', msg),
  showError: (msg) => console.log('❌ Error:', msg),
  showInfo: (msg) => console.log('ℹ️ Info:', msg),
  removeToast: () => {}
});

const Home = () => {
  // State management
  const [featuredPets, setFeaturedPets] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [petsError, setPetsError] = useState(null);
  const [productsError, setProductsError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Toast notifications
  const { showSuccess, showError, showInfo } = useToast();

  // Fetch random pets (remove all filters to see what data exists)
  const fetchFeaturedPets = useCallback(async () => {
    try {
      console.log('🏠 Home: Fetching random pets (no filters)...');
      
      // Remove ALL filters to see what pets exist in database
      const response = await petAPI.getAllPets({ 
        limit: 4
        // Removed status filter to see all pets
      });
      
      console.log('🐕 RAW API RESPONSE:', response.data);
      
      const pets = response.data?.data || [];
      
      // Debug each pet object
      console.log('🐕 PETS ANALYSIS:');
      pets.forEach((pet, index) => {
        console.log(`🐕 Pet ${index + 1}:`, {
          name: pet.name,
          image: pet.image,
          imageUrl: pet.imageUrl,
          hasImageField: !!pet.image,
          hasImageUrlField: !!pet.imageUrl,
          status: pet.status
        });
        
        // Test constructed URL
        if (pet.image) {
          const constructedUrl = `https://storage.googleapis.com/furbabies-petstore/${pet.image}`;
          console.log(`🔗 Constructed URL for ${pet.name}: ${constructedUrl}`);
        }
      });
      
      if (pets.length > 0) {
        console.log('✅ Random pets loaded:', pets.length);
        setFeaturedPets(pets);
        setPetsError(null);
        
        if (!isInitialLoad) {
          showSuccess(`${pets.length} pets loaded!`);
        }
      } else {
        console.warn('⚠️ No pets returned from API');
        setPetsError('No pets available at this time.');
        showInfo('No pets available right now. Check back soon!');
      }
    } catch (err) {
      console.error('❌ Error loading pets:', err);
      const errorMessage = 'Unable to load pets at this time.';
      setPetsError(errorMessage);
      showError(errorMessage);
    }
  }, [isInitialLoad, showSuccess, showError, showInfo]);

  // Fetch random products (remove all filters to see what data exists)
  const fetchFeaturedProducts = useCallback(async () => {
    try {
      console.log('🏠 Home: Fetching random products (no filters)...');
      
      // Remove ALL filters to see what products exist in database
      const response = await productAPI.getAllProducts({ 
        limit: 4
        // Removed inStock filter to see all products
      });
      
      console.log('🛍️ RAW API RESPONSE:', response.data);
      
      const products = response.data?.data || [];
      
      // Debug each product object
      console.log('🛍️ PRODUCTS ANALYSIS:');
      products.forEach((product, index) => {
        console.log(`🛍️ Product ${index + 1}:`, {
          name: product.name,
          image: product.image,
          imageUrl: product.imageUrl,
          hasImageField: !!product.image,
          hasImageUrlField: !!product.imageUrl,
          inStock: product.inStock,
          price: product.price
        });
        
        // Test constructed URL
        if (product.image) {
          const constructedUrl = `https://storage.googleapis.com/furbabies-petstore/${product.image}`;
          console.log(`🔗 Constructed URL for ${product.name}: ${constructedUrl}`);
        }
      });
      
      if (products.length > 0) {
        console.log('✅ Random products loaded:', products.length);
        setFeaturedProducts(products);
        setProductsError(null);
        
        if (!isInitialLoad) {
          showSuccess(`${products.length} products loaded!`);
        }
      } else {
        console.warn('⚠️ No products returned from API');
        setProductsError('No products available at this time.');
        showInfo('No products available right now.');
      }
    } catch (err) {
      console.error('❌ Error loading products:', err);
      const errorMessage = 'Unable to load products at this time.';
      setProductsError(errorMessage);
      showError(errorMessage);
    }
  }, [isInitialLoad, showSuccess, showError, showInfo]);

  // Add to favorites handler
  const handleAddToFavorites = useCallback((pet) => {
    console.log('❤️ Adding to favorites:', pet.name);
    showInfo(`${pet.name} added to favorites!`);
  }, [showInfo]);

  // Initial data loading
  useEffect(() => {
    console.log('🏠 Home: Initial data load starting...');
    
    const loadInitialData = async () => {
      await Promise.all([
        fetchFeaturedPets(),
        fetchFeaturedProducts()
      ]);
      setIsInitialLoad(false);
      console.log('🏠 Home: Initial data load completed');
    };

    loadInitialData();
  }, [fetchFeaturedPets, fetchFeaturedProducts]);

  return (
    <div className="home-page">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Random Pets Section */}
      <Container className="py-5">
        <SectionHeader 
          title="Available Pets" 
          subtitle="Find your perfect companion today" 
        />

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
          <Alert variant="info" className="text-center">
            <i className="fas fa-clock me-2"></i>
            Loading pets...
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
            View All Pets
          </Button>
        </div>
      </Container>

      {/* Random Products Section */}
      <Container className="py-5 bg-light">
        <SectionHeader 
          title="Popular Products" 
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
              <Button variant="outline-primary" onClick={fetchFeaturedProducts}>
                Try Again
              </Button>
            </div>
          </Alert>
        ) : featuredProducts.length === 0 ? (
          <Alert variant="info" className="text-center">
            <i className="fas fa-clock me-2"></i>
            Loading products...
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

      {/* News Section - Commented out for now */}
      {/* <NewsSection /> */}
    </div>
  );
};

export default Home;