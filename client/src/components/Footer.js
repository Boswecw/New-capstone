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
          <a 
            href="https://facebook.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="Facebook" 
            className="me-3 footer-icon"
            style={{
              color: '#6c757d', 
              fontSize: '1.5rem',
              transition: 'all 0.3s ease',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#1877f2';
              e.target.style.transform = 'scale(1.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#6c757d';
              e.target.style.transform = 'scale(1)';
            }}
          >
            <i className="fab fa-facebook"></i>
          </a>
          <a 
            href="https://x.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="X" 
            className="me-3 footer-icon"
            style={{
              color: '#6c757d', 
              fontSize: '1.5rem',
              transition: 'all 0.3s ease',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#000000';
              e.target.style.transform = 'scale(1.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#6c757d';
              e.target.style.transform = 'scale(1)';
            }}
          >
            <strong>𝕏</strong>
          </a>
          <a 
            href="https://instagram.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="Instagram" 
            className="me-3 footer-icon"
            style={{
              color: '#6c757d', 
              fontSize: '1.5rem',
              transition: 'all 0.3s ease',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#e4405f';
              e.target.style.transform = 'scale(1.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#6c757d';
              e.target.style.transform = 'scale(1)';
            }}
          >
            <i className="fab fa-instagram"></i>
          </a>
          <a 
            href="tel:123-456-7890" 
            aria-label="Phone"
            className="footer-icon"
            style={{
              color: '#6c757d', 
              fontSize: '1.5rem',
              transition: 'all 0.3s ease',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#28a745';
              e.target.style.transform = 'scale(1.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#6c757d';
              e.target.style.transform = 'scale(1)';
            }}
          >
            <i className="fas fa-phone"></i>
          </a>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;