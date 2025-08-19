// client/src/components/Form/AuthForms.js - COMPLETELY FIXED VERSION
import React, { useState } from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// =============================================================================
// LOGIN FORM COMPONENT - FIXED VERSION
// =============================================================================

export const LoginForm = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  
  // Manual form state management (no complex Form component)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  // Handle form submission - FIXED: No complex JSON handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Login attempt with:', { 
        email: formData.email, 
        passwordLength: formData.password.length 
      });

      // Basic validation
      if (!formData.email || !formData.password) {
        throw new Error('Please fill in all fields');
      }

      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // FIXED: Pass data directly to login function
      const result = await login({
        email: formData.email.trim(),
        password: formData.password
      });

      if (result && result.success) {
        console.log('✅ Login successful');
        navigate('/');
      } else {
        throw new Error(result?.message || 'Login failed');
      }

    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5" style={{ marginTop: '80px' }}>
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card className="shadow-lg border-0">
            <Card.Body className="p-5">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="mb-3">
                  <i className="fas fa-paw fa-3x text-primary"></i>
                </div>
                <h2 className="fw-bold">Welcome Back</h2>
                <p className="text-muted">Sign in to your account</p>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="danger" className="mb-4">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}

              {/* Login Form - SIMPLIFIED */}
              <form onSubmit={handleSubmit}>
                {/* Email Field */}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-control"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    autoComplete="email"
                    required
                    autoFocus
                  />
                </div>

                {/* Password Field */}
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      className="form-control"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="d-grid mb-3">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg"
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
                </div>

                {/* Forgot Password Link */}
                <div className="text-center mb-3">
                  <Link to="/forgot-password" className="text-decoration-none">
                    Forgot your password?
                  </Link>
                </div>
              </form>

              {/* Sign Up Link */}
              <div className="text-center">
                <p className="text-muted mb-0">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-decoration-none fw-bold">
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
// REGISTER FORM COMPONENT - FIXED VERSION
// =============================================================================

export const RegisterForm = () => {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  
  // Manual form state management
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  // Handle form submission - FIXED
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('📝 Registration attempt with:', { 
        name: formData.name, 
        email: formData.email 
      });

      // Basic validation
      if (!formData.name || !formData.email || !formData.password) {
        throw new Error('Please fill in all required fields');
      }

      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // FIXED: Pass data directly to register function
      const result = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password
      });

      if (result && result.success) {
        console.log('✅ Registration successful');
        navigate('/');
      } else {
        throw new Error(result?.message || 'Registration failed');
      }

    } catch (err) {
      console.error('❌ Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
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

              {/* Registration Form - SIMPLIFIED */}
              <form onSubmit={handleSubmit}>
                {/* Name Field */}
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-control"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    autoComplete="name"
                    required
                    autoFocus
                  />
                </div>

                {/* Email Field */}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-control"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    autoComplete="email"
                    required
                  />
                </div>

                {/* Password Field */}
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      className="form-control"
                      placeholder="Create a password (min 6 characters)"
                      value={formData.password}
                      onChange={handleInputChange}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      className="form-control"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="d-grid mb-3">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg"
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
                </div>
              </form>

              {/* Sign In Link */}
              <div className="text-center">
                <p className="text-muted mb-0">
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

// =============================================================================
// FORGOT PASSWORD FORM
// =============================================================================

export const ForgotPasswordForm = () => {
  const [formData, setFormData] = useState({ email: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.email) {
        throw new Error('Please enter your email address');
      }

      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Simulate API call - replace with actual implementation
      console.log('Sending password reset to:', formData.email);
      setSuccess('Password reset instructions have been sent to your email.');
      
    } catch (err) {
      setError(err.message || 'Error sending reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5" style={{ marginTop: '80px' }}>
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card className="shadow-lg border-0">
            <Card.Body className="p-5">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="mb-3">
                  <i className="fas fa-key fa-3x text-primary"></i>
                </div>
                <h2 className="fw-bold">Forgot Password?</h2>
                <p className="text-muted">Enter your email to reset your password</p>
              </div>

              {/* Success Alert */}
              {success && (
                <Alert variant="success" className="mb-4">
                  <i className="fas fa-check-circle me-2"></i>
                  {success}
                </Alert>
              )}

              {/* Error Alert */}
              {error && (
                <Alert variant="danger" className="mb-4">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}

              {!success && (
                <form onSubmit={handleSubmit}>
                  {/* Email Field */}
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-control"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      autoComplete="email"
                      required
                      autoFocus
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="d-grid mb-3">
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Sending Instructions...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane me-2"></i>
                          Send Reset Instructions
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Back to Login */}
              <div className="text-center">
                <Link to="/login" className="text-decoration-none">
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

const AuthForms = {
  LoginForm,
  RegisterForm,
  ForgotPasswordForm
};

export default AuthForms;