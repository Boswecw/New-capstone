// =============================================================================
// AuthForms.js – Using Your Existing Design System
// =============================================================================

import React, { useState } from "react";
import { Container, Row, Col, Card, Alert } from "react-bootstrap";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/AuthContext";
import Form, { CompleteField, Checkbox, FormActions } from "./Form";
import "./AuthForm.css"; // ✅ External CSS file using your design system

// =============================================================================
// Helper: Login Error Handler
// =============================================================================
const getLoginErrorMessage = (error, apiMessage) => {
  const message =
    apiMessage?.toLowerCase() || error?.message?.toLowerCase() || "";

  if (message.includes("invalid credentials"))
    return "🔐 Incorrect email or password.";
  if (message.includes("user not found"))
    return "👤 No account found with this email.";
  if (message.includes("account locked"))
    return "🔒 Too many failed attempts. Try later.";
  if (message.includes("email not verified"))
    return "📧 Please verify your email before logging in.";

  return apiMessage || "❌ Login failed. Please try again.";
};

// =============================================================================
// LoginForm Component - Using Your Design System
// =============================================================================
export const LoginForm = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const validation = {
    email: {
      required: "Email is required",
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      patternMessage: "Enter a valid email address",
    },
    password: {
      required: "Password is required",
    },
  };

  const handleSubmit = async (formData) => {
    console.log('🔍 AuthForms handleSubmit called with:', formData);
    
    setLoading(true);
    setError("");

    // ✅ EXTRACT EMAIL AND PASSWORD FROM FORM DATA
    let email, password;

    // Check if we have flat structure: {email: "...", password: "..."}
    if (formData.email && formData.password && typeof formData.email === 'string') {
      email = formData.email;
      password = formData.password;
      console.log('✅ Found flat structure');
    } 
    // Check for nested structure: {email: {email: "...", password: "..."}}
    else if (typeof formData.email === 'object' && formData.email?.email && formData.email?.password) {
      email = formData.email.email;
      password = formData.email.password;
      console.log('✅ Found nested structure');
    }
    // Search through all fields for nested objects
    else {
      console.log('🔍 Searching for nested credentials...');
      for (const [key, value] of Object.entries(formData)) {
        if (typeof value === 'object' && value?.email && value?.password) {
          email = value.email;
          password = value.password;
          console.log(`✅ Found credentials in field: ${key}`);
          break;
        }
      }
    }

    console.log('📧 Final email:', email);
    console.log('🔐 Final password length:', password?.length);

    // Validate credentials
    if (!email || !password) {
      const msg = "Please enter both email and password";
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    try {
      console.log('🚀 Starting login process...');
      // ✅ CALL LOGIN WITH SEPARATE PARAMETERS
      const result = await login(email, password);
      
      console.log('📥 Login result:', result);
      
      if (!result.success) {
        const msg = getLoginErrorMessage(null, result.message);
        setError(msg);
        toast.error(msg);
        return;
      }

      // ✅ SUCCESS - SHOW SUCCESS MESSAGE AND NAVIGATE
      toast.success(`🎉 Welcome back, ${result.user?.firstName || result.user?.name || "user"}!`);
      const redirect = sessionStorage.getItem("intendedPath") || "/";
      sessionStorage.removeItem("intendedPath");
      navigate(redirect);
      
    } catch (err) {
      console.error('❌ Login error:', err);
      const msg = getLoginErrorMessage(err, err?.response?.data?.message);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Container>
        <Row className="justify-content-center">
          <Col lg={5} md={7} sm={9}>
            <Card className="auth-card">
              <div className="auth-card-body">
                {/* Header */}
                <div className="auth-header">
                  <div className="auth-icon">
                    <i className="fas fa-paw"></i>
                  </div>
                  <h1 className="auth-title">Welcome Back</h1>
                  <p className="auth-subtitle">
                    Sign in to your FurBabies account
                  </p>
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert variant="danger" className="auth-error">
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
                      autoFocus: true
                    }}
                    className="auth-field"
                  />

                  {/* Password Field */}
                  <CompleteField
                    label="Password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    floating={true}
                    inputProps={{
                      autoComplete: "current-password"
                    }}
                    className="auth-field"
                  />

                  {/* Show Password Toggle */}
                  <div className="auth-password-toggle">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} me-1`}></i>
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="auth-options">
                    <div className="form-check">
                      <Checkbox 
                        id="remember" 
                        name="remember" 
                        label="Remember me"
                      />
                    </div>
                    <Link to="/forgot-password" className="auth-link">
                      Forgot password?
                    </Link>
                  </div>

                  {/* Submit Button */}
                  <FormActions alignment="center">
                    <button
                      type="submit"
                      className="btn btn-primary auth-submit-btn w-100"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="spinner me-2" role="status">
                            <span className="sr-only">Loading...</span>
                          </div>
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

                {/* Sign Up Link */}
                <div className="auth-signup">
                  <p>
                    Don't have an account?{" "}
                    <Link to="/register" className="auth-link fw-semibold">
                      Create one here
                    </Link>
                  </p>
                </div>

                {/* Demo Accounts */}
                <Alert variant="info" className="auth-demo">
                  <div className="fw-bold mb-2">
                    <i className="fas fa-info-circle me-2"></i>
                    Demo Accounts
                  </div>
                  <small>
                    <strong>Admin:</strong> admin@furbabies.com / admin123
                    <br />
                    <strong>User:</strong> test@example.com / password123
                  </small>
                </Alert>
              </div>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};