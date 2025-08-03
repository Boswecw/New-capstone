// client/src/components/RegistrationTips.js
import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';

const RegistrationTips = () => {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <Button 
        variant="outline-info" 
        size="sm" 
        onClick={handleShow}
        className="mb-3"
      >
        <i className="fas fa-question-circle me-1"></i>
        Registration Help
      </Button>

      <Modal show={show} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-user-plus me-2 text-primary"></i>
            Registration Requirements & Tips
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-md-6">
              <h5 className="text-primary">
                <i className="fas fa-lock me-2"></i>
                Password Requirements
              </h5>
              <div className="alert alert-light">
                <ul className="mb-0">
                  <li><strong>Minimum 6 characters</strong> (longer is better)</li>
                  <li><strong>At least one lowercase letter</strong> (a-z)</li>
                  <li><strong>At least one uppercase letter</strong> (A-Z)</li>
                  <li><strong>At least one number</strong> (0-9)</li>
                </ul>
              </div>
              
              <h6 className="text-success mt-3">✅ Good Password Examples:</h6>
              <ul className="text-success small">
                <li><code>MyPet123</code></li>
                <li><code>FurBaby2024</code></li>
                <li><code>DogLover99</code></li>
                <li><code>CatMom2024</code></li>
              </ul>
              
              <h6 className="text-danger mt-3">❌ Avoid These:</h6>
              <ul className="text-danger small">
                <li><code>password</code> (too common)</li>
                <li><code>123456</code> (only numbers)</li>
                <li><code>abc123</code> (too short)</li>
                <li><code>ALLCAPS</code> (no lowercase)</li>
              </ul>
            </div>
            
            <div className="col-md-6">
              <h5 className="text-primary">
                <i className="fas fa-user me-2"></i>
                Name Requirements
              </h5>
              <div className="alert alert-light">
                <ul className="mb-0">
                  <li><strong>Letters and spaces only</strong></li>
                  <li><strong>2-50 characters long</strong></li>
                  <li><strong>No numbers or symbols</strong></li>
                </ul>
              </div>
              
              <h6 className="text-success mt-3">✅ Valid Names:</h6>
              <ul className="text-success small">
                <li>John Smith</li>
                <li>Mary Jane</li>
                <li>Ana Maria</li>
                <li>Jean-Pierre</li>
              </ul>
              
              <h6 className="text-danger mt-3">❌ Invalid Names:</h6>
              <ul className="text-danger small">
                <li>John123 (contains numbers)</li>
                <li>Mary@Jane (contains symbols)</li>
                <li>A (too short)</li>
              </ul>
              
              <h5 className="text-primary mt-4">
                <i className="fas fa-envelope me-2"></i>
                Email Requirements
              </h5>
              <div className="alert alert-light">
                <ul className="mb-0">
                  <li><strong>Valid email format</strong></li>
                  <li><strong>Must contain @ symbol</strong></li>
                  <li><strong>Must have domain extension</strong></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-primary bg-opacity-10 rounded">
            <h6 className="text-primary">
              <i className="fas fa-shield-alt me-2"></i>
              Security Tips
            </h6>
            <ul className="mb-0 small">
              <li>Use a unique password you don't use elsewhere</li>
              <li>Consider using a password manager</li>
              <li>Never share your login credentials</li>
              <li>Log out when using shared computers</li>
            </ul>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleClose}>
            <i className="fas fa-check me-1"></i>
            Got it!
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default RegistrationTips;