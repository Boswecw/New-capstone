// client/src/pages/NotFound.js
import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <Container className="py-5" style={{ marginTop: '80px' }}>
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body className="p-5">
              <div className="mb-4">
                <i className="fas fa-search fa-5x text-muted mb-3"></i>
                <h1 className="display-4 text-primary">404</h1>
                <h2 className="h4 text-muted mb-4">Page Not Found</h2>
                <p className="text-muted mb-4">
                  Oops! The page you're looking for doesn't exist. 
                  It might have been moved, deleted, or you entered the wrong URL.
                </p>
              </div>
              
              <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                <Button 
                  as={Link} 
                  to="/" 
                  variant="primary" 
                  size="lg"
                  className="me-md-2"
                >
                  <i className="fas fa-home me-2"></i>
                  Go Home
                </Button>
                <Button 
                  as={Link} 
                  to="/browse" 
                  variant="outline-primary" 
                  size="lg"
                >
                  <i className="fas fa-paw me-2"></i>
                  Browse Pets
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFound;