// =============================================================================
// AuthForm.js - Complete Authentication Forms
// Login, Register, Forgot Password, and Reset Password forms
// =============================================================================

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, ProgressBar } from 'react-bootstrap';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// Import our form components
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

// =============================================================================
// LOGIN FORM COMPONENT
// =============================================================================

export const LoginForm = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  // Form validation rules
  const validation = {
    email: {
      required: 'Email is required',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      patternMessage: 'Please enter a valid email address'
    },
    password: {
      required: 'Password is required',
      minLength: 6
    }
  };

  // Handle form submission
  const handleSubmit = async (formData) => {
    setLoading(true);
    setError('');

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
        rememberMe: rememberMe
      });
      
      if (!result.success) {
        setError(result.message || 'Login failed. Please check your credentials.');
      } else {
        // Navigate to intended destination or home
        const intendedPath = sessionStorage.getItem('intendedPath') || '/';
        sessionStorage.removeItem('intendedPath');
        navigate(intendedPath);
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5" style={{ marginTop: '80px' }}>
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow-lg border-0">
            <Card.Body className="p-5">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="mb-3">
                  <i className="fas fa-paw fa-3x text-primary"></i>
                </div>
                <h2 className="fw-bold">Welcome Back</h2>
                <p className="text-muted">Sign in to your FurBabies account</p>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="danger" className="mb-4">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}

              {/* Login Form */}
              <Form onSubmit={handleSubmit} validation={validation}>
                {/* Email Field */}
                <CompleteField
                  label="Email Address"
                  name="email"
                  type="email"
                  required
                  floating={true}
                  inputProps={{
                    autoComplete: "email",
                    autoFocus: true,
                    placeholder: " "
                  }}
                />

                {/* Password Field with Toggle */}
                <FormField required>
                  <Label htmlFor="password">Password</Label>
                  <InputGroup>
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      autoComplete="current-password"
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
                </FormField>

                {/* Remember Me & Forgot Password */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <Checkbox
                    id="remember"
                    name="remember"
                    label="Remember me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  
                  <Link 
                    to="/forgot-password" 
                    className="text-decoration-none small"
                  >
                    Forgot password?
                  </Link>
                </div>

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
                        Signing In...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt me-2"></i>
                        Sign In
                      </>
                    )}
                  </button>
                </FormActions>
              </Form>

              {/* Register Link */}
              <div className="text-center mt-4">
                <p className="mb-0">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-decoration-none fw-medium">
                    Create one here
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

// =============================================================================
// REGISTER FORM COMPONENT
// =============================================================================

