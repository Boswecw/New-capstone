// =============================================================================
// Complete Registration Form - Fixed Version
// All imports and functions properly defined
// =============================================================================

import React, { useState } from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Import our form components (make sure the path is correct)
import {
  Form,
  FormRow,
  FormCol,
  CompleteField,
  FormField,
  Label,
  Input,
  InputGroup,
  Checkbox,
  FormActions,
  HelpText
} from '../components/Form';

const RegistrationForm = () => {
  const { user, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" />;
  }

  // Form validation rules
  const validation = {
    firstName: {
      required: 'First name is required',
      minLength: 2,
      maxLength: 30
    },
    lastName: {
      required: 'Last name is required',
      minLength: 2,
      maxLength: 30
    },
    username: {
      required: 'Username is required',
      minLength: 3,
      maxLength: 20,
      pattern: /^[a-zA-Z0-9_]+$/,
      patternMessage: 'Username can only contain letters, numbers, and underscores'
    },
    email: {
      required: 'Email is required',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      patternMessage: 'Please enter a valid email address'
    },
    password: {
      required: 'Password is required',
      minLength: 8,
      custom: (value) => {
        if (!/(?=.*[a-z])/.test(value)) return 'Password must contain a lowercase letter';
        if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain an uppercase letter';
        if (!/(?=.*\d)/.test(value)) return 'Password must contain a number';
        if (!/(?=.*[@$!%*?&])/.test(value)) return 'Password must contain a special character';
        return null;
      }
    },
    confirmPassword: {
      required: 'Please confirm your password',
      custom: (value, data) => {
        if (value !== data.password) return 'Passwords do not match';
        return null;
      }
    },
    terms: {
      required: 'You must accept the terms and conditions',
      custom: (value) => {
        if (!value) return 'Please accept the terms and conditions';
        return null;
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (formData) => {
    setLoading(true);
    setError('');

    try {
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      
      if (!result.success) {
        setError(result.message);
      }
      // If successful, the useAuth hook will handle the redirect
      
    } catch (err) {
      setError('Registration failed. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[@$!%*?&]/.test(password)) strength += 1;
    return strength;
  };

  // Handle password change for strength indicator
  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setPasswordStrength(calculatePasswordStrength(password));
  };

  // Get strength indicator color
  const getStrengthColor = () => {
    if (passwordStrength <= 2) return 'danger';
    if (passwordStrength <= 3) return 'warning';
    return 'success';
  };

  // Get strength text
  const getStrengthText = () => {
    if (passwordStrength <= 1) return 'Very Weak';
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Medium';
    if (passwordStrength <= 4) return 'Strong';
    return 'Very Strong';
  };

  return (
    <Container className="py-5" style={{ marginTop: '80px' }}>
      <Row className="justify-content-center">
        <Col md={8} lg={7}>
          <Card className="shadow-lg border-0">
            <Card.Body className="p-5">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="mb-3">
                  <i className="fas fa-paw fa-3x text-primary"></i>
                </div>
                <h2 className="fw-bold">Join FurBabies</h2>
                <p className="text-muted">Create your account and find your perfect companion</p>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="danger" className="mb-4">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}

              {/* Registration Form */}
              <Form 
                onSubmit={handleSubmit}
                validation={validation}
              >
                {/* Name Fields */}
                <FormRow>
                  <FormCol size="half">
                    <CompleteField
                      label="First Name"
                      name="firstName"
                      type="text"
                      required
                      inputProps={{
                        placeholder: "John",
                        autoComplete: "given-name",
                        autoFocus: true
                      }}
                    />
                  </FormCol>
                  
                  <FormCol size="half">
                    <CompleteField
                      label="Last Name"
                      name="lastName"
                      type="text"
                      required
                      inputProps={{
                        placeholder: "Doe",
                        autoComplete: "family-name"
                      }}
                    />
                  </FormCol>
                </FormRow>

                {/* Username Field */}
                <CompleteField
                  label="Username"
                  name="username"
                  type="text"
                  required
                  helpText="3-20 characters, letters, numbers, and underscores only"
                  inputProps={{
                    placeholder: "johndoe123",
                    autoComplete: "username"
                  }}
                />

                {/* Email Field with Floating Label */}
                <CompleteField
                  label="Email Address"
                  name="email"
                  type="email"
                  required
                  floating
                  helpText="We'll use this to send you updates about your pets"
                  inputProps={{
                    autoComplete: "email"
                  }}
                />

                {/* Password Field with Strength Indicator */}
                <FormField required>
                  <Label htmlFor="password">Password</Label>
                  <InputGroup>
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      onChange={handlePasswordChange}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </InputGroup>
                  
                  {/* Password Strength Indicator */}
                  <div className="mt-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">Password Strength:</small>
                      <small className={`text-${getStrengthColor()}`}>
                        {getStrengthText()}
                      </small>
                    </div>
                    <div className="progress" style={{ height: '4px' }}>
                      <div 
                        className={`progress-bar bg-${getStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <HelpText size="small">
                    Must contain: 8+ characters, uppercase, lowercase, number, and special character
                  </HelpText>
                </FormField>

                {/* Confirm Password Field */}
                <FormField required>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <InputGroup>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </InputGroup>
                </FormField>

                {/* Terms and Conditions */}
                <FormField required className="mb-4">
                  <Checkbox
                    id="terms"
                    name="terms"
                    label={
                      <>
                        I agree to the{' '}
                        <Link to="/terms" className="text-decoration-none">
                          Terms of Service
                        </Link>
                        {' '}and{' '}
                        <Link to="/privacy" className="text-decoration-none">
                          Privacy Policy
                        </Link>
                      </>
                    }
                  />
                </FormField>

                {/* Submit Button */}
                <FormActions alignment="center">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg w-100"
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
                  </button>
                </FormActions>
              </Form>

              {/* Login Link */}
              <div className="text-center mt-4">
                <p className="mb-0">
                  Already have an account?{' '}
                  <Link to="/login" className="text-decoration-none fw-medium">
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

export default RegistrationForm;