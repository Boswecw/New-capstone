// client/src/pages/Home.js - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';

import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import HeroBanner from '../components/HeroBanner';
import PetCard from '../components/PetCard';
import Footer from '../components/Footer';
import api from '../services/api';
import { bucketFolders, findBestMatchingImage } from '../utils/bucketUtils';

const Home = () => {
  const [featuredPets, setFeaturedPets] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [error, setError] = useState('');

  // Featured products configuration
  const featuredProducts = [
    {
      id: 'dog-food',
      title: 'Premium Dog Food',
      price: 29.99,
      icon: 'fa-bone',
      searchTerms: ['dog', 'food', 'premium'],
      fallbackImage: '/assets/Dogfood.png'
    },
    {
      id: 'cat-toys',
      title: 'Interactive Cat Toys',
      price: 14.99,
      icon: 'fa-mouse',
      searchTerms: ['cat', 'toy', 'interactive'],
      fallbackImage: '/assets/interactivecattoy.png'
    },
    {
      id: 'aquarium-kit',
      title: 'Aquarium Starter Kit',
      price: 49.99,
      icon: 'fa-fish',
      searchTerms: ['aquarium', 'fish', 'tank', 'starter'],
      fallbackImage: '/assets/Aquarium.png'
    }
  ];

  useEffect(() => {
    fetchFeaturedPets();
    fetchProductImages();
  }, []);

  const fetchFeaturedPets = async () => {
    try {
      const response = await api.get('/pets/featured');
      setFeaturedPets(response.data.data);
    } catch (error) {
      console.error('Error fetching featured pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductImages = async () => {
    setImageLoading(true);
    try {
      // ✅ FIXED: Using correct bucket name (all lowercase)
      const response = await api.get(`/gcs/buckets/furbabies-petstore/images?prefix=${bucketFolders.PRODUCT}/&public=true`);
      if (response.data.success) {
        setProductImages(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching product images:', error);
      setError('Failed to load product images');
    } finally {
      setImageLoading(false);
    }
  };

  // Find best matching image for a product
  const findProductImage = (product) => {
    return findBestMatchingImage(productImages, product.searchTerms, product.fallbackImage);
  };

  const testimonials = [
    {
      name: "Jessica R.",
      text: "FurBabies has everything I need for my pup. The staff is friendly and the quality is top-notch!",
      icon: "fa-dog",
      rating: 5.0
    },
    {
      name: "Marcus D.",
      text: "My cat LOVES the toys I got here. Fast delivery and great prices!",
      icon: "fa-cat",
      rating: 4.8
    },
    {
      name: "Linda M.",
      text: "Excellent customer service and a wide variety of pet products. Highly recommended!",
      icon: "fa-heart",
      rating: 5.0
    }
  ];

  return (
    <div className="home-page">
       <Navbar />
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
          ) : featuredPets.length > 0 ? (
            <Row className="g-4">
              {featuredPets.slice(0, 3).map(pet => (
                <Col key={pet._id} md={4}>
                  <PetCard pet={pet} />
                </Col>
              ))}
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
          ) : (
            <Row className="g-4">
              {featuredProducts.map(product => {
                const productImage = findProductImage(product);
                return (
                  <Col key={product.id} md={4}>
                    <Card className="h-100 shadow-sm">
                      <Card.Img 
                        variant="top" 
                        src={productImage} 
                        alt={product.title}
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                      <Card.Body className="d-flex flex-column">
                        <Card.Title className="d-flex align-items-center">
                          <i className={`fas ${product.icon} me-2 text-primary`}></i>
                          {product.title}
                        </Card.Title>
                        <Card.Text className="text-muted flex-grow-1">
                          High-quality {product.title.toLowerCase()} for your beloved pet.
                        </Card.Text>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="h5 text-primary mb-0">${product.price}</span>
                          <Button variant="outline-primary" size="sm">
                            View Details
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
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

       <Footer />
    </div>
  );
};

export default Home;