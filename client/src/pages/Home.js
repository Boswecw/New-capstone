// client/src/pages/Home.js - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import HeroBanner from '../components/HeroBanner';
import PetCard from '../components/PetCard';
import ProductCard from '../components/ProductCard';
import api from '../services/api';
// Removed import that doesn't exist

const Home = () => {
  const [featuredPets, setFeaturedPets] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  // ✅ Error state used in JSX below
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFeaturedPets();
    fetchFeaturedProducts();
    fetchProductImages();
  }, []);

  // ✅ FIXED: Correct function name and API endpoint
  const fetchFeaturedPets = async () => {
    setLoading(true);
    setError(''); // Clear any previous errors
    try {
      console.log('🐾 Fetching featured pets...');
      
      // ✅ CRITICAL FIX: Use correct endpoint
      const response = await api.get('/pets?featured=true&limit=6');
      
      console.log('📊 Pets API response:', response.data);
      
      if (response.data?.success) {
        setFeaturedPets(response.data.data || []);
        console.log('✅ Featured pets loaded:', response.data.data?.length);
      } else {
        console.warn('⚠️ Pets API returned success=false:', response.data?.message);
        setFeaturedPets([]);
        setError('No featured pets available');
      }
    } catch (err) {
      console.error('❌ Error fetching featured pets:', err);
      console.error('❌ Error details:', err.response?.data);
      setFeaturedPets([]);
      setError('Failed to load featured pets');
      
      // ✅ FALLBACK: Try getting any available pets
      try {
        console.log('🔄 Trying fallback pets endpoint...');
        const fallbackResponse = await api.get('/pets?limit=6&status=available');
        if (fallbackResponse.data?.success) {
          setFeaturedPets(fallbackResponse.data.data || []);
          console.log('✅ Fallback pets loaded:', fallbackResponse.data.data?.length);
        }
      } catch (fallbackErr) {
        console.error('❌ Fallback also failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      console.log('🛒 Fetching featured products...');
      const response = await api.get('/products?featured=true&limit=6');
      if (response.data?.success) {
        setFeaturedProducts(response.data.data || []);
        console.log('✅ Featured products loaded:', response.data.data?.length);
      }
    } catch (err) {
      console.error('❌ Error fetching featured products:', err);
      setFeaturedProducts([]);
    }
  };

  const fetchProductImages = async () => {
    setImageLoading(true);
    try {
      console.log('🖼️ Fetching product images...');
      const response = await api.get('/gcs/buckets/furbabies-petstore/images?prefix=product/&public=true');
      if (response.data?.success) {
        setProductImages(response.data.data || []);
        console.log('✅ Product images loaded:', response.data.data?.length);
      }
    } catch (err) {
      console.error('❌ Error fetching product images:', err);
      setProductImages([]);
      setError('Failed to load product images');
    } finally {
      setImageLoading(false);
    }
  };

  const findProductImage = (product) => {
    if (!product) return 'product/placeholder.png';
    
    // Simple image matching - just use product image or first available
    if (product.image) return product.image;
    if (productImages.length > 0) return productImages[0];
    return 'product/placeholder.png';
  };

  const getProductImageUrl = (product) => {
    if (product.imageUrl) return product.imageUrl;
    const imagePath = findProductImage(product);
    return `https://storage.googleapis.com/furbabies-petstore/${imagePath}`;
  };

  return (
    <div className="home-page">
      <Navbar />
      <HeroBanner />
      <Container className="py-5">
        {/* Featured Pets Section */}
        <section className="featured-pets mb-5">
          <h2 className="text-center mb-4">Featured Pets</h2>
          
          {/* ✅ BETTER ERROR HANDLING */}
          {error && (
            <Alert variant="warning" className="text-center">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}
          
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading featured pets...</p>
            </div>
          ) : featuredPets?.length > 0 ? (
            <Row className="g-4">
              {featuredPets.slice(0, 3).map(pet => (
                <Col key={pet._id} md={4}>
                  <PetCard pet={pet} />
                </Col>
              ))}
            </Row>
          ) : (
            <Alert variant="info" className="text-center">
              <i className="fas fa-info-circle me-2"></i>
              No featured pets available at the moment.
              <div className="mt-2">
                <Button variant="outline-primary" size="sm" onClick={fetchFeaturedPets}>
                  <i className="fas fa-refresh me-1"></i>
                  Try Again
                </Button>
              </div>
            </Alert>
          )}
          
          <div className="text-center mt-4">
            <Link to="/pets">
              <Button variant="primary" size="lg">
                <i className="fas fa-paw me-2"></i>
                View All Pets
              </Button>
            </Link>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="featured-products mb-5">
          <h2 className="text-center mb-4">Featured Products</h2>
          {imageLoading ? (
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading products...</p>
            </div>
          ) : featuredProducts?.length > 0 ? (
            <Row className="g-4">
              {featuredProducts.map(product => (
                <Col key={product._id} md={4}>
                  <ProductCard product={product} imageUrl={getProductImageUrl(product)} />
                </Col>
              ))}
            </Row>
          ) : (
            <Alert variant="info" className="text-center">
              <i className="fas fa-info-circle me-2"></i>
              No featured products available at the moment.
            </Alert>
          )}
          
          <div className="text-center mt-4">
            <Link to="/products">
              <Button variant="outline-primary" size="lg">
                <i className="fas fa-shopping-cart me-2"></i>
                View All Products
              </Button>
            </Link>
          </div>
        </section>
      </Container>
    </div>
  );
};

export default Home;