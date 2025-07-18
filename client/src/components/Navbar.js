// client/src/components/Navbar.js - FIXED VERSION with Active State Management
import React from 'react';
import {
  Navbar as BootstrapNavbar,
  Nav,
  NavDropdown,
  Container
} from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 🔧 FIXED: Function to check if current route is active
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // 🔧 FIXED: Function to get active nav link class
  const getNavLinkClass = (path) => {
    return isActive(path) ? 'active' : '';
  };

  // 🔧 FIXED: Function to get active nav link style
  const getNavLinkStyle = (path) => {
    return {
      color: isActive(path) ? '#0d6efd' : undefined,
      fontWeight: isActive(path) ? '600' : undefined
    };
  };

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
            {/* 🔧 FIXED: Home link with active state */}
            <Nav.Link 
              as={Link} 
              to="/"
              className={getNavLinkClass('/')}
              style={getNavLinkStyle('/')}
            >
              <i className="fas fa-home me-1"></i>Home
            </Nav.Link>

            {/* 🔧 FIXED: Shop by Pet Dropdown with active state */}
            <NavDropdown 
              title="Shop by Pet" 
              id="nav-dropdown-pets"
              className={isActive('/browse') ? 'active' : ''}
            >
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

            {/* 🔧 FIXED: Products link with active state */}
            <Nav.Link 
              as={Link} 
              to="/products"
              className={getNavLinkClass('/products')}
              style={getNavLinkStyle('/products')}
            >
              <i className="fas fa-shopping-bag me-1"></i>Products
            </Nav.Link>

            {/* 🔧 FIXED: News link with active state */}
            <Nav.Link 
              as={Link} 
              to="/news"
              className={getNavLinkClass('/news')}
              style={getNavLinkStyle('/news')}
            >
              <i className="fas fa-newspaper me-1"></i>News
            </Nav.Link>

            {/* 🔧 FIXED: About link with active state */}
            <Nav.Link 
              as={Link} 
              to="/about"
              className={getNavLinkClass('/about')}
              style={getNavLinkStyle('/about')}
            >
              <i className="fas fa-info-circle me-1"></i>About
            </Nav.Link>

            {/* 🔧 FIXED: Contact link with active state */}
            <Nav.Link 
              as={Link} 
              to="/contact"
              className={getNavLinkClass('/contact')}
              style={getNavLinkStyle('/contact')}
            >
              <i className="fas fa-envelope me-1"></i>Contact
            </Nav.Link>

            {user ? (
              <NavDropdown 
                title={
                  <span>
                    <i className="fas fa-user-circle me-1"></i>
                    {user.firstName || user.username || 'User'}
                  </span>
                } 
                id="nav-dropdown-user"
                className={isActive('/profile') || isActive('/admin') ? 'active' : ''}
              >
                <NavDropdown.Item as={Link} to="/profile">
                  <i className="fas fa-user me-2"></i>Profile
                </NavDropdown.Item>
                
                <NavDropdown.Item as={Link} to="/favorites">
                  <i className="fas fa-heart me-2"></i>Favorites
                </NavDropdown.Item>
                
                <NavDropdown.Item as={Link} to="/applications">
                  <i className="fas fa-file-alt me-2"></i>My Applications
                </NavDropdown.Item>
                
                {/* Admin links for admin users */}
                {user.role === 'admin' && (
                  <>
                    <NavDropdown.Divider />
                    <NavDropdown.Item as={Link} to="/admin">
                      <i className="fas fa-tachometer-alt me-2"></i>Admin Dashboard
                    </NavDropdown.Item>
                    
                    <NavDropdown.Item as={Link} to="/admin/pets">
                      <i className="fas fa-paw me-2"></i>Manage Pets
                    </NavDropdown.Item>
                    
                    <NavDropdown.Item as={Link} to="/admin/products">
                      <i className="fas fa-shopping-bag me-2"></i>Manage Products
                    </NavDropdown.Item>
                    
                    <NavDropdown.Item as={Link} to="/admin/users">
                      <i className="fas fa-users me-2"></i>Manage Users
                    </NavDropdown.Item>
                    
                    <NavDropdown.Item as={Link} to="/admin/contacts">
                      <i className="fas fa-envelope me-2"></i>Messages
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
              <Nav.Link 
                as={Link} 
                to="/login"
                className={getNavLinkClass('/login')}
                style={getNavLinkStyle('/login')}
              >
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