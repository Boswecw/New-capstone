import React from 'react';
import {
  Navbar as BootstrapNavbar,
  Nav,
  NavDropdown,
  Container
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <BootstrapNavbar expand="lg" className="custom-navbar" fixed="top" bg="light">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/">
          <i className="fas fa-paw me-2"></i>FurBabies
        </BootstrapNavbar.Brand>

        <BootstrapNavbar.Toggle aria-controls="navbar-nav" />

        <BootstrapNavbar.Collapse id="navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/">
              <i className="fas fa-home me-1"></i>Home
            </Nav.Link>

            {/* 🐾 Dropdown Menu */}
            <NavDropdown title="Shop by Pet" id="nav-dropdown-pets">
              <NavDropdown.Item as={Link} to="/dogs">
                <i className="fas fa-dog me-2"></i>Dogs
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/cats">
                <i className="fas fa-cat me-2"></i>Cats
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/aquatics">
                <i className="fas fa-fish me-2"></i>Aquatics
              </NavDropdown.Item>
            </NavDropdown>

            <Nav.Link as={Link} to="/about">
              <i className="fas fa-info-circle me-1"></i>About
            </Nav.Link>

            <Nav.Link as={Link} to="/contact">
              <i className="fas fa-envelope me-1"></i>Contact
            </Nav.Link>

            {/* 👤 Account or Auth */}
            {user ? (
              <NavDropdown title={user.displayName || 'Account'} id="nav-dropdown-account">
                <NavDropdown.Item as={Link} to="/profile">Profile</NavDropdown.Item>
                <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Nav.Link as={Link} to="/login">
                <i className="fas fa-sign-in-alt me-1"></i>Login
              </Nav.Link>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;