export const RegisterForm = () => {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
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

  // Get strength indicator properties
  const getStrengthColor = () => {
    if (passwordStrength <= 2) return 'danger';
    if (passwordStrength <= 3) return 'warning';
    return 'success';
  };

  const getStrengthText = () => {
    if (passwordStrength <= 1) return 'Very Weak';
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Medium';
    if (passwordStrength <= 4) return 'Strong';
    return 'Very Strong';
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
        setError(result.message || 'Registration failed. Please try again.');
      } else {
        // Registration successful, redirect to home or dashboard
        navigate('/');
      }
      
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
              <Form onSubmit={handleSubmit} validation={validation}>
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

                {/* Email Field */}
                <CompleteField
                  label="Email Address"
                  name="email"
                  type="email"
                  required
                  helpText="We'll use this to send you updates about your pets"
                  inputProps={{
                    placeholder: "john@example.com",
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
                    <ProgressBar 
                      now={(passwordStrength / 5) * 100}
                      variant={getStrengthColor()}
                      style={{ height: '4px' }}
                    />
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
                        <Link to="/terms" className="text-decoration-none" target="_blank">
                          Terms of Service
                        </Link>
                        {' '}and{' '}
                        <Link to="/privacy" className="text-decoration-none" target="_blank">
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

// =============================================================================
// FORGOT PASSWORD FORM COMPONENT
// =============================================================================

export const ForgotPasswordForm = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  // Form validation rules
  const validation = {
    email: {
      required: 'Email is required',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      patternMessage: 'Please enter a valid email address'
    }
  };

  // Handle form submission
  const handleSubmit = async (formData) => {
    setLoading(true);
    setError('');

    try {
      // Call forgot password API
      const response = await api.post('/auth/forgot-password', { 
        email: formData.email 
      });

      if (response.data.success) {
        setEmail(formData.email);
        setSuccess(true);
      } else {
        throw new Error(response.data.message || 'Failed to send reset email');
      }
      
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(
        err.response?.data?.message || 
        'Error sending reset email. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle resend email
  const handleResend = async () => {
    if (email) {
      await handleSubmit({ email });
    }
  };

  return (
    <Container className="py-5" style={{ marginTop: '80px' }}>
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow-lg border-0">
            <Card.Body className="p-5">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="mb-3">
                  <i className="fas fa-key fa-3x text-primary"></i>
                </div>
                <h2 className="fw-bold">Reset Password</h2>
                <p className="text-muted">
                  {success 
                    ? "Check your email for reset instructions"
                    : "Enter your email and we'll send you a link to reset your password"
                  }
                </p>
              </div>

              {/* Success Message */}
              {success && (
                <Alert variant="success" className="mb-4">
                  <div className="d-flex align-items-start">
                    <i className="fas fa-check-circle me-2 mt-1"></i>
                    <div>
                      <strong>Email sent!</strong>
                      <p className="mb-2">
                        We've sent password reset instructions to <strong>{email}</strong>
                      </p>
                      <p className="mb-0 small">
                        Didn't receive it? Check your spam folder or{' '}
                        <button 
                          type="button" 
                          className="btn btn-link p-0 text-decoration-underline"
                          onClick={handleResend}
                        >
                          click here to resend
                        </button>
                      </p>
                    </div>
                  </div>
                </Alert>
              )}

              {/* Error Alert */}
              {error && (
                <Alert variant="danger" className="mb-4">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}

              {/* Form - only show if not successful */}
              {!success && (
                <Form onSubmit={handleSubmit} validation={validation}>
                  {/* Email Field */}
                  <CompleteField
                    label="Email Address"
                    name="email"
                    type="email"
                    required
                    helpText="Enter the email associated with your account"
                    inputProps={{
                      placeholder: "john@example.com",
                      autoComplete: "email",
                      autoFocus: true
                    }}
                  />

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
                          Sending...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane me-2"></i>
                          Send Reset Link
                        </>
                      )}
                    </button>
                  </FormActions>
                </Form>
              )}

              {/* Back to Login */}
              <div className="text-center mt-4">
                <Link 
                  to="/login" 
                  className="text-decoration-none"
                >
                  <i className="fas fa-arrow-left me-1"></i>
                  Back to Sign In
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

// =============================================================================
// RESET PASSWORD FORM COMPONENT
// =============================================================================

export const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [tokenValid, setTokenValid] = useState(null);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  // Validate token on component mount
  useEffect(() => {
    if (!token || !email) {
      setError('Invalid or missing reset token. Please request a new password reset.');
      setTokenValid(false);
      return;
    }

    // Validate token with backend
    const validateToken = async () => {
      try {
        const response = await api.post('/auth/validate-reset-token', { token, email });
        if (response.data.success) {
          setTokenValid(true);
        } else {
          setError('This reset link has expired or is invalid. Please request a new one.');
          setTokenValid(false);
        }
      } catch (err) {
        setError('This reset link has expired or is invalid. Please request a new one.');
        setTokenValid(false);
      }
    };

    validateToken();
  }, [token, email]);

  // Form validation rules
  const validation = {
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

  // Get strength indicator properties
  const getStrengthColor = () => {
    if (passwordStrength <= 2) return 'danger';
    if (passwordStrength <= 3) return 'warning';
    return 'success';
  };

  const getStrengthText = () => {
    if (passwordStrength <= 1) return 'Very Weak';
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Medium';
    if (passwordStrength <= 4) return 'Strong';
    return 'Very Strong';
  };

  // Handle form submission
  const handleSubmit = async (formData) => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        email,
        password: formData.password
      });

      if (response.data.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        throw new Error(response.data.message || 'Failed to reset password');
      }
      
    } catch (err) {
      console.error('Reset password error:', err);
      setError(
        err.response?.data?.message || 
        'Error resetting password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Loading state while validating token
  if (tokenValid === null) {
    return (
      <Container className="py-5" style={{ marginTop: '80px' }}>
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card className="shadow-lg border-0">
              <Card.Body className="text-center p-5">
                <div className="spinner-border text-primary mb-3"></div>
                <p>Validating reset link...</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-5" style={{ marginTop: '80px' }}>
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow-lg border-0">
            <Card.Body className="p-5">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="mb-3">
                  <i className={`fas ${success ? 'fa-check-circle text-success' : 'fa-lock text-primary'} fa-3x`}></i>
                </div>
                <h2 className="fw-bold">
                  {success ? 'Password Reset!' : 'Create New Password'}
                </h2>
                <p className="text-muted">
                  {success 
                    ? "Your password has been successfully reset"
                    : "Enter your new password below"
                  }
                </p>
              </div>

              {/* Success Message */}
              {success && (
                <Alert variant="success" className="mb-4">
                  <i className="fas fa-check-circle me-2"></i>
                  <strong>Success!</strong> Your password has been reset. 
                  You'll be redirected to the login page in a few seconds.
                </Alert>
              )}

              {/* Error Alert */}
              {error && (
                <Alert variant="danger" className="mb-4">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}

              {/* Form - only show if token is valid and not successful */}
              {tokenValid && !success && (
                <Form onSubmit={handleSubmit} validation={validation}>
                  {/* New Password Field */}
                  <FormField required>
                    <Label htmlFor="password">New Password</Label>
                    <InputGroup>
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        autoComplete="new-password"
                        onChange={handlePasswordChange}
                        autoFocus
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
                      <ProgressBar 
                        now={(passwordStrength / 5) * 100}
                        variant={getStrengthColor()}
                        style={{ height: '4px' }}
                      />
                    </div>
                    
                    <HelpText size="small">
                      Must contain: 8+ characters, uppercase, lowercase, number, and special character
                    </HelpText>
                  </FormField>

                  {/* Confirm Password Field */}
                  <FormField required>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <InputGroup>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your new password"
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
                          Updating Password...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check me-2"></i>
                          Update Password
                        </>
                      )}
                    </button>
                  </FormActions>
                </Form>
              )}

              {/* Invalid token - show reset link */}
              {!tokenValid && (
                <div className="text-center">
                  <Link 
                    to="/forgot-password" 
                    className="btn btn-primary"
                  >
                    Request New Reset Link
                  </Link>
                </div>
              )}

              {/* Back to Login */}
              <div className="text-center mt-4">
                <Link 
                  to="/login" 
                  className="text-decoration-none"
                >
                  <i className="fas fa-arrow-left me-1"></i>
                  Back to Sign In
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

// =============================================================================
// EXPORTS
// =============================================================================

// Default export object with all forms
const AuthForms = {
  LoginForm,
  RegisterForm,
  ForgotPasswordForm,
  ResetPasswordForm
};

export default AuthForms;