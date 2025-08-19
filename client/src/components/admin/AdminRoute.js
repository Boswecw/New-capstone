// client/src/components/AdminRoute.js
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Container, Spinner, Alert } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";

const AdminRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3 text-muted">Verifying access permissions...</p>
      </Container>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Check admin role
  if (user.role !== "admin") {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          <Alert.Heading>
            <i className="fas fa-shield-alt me-2"></i>
            Access Denied
          </Alert.Heading>
          <p className="mb-3">
            You don't have permission to access the admin dashboard.
          </p>
          <p className="mb-0">
            Only administrators can view this page. 
            Current role: <strong>{user.role}</strong>
          </p>
          <hr />
          <div className="d-flex gap-2 justify-content-center">
            <button 
              className="btn btn-outline-primary"
              onClick={() => window.history.back()}
            >
              Go Back
            </button>
            <a href="/" className="btn btn-primary">
              Go Home
            </a>
          </div>
        </Alert>
      </Container>
    );
  }

  return children;
};

export default AdminRoute;