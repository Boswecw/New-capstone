// client/src/pages/Register.js - Updated with Password Requirements
import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PasswordRequirements from '../components/PasswordRequirements';

const Register = () => {
  const { user, register, validatePassword, validateName, validateEmail } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" />;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validation
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    const nameValidation = validateName(fullName);
    const emailValidation = validateEmail(formData.email);
    const passwordValidation = validatePassword(formData.password);

    // Check name validation
    if (!nameValidation.isValid) {
      setError(nameValidation.errors.join(', '));
      setLoading(false);
      return;
    }

    // Check email validation
    if (!emailValidation.isValid) {
      setError(emailValidation.errors.join(', '));
      setLoading(false);
      return;
    }

    // Check password validation
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors.join(', '));
      setLoading(false);
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const result = await register(formData);
      
      if (!result.success) {
        setError(result.message);
      }
      // If successful, user will be redirected by AuthContext
      
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <Container className="py-5" style={{ marginTop: '80px' }}>
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2><i className="fas fa-paw me-2 text-primary"></i>Join FurBabies</h2>
                <p className="text-muted">Create your account to find your perfect pet companion</p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="First name"
                        required
                      />
                      <Form.Text className="text-muted">
                        Letters and spaces only
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Last name"
                        required
                      />
                      <Form.Text className="text-muted">
                        Letters and spaces only
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                    required
                  />
                  <Form.Text className="text-muted">
                    This will be displayed on your profile
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                  />
                  <Form.Text className="text-muted">
                    We'll never share your email with anyone else
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a strong password"
                      required
                    />
                    <Button 
                      variant="outline-secondary"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </Button>
                  </div>
                  
                  {/* Password Requirements Component */}
                  <div className="mt-2">
                    <PasswordRequirements 
                      password={formData.password}
                      className="p-3 bg-light rounded"
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Confirm Password</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      required
                    />
                    <Button 
                      variant="outline-secondary"
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </Button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <small className="text-danger d-block mt-1">
                      <i className="fas fa-times-circle me-1"></i>
                      Passwords do not match
                    </small>
                  )}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password && (
                    <small className="text-success d-block mt-1">
                      <i className="fas fa-check-circle me-1"></i>
                      Passwords match
                    </small>
                  )}
                </Form.Group>

                {/* Account Requirements Summary */}
                <div className="alert alert-info mb-4">
                  <h6 className="alert-heading">
                    <i className="fas fa-info-circle me-2"></i>
                    Account Requirements
                  </h6>
                  <ul className="mb-0 small">
                    <li><strong>Name:</strong> Letters and spaces only (2-50 characters)</li>
                    <li><strong>Email:</strong> Valid email address</li>
                    <li><strong>Password:</strong> See requirements above</li>
                  </ul>
                </div>

                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-100 mb-3"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-plus me-2"></i>
                      Create Account
                    </>
                  )}
                </Button>
              </Form>

              <div className="text-center">
                <p className="mb-0">
                  Already have an account?{' '}
                  <Link to="/login" className="text-decoration-none fw-bold">
                    Sign in here
                  </Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;