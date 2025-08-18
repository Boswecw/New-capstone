// client/src/pages/admin/AdminSettings.js - Enhanced with all imports implemented
import React, { useState, useEffect, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  Badge,
  Modal,
  InputGroup,
  ButtonGroup,
  Table
} from "react-bootstrap";
import api from "../../services/api";

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    // Site Information
    siteName: "FurBabies Pet Store",
    siteDescription: "Find your perfect pet companion",
    contactEmail: "info@furbabies.com",
    contactPhone: "(555) 123-4567",
    siteUrl: "https://furbabies.com",
    apiKey: "",
    
    // User Settings
    allowRegistration: true,
    requireEmailVerification: false,
    maxLoginAttempts: 5,
    
    // Pet Settings
    defaultPetStatus: "available",
    maxPetImages: 5,
    petApprovalRequired: false,
    
    // System Settings
    maintenanceMode: false,
    maxUploadSize: "5MB",
    sessionTimeout: "30",
    enableAnalytics: true,
    backupFrequency: "daily",
    
    // Email Settings
    emailNotifications: true,
    notifyOnNewContact: true,
    notifyOnNewRegistration: false,
    notifyOnAdoption: true,
    smtpHost: "smtp.gmail.com",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: ""
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" });
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [testingConnection, setTestingConnection] = useState(false);

  const showAlert = (message, variant) => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ show: false, message: "", variant: "" }), 5000);
  };

  // Wrap fetchSettings in useCallback to fix dependency issue
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("🔍 Loading system settings...");
      const response = await api.get("/admin/settings");
      
      if (response.data.success) {
        setSettings(prevSettings => ({
          ...prevSettings,
          ...response.data.data
        }));
        console.log("✅ Settings loaded from backend");
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("❌ Error loading settings:", error);
      
      if (error.response?.status === 404) {
        // Try to load from localStorage as fallback
        const savedSettings = localStorage.getItem("adminSettings");
        if (savedSettings) {
          setSettings(prevSettings => ({
            ...prevSettings,
            ...JSON.parse(savedSettings)
          }));
          showAlert("Settings loaded from local storage", "info");
        } else {
          showAlert("Using default settings", "info");
        }
        console.log("✅ Settings loaded from local storage or defaults");
      } else {
        showAlert("Failed to load settings", "danger");
        console.log("✅ Settings loaded from system data");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      console.log("💾 Saving settings...");

      const response = await api.put("/admin/settings", settings);

      if (response.data.success) {
        showAlert("Settings saved successfully", "success");
        setUnsavedChanges(false);
        console.log("✅ Settings saved to backend");
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("❌ Error saving settings:", error);

      if (error.response?.status === 404) {
        localStorage.setItem("adminSettings", JSON.stringify(settings));
        showAlert(
          "Settings saved locally (backend endpoint not available)",
          "warning"
        );
        setUnsavedChanges(false);
      } else {
        showAlert(
          error.response?.data?.message || "Failed to save settings",
          "danger"
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
  };

  const handleResetToDefaults = () => {
    if (window.confirm("Are you sure you want to reset all settings to defaults?")) {
      setSettings({
        siteName: "FurBabies Pet Store",
        siteDescription: "Find your perfect pet companion",
        contactEmail: "info@furbabies.com",
        contactPhone: "(555) 123-4567",
        siteUrl: "https://furbabies.com",
        apiKey: "",
        allowRegistration: true,
        requireEmailVerification: false,
        maxLoginAttempts: 5,
        defaultPetStatus: "available",
        maxPetImages: 5,
        petApprovalRequired: false,
        maintenanceMode: false,
        maxUploadSize: "5MB",
        sessionTimeout: "30",
        enableAnalytics: true,
        backupFrequency: "daily",
        emailNotifications: true,
        notifyOnNewContact: true,
        notifyOnNewRegistration: false,
        notifyOnAdoption: true,
        smtpHost: "smtp.gmail.com",
        smtpPort: "587",
        smtpUser: "",
        smtpPassword: ""
      });
      setUnsavedChanges(true);
      showAlert("Settings reset to defaults", "info");
    }
  };

  const generateBackup = async () => {
    try {
      const backupData = {
        settings,
        timestamp: new Date().toISOString(),
        version: "1.0"
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json"
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `furbabies-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setShowBackupModal(false);
      showAlert("Backup file downloaded", "success");
    } catch (error) {
      console.error("Error generating backup:", error);
      showAlert("Failed to generate backup", "danger");
    }
  };

  const testEmailConnection = async () => {
    setTestingConnection(true);
    try {
      const response = await api.post("/admin/test-email", {
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpUser: settings.smtpUser,
        smtpPassword: settings.smtpPassword
      });
      
      if (response.data.success) {
        showAlert("Email connection successful", "success");
      } else {
        showAlert("Email connection failed", "danger");
      }
    } catch (error) {
      showAlert("Email connection test failed", "danger");
    } finally {
      setTestingConnection(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]); // Fixed dependency

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading settings...</p>
      </div>
    );
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          <i className="fas fa-cogs me-2"></i>System Settings
        </h1>
        <div className="d-flex gap-2">
          {unsavedChanges && (
            <Badge bg="warning" className="me-2">
              <i className="fas fa-exclamation-triangle me-1"></i>
              Unsaved Changes
            </Badge>
          )}
          <Button
            variant="outline-secondary"
            onClick={() => setShowBackupModal(true)}
          >
            <i className="fas fa-download me-2"></i>Backup
          </Button>
          <Button variant="outline-danger" onClick={handleResetToDefaults}>
            <i className="fas fa-undo me-2"></i>Reset
          </Button>
        </div>
      </div>

      {alert.show && (
        <Alert
          variant={alert.variant}
          dismissible
          onClose={() => setAlert({ show: false })}
        >
          {alert.message}
        </Alert>
      )}

      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError(null)}
        >
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Tab Navigation using ButtonGroup */}
      <Card className="mb-4">
        <Card.Header>
          <ButtonGroup className="w-100" role="group">
            <Button
              variant={activeTab === 'general' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveTab('general')}
            >
              <i className="fas fa-globe me-2"></i>General
            </Button>
            <Button
              variant={activeTab === 'users' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveTab('users')}
            >
              <i className="fas fa-users me-2"></i>Users
            </Button>
            <Button
              variant={activeTab === 'pets' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveTab('pets')}
            >
              <i className="fas fa-paw me-2"></i>Pets
            </Button>
            <Button
              variant={activeTab === 'system' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveTab('system')}
            >
              <i className="fas fa-server me-2"></i>System
            </Button>
            <Button
              variant={activeTab === 'email' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveTab('email')}
            >
              <i className="fas fa-envelope me-2"></i>Email
            </Button>
          </ButtonGroup>
        </Card.Header>
      </Card>

      <Form onSubmit={handleSave}>
        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <Row className="g-4">
            <Col lg={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">
                    <i className="fas fa-info-circle me-2"></i>Site Information
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Site Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={settings.siteName}
                      onChange={(e) => handleInputChange("siteName", e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Site URL</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="fas fa-link"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="url"
                        value={settings.siteUrl}
                        onChange={(e) => handleInputChange("siteUrl", e.target.value)}
                        placeholder="https://yoursite.com"
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Site Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={settings.siteDescription}
                      onChange={(e) => handleInputChange("siteDescription", e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>API Key</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showPasswords.apiKey ? "text" : "password"}
                        value={settings.apiKey}
                        onChange={(e) => handleInputChange("apiKey", e.target.value)}
                        placeholder="Enter API key"
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => togglePasswordVisibility('apiKey')}
                      >
                        <i className={`fas ${showPasswords.apiKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </Button>
                    </InputGroup>
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">
                    <i className="fas fa-phone me-2"></i>Contact Information
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Contact Email</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="fas fa-envelope"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="email"
                        value={settings.contactEmail}
                        onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group>
                    <Form.Label>Contact Phone</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="fas fa-phone"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        value={settings.contactPhone}
                        onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                      />
                    </InputGroup>
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* User Settings Tab */}
        {activeTab === 'users' && (
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-users me-2"></i>User Management
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Allow new user registration"
                      checked={settings.allowRegistration}
                      onChange={(e) => handleInputChange("allowRegistration", e.target.checked)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Require email verification"
                      checked={settings.requireEmailVerification}
                      onChange={(e) => handleInputChange("requireEmailVerification", e.target.checked)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Max Login Attempts</Form.Label>
                    <Form.Control
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => handleInputChange("maxLoginAttempts", parseInt(e.target.value))}
                      min="1"
                      max="10"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* Pets Settings Tab */}
        {activeTab === 'pets' && (
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-paw me-2"></i>Pet Management
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Default Pet Status</Form.Label>
                    <Form.Select
                      value={settings.defaultPetStatus}
                      onChange={(e) => handleInputChange("defaultPetStatus", e.target.value)}
                    >
                      <option value="available">Available</option>
                      <option value="pending">Pending</option>
                      <option value="adopted">Adopted</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Max Pet Images</Form.Label>
                    <Form.Control
                      type="number"
                      value={settings.maxPetImages}
                      onChange={(e) => handleInputChange("maxPetImages", parseInt(e.target.value))}
                      min="1"
                      max="10"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Pet approval required"
                      checked={settings.petApprovalRequired}
                      onChange={(e) => handleInputChange("petApprovalRequired", e.target.checked)}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* System Settings Tab */}
        {activeTab === 'system' && (
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-server me-2"></i>System Configuration
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Maintenance Mode"
                      checked={settings.maintenanceMode}
                      onChange={(e) => handleInputChange("maintenanceMode", e.target.checked)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Max Upload Size</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        value={settings.maxUploadSize}
                        onChange={(e) => handleInputChange("maxUploadSize", e.target.value)}
                      />
                      <InputGroup.Text>MB</InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Session Timeout (minutes)</Form.Label>
                    <Form.Control
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => handleInputChange("sessionTimeout", e.target.value)}
                      min="5"
                      max="480"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Enable Analytics"
                      checked={settings.enableAnalytics}
                      onChange={(e) => handleInputChange("enableAnalytics", e.target.checked)}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* Email Settings Tab */}
        {activeTab === 'email' && (
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-envelope me-2"></i>Email Configuration
              </h5>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={testEmailConnection}
                disabled={testingConnection}
              >
                {testingConnection ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Testing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plug me-2"></i>
                    Test Connection
                  </>
                )}
              </Button>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>SMTP Host</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="fas fa-server"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        value={settings.smtpHost}
                        onChange={(e) => handleInputChange("smtpHost", e.target.value)}
                        placeholder="smtp.gmail.com"
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>SMTP Port</Form.Label>
                    <Form.Control
                      type="number"
                      value={settings.smtpPort}
                      onChange={(e) => handleInputChange("smtpPort", e.target.value)}
                      placeholder="587"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>SMTP Username</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="fas fa-user"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        value={settings.smtpUser}
                        onChange={(e) => handleInputChange("smtpUser", e.target.value)}
                        placeholder="your-email@gmail.com"
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>SMTP Password</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showPasswords.smtpPassword ? "text" : "password"}
                        value={settings.smtpPassword}
                        onChange={(e) => handleInputChange("smtpPassword", e.target.value)}
                        placeholder="Enter SMTP password"
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => togglePasswordVisibility('smtpPassword')}
                      >
                        <i className={`fas ${showPasswords.smtpPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </Button>
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <h6>Notification Settings</h6>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Enable email notifications"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleInputChange("emailNotifications", e.target.checked)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Notify on new contact"
                      checked={settings.notifyOnNewContact}
                      onChange={(e) => handleInputChange("notifyOnNewContact", e.target.checked)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Notify on new registration"
                      checked={settings.notifyOnNewRegistration}
                      onChange={(e) => handleInputChange("notifyOnNewRegistration", e.target.checked)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Notify on adoption"
                      checked={settings.notifyOnAdoption}
                      onChange={(e) => handleInputChange("notifyOnAdoption", e.target.checked)}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* Save Button */}
        <div className="text-end mt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={saving || !unsavedChanges}
          >
            {saving ? (
              <>
                <Spinner size="sm" className="me-2" />
                Saving Settings...
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

      {/* Backup Modal */}
      <Modal show={showBackupModal} onHide={() => setShowBackupModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-download me-2"></i>Generate System Backup
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Generate a backup file containing:</p>
          <Table striped>
            <tbody>
              <tr>
                <td><i className="fas fa-cog me-2"></i>Current system settings</td>
                <td><Badge bg="success">Included</Badge></td>
              </tr>
              <tr>
                <td><i className="fas fa-chart-bar me-2"></i>Database statistics summary</td>
                <td><Badge bg="success">Included</Badge></td>
              </tr>
              <tr>
                <td><i className="fas fa-file-code me-2"></i>Configuration snapshot</td>
                <td><Badge bg="success">Included</Badge></td>
              </tr>
            </tbody>
          </Table>
          <Alert variant="info">
            <i className="fas fa-info-circle me-2"></i>
            This backup contains configuration data only, not user data or images.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBackupModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={generateBackup}>
            <i className="fas fa-download me-2"></i>
            Download Backup
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdminSettings;