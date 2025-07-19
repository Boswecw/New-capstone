// client/src/components/Navbar.js - FIXED AUTHCONTEXT IMPORT + NEWS LINK
import React, { useState, useContext } from 'react';
import { Navbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext'; // ✅ FIXED: Default import

const AppNavbar = () => {
  const [expanded, setExpanded] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setExpanded(false);
  };

  const closeNavbar = () => setExpanded(false);

  return (
    <Navbar 
      bg="white" 
      expand="lg" 
      className="shadow-sm sticky-top"
      expanded={expanded}
      onToggle={setExpanded}
    >
      <Container>
        {/* Brand Logo */}
        <Navbar.Brand as={Link} to="/" onClick={closeNavbar}>
          <div className="d-flex align-items-center">
            <i className="fas fa-paw text-primary fs-3 me-2"></i>
            <span className="fw-bold text-primary fs-4">FurBabies</span>
          </div>
        </Navbar.Brand>

        {/* Mobile Toggle */}
        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        {/* Navigation Links */}
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {/* Home */}
            <Nav.Link as={Link} to="/" onClick={closeNavbar}>
              <i className="fas fa-home me-1"></i>
              Home
            </Nav.Link>

            {/* Pets Dropdown */}
            <NavDropdown title={
              <span>
                <i className="fas fa-paw me-1"></i>
                Pets
              </span>
            } id="pets-dropdown">
              <NavDropdown.Item as={Link} to="/pets" onClick={closeNavbar}>
                <i className="fas fa-list me-2"></i>
                All Pets
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/browse" onClick={closeNavbar}>
                <i className="fas fa-search me-2"></i>
                Browse Pets
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item as={Link} to="/pets?type=dog" onClick={closeNavbar}>
                <i className="fas fa-dog me-2"></i>
                Dogs
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/pets?type=cat" onClick={closeNavbar}>
                <i className="fas fa-cat me-2"></i>
                Cats
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/pets?type=fish" onClick={closeNavbar}>
                <i className="fas fa-fish me-2"></i>
                Fish & Aquatic
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/pets?type=other" onClick={closeNavbar}>
                <i className="fas fa-dove me-2"></i>
                Other Pets
              </NavDropdown.Item>
            </NavDropdown>

            {/* Products */}
            <Nav.Link as={Link} to="/products" onClick={closeNavbar}>
              <i className="fas fa-shopping-bag me-1"></i>
              Products
            </Nav.Link>

            {/* ✅ News Link */}
            <Nav.Link as={Link} to="/news" onClick={closeNavbar}>
              <i className="fas fa-newspaper me-1"></i>
              News
            </Nav.Link>

            {/* About */}
            <Nav.Link as={Link} to="/about" onClick={closeNavbar}>
              <i className="fas fa-info-circle me-1"></i>
              About
            </Nav.Link>

            {/* Contact */}
            <Nav.Link as={Link} to="/contact" onClick={closeNavbar}>
              <i className="fas fa-envelope me-1"></i>
              Contact
            </Nav.Link>
          </Nav>

          {/* Right Side Navigation */}
          <Nav>
            {user ? (
              // Logged in user menu
              <NavDropdown 
                title={
                  <span>
                    <i className="fas fa-user-circle me-1"></i>
                    {user.name || user.email}
                  </span>
                } 
                id="user-dropdown"
                align="end"
              >
                <NavDropdown.Item as={Link} to="/profile" onClick={closeNavbar}>
                  <i className="fas fa-user me-2"></i>
                  My Profile
                </NavDropdown.Item>
                
                {user.role === 'admin' && (
                  <>
                    <NavDropdown.Divider />
                    <NavDropdown.Item as={Link} to="/admin" onClick={closeNavbar}>
                      <i className="fas fa-cog me-2"></i>
                      Admin Dashboard
                    </NavDropdown.Item>
                  </>
                )}
                
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt me-2"></i>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              // Guest user buttons
              <div className="d-flex gap-2">
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  as={Link} 
                  to="/login" 
                  onClick={closeNavbar}
                >
                  <i className="fas fa-sign-in-alt me-1"></i>
                  Login
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  as={Link} 
                  to="/register" 
                  onClick={closeNavbar}
                >
                  <i className="fas fa-user-plus me-1"></i>
                  Register
                </Button>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
