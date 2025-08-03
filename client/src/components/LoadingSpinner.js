
// client/src/components/LoadingSpinner.js
import React from 'react';
import { Container, Spinner } from 'react-bootstrap';

const LoadingSpinner = ({ message = "Loading...", size = "border" }) => {
  return (
    <Container className="py-5">
      <div className="text-center">
        <Spinner animation={size} role="status" className="mb-3" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <h4>{message}</h4>
        <p className="text-muted">Please wait while we fetch your data.</p>
      </div>
    </Container>
  );
};

export default LoadingSpinner;