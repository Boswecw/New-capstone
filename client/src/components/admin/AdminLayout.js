import React from 'react';
import { Container, Row, Col, Nav, Navbar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
  return (
    <div className="admin-layout" style={{ marginTop: '76px' }}>
      {/* Admin Navigation */}
      <Navbar bg="dark" variant="dark" className="admin-nav">
        <Container fluid>
          <Navbar.Brand>
            <i className="fas fa-cog me-2"></i>Admin Dashboard
          </Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/admin">
              <i className="fas fa-chart-line me-1"></i>Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/admin/pets">
              <i className="fas fa-paw me-1"></i>Pets
            </Nav.Link>
            <Nav.Link as={Link} to="/admin/users">
              <i className="fas fa-users me-1"></i>Users
            </Nav.Link>
            <Nav.Link as={Link} to="/admin/contacts">
              <i className="fas fa-envelope me-1"></i>Contacts
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      {/* Admin Content */}
      <Container fluid className="py-4">
        <Outlet />
      </Container>
    </div>
  );
};

export default AdminLayout;