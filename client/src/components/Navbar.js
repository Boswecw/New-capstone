// client/src/components/Navbar.js - Using useContext and AuthProvider
import React, { useContext } from 'react';
import { Navbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth, AuthContext } from '../contexts/AuthContext';
import './Navbar.css';

const AppNavbar = () => {
  const [expanded, setExpanded] = React.useState(false);
  const { user, logout } = useAuth();
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setExpanded(false);
  };

  const closeNavbar = () => setExpanded(false);

  const handleNavbarFilter = (url, filterType, filterValue) => {
    console.log(`🔗 NAVBAR CLICK: Navigating to ${url} (${filterType}=${filterValue})`);
    console.log('Auth Context:', authContext);
    closeNavbar();
  };

  return (
    <AuthProvider>
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

              <NavDropdown title={<span><i className="fas fa-paw me-1"></i> Pets</span>} id="pets-dropdown">
                <NavDropdown.Item as={Link} to="/pets" onClick={closeNavbar}>
                  <i className="fas fa-list me-2"></i> All Pets
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/browse" onClick={closeNavbar}>
                  <i className="fas fa-search me-2"></i> Browse Pets
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item as={Link} to="/browse?type=dog" onClick={() => handleNavbarFilter('/browse?type=dog', 'type', 'dog')}>
                  <i className="fas fa-dog me-2"></i> Dogs
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/browse?type=cat" onClick={() => handleNavbarFilter('/browse?type=cat', 'type', 'cat')}>
                  <i className="fas fa-cat me-2"></i> Cats
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/browse?type=bird" onClick={() => handleNavbarFilter('/browse?type=bird', 'type', 'bird')}>
                  <i className="fas fa-dove me-2"></i> Birds
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/browse?type=fish" onClick={() => handleNavbarFilter('/browse?type=fish', 'type', 'fish')}>
                  <i className="fas fa-fish me-2"></i> Fish & Aquatic
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/browse?type=rabbit" onClick={() => handleNavbarFilter('/browse?type=rabbit', 'breed', 'rabbit')}>
                  <i className="fas fa-carrot me-2"></i> Rabbits
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/browse?type=hamster" onClick={() => handleNavbarFilter('/browse?type=hamster', 'breed', 'hamster')}>
                  <i className="fas fa-circle me-2"></i> Hamsters & Small Pets
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/browse?type=other" onClick={() => handleNavbarFilter('/browse?type=other', 'type', 'other')}>
                  <i className="fas fa-paw me-2"></i> Other Pets
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item as={Link} to="/browse?featured=true" onClick={() => handleNavbarFilter('/browse?featured=true', 'featured', 'true')}>
                  <i className="fas fa-star me-2"></i> Featured Pets
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/browse?age=young" onClick={() => handleNavbarFilter('/browse?age=young', 'age', 'young')}>
                  <i className="fas fa-heart me-2"></i> Young Pets
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/browse?age=puppy/kitten" onClick={() => handleNavbarFilter('/browse?age=puppy/kitten', 'age', 'puppy/kitten')}>
                  <i className="fas fa-baby me-2"></i> Puppies & Kittens
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/browse?size=small" onClick={() => handleNavbarFilter('/browse?size=small', 'size', 'small')}>
                  <i className="fas fa-paw me-2"></i> Small Size
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
                  title={<span><i className="fas fa-user-circle me-1"></i> {user.name || user.email}</span>}
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
                  <Button variant="outline-primary" size="sm" as={Link} to="/login" onClick={closeNavbar}>
                    <i className="fas fa-sign-in-alt me-1"></i> Login
                  </Button>
                  <Button variant="primary" size="sm" as={Link} to="/register" onClick={closeNavbar}>
                    <i className="fas fa-user-plus me-1"></i> Register
                  </Button>
                </div>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </AuthProvider>
  );
};

export default AppNavbar;