// components/Form/ContactForm.js - FIXED VERSION
import React, { useState } from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { contactAPI } from '../../services/api';

// Import form components from the fixed index
import {
  Form,
  CompleteField,
  FormField,
  Label,
  Textarea,
  FormActions,
  Select
} from './index';

const ContactForm = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Form validation rules
  const validation = {
    name: { 
      required: 'Name is required',
      minLength: 2,
      maxLength: 50
    },
    email: { 
      required: 'Email is required', 
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      patternMessage: 'Please enter a valid email address'
    },
    subject: {
      required: 'Please select a subject',
      maxLength: 100
    },
    message: { 
      required: 'Message is required', 
      minLength: 10,
      maxLength: 1000
    }
  };

  // Subject options for the dropdown
  const subjectOptions = [
    { value: '', label: 'Please select a subject...' },
    { value: 'general', label: 'General Inquiry' },
    { value: 'adoption', label: 'Pet Adoption' },
    { value: 'support', label: 'Customer Support' },
    { value: 'partnership', label: 'Partnership Opportunity' },
    { value: 'feedback', label: 'Feedback & Suggestions' },
    { value: 'other', label: 'Other' }
  ];

  // Handle form submission
  const handleSubmit = async (formData) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Submit to API endpoint
      const response = await contactAPI.createContact({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message
      });

      if (response.data.success) {
        setSuccess('Thank you for your message! We will get back to you soon.');
        // Form will be reset automatically by the Form component
      } else {
        throw new Error(response.data.message || 'Failed to send message');
      }
      
    } catch (err) {
      console.error('Contact form error:', err);
      setError(
        err.response?.data?.message || 
        'Error sending message. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5" style={{ marginTop: '80px' }}>
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-lg border-0">
            <Card.Body className="p-5">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="mb-3">
                  <i className="fas fa-envelope fa-3x text-primary"></i>
                </div>
                <h2 className="fw-bold">Get In Touch</h2>
                <p className="text-muted">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
              </div>

              {/* Success Message */}
              {success && (
                <Alert variant="success" className="mb-4">
                  <i className="fas fa-check-circle me-2"></i>
                  {success}
                </Alert>
              )}

              {/* Error Message */}
              {error && (
                <Alert variant="danger" className="mb-4">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}

              {/* Contact Form */}
              <Form onSubmit={handleSubmit} validation={validation}>
                {/* Name Field */}
                <CompleteField
                  label="Name"
                  name="name"
                  type="text"
                  required
                  inputProps={{
                    placeholder: "Your full name",
                    autoComplete: "name"
                  }}
                />

                {/* Email Field */}
                <CompleteField
                  label="Email Address"
                  name="email"
                  type="email"
                  required
                  inputProps={{
                    placeholder: "your.email@example.com",
                    autoComplete: "email"
                  }}
                />

                {/* Subject Field */}
                <FormField required>
                  <Label htmlFor="subject" required>
                    <i className="fas fa-tag me-1"></i>
                    Subject
                  </Label>
                  <Select
                    id="subject"
                    name="subject"
                    options={subjectOptions}
                    required
                  />
                </FormField>

                {/* Message Field */}
                <FormField required>
                  <Label htmlFor="message" required>
                    <i className="fas fa-comment-dots me-1"></i>
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={5}
                    placeholder="Tell us how we can help you..."
                    required
                  />
                </FormField>

                {/* Privacy Notice */}
                <div className="mb-4">
                  <small className="text-muted">
                    <i className="fas fa-shield-alt me-1"></i>
                    Your information is secure and will never be shared with third parties.
                  </small>
                </div>

                {/* Submit Button */}
                <FormActions alignment="center">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg px-5"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Sending Message...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane me-2"></i>
                        Send Message
                      </>
                    )}
                  </button>
                </FormActions>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ContactForm;