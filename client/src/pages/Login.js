import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
} from "react-bootstrap";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" />;
  }

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { email, password } = formData;

    // ✅ Validate inputs before sending
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    console.log("🧪 Login form submission:");
    console.log("📬 Email:", email, "| Type:", typeof email);
    console.log("🔒 Password:", password ? "[REDACTED]" : "MISSING");

    setLoading(true);

    try {
      const result = await login({ email, password });

      if (!result.success) {
        setError(result.message || "Login failed. Please try again.");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    }

    setLoading(false);
  };

  return (
    <Container className="py-5" style={{ marginTop: "80px" }}>
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card>
            <Card.Body>
              <div className="text-center mb-4">
                <h2>
                  <i className="fas fa-paw me-2"></i>FurBabies Login
                </h2>
                <p className="text-muted">Sign in to your account</p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit} autoComplete="on">
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
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </Form>

              <div className="text-center">
                <p className="mb-0">
                  Don't have an account? <Link to="/register">Sign up</Link>
                </p>
              </div>

              <div className="mt-4">
                <Alert variant="info" className="text-sm">
                  <strong>Demo Accounts</strong>
                  <br />
                  Admin: <code>admin@furbabies.com</code> / <code>admin123</code>
                  <br />
                  User: <code>test@example.com</code> / <code>password123</code>
                </Alert>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
