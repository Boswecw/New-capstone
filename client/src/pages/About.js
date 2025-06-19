import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const About = () => {
  return (
    <>
      {/* Hero Banner */}
      <section className="furbabies-banner">
        <Container>
          <div className="hero-content">
            <h1 className="hero-title">
              <i className="fas fa-paw me-2"></i>
              <img src="/assets/FurBabiesIcon.png" alt="FurBabies icon" className="hero-icon" />
            </h1>
            <p className="hero-subtitle">
              <i className="fas fa-heart me-2"></i>Your One Stop Pet Super Store
            </p>
          </div>
        </Container>
      </section>

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
              ></iframe>
            </div>
          </Col>

          {/* Mission Statement */}
          <Col md={4} className="text-center">
            <h3 className="text-primary">Our Mission</h3>
            <p>
              At FurBabies, our mission is to connect loving families with happy, healthy pets and quality supplies. 
              We believe every animal deserves a forever home and every pet owner deserves trustworthy products and support. 
              Whether you're shopping for a puppy, parrot, or pet food, FurBabies is here to help make tails wag and whiskers twitch.
            </p>
          </Col>

          {/* Image Column */}
          <Col md={4} className="text-center">
            <img 
              src="/assets/Peoplecats.png" 
              alt="FurBabies Logo" 
              className="img-fluid rounded" 
              style={{ maxHeight: '300px' }}
            />
          </Col>
        </Row>
      </Container>

      {/* Paw Love Section */}
      <section className="paw-love-section">
        <Container>
          <div className="text-center mb-5">
            <h2 className="paw-love-title justify-content-center">
              <img src="/assets/PawLoveicon.png" alt="Paw Love Icon" className="paw-love-icon" />
              <strong>Paw Love Promise</strong>
            </h2>
            <p className="lead">Our non-profit animal welfare first promise to our community</p>
          </div>

          <Row>
            <Col lg={4} className="mb-4">
              <Card className="info-card h-100">
                <Card.Body>
                  <Card.Title className="card-title">
                    <i className="fas fa-shield-heart text-primary"></i>
                    Compassion First
                  </Card.Title>
                  <Card.Text>
                    We are committed to the ethical treatment of all animals in our care. Our pets come exclusively from trusted sources:
                  </Card.Text>
                  <ul className="bullet-list">
                    <li>Reputable animal rescue groups</li>
                    <li>Certified ethical breeders with highest care standards</li>
                    <li>Local humane societies reducing pet homelessness</li>
                  </ul>
                  <Card.Text>
                    <strong>We do not support puppy mills, unethical breeders, or any entity that compromises animal welfare.</strong>
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4} className="mb-4">
              <Card className="info-card h-100">
                <Card.Body>
                  <Card.Title className="card-title">
                    <i className="fas fa-file-contract text-success"></i>
                    Responsible Adoption
                  </Card.Title>
                  <Card.Text>
                    Adopting a pet is a lifelong commitment. All adoptions require a signed Ethical Adoption Contract 
                    ensuring each pet is placed in a safe, caring environment.
                  </Card.Text>
                  <Card.Text><strong>Our contract includes:</strong></Card.Text>
                  <ul className="bullet-list">
                    <li>Agreement to provide proper care, nutrition, and veterinary support</li>
                    <li>No-abuse, no-neglect policy</li>
                    <li>Return clauses if circumstances prevent continued care</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4} className="mb-4">
              <Card className="info-card h-100">
                <Card.Body>
                  <Card.Title className="card-title">
                    <i className="fas fa-users text-warning"></i>
                    Our Commitment
                  </Card.Title>
                  <Card.Text>
                    At FurBabies, we're not just a pet shop — we're a community of animal lovers. 
                    We advocate for rescue-first thinking, responsible pet ownership, and lifelong animal well-being.
                  </Card.Text>
                  <Card.Text>
                    <strong>Not one penny is made from the animals we have available in our stores.</strong> 
                    We believe every pet deserves a loving home, and every home deserves a happy, healthy companion.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <div className="text-center mt-4">
            <p className="lead text-muted">
              <i className="fas fa-heart text-danger me-2"></i>
              Thank you for supporting an ethical future for pets. When you choose FurBabies, 
              you're choosing kindness, compassion, and care that lasts a lifetime.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
};

export default About;