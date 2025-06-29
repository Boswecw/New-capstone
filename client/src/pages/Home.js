import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Carousel, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import HeroBanner from '../components/HeroBanner';
import PetCard from '../components/PetCard';
import api from '../services/api';

const Home = () => {
  const [featuredPets, setFeaturedPets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedPets();
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
      icon: "fa-fish",
      rating: 5.0
    }
  ];

  return (
    <>
      {/* Hero Banner */}
      <HeroBanner logoSize="large" />

      {/* Featured Products */}
      <section id="products" className="py-5">
        <Container>
          <h2 className="mb-4 text-center">
            <i className="fas fa-star me-2"></i>Featured Products
          </h2>
          <Row className="g-4">
            <Col md={4}>
              <Card className="p-3">
                <Card.Img variant="top" src="/assets/Dogfood.png" alt="Dog Food" />
                <Card.Body>
                  <Card.Title>
                    <i className="fas fa-bone me-2"></i>Premium Dog Food
                  </Card.Title>
                  <p className="price">
                    <i className="fas fa-tag me-1"></i>$29.99
                  </p>
                  <Button variant="primary" className="w-100">
                    <i className="fas fa-cart-plus me-2"></i>Add to Cart
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="p-3">
                <Card.Img variant="top" src="/assets/interactivecattoy.png" alt="Cat Toys" />
                <Card.Body>
                  <Card.Title>
                    <i className="fas fa-mouse me-2"></i>Interactive Cat Toys
                  </Card.Title>
                  <p className="price">
                    <i className="fas fa-tag me-1"></i>$14.99
                  </p>
                  <Button variant="primary" className="w-100">
                    <i className="fas fa-cart-plus me-2"></i>Add to Cart
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="p-3">
                <Card.Img variant="top" src="/assets/Aquarium.png" alt="Aquarium Kit" />
                <Card.Body>
                  <Card.Title>
                    <i className="fas fa-fish me-2"></i>Aquarium Starter Kit
                  </Card.Title>
                  <p className="price">
                    <i className="fas fa-tag me-1"></i>$49.99
                  </p>
                  <Button variant="primary" className="w-100">
                    <i className="fas fa-cart-plus me-2"></i>Add to Cart
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Featured Pets */}
      {featuredPets.length > 0 && (
        <section className="py-5 bg-light">
          <Container>
            <h2 className="text-center mb-4">
              <i className="fas fa-heart me-2"></i>Featured Pets
            </h2>
            {loading ? (
              <div className="loading-spinner">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <Row className="g-4">
                {featuredPets.slice(0, 3).map(pet => (
                  <Col key={pet._id} md={4}>
                    <PetCard pet={pet} />
                  </Col>
                ))}
              </Row>
            )}
            <div className="text-center mt-4">
              <Link to="/browse" className="btn btn-primary">
                View All Pets
              </Link>
            </div>
          </Container>
        </section>
      )}

      {/* Customer Reviews */}
      <section id="reviews" className="py-5">
        <Container>
          <h2 className="text-center mb-5">
            <i className="fas fa-comments me-2"></i>What Our Customers Say
          </h2>
          
          <Carousel indicators={false} className="testimonial-carousel">
            {testimonials.map((testimonial, index) => (
              <Carousel.Item key={index}>
                <div className="d-flex justify-content-center">
                  <Card className="p-4 shadow" style={{ maxWidth: '700px' }}>
                    <Card.Body className="text-center">
                      <i className="fas fa-quote-left fa-2x text-muted mb-3"></i>
                      <p className="lead">{testimonial.text}</p>
                      <div className="mt-4">
                        <i className={`fas ${testimonial.icon} fa-2x text-warning mb-2`}></i>
                        <h5 className="mb-0">{testimonial.name}</h5>
                        <small className="text-muted">
                          <i className="fas fa-star text-warning"></i> {testimonial.rating} | Verified Buyer
                        </small>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
        </Container>
      </section>
    </>
  );
};

export default Home;
