import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Alert,
  Card,
} from "react-bootstrap";
import HeroBanner from "../components/HeroBanner";
import api from "../services/api";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/contact", formData);
      setSuccess("Thank you for your message! We will get back to you soon.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      setError("Error sending message. Please try again.");
      console.error("Error submitting contact form:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Enhanced Hero Banner - matches Home page style */}
      <HeroBanner
  title="Contact FurBabies"
  subtitle="We'd love to hear from you!"
  primaryButtonText="Browse Pets"
  primaryButtonLink="/browse"
  secondaryButtonText="Learn More"
  secondaryButtonLink="/about"
/>

      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={8}>
            {/* Contact Form Card */}
            <Card className="border-0 shadow-sm mb-5">
              <Card.Header className="bg-primary text-white">
                <h3 className="mb-0">
                  <i className="fas fa-paper-plane me-2"></i>
                  Send Us a Message
                </h3>
              </Card.Header>
              <Card.Body className="p-4">
                {/* Success/Error Messages */}
                {success && (
                  <Alert variant="success" className="mb-4">
                    <i className="fas fa-check-circle me-2"></i>
                    {success}
                  </Alert>
                )}
                {error && (
                  <Alert variant="danger" className="mb-4">
                    <i className="fas fa-exclamation-circle me-2"></i>
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <i className="fas fa-user me-1"></i>
                          Name *
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="Your full name"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <i className="fas fa-envelope me-1"></i>
                          Email *
                        </Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="your.email@example.com"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>
                      <i className="fas fa-tag me-1"></i>
                      Subject *
                    </Form.Label>
                    <Form.Select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Choose a subject...</option>
                      <option value="adoption">Pet Adoption Inquiry</option>
                      <option value="volunteer">Volunteer Opportunities</option>
                      <option value="support">Support & Help</option>
                      <option value="partnership">Partnership</option>
                      <option value="feedback">Feedback</option>
                      <option value="other">Other</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>
                      <i className="fas fa-comment me-1"></i>
                      Message *
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      placeholder="Tell us how we can help you..."
                    />
                  </Form.Group>

                  <div className="text-center">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={loading}
                      className="px-5"
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane me-2"></i>
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Contact Information */}
        <Row className="g-4">
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm text-center">
              <Card.Body className="p-4">
                <i className="fas fa-map-marker-alt fa-3x text-primary mb-3"></i>
                <h5>Visit Us</h5>
                <p className="text-muted mb-0">
                  123 Pet Street<br />
                  Animal City, AC 12345
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm text-center">
              <Card.Body className="p-4">
                <i className="fas fa-phone fa-3x text-success mb-3"></i>
                <h5>Call Us</h5>
                <p className="text-muted mb-0">
                  (555) 123-PETS<br />
                  Mon-Fri 9AM-6PM
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm text-center">
              <Card.Body className="p-4">
                <i className="fas fa-envelope fa-3x text-info mb-3"></i>
                <h5>Email Us</h5>
                <p className="text-muted mb-0">
                  info@furbabies.com<br />
                  We reply within 24 hours
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* FAQ Section */}
        <div className="mt-5 pt-5 border-top">
          <div className="text-center mb-4">
            <h3>
              <i className="fas fa-question-circle text-primary me-2"></i>
              Frequently Asked Questions
            </h3>
            <p className="text-muted">Quick answers to common questions</p>
          </div>
          
          <Row>
            <Col md={6}>
              <h6><i className="fas fa-paw me-2 text-primary"></i>How do I adopt a pet?</h6>
              <p className="text-muted mb-4">Browse our available pets, submit an application, and we'll guide you through our adoption process.</p>
            </Col>
            <Col md={6}>
              <h6><i className="fas fa-heart me-2 text-danger"></i>Can I volunteer?</h6>
              <p className="text-muted mb-4">Yes! We always need volunteers. Contact us to learn about current opportunities.</p>
            </Col>
          </Row>
        </div>
      </Container>
    </>
  );
};

export default Contact;