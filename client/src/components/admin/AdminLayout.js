// client/src/components/admin/AdminLayout.js - UPDATED with Products Link
import React from 'react';
import { Container, Nav, Navbar } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
  const location = useLocation();
  
  // Debug logging
  console.log('🎯 AdminLayout is rendering!');
  console.log('🎯 Current location:', location.pathname);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="admin-layout" style={{ marginTop: '76px' }}>
      {console.log('🎯 About to render admin navbar')}
      
      {/* Admin Navigation */}
      <Navbar 
        bg="dark" 
        variant="dark" 
        className="admin-nav"
        style={{ 
          position: 'sticky',
          top: '76px',
          zIndex: 1020,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <Container fluid>
          <Navbar.Brand style={{ color: '#fff', fontWeight: 'bold' }}>
            <i className="fas fa-cog me-2"></i>Admin Dashboard
          </Navbar.Brand>
          
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/admin"
              className={isActive('/admin') ? 'active' : ''}
              style={{ color: isActive('/admin') ? '#ffc107' : '#fff' }}
            >
              <i className="fas fa-chart-line me-1"></i>Dashboard
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
            
            {/* ✅ NEW: Products Navigation Link */}
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
          
          {/* Admin indicator */}
          <Nav>
            <span style={{ color: '#28a745', fontSize: '12px', fontWeight: 'bold' }}>
              ✅ ADMIN MODE
            </span>
          </Nav>
        </Container>
      </Navbar>

      {/* Admin Content */}
      <Container fluid className="py-4" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 140px)' }}>
        {console.log('🎯 About to render admin content via Outlet')}
        <div style={{ 
          backgroundColor: '#fff', 
          borderRadius: '8px', 
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <Outlet />
        </div>
      </Container>
    </div>
  );
};

export default AdminLayout;