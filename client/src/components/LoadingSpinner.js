
import React from 'react';
import { Container, Spinner } from 'react-bootstrap';

const LoadingSpinner = ({
  message = "Loading...",
  size = "border",
  variant = "primary",
  noContainer = false,
}) => {
  const content = (
    <div className="text-center w-100 py-4">
      <Spinner animation={size} role="status" className="mb-3" variant={variant}>
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      <h5 className="mb-0">{message}</h5>
    </div>
  );

  return noContainer ? content : <Container className="py-5">{content}</Container>;
};

export default LoadingSpinner;
