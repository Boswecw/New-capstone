import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="text-center">
      <Container>
        <p className="mb-3">
          <i className="fas fa-paw me-2"></i>&copy; 2025 FurBabies. All rights reserved.
        </p>
        <div className="footer-icons">
          <a href="#" aria-label="Facebook">
            <i className="fab fa-facebook"></i>
          </a>
          <a href="#" aria-label="Twitter">
            <i className="fab fa-twitter"></i>
          </a>
          <a href="#" aria-label="Instagram">
            <i className="fab fa-instagram"></i>
          </a>
          <a href="#" aria-label="Phone">
            <i className="fas fa-phone"></i>
          </a>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;