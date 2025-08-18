// client/src/components/admin/AdminLayout.js - Updated with Complete Navigation
import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';

const AdminLayout = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path)) return true;
    return false;
  };

  console.log('🎯 AdminLayout rendering with location:', location.pathname);

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Admin Navigation Bar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
        <Container fluid>
          <Navbar.Brand as={Link} to="/admin" className="fw-bold">
            <i className="fas fa-paw me-2" style={{ color: '#ffc107' }}></i>
            Admin Dashboard
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="admin-navbar-nav" />
          <Navbar.Collapse id="admin-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link 
                as={Link} 
                to="/admin"
                className={isActive('/admin') && location.pathname === '/admin' ? 'active' : ''}
                style={{ color: isActive('/admin') && location.pathname === '/admin' ? '#ffc107' : '#fff' }}
              >
                <i className="fas fa-tachometer-alt me-1"></i>Dashboard
              </Nav.Link>
              
              <Nav.Link 
                as={Link} 
                to="/admin/users"
                className={isActive('/admin/users') ? 'active' : ''}
                style={{ color: isActive('/admin/users') ? '#ffc107' : '#fff' }}
              >
                <i className="fas fa-users me-1"></i>Users
              </Nav.Link>
              
              <Nav.Link 
                as={Link} 
                to="/admin/pets"
                className={isActive('/admin/pets') ? 'active' : ''}
                style={{ color: isActive('/admin/pets') ? '#ffc107' : '#fff' }}
              >
                <i className="fas fa-paw me-1"></i>Pets
              </Nav.Link>
              
              <Nav.Link 
                as={Link} 
                to="/admin/products"
                className={isActive('/admin/products') ? 'active' : ''}
                style={{ color: isActive('/admin/products') ? '#ffc107' : '#fff' }}
              >
                <i className="fas fa-shopping-bag me-1"></i>Products
              </Nav.Link>
              
              <Nav.Link 
                as={Link} 
                to="/admin/contacts"
                className={isActive('/admin/contacts') ? 'active' : ''}
                style={{ color: isActive('/admin/contacts') ? '#ffc107' : '#fff' }}
              >
                <i className="fas fa-envelope me-1"></i>Contacts
              </Nav.Link>
              
              <Nav.Link 
                as={Link} 
                to="/admin/analytics"
                className={isActive('/admin/analytics') ? 'active' : ''}
                style={{ color: isActive('/admin/analytics') ? '#ffc107' : '#fff' }}
              >
                <i className="fas fa-chart-bar me-1"></i>Analytics
              </Nav.Link>
              
              <Nav.Link 
                as={Link} 
                to="/admin/reports"
                className={isActive('/admin/reports') ? 'active' : ''}
                style={{ color: isActive('/admin/reports') ? '#ffc107' : '#fff' }}
              >
                <i className="fas fa-file-alt me-1"></i>Reports
              </Nav.Link>
              
              <Nav.Link 
                as={Link} 
                to="/admin/settings"
                className={isActive('/admin/settings') ? 'active' : ''}
                style={{ color: isActive('/admin/settings') ? '#ffc107' : '#fff' }}
              >
                <i className="fas fa-cogs me-1"></i>Settings
              </Nav.Link>
            </Nav>
            
            {/* Admin indicator and quick actions */}
            <Nav>
              <Nav.Link as={Link} to="/" style={{ color: '#28a745', fontSize: '14px' }}>
                <i className="fas fa-home me-1"></i>Back to Site
              </Nav.Link>
              <span style={{ 
                color: '#28a745', 
                fontSize: '12px', 
                fontWeight: 'bold',
                padding: '8px 16px',
                alignSelf: 'center'
              }}>
                ✅ ADMIN MODE
              </span>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Admin Content Area */}
      <Container fluid className="py-4">
        {console.log('🎯 About to render admin content via Outlet')}
        <div style={{ 
          backgroundColor: '#fff', 
          borderRadius: '8px', 
          padding: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          minHeight: 'calc(100vh - 140px)'
        }}>
          <Outlet />
        </div>
      </Container>
    </div>
  );
};

export default AdminLayout;