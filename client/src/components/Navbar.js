// client/src/components/Navbar.js - UPDATED TO MATCH ACTUAL DATABASE
import React, { useState } from 'react';
import { Navbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const AppNavbar = () => {
  const [expanded, setExpanded] = useState(false);
  const { user, logout } = useAuth();
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
        <Navbar.Brand as={Link} to="/" onClick={closeNavbar}>
          <div className="d-flex align-items-center">
            <i className="fas fa-paw text-primary fs-3 me-2"></i>
            <span className="fw-bold text-primary fs-4">FurBabies</span>
          </div>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" onClick={closeNavbar}>
              <i className="fas fa-home me-1"></i> Home
            </Nav.Link>

            {/* Updated Pets dropdown - Based on actual database */}
            <NavDropdown
              title={<span><i className="fas fa-paw me-1"></i> Pets</span>}
              id="pets-dropdown"
            >
              <NavDropdown.Item as={Link} to="/browse" onClick={closeNavbar}>
                <i className="fas fa-search me-2"></i> Browse All Pets
              </NavDropdown.Item>
              <NavDropdown.Divider />
              
              {/* Main Pet Types - Most Popular */}
              <NavDropdown.Header>Popular Pets</NavDropdown.Header>
              <NavDropdown.Item as={Link} to="/browse?type=dog" onClick={closeNavbar}>
                <i className="fas fa-dog me-2"></i> Dogs
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/browse?type=cat" onClick={closeNavbar}>
                <i className="fas fa-cat me-2"></i> Cats
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/browse?type=bird" onClick={closeNavbar}>
                <i className="fas fa-dove me-2"></i> Birds
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/browse?type=fish" onClick={closeNavbar}>
                <i className="fas fa-fish me-2"></i> Fish
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/browse?type=rabbit" onClick={closeNavbar}>
                <i className="fas fa-carrot me-2"></i> Rabbits
              </NavDropdown.Item>
              
              <NavDropdown.Divider />
              
              {/* Small Pets - Based on actual database types */}
              <NavDropdown.Header>Small Pets</NavDropdown.Header>
              <NavDropdown.Item as={Link} to="/browse?type=hamster" onClick={closeNavbar}>
                <i className="fas fa-circle me-2"></i> Hamsters
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/browse?type=guinea-pig" onClick={closeNavbar}>
                <i className="fas fa-circle me-2"></i> Guinea Pigs
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/browse?type=gerbil" onClick={closeNavbar}>
                <i className="fas fa-circle me-2"></i> Gerbils
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/browse?type=fancy-rat" onClick={closeNavbar}>
                <i className="fas fa-circle me-2"></i> Fancy Rats
              </NavDropdown.Item>
              
              <NavDropdown.Divider />
              
              {/* Exotic Pets - Based on actual database types */}
              <NavDropdown.Header>Exotic Pets</NavDropdown.Header>
              <NavDropdown.Item as={Link} to="/browse?type=ferret" onClick={closeNavbar}>
                <i className="fas fa-paw me-2"></i> Ferrets
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/browse?type=chinchilla" onClick={closeNavbar}>
                <i className="fas fa-paw me-2"></i> Chinchillas
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/browse?type=hedgehog" onClick={closeNavbar}>
                <i className="fas fa-paw me-2"></i> Hedgehogs
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/browse?type=sugar-glider" onClick={closeNavbar}>
                <i className="fas fa-paw me-2"></i> Sugar Gliders
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/browse?type=stoat" onClick={closeNavbar}>
                <i className="fas fa-paw me-2"></i> Stoats
              </NavDropdown.Item>
              
              <NavDropdown.Divider />
              
              {/* Age-Based Filters - These DO exist in your database! */}
              <NavDropdown.Header>By Age</NavDropdown.Header>
              <NavDropdown.Item as={Link} to="/browse?age=puppy" onClick={closeNavbar}>
                <i className="fas fa-baby me-2"></i> Puppies
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/browse?age=kitten" onClick={closeNavbar}>
                <i className="fas fa-baby me-2"></i> Kittens
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/browse?age=young" onClick={closeNavbar}>
                <i className="fas fa-heart me-2"></i> Young Pets
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/browse?age=baby" onClick={closeNavbar}>
                <i className="fas fa-baby me-2"></i> Baby Animals
              </NavDropdown.Item>
              
              <NavDropdown.Divider />
              
              {/* Special Categories */}
              <NavDropdown.Header>Special Categories</NavDropdown.Header>
              <NavDropdown.Item as={Link} to="/browse?featured=true" onClick={closeNavbar}>
                <i className="fas fa-star me-2"></i> Featured Pets
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/browse?status=available" onClick={closeNavbar}>
                <i className="fas fa-check-circle me-2"></i> Available Now
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/browse?size=small" onClick={closeNavbar}>
                <i className="fas fa-paw me-2"></i> Small Size
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/browse?size=large" onClick={closeNavbar}>
                <i className="fas fa-paw me-2"></i> Large Size
              </NavDropdown.Item>
            </NavDropdown>

            <Nav.Link as={Link} to="/products" onClick={closeNavbar}>
              <i className="fas fa-shopping-bag me-1"></i> Products
            </Nav.Link>

            <Nav.Link as={Link} to="/news" onClick={closeNavbar}>
              <i className="fas fa-newspaper me-1"></i> News
            </Nav.Link>

            <Nav.Link as={Link} to="/about" onClick={closeNavbar}>
              <i className="fas fa-info-circle me-1"></i> About
            </Nav.Link>

            <Nav.Link as={Link} to="/contact" onClick={closeNavbar}>
              <i className="fas fa-envelope me-1"></i> Contact
            </Nav.Link>
          </Nav>

          <Nav>
            {user ? (
              <NavDropdown
                title={
                  <span>
                    <i className="fas fa-user-circle me-1"></i>{' '}
                    {user.name || user.email}
                  </span>
                }
                id="user-dropdown"
                align="end"
              >
                <NavDropdown.Item as={Link} to="/profile" onClick={closeNavbar}>
                  <i className="fas fa-user me-2"></i> My Profile
                </NavDropdown.Item>

                {user.role === 'admin' && (
                  <>
                    <NavDropdown.Divider />
                    <NavDropdown.Item as={Link} to="/admin" onClick={closeNavbar}>
                      <i className="fas fa-cog me-2"></i> Admin Dashboard
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/news" onClick={closeNavbar}>
                      <i className="fas fa-newspaper me-2"></i> Manage News
                    </NavDropdown.Item>
                  </>
                )}

                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt me-2"></i> Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <div className="d-flex gap-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  as={Link}
                  to="/login"
                  onClick={closeNavbar}
                >
                  <i className="fas fa-sign-in-alt me-1"></i> Login
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  as={Link}
                  to="/register"
                  onClick={closeNavbar}
                >
                  <i className="fas fa-user-plus me-1"></i> Register
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