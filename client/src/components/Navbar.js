// client/src/components/Navbar.js - COMPLETE UPDATED VERSION with Products Link
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

            {/* 🐾 Shop by Pet Dropdown */}
            <NavDropdown title="Shop by Pet" id="nav-dropdown-pets">
              <NavDropdown.Item as={Link} to="/browse?type=dog">
                <i className="fas fa-dog me-2"></i>Dogs
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/browse?type=cat">
                <i className="fas fa-cat me-2"></i>Cats
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/browse?type=fish">
                <i className="fas fa-fish me-2"></i>Aquatics
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/browse?type=small-pet">
                <i className="fas fa-star me-2"></i>Small Pets
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/browse?type=bird">
                <i className="fas fa-dove me-2"></i>Birds
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item as={Link} to="/browse">
                <i className="fas fa-th me-2"></i>Browse All
              </NavDropdown.Item>
            </NavDropdown>

            <Nav.Link as={Link} to="/about">
              <i className="fas fa-info-circle me-1"></i>About
            </Nav.Link>

            <Nav.Link as={Link} to="/contact">
              <i className="fas fa-envelope me-1"></i>Contact
            </Nav.Link>

            {user ? (
              <NavDropdown 
                title={
                  <span>
                    <i className="fas fa-user me-1"></i>
                    {user.name || user.email || 'Account'}
                    {user.role === 'admin' && (
                      <span className="badge bg-danger ms-1" style={{ fontSize: '10px' }}>ADMIN</span>
                    )}
                  </span>
                } 
                id="nav-dropdown-account"
              >
                <NavDropdown.Item as={Link} to="/profile">
                  <i className="fas fa-user me-2"></i>Profile
                </NavDropdown.Item>
                
                {/* Admin Section - Only show for admin users */}
                {user.role === 'admin' && (
                  <>
                    <NavDropdown.Divider />
                    <NavDropdown.Header>
                      <i className="fas fa-cog me-2"></i>Admin Panel
                    </NavDropdown.Header>
                    
                    <NavDropdown.Item as={Link} to="/admin">
                      <i className="fas fa-chart-line me-2"></i>Dashboard
                    </NavDropdown.Item>
                    
                    <NavDropdown.Item as={Link} to="/admin/users">
                      <i className="fas fa-users me-2"></i>User Management
                    </NavDropdown.Item>
                    
                    <NavDropdown.Item as={Link} to="/admin/pets">
                      <i className="fas fa-paw me-2"></i>Pet Management
                    </NavDropdown.Item>
                    
                    {/* ✅ NEW: Products Management Link */}
                    <NavDropdown.Item as={Link} to="/admin/products">
                      <i className="fas fa-shopping-bag me-2"></i>Product Management
                    </NavDropdown.Item>
                    
                    <NavDropdown.Item as={Link} to="/admin/contacts">
                      <i className="fas fa-envelope me-2"></i>Contact Management
                    </NavDropdown.Item>
                    
                    <NavDropdown.Item as={Link} to="/admin/analytics">
                      <i className="fas fa-chart-bar me-2"></i>Analytics
                    </NavDropdown.Item>
                    
                    <NavDropdown.Item as={Link} to="/admin/reports">
                      <i className="fas fa-file-alt me-2"></i>Reports
                    </NavDropdown.Item>
                    
                    <NavDropdown.Item as={Link} to="/admin/settings">
                      <i className="fas fa-cogs me-2"></i>Settings
                    </NavDropdown.Item>
                  </>
                )}
                
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt me-2"></i>Logout
                </NavDropdown.Item>
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