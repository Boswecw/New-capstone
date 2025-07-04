import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="text-center py-4 bg-light mt-auto">
      <Container>
        <p className="mb-3">
          <i className="fas fa-paw me-2"></i>
          &copy; {new Date().getFullYear()} FurBabies. All rights reserved.
        </p>
        <div className="footer-icons">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="me-3">
            <i className="fab fa-facebook"></i>
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="me-3">
            <i className="fab fa-twitter"></i>
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="me-3">
            <i className="fab fa-instagram"></i>
          </a>
          <a href="tel:123-456-7890" aria-label="Phone">
            <i className="fas fa-phone"></i>
          </a>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
