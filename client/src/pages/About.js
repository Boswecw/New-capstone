// client/src/pages/About.js
import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import HeroBanner from '../components/HeroBanner';

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
          {/* Mission Statement */}
          <Col md={8} className="mb-4 mb-md-0">
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

          {/* Mission Video */}
          <Col md={4}>
            <div className="ratio ratio-16x9">
              <iframe
                src="https://www.youtube.com/embed/d6kjZXwdyJs?autoplay=1&mute=1"
                title="FurBabies Intro Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="rounded shadow"
              ></iframe>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Company Values Section */}
      <section className="py-5 bg-light">
        <Container>
          <Row>
            <Col lg={8} className="mx-auto">
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-5">
                  <h4 className="text-primary mb-4 text-center">
                    <i className="fas fa-paw me-2"></i>Our Core Values
                  </h4>
                  <Row>
                    <Col md={6}>
                      <ul className="list-unstyled">
                        <li className="mb-3">
                          <i className="fas fa-check-circle text-success me-3"></i>
                          <strong>Animal welfare first</strong>
                          <br />
                          <small className="text-muted">Every pet's health and happiness is our priority</small>
                        </li>
                        <li className="mb-3">
                          <i className="fas fa-check-circle text-success me-3"></i>
                          <strong>Quality products & services</strong>
                          <br />
                          <small className="text-muted">Only the best for your furry family members</small>
                        </li>
                      </ul>
                    </Col>
                    <Col md={6}>
                      <ul className="list-unstyled">
                        <li className="mb-3">
                          <i className="fas fa-check-circle text-success me-3"></i>
                          <strong>Supporting local communities</strong>
                          <br />
                          <small className="text-muted">Giving back to animal shelters and rescue organizations</small>
                        </li>
                        <li className="mb-3">
                          <i className="fas fa-check-circle text-success me-3"></i>
                          <strong>Expert guidance & care</strong>
                          <br />
                          <small className="text-muted">Professional advice from pet care specialists</small>
                        </li>
                      </ul>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* What We Offer - Simple Icon-Based Section */}
      <section className="py-5">
        <Container>
          <h2 className="text-center mb-5">
            <i className="fas fa-star me-2"></i>What We Offer
          </h2>
          <Row>
            {/* Dogs */}
            <Col lg={3} md={6} className="mb-4">
              <div className="text-center">
                <div className="feature-icon mb-3">
                  <i className="fas fa-dog fa-4x text-primary mb-3"></i>
                </div>
                <h5 className="text-primary">Dogs</h5>
                <p className="text-muted">Loyal companions for every family</p>
              </div>
            </Col>

            {/* Cats */}
            <Col lg={3} md={6} className="mb-4">
              <div className="text-center">
                <div className="feature-icon mb-3">
                  <i className="fas fa-cat fa-4x text-primary mb-3"></i>
                </div>
                <h5 className="text-primary">Cats</h5>
                <p className="text-muted">Independent and loving feline friends</p>
              </div>
            </Col>

            {/* Aquatic Pets */}
            <Col lg={3} md={6} className="mb-4">
              <div className="text-center">
                <div className="feature-icon mb-3">
                  <i className="fas fa-fish fa-4x text-primary mb-3"></i>
                </div>
                <h5 className="text-primary">Aquatic Pets</h5>
                <p className="text-muted">Beautiful aquatic companions</p>
              </div>
            </Col>

            {/* Pet Supplies */}
            <Col lg={3} md={6} className="mb-4">
              <div className="text-center">
                <div className="feature-icon mb-3">
                  <i className="fas fa-bone fa-4x text-primary mb-3"></i>
                </div>
                <h5 className="text-primary">Supplies</h5>
                <p className="text-muted">Everything your pet needs</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Why Choose Us Section */}
      <Container className="my-5">
        <Row>
          <Col lg={10} className="mx-auto">
            <h2 className="mb-5 text-center">
              <i className="fas fa-award me-2"></i>Why Choose FurBabies?
            </h2>
            <Row>
              <Col md={4} className="mb-4 text-center">
                <div className="feature-icon mb-3">
                  <i className="fas fa-shield-alt fa-3x text-primary"></i>
                </div>
                <h5>Health Guaranteed</h5>
                <p className="text-muted">All our pets come with health certifications and veterinary checkups.</p>
              </Col>
              <Col md={4} className="mb-4 text-center">
                <div className="feature-icon mb-3">
                  <i className="fas fa-handshake fa-3x text-primary"></i>
                </div>
                <h5>Expert Support</h5>
                <p className="text-muted">Our experienced team provides ongoing support and guidance.</p>
              </Col>
              <Col md={4} className="mb-4 text-center">
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