// client/src/pages/Register.js - UPDATED with custom Button system
import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Alert } from 'react-bootstrap';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import PasswordRequirements from '../components/PasswordRequirements';
import { validateName, validateEmail, validatePassword } from '../utils/validation';
import Button from '../components/button/Button.jsx'; // ✅ ADDED: Custom Button component

const Register = () => {
  const { user, register } = useAuth();
  const navigate = useNavigate();

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

  if (user) {
    return <Navigate to="/" />;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const fullName = `${formData.firstName} ${formData.lastName}`.trim();

    const nameValidation = validateName(fullName);
    const emailValidation = validateEmail(formData.email);
    const passwordValidation = validatePassword(formData.password);

    if (!nameValidation.isValid) {
      setError(nameValidation.errors.join(', '));
      setLoading(false);
      return;
    }

    if (!emailValidation.isValid) {
      setError(emailValidation.errors.join(', '));
      setLoading(false);
      return;
    }

    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors.join(', '));
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Transform data to match backend expectations
      const registrationData = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        password: formData.password
      };
      
      const result = await register(registrationData);
      
      if (!result.success) {
        const errorMessage = result.message || 'Registration failed. Please try again.';
        setError(errorMessage);
        
        // DEBUG: Log the actual error message
        console.log('Registration error message:', errorMessage);
        
        // IMPROVED: More comprehensive check for already registered
        const isAlreadyRegistered = errorMessage.toLowerCase().includes('already registered') || 
                                   errorMessage.toLowerCase().includes('already exists') ||
                                   errorMessage.toLowerCase().includes('email already') ||
                                   errorMessage.toLowerCase().includes('user already') ||
                                   errorMessage.toLowerCase().includes('exists');
        
        if (isAlreadyRegistered) {
          toast.warn('👤 This email is already registered! Try signing in instead.', {
            position: "top-right",
            autoClose: 6000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        } else {
          // General error toast
          toast.error(errorMessage, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      } else {
        // SUCCESS: Show success toast and redirect
        toast.success('🎉 Account created successfully! Welcome to FurBabies!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        // Small delay to let user see the toast before redirect
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (err) {
      console.error('Registration error:', err);
      console.log('Error response:', err.response); // DEBUG: Log full error response
      
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      
      // IMPROVED: Multiple ways to detect already registered
      const isStatus409 = err.response?.status === 409;
      const isAlreadyRegistered = errorMessage.toLowerCase().includes('already registered') || 
                                 errorMessage.toLowerCase().includes('already exists') ||
                                 errorMessage.toLowerCase().includes('email already') ||
                                 errorMessage.toLowerCase().includes('user already') ||
                                 errorMessage.toLowerCase().includes('exists');
      
      console.log('Is 409 status:', isStatus409); // DEBUG
      console.log('Is already registered message:', isAlreadyRegistered); // DEBUG
      
      if (isStatus409 || isAlreadyRegistered) {
        toast.warn('👤 This email is already registered! Try signing in instead.', {
          position: "top-right",
          autoClose: 6000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        // General error toast
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
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

              {error && (
                <Alert variant={
                  error.toLowerCase().includes('already registered') || 
                  error.toLowerCase().includes('already exists') 
                    ? "warning" 
                    : "danger"
                }>
                  {error.toLowerCase().includes('already registered') || 
                   error.toLowerCase().includes('already exists') ? (
                    <>
                      {error}{' '}
                      <Link to="/login" className="alert-link">
                        <strong>Sign in here</strong>
                      </Link>
                    </>
                  ) : (
                    error
                  )}
                </Alert>
              )}

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
                      <Form.Text className="text-muted">Letters and spaces only</Form.Text>
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
                      <Form.Text className="text-muted">Letters and spaces only</Form.Text>
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
                  <Form.Text className="text-muted">This will be displayed on your profile</Form.Text>
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
                  <Form.Text className="text-muted">We'll never share your email</Form.Text>
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
                    {/* ✅ UPDATED: Custom Button for password toggle */}
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="border border-start-0"
                      style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </Button>
                  </div>
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
                    {/* ✅ UPDATED: Custom Button for password toggle */}
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="border border-start-0"
                      style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
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
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <small className="text-success d-block mt-1">
                      <i className="fas fa-check-circle me-1"></i>
                      Passwords match
                    </small>
                  )}
                </Form.Group>

                <div className="alert alert-info mb-4">
                  <h6 className="alert-heading">
                    <i className="fas fa-info-circle me-2"></i>
                    Account Requirements
                  </h6>
                  <ul className="mb-0 small">
                    <li><strong>Name:</strong> Letters and spaces only (2–50 characters)</li>
                    <li><strong>Email:</strong> Valid email address</li>
                    <li><strong>Password:</strong> See requirements above</li>
                  </ul>
                </div>

                {/* ✅ UPDATED: Custom Button for form submission */}
                <Button
                  type="submit"
                  variant="primary"
                  className="w-100 mb-3"
                  size="large"
                  loading={loading}
                >
                  <i className="fas fa-user-plus me-2"></i>
                  {loading ? 'Creating Account...' : 'Create Account'}
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