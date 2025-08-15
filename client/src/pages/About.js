import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import HeroBanner from "../components/HeroBanner";

const About = () => {
  return (
    <>
      {/* Enhanced Hero Banner - matches Home page style */}
      <HeroBanner
  title="About FurBabies"
  subtitle="Connecting loving families with their perfect furry companions"
  primaryButtonText="Browse Pets"
  primaryButtonLink="/browse"
  secondaryButtonText="Contact Us"
  secondaryButtonLink="/contact"
/>

      <Container className="py-5">
        {/* Mission Section */}
        <Row className="mb-5">
          <Col>
            <div className="text-center mb-5">
              <h2 className="display-5 fw-bold mb-3">
                <i className="fas fa-bullseye text-primary me-3"></i>
                Our Mission
              </h2>
              <p className="lead text-muted">
                To rescue, rehabilitate, and rehome pets while connecting them with loving families
              </p>
            </div>
          </Col>
        </Row>

        {/* Story Section */}
        <Row className="align-items-center mb-5">
          <Col md={6}>
            <h3 className="mb-4">
              <i className="fas fa-book-open text-info me-2"></i>
              Our Story
            </h3>
            <p className="mb-3">
              FurBabies was founded in 2020 with a simple but powerful mission: every pet deserves a loving home. 
              What started as a small local initiative has grown into a comprehensive pet adoption platform 
              that has helped thousands of animals find their forever families.
            </p>
            <p className="mb-3">
              We work closely with local shelters, rescue organizations, and veterinarians to ensure 
              that every pet in our care receives the love, attention, and medical care they need 
              while waiting for their perfect match.
            </p>
            <p>
              Our team of dedicated volunteers and staff work tirelessly to make the adoption process 
              smooth, transparent, and joyful for both pets and their new families.
            </p>
          </Col>
          <Col md={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <i className="fas fa-award fa-3x text-warning mb-3"></i>
                <h5>Award-Winning Service</h5>
                <p className="text-muted mb-0">
                  Recognized by the National Pet Adoption Association for excellence in pet care and adoption services.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Values Section */}
        <Row className="mb-5">
          <Col>
            <div className="text-center mb-5">
              <h2 className="display-5 fw-bold mb-3">
                <i className="fas fa-gem text-success me-3"></i>
                Our Values
              </h2>
            </div>
          </Col>
        </Row>

        <Row className="g-4 mb-5">
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <i className="fas fa-heart fa-3x text-danger mb-3"></i>
                <h5>Compassion</h5>
                <p className="text-muted">
                  Every decision we make is guided by love and empathy for the animals in our care.
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <i className="fas fa-handshake fa-3x text-primary mb-3"></i>
                <h5>Integrity</h5>
                <p className="text-muted">
                  We maintain the highest standards of honesty and transparency in all our operations.
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <i className="fas fa-users fa-3x text-info mb-3"></i>
                <h5>Community</h5>
                <p className="text-muted">
                  We believe in building strong relationships with pet owners, volunteers, and partners.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Impact Section */}
        <div className="bg-light rounded p-5 mb-5">
          <Row className="text-center">
            <Col md={3} className="mb-3">
              <h3 className="display-4 fw-bold text-primary">2,500+</h3>
              <p className="text-muted">Pets Adopted</p>
            </Col>
            <Col md={3} className="mb-3">
              <h3 className="display-4 fw-bold text-success">98%</h3>
              <p className="text-muted">Success Rate</p>
            </Col>
            <Col md={3} className="mb-3">
              <h3 className="display-4 fw-bold text-info">150+</h3>
              <p className="text-muted">Partner Shelters</p>
            </Col>
            <Col md={3} className="mb-3">
              <h3 className="display-4 fw-bold text-warning">500+</h3>
              <p className="text-muted">Volunteers</p>
            </Col>
          </Row>
        </div>

        {/* Team Section */}
        <Row className="mb-5">
          <Col>
            <div className="text-center">
              <h2 className="display-5 fw-bold mb-3">
                <i className="fas fa-users text-primary me-3"></i>
                Our Team
              </h2>
              <p className="lead text-muted mb-4">
                Meet the passionate people behind FurBabies
              </p>
              <p className="text-muted">
                Our diverse team includes veterinarians, animal behaviorists, adoption counselors, 
                and dedicated volunteers who share a common love for animals and commitment to their welfare.
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default About;