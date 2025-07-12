// client/src/pages/admin/AdminSettings.js - UPDATED TO USE PROPER API
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Alert, Button, Form, Toast, ToastContainer } from "react-bootstrap";
import { adminAPI } from "../../services/api";

const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        console.log('⚙️ Fetching admin settings...');
        const response = await adminAPI.getSettings();
        
        if (response.data.success) {
          setSettings(response.data.data);
          console.log('✅ Settings loaded:', response.data.data);
        } else {
          throw new Error(response.data.message || 'Failed to load settings');
        }
      } catch (err) {
        console.error("❌ Failed to load settings:", err);
        setError(err.response?.data?.message || err.message || "Unable to load settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      console.log('⚙️ Saving settings...', settings);
      const response = await adminAPI.updateSettings(settings);
      
      if (response.data.success) {
        setShowToast(true);
        console.log('✅ Settings saved successfully');
        setTimeout(() => setShowToast(false), 3000);
      } else {
        throw new Error(response.data.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error("❌ Failed to save settings:", err);
      setError(err.response?.data?.message || err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  // Loading state
  if (loading) {
    return (
      <Container fluid className="py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading settings...</p>
          </div>
        </div>
      </Container>
    );
  }

  // Error state
  if (!settings) {
    return (
      <Container fluid className="py-4">
        <Alert variant="danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          <strong>Error loading settings:</strong> {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">
            <i className="fas fa-cogs me-2 text-primary"></i>
            System Settings
          </h1>
          <p className="text-muted mb-0">
            Manage your application settings and preferences
          </p>
        </div>
      </div>

      {/* Settings Form */}
      <Row>
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">
                <i className="fas fa-sliders-h me-2"></i>
                Configuration Settings
              </h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSave}>
                {/* Site Information */}
                <div className="mb-4">
                  <h6 className="text-primary mb-3">
                    <i className="fas fa-info-circle me-2"></i>
                    Site Information
                  </h6>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Site Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={settings.siteName || ''}
                          onChange={(e) => handleInputChange("siteName", e.target.value)}
                          placeholder="Enter site name"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Max Upload Size</Form.Label>
                        <Form.Control
                          type="text"
                          value={settings.maxUploadSize || ''}
                          onChange={(e) => handleInputChange("maxUploadSize", e.target.value)}
                          placeholder="e.g., 5MB"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Site Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={settings.siteDescription || ''}
                      onChange={(e) => handleInputChange("siteDescription", e.target.value)}
                      placeholder="Enter site description"
                    />
                  </Form.Group>
                </div>

                {/* User Management */}
                <div className="mb-4">
                  <h6 className="text-primary mb-3">
                    <i className="fas fa-users me-2"></i>
                    User Management
                  </h6>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          id="allowRegistration"
                          label="Allow new user registration"
                          checked={settings.allowRegistration || false}
                          onChange={(e) => handleInputChange("allowRegistration", e.target.checked)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          id="requireEmailVerification"
                          label="Require email verification"
                          checked={settings.requireEmailVerification || false}
                          onChange={(e) => handleInputChange("requireEmailVerification", e.target.checked)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                {/* System Settings */}
                <div className="mb-4">
                  <h6 className="text-primary mb-3">
                    <i className="fas fa-cog me-2"></i>
                    System Settings
                  </h6>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          id="maintenanceMode"
                          label="Enable maintenance mode"
                          checked={settings.maintenanceMode || false}
                          onChange={(e) => handleInputChange("maintenanceMode", e.target.checked)}
                        />
                        <Form.Text className="text-muted">
                          When enabled, only admins can access the site
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          id="emailNotifications"
                          label="Enable email notifications"
                          checked={settings.emailNotifications || false}
                          onChange={(e) => handleInputChange("emailNotifications", e.target.checked)}
                        />
                        <Form.Text className="text-muted">
                          Send system emails for important events
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                {/* Error Display */}
                {error && (
                  <Alert variant="danger" className="mb-3">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {error}
                  </Alert>
                )}

                {/* Save Button */}
                <div className="d-flex justify-content-end pt-3 border-top">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={saving}
                    className="px-4"
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Settings Info Panel */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light">
              <h6 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Settings Information
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <strong>Last Updated:</strong>
                <br />
                <small className="text-muted">
                  {settings.updatedAt ? new Date(settings.updatedAt).toLocaleString() : 'Never'}
                </small>
              </div>
              
              <div className="mb-3">
                <strong>Current Status:</strong>
                <br />
                <span className={`badge ${settings.maintenanceMode ? 'bg-warning' : 'bg-success'}`}>
                  {settings.maintenanceMode ? 'Maintenance Mode' : 'Normal Operation'}
                </span>
              </div>

              <div className="alert alert-info">
                <small>
                  <i className="fas fa-lightbulb me-1"></i>
                  <strong>Tip:</strong> Changes take effect immediately after saving.
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Success Toast */}
      <ToastContainer position="bottom-end" className="p-3">
        <Toast 
          onClose={() => setShowToast(false)} 
          show={showToast} 
          delay={3000} 
          autohide
          bg="success"
        >
          <Toast.Header>
            <i className="fas fa-check-circle text-success me-2"></i>
            <strong className="me-auto">Success</strong>
            <small>Just now</small>
          </Toast.Header>
          <Toast.Body className="text-white">
            Settings saved successfully!
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
};

export default AdminSettings;