// components/AdminRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import { Container, Spinner, Alert } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Access Denied</Alert.Heading>
          <p>You don't have permission to access the admin dashboard.</p>
          <p>Only administrators can view this page.</p>
        </Alert>
      </Container>
    );
  }

  return children;
};

export default AdminRoute;