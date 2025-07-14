// client/src/pages/Home.js - Complete Version with Debug Logging
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

  // Toast notifications
  const { toasts, showSuccess, showError, showInfo, removeToast } = useToast();

  // Fetch featured pets with enhanced debugging
  const fetchFeaturedPets = useCallback(async () => {
    try {
      console.log('🏠 Home: Fetching featured pets...');
      
      const response = await petAPI.getAllPets({ 
        featured: true, 
        limit: 4,
        status: 'available' 
      });
      
      // ⭐ DEBUG: Show complete API response ⭐
      console.log('🐕 RAW API RESPONSE:', response.data);
      
      const pets = response.data?.data || [];
      
      // ⭐ DEBUG: Analyze each pet object ⭐
      console.log('🐕 PETS ANALYSIS:');
      pets.forEach((pet, index) => {
        console.log(`🐕 Pet ${index + 1}:`, {
          name: pet.name,
          image: pet.image,
          imageUrl: pet.imageUrl,
          hasImageField: !!pet.image,
          hasImageUrlField: !!pet.imageUrl,
          featured: pet.featured,
          status: pet.status,
          fullObject: pet
        });
        
        // Test image URL construction
        if (pet.image) {
          const constructedUrl = `https://storage.googleapis.com/furbabies-petstore/${pet.image}`;
          console.log(`🔗 Constructed URL for ${pet.name}: ${constructedUrl}`);
        }
      });
      
      if (pets.length > 0) {
        console.log('✅ Featured pets loaded:', pets.length);
        setFeaturedPets(pets);
        setPetsError(null);
        
        if (!isInitialLoad) {
          showSuccess(`${pets.length} featured pets loaded!`);
        }
      } else {
        console.warn('⚠️ No featured pets returned from API');
        setPetsError('No featured pets available at this time.');
        showInfo('No featured pets available right now. Check back soon!');
      }
    } catch (err) {
      console.error('❌ Error loading featured pets:', err);
      const errorMessage = 'Unable to load featured pets at this time.';
      setPetsError(errorMessage);
      showError(errorMessage);
    }
  }, [isInitialLoad, showSuccess, showError, showInfo]);

  // Fetch featured products with enhanced debugging
  const fetchFeaturedProducts = useCallback(async () => {
    try {
      console.log('🏠 Home: Fetching featured products...');
      
      const response = await productAPI.getAllProducts({ 
        featured: true, 
        limit: 4 
      });
      
      // ⭐ DEBUG: Show complete API response ⭐
      console.log('🛍️ RAW API RESPONSE:', response.data);
      
      const products = response.data?.data || [];
      
      // ⭐ DEBUG: Analyze each product object ⭐
      console.log('🛍️ PRODUCTS ANALYSIS:');
      products.forEach((product, index) => {
        console.log(`🛍️ Product ${index + 1}:`, {
          name: product.name,
          image: product.image,
          imageUrl: product.imageUrl,
          hasImageField: !!product.image,
          hasImageUrlField: !!product.imageUrl,
          featured: product.featured,
          inStock: product.inStock,
          price: product.price,
          fullObject: product
        });
        
        // Test image URL construction
        if (product.image) {
          const constructedUrl = `https://storage.googleapis.com/furbabies-petstore/${product.image}`;
          console.log(`🔗 Constructed URL for ${product.name}: ${constructedUrl}`);
        }
      });
      
      if (products.length > 0) {
        console.log('✅ Featured products loaded:', products.length);
        setFeaturedProducts(products);
        setProductsError(null);
        
        if (!isInitialLoad) {
          showSuccess(`${products.length} featured products loaded!`);
        }
      } else {
        console.warn('⚠️ No featured products returned from API');
        setProductsError('No featured products available at this time.');
        showInfo('No featured products available right now.');
      }
    } catch (err) {
      console.error('❌ Error loading featured products:', err);
      const errorMessage = 'Unable to load featured products at this time.';
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
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Hero Banner */}
      <HeroBanner />

      {/* Featured Pets Section */}
      <Container className="py-5">
        <SectionHeader 
          title="Featured Pets" 
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
            Loading featured pets...
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
              <Button variant="outline-primary" onClick={fetchFeaturedProducts}>
                Try Again
              </Button>
            </div>
          </Alert>
        ) : featuredProducts.length === 0 ? (
          <Alert variant="info" className="text-center">
            <i className="fas fa-clock me-2"></i>
            Loading featured products...
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