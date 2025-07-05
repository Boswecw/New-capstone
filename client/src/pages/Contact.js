import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, Card } from 'react-bootstrap';
import Navbar from '../components/Navbar';
import HeroBanner from '../components/HeroBanner';
import Footer from '../components/Footer';
import api from '../services/api';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/contact', formData);
      setSuccess('Thank you for your message! We will get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setError('Error sending message. Please try again.');
      console.error('Error submitting contact form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ marginTop: '80px' }}>
        <HeroBanner 
          logoSize="large"
          subtitle={<><i className="fas fa-envelope me-2" />Get in Touch with Us</>}
        />

        <Container className="py-5">
          <h1 className="text-center mb-4">
            <i className="fas fa-paw me-2"></i>Contact FurBabies
          </h1>
          <p className="text-center text-muted mb-5">
            We'd love to hear from you! Whether you have a question about pets, 
            services, or anything else, our team is ready to help.
          </p>

          <Row className="g-4">
            {/* Contact Form */}
            <Col lg={6}>
              <Card>
                <Card.Body>
                  <Card.Title>Send us a Message</Card.Title>

                  {success && <Alert variant="success">{success}</Alert>}
                  {error && <Alert variant="danger">{error}</Alert>}

                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label><i className="fas fa-user me-1" />Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your Name"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label><i className="fas fa-envelope me-1" />Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label><i className="fas fa-tag me-1" />Subject</Form.Label>
                      <Form.Control
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Subject (Optional)"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label><i className="fas fa-comment-dots me-1" />Message</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="How can we help?"
                        required
                      />
                    </Form.Group>

                    <Button type="submit" variant="primary" disabled={loading}>
                      <i className="fas fa-paper-plane me-1" />
                      {loading ? 'Sending...' : 'Send Message'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            {/* Contact Info */}
            <Col lg={6}>
              <div className="mb-4">
                <h5><i className="fas fa-map-marker-alt me-2" />Our Store</h5>
                <p>1234 Happy Tails Blvd<br />Lexington, KY 40505</p>
              </div>

              <div className="mb-4">
                <h5><i className="fas fa-phone me-2" />Call Us</h5>
                <p>(859) 555-1234</p>
              </div>

              <div className="mb-4">
                <h5><i className="fas fa-envelope me-2" />Email Us</h5>
                <p>support@furbabiespets.com</p>
              </div>

              <div className="map-container">
                <iframe
                  src="https://www.google.com/maps?q=Lexington+KY&output=embed"
                  width="100%"
                  height="300"
                  frameBorder="0"
                  style={{ border: 0, borderRadius: '8px' }}
                  allowFullScreen
                  title="Store Location"
                ></iframe>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default Contact;
