// client/src/pages/About.js
import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import HeroBanner from '../components/HeroBanner';
import PetImage from '../components/PetImage';

const About = () => {
  return (
    <>
      {/* Hero Banner - Now using component, same appearance */}
      <HeroBanner 
        logoSize="large"
      />

      {/* Mission Section */}
      <Container className="my-5">
        <Row className="align-items-center">
          {/* Video Column */}
          <Col md={4} className="mb-4 mb-md-0">
            <div className="ratio ratio-16x9">
              <iframe
                src="https://www.youtube.com/embed/d6kjZXwdyJs?autoplay=1&mute=1"
                title="FurBabies Intro Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="rounded"
              ></iframe>
            </div>
          </Col>

          {/* Mission Statement */}
          <Col md={4} className="text-center">
            <h3 className="text-primary mb-3">
              <i className="fas fa-heart me-2"></i>Our Mission
            </h3>
            <p className="lead">
              At FurBabies, our mission is to connect loving families with happy, healthy pets and quality supplies. 
              We believe every animal deserves a forever home and every pet owner deserves trustworthy products and support.
            </p>
            <p>
              Whether you're shopping for a puppy, parrot, or pet food, FurBabies is here to help make tails wag and whiskers twitch.
              We're committed to providing the highest quality pets and supplies while supporting animal welfare in our community.
            </p>
          </Col>

          {/* Company Values */}
          <Col md={4}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h5 className="text-primary mb-3">
                  <i className="fas fa-paw me-2"></i>Our Values
                </h5>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Animal welfare first
                  </li>
                  <li className="mb-2">
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Quality products & services
                  </li>
                  <li className="mb-2">
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Supporting local communities
                  </li>
                  <li className="mb-2">
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Expert guidance & care
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Pet Categories Section */}
      <section className="py-5 bg-light">
        <Container>
          <h2 className="text-center mb-5">
            <i className="fas fa-star me-2"></i>What We Offer
          </h2>
          <Row>
            {/* Dogs */}
            <Col lg={3} md={6} className="mb-4">
              <Card className="h-100 border-0 shadow-sm category-card">
                <div style={{ height: '200px' }}>
                  <PetImage
                    petType="dog"
                    imagePath="categories/dogs-category.jpg"
                    alt="Dogs category"
                    className="h-100"
                    size="medium"
                  />
                </div>
                <Card.Body className="text-center">
                  <h5 className="text-primary">
                    <i className="fas fa-dog me-2"></i>Dogs
                  </h5>
                  <p className="text-muted">Loyal companions for every family</p>
                </Card.Body>
              </Card>
            </Col>

            {/* Cats */}
            <Col lg={3} md={6} className="mb-4">
              <Card className="h-100 border-0 shadow-sm category-card">
                <div style={{ height: '200px' }}>
                  <PetImage
                    petType="cat"
                    imagePath="categories/cats-category.jpg"
                    alt="Cats category"
                    className="h-100"
                    size="medium"
                  />
                </div>
                <Card.Body className="text-center">
                  <h5 className="text-primary">
                    <i className="fas fa-cat me-2"></i>Cats
                  </h5>
                  <p className="text-muted">Independent and loving feline friends</p>
                </Card.Body>
              </Card>
            </Col>

            {/* Aquatic Pets */}
            <Col lg={3} md={6} className="mb-4">
              <Card className="h-100 border-0 shadow-sm category-card">
                <div style={{ height: '200px' }}>
                  <PetImage
                    petType="fish"
                    imagePath="categories/aquatics-category.jpg"
                    alt="Aquatic pets category"
                    className="h-100"
                    size="medium"
                  />
                </div>
                <Card.Body className="text-center">
                  <h5 className="text-primary">
                    <i className="fas fa-fish me-2"></i>Aquatic Pets
                  </h5>
                  <p className="text-muted">Beautiful aquatic companions</p>
                </Card.Body>
              </Card>
            </Col>

            {/* Pet Supplies */}
            <Col lg={3} md={6} className="mb-4">
              <Card className="h-100 border-0 shadow-sm category-card">
                <div style={{ height: '200px' }}>
                  <PetImage
                    petType="supply"
                    imagePath="categories/supplies-category.jpg"
                    alt="Pet supplies category"
                    className="h-100"
                    size="medium"
                  />
                </div>
                <Card.Body className="text-center">
                  <h5 className="text-primary">
                    <i className="fas fa-bone me-2"></i>Supplies
                  </h5>
                  <p className="text-muted">Everything your pet needs</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Why Choose Us Section */}
      <Container className="my-5">
        <Row>
          <Col lg={8} className="mx-auto text-center">
            <h2 className="mb-4">
              <i className="fas fa-award me-2"></i>Why Choose FurBabies?
            </h2>
            <Row>
              <Col md={4} className="mb-4">
                <div className="feature-icon mb-3">
                  <i className="fas fa-shield-alt fa-3x text-primary"></i>
                </div>
                <h5>Health Guaranteed</h5>
                <p className="text-muted">All our pets come with health certifications and veterinary checkups.</p>
              </Col>
              <Col md={4} className="mb-4">
                <div className="feature-icon mb-3">
                  <i className="fas fa-handshake fa-3x text-primary"></i>
                </div>
                <h5>Expert Support</h5>
                <p className="text-muted">Our experienced team provides ongoing support and guidance.</p>
              </Col>
              <Col md={4} className="mb-4">
                <div className="feature-icon mb-3">
                  <i className="fas fa-truck fa-3x text-primary"></i>
                </div>
                <h5>Safe Delivery</h5>
                <p className="text-muted">We ensure safe and comfortable transportation for all pets.</p>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default About;