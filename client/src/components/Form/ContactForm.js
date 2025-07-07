// =============================================================================
// Complete Contact Form - Fixed Version
// All imports and functions properly defined
// =============================================================================

import React, { useState } from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import api from '../services/api';

// Import our form components (make sure the path is correct)
import {
  Form,
  CompleteField,
  FormField,
  Label,
  Textarea,
  FormActions,
  Select
} from '../components/Form';

const ContactForm = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formRef, setFormRef] = useState(null);

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
      // Submit to your API endpoint
      const response = await api.post('/contact', {
        name: formData.name,
        email: formData.email,
        subject: formData.subject || 'General Inquiry',
        message: formData.message
      });

      if (response.data.success) {
        setSuccess('Thank you for your message! We will get back to you soon.');
        
        // Reset the form by clearing all input values
        if (formRef) {
          formRef.reset();
        }
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
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-lg border-0">
            <Card.Body className="p-4">
              {/* Header */}
              <div className="text-center mb-4">
                <h3 className="fw-bold">
                  <i className="fas fa-envelope me-2 text-primary"></i>
                  Contact Us
                </h3>
                <p className="text-muted">
                  We'd love to hear from you! Send us a message and we'll respond as soon as possible.
                </p>
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
              <Form 
                onSubmit={handleSubmit} 
                validation={validation}
                ref={setFormRef}
              >
                {/* Name Field */}
                <CompleteField 
                  label={
                    <>
                      <i className="fas fa-user me-1"></i>
                      Full Name
                    </>
                  }
                  name="name" 
                  type="text"
                  required 
                  helpText="Enter your first and last name"
                  inputProps={{
                    placeholder: "John Doe",
                    autoComplete: "name",
                    autoFocus: true
                  }}
                />

                {/* Email Field */}
                <CompleteField 
                  label={
                    <>
                      <i className="fas fa-envelope me-1"></i>
                      Email Address
                    </>
                  }
                  name="email" 
                  type="email" 
                  required 
                  helpText="We'll use this email to respond to your message"
                  inputProps={{
                    placeholder: "john@example.com",
                    autoComplete: "email"
                  }}
                />

                {/* Subject Field */}
                <FormField>
                  <Label htmlFor="subject">
                    <i className="fas fa-tag me-1"></i>
                    Subject
                  </Label>
                  <Select
                    id="subject"
                    name="subject"
                    placeholder="What is this message about?"
                    options={subjectOptions}
                  />
                </FormField>

                {/* Message Field */}
                <FormField required>
                  <Label htmlFor="message">
                    <i className="fas fa-comment-dots me-1"></i>
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={5}
                    placeholder="Tell us how we can help you..."
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
                    className="btn btn-primary btn-lg"
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

// Export the component
export default ContactForm;