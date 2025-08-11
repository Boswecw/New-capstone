// client/src/pages/Home.js - UPDATED AND FIXED VERSION

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';


import HeroBanner from '../components/HeroBanner';
import PetCard from '../components/PetCard';
import api from '../services/api';
import { bucketFolders, findBestMatchingImage } from '../utils/bucketUtils';

const Home = () => {
  const [featuredPets, setFeaturedPets] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFeaturedPets();
    fetchFeaturedProducts();
    fetchProductImages();
  }, []);

  const fetchFeaturedPets = async () => {
    try {
      console.log('🐾 Fetching featured pets...');
      const response = await api.get('/pets/featured?limit=6');
      console.log('✅ Pets response:', response.data);

      if (response.data && response.data.success) {
        setFeaturedPets(response.data.data || []);
      } else {
        console.error('❌ Invalid pets response format:', response.data);
        setFeaturedPets([]);
      }
    } catch (error) {
      console.error('❌ Error fetching featured pets:', error);
      setFeaturedPets([]);
      setError('Failed to load featured pets');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      console.log('📦 Fetching featured products...');
      const response = await api.get('/products/featured?limit=3');
      console.log('✅ Products response:', response.data);

      if (response.data && response.data.success) {
        setFeaturedProducts(response.data.data || []);
      } else {
        console.error('❌ Invalid products response format:', response.data);
        setFeaturedProducts([]);
      }
    } catch (error) {
      console.error('❌ Error fetching featured products:', error);
      setFeaturedProducts([]);
    }
  };

  const fetchProductImages = async () => {
    setImageLoading(true);
    try {
      console.log('🖼️ Fetching product images...');
      const response = await api.get(
        `/images/gcs?prefix=${bucketFolders.PRODUCT}/&public=true`
      );

      if (response.data && response.data.success) {
        setProductImages(response.data.data || []);
        console.log('✅ Product images loaded:', response.data.data.length);
      } else {
        console.warn('⚠️ Product images not available');
        setProductImages([]);
      }
    } catch (error) {
      console.error('❌ Error fetching product images:', error);
      setError('Failed to load product images');
      setProductImages([]);
    } finally {
      setImageLoading(false);
    }
  };

  const findProductImage = (product) => {
    if (!product) return 'product/placeholder.png';

    try {
      return findBestMatchingImage(
        productImages,
        [product.name, product.category, product.brand],
        product.image
      );
    } catch (error) {
      console.error('Error finding product image:', error);
      return product.image || 'product/placeholder.png';
    }
  };

  const getProductImageUrl = (product) => {
    // Use the imageUrl from API if available, otherwise build URL
    if (product.imageUrl) {
      return product.imageUrl;
    }

    const imagePath = findProductImage(product);
    return `https://storage.googleapis.com/furbabies-petstore/${encodeURIComponent(imagePath)}`;
  };

  const testimonials = [
    {
      name: 'Jessica R.',
      text: 'FurBabies has everything I need for my pup. The staff is friendly and the quality is top-notch!',
      icon: 'fa-dog',
      rating: 5.0,
    },
    {
      name: 'Marcus D.',
      text: 'My cat LOVES the toys I got here. Fast delivery and great prices!',
      icon: 'fa-cat',
      rating: 4.8,
    },
    {
      name: 'Linda M.',
      text: 'Excellent customer service and a wide variety of pet products. Highly recommended!',
      icon: 'fa-heart',
      rating: 5.0,
    },
  ];

  return (
    <div className="home-page">
      <HeroBanner />

      <Container className="py-5">
        {/* Featured Pets Section */}
        <section className="featured-pets mb-5">
          <h2 className="text-center mb-4">Featured Pets</h2>

          {loading ? (
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading featured pets...</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="text-center">
              {error}
            </Alert>
          ) : featuredPets && featuredPets.length > 0 ? (
            <Row className="g-4">
              {featuredPets.map((pet) =>
                pet && pet._id ? (
                  <Col key={pet._id} md={4}>
                    <PetCard pet={pet} />
                  </Col>
                ) : null
              )}
            </Row>
          ) : (
            <Alert variant="info" className="text-center">
              No featured pets available at the moment.
            </Alert>
          )}

          <div className="text-center mt-4">
            <Link to="/pets">
              <Button variant="primary" size="lg">
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
          ) : featuredProducts && featuredProducts.length > 0 ? (
            <Row className="g-4">
              {featuredProducts.map((product) =>
                product && product._id ? (
                  <Col key={product._id} md={4}>
                    <Card className="h-100 shadow-sm">
                      <Card.Img
                        variant="top"
                        src={getProductImageUrl(product)}
                        alt={product.name || 'Product'}
                        style={{ height: '200px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://via.placeholder.com/300x200?text=Product+Image';
                        }}
                      />
                      <Card.Body className="d-flex flex-column">
                        <Card.Title className="d-flex align-items-center">
                          <i className="fas fa-box-open me-2 text-primary"></i>
                          {product.name || 'Unknown Product'}
                        </Card.Title>
                        <Card.Text className="text-muted flex-grow-1">
                          {product.description || 'No description available'}
                        </Card.Text>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="h5 text-primary mb-0">
                            $
                            {product.price ? Number(product.price).toFixed(2) : '0.00'}
                          </span>
                          <Button variant="outline-primary" size="sm">
                            View Details
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ) : null
              )}
            </Row>
          ) : (
            <Alert variant="info" className="text-center">
              No featured products available at the moment.
            </Alert>
          )}

          <div className="text-center mt-4">
            <Link to="/products">
              <Button variant="outline-secondary" size="lg">
                View All Products
              </Button>
            </Link>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="testimonials">
          <h2 className="text-center mb-4">What Our Customers Say</h2>
          <Row className="g-4">
            {testimonials.map((testimonial, index) => (
              <Col key={index} md={4}>
                <Card className="h-100 text-center shadow-sm">
                  <Card.Body>
                    <i className={`fas ${testimonial.icon} fa-3x text-primary mb-3`}></i>
                    <Card.Text>"{testimonial.text}"</Card.Text>
                    <Card.Title className="h6">{testimonial.name}</Card.Title>
                    <div className="text-warning">
                      {'★'.repeat(Math.floor(testimonial.rating))}
                      {testimonial.rating % 1 !== 0 && '☆'}
                      <span className="ms-2 text-muted">({testimonial.rating})</span>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </section>
      </Container>
    </div>
  );
};

export default Home;
