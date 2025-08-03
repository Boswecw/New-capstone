// client/src/pages/admin/AdminSettings.js - UPDATED with Real Backend
import React, { useState, useEffect } from "react";
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
} from "react-bootstrap";
import api from "../../services/api";

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    // Site Information
    siteName: "FurBabies Pet Store",
    siteDescription: "Find your perfect pet companion",
    contactEmail: "info@furbabies.com",
    contactPhone: "(555) 123-4567",

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

    // Email Settings
    emailNotifications: true,
    notifyOnNewContact: true,
    notifyOnNewRegistration: false,
    notifyOnAdoption: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" });
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const showAlert = (message, variant) => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ show: false, message: "", variant: "" }), 5000);
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      console.log("⚙️ Fetching system settings...");

      // Try to fetch from settings endpoint
      const response = await api.get("/admin/settings");

      if (response.data.success) {
        setSettings((prev) => ({ ...prev, ...response.data.data }));
        console.log("✅ Settings loaded from backend");
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("❌ Error fetching settings:", error);

      // If settings endpoint doesn't exist, try to load from other sources
      if (error.response?.status === 404) {
        console.log(
          "⚙️ Settings endpoint not found, using defaults with current system info..."
        );
        await loadSettingsFromSystem();
      } else {
        showAlert(
          error.response?.data?.message || "Failed to load settings",
          "warning"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSettingsFromSystem = async () => {
    try {
      // Get current system information to populate settings
      const dashboardResponse = await api.get("/admin/dashboard");

      if (dashboardResponse.data.success) {
        const stats = dashboardResponse.data.data.stats;

        // Update settings with current system state
        setSettings((prev) => ({
          ...prev,
          // Infer settings from current data
          allowRegistration: (stats.users?.totalUsers || 0) > 0,
          petApprovalRequired: false, // Default
          enableAnalytics: true, // Default
        }));

        console.log("✅ Settings loaded from system data");
      }
    } catch (error) {
      console.error("❌ Error loading system settings:", error);
      showAlert("Using default settings", "info");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      console.log("💾 Saving settings...");

      // Try to save to backend
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
        // Settings endpoint doesn't exist, save to localStorage as fallback
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
    if (
      window.confirm("Are you sure you want to reset all settings to defaults?")
    ) {
      setSettings({
        siteName: "FurBabies Pet Store",
        siteDescription: "Find your perfect pet companion",
        contactEmail: "info@furbabies.com",
        contactPhone: "(555) 123-4567",
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
        emailNotifications: true,
        notifyOnNewContact: true,
        notifyOnNewRegistration: false,
        notifyOnAdoption: true,
      });
      setUnsavedChanges(true);
      showAlert("Settings reset to defaults", "info");
    }
  };

  const generateBackup = async () => {
    try {
      // Generate backup of current system state
      const dashboardResponse = await api.get("/admin/dashboard");
      const usersResponse = await api.get("/admin/users?limit=10");
      const petsResponse = await api.get("/admin/pets?limit=10");

      const backupData = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        settings: settings,
        summary: {
          totalUsers: dashboardResponse.data.data.stats.users?.totalUsers || 0,
          totalPets: dashboardResponse.data.data.stats.pets?.totalPets || 0,
          totalContacts:
            dashboardResponse.data.data.stats.contacts?.totalContacts || 0,
        },
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `furbabies-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showAlert("System backup downloaded successfully", "success");
      setShowBackupModal(false);
    } catch (error) {
      console.error("Error generating backup:", error);
      showAlert("Failed to generate backup", "danger");
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

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

      <Form onSubmit={handleSave}>
        <Row className="g-4">
          {/* Site Information */}
          <Col lg={6}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  <i className="fas fa-globe me-2"></i>Site Information
                </h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Site Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={settings.siteName}
                    onChange={(e) =>
                      handleInputChange("siteName", e.target.value)
                    }
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Site Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={settings.siteDescription}
                    onChange={(e) =>
                      handleInputChange("siteDescription", e.target.value)
                    }
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Contact Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) =>
                      handleInputChange("contactEmail", e.target.value)
                    }
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label>Contact Phone</Form.Label>
                  <Form.Control
                    type="text"
                    value={settings.contactPhone}
                    onChange={(e) =>
                      handleInputChange("contactPhone", e.target.value)
                    }
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          {/* User Management */}
          <Col lg={6}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  <i className="fas fa-users me-2"></i>User Management
                </h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Allow new user registration"
                    checked={settings.allowRegistration}
                    onChange={(e) =>
                      handleInputChange("allowRegistration", e.target.checked)
                    }
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Require email verification for new accounts"
                    checked={settings.requireEmailVerification}
                    onChange={(e) =>
                      handleInputChange(
                        "requireEmailVerification",
                        e.target.checked
                      )
                    }
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Max Login Attempts</Form.Label>
                  <Form.Select
                    value={settings.maxLoginAttempts}
                    onChange={(e) =>
                      handleInputChange(
                        "maxLoginAttempts",
                        parseInt(e.target.value)
                      )
                    }
                  >
                    <option value={3}>3 attempts</option>
                    <option value={5}>5 attempts</option>
                    <option value={10}>10 attempts</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group>
                  <Form.Label>Session Timeout (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) =>
                      handleInputChange("sessionTimeout", e.target.value)
                    }
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          {/* Pet Management */}
          <Col lg={6}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  <i className="fas fa-paw me-2"></i>Pet Management
                </h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Default Pet Status</Form.Label>
                  <Form.Select
                    value={settings.defaultPetStatus}
                    onChange={(e) =>
                      handleInputChange("defaultPetStatus", e.target.value)
                    }
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
                    min="1"
                    max="10"
                    value={settings.maxPetImages}
                    onChange={(e) =>
                      handleInputChange(
                        "maxPetImages",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Check
                    type="checkbox"
                    label="Require approval for new pet listings"
                    checked={settings.petApprovalRequired}
                    onChange={(e) =>
                      handleInputChange("petApprovalRequired", e.target.checked)
                    }
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          {/* System Settings */}
          <Col lg={6}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  <i className="fas fa-server me-2"></i>System Settings
                </h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Maintenance Mode"
                    checked={settings.maintenanceMode}
                    onChange={(e) =>
                      handleInputChange("maintenanceMode", e.target.checked)
                    }
                  />
                  <Form.Text className="text-muted">
                    When enabled, only admins can access the site
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Max Upload Size</Form.Label>
                  <Form.Select
                    value={settings.maxUploadSize}
                    onChange={(e) =>
                      handleInputChange("maxUploadSize", e.target.value)
                    }
                  >
                    <option value="1MB">1 MB</option>
                    <option value="5MB">5 MB</option>
                    <option value="10MB">10 MB</option>
                    <option value="25MB">25 MB</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group>
                  <Form.Check
                    type="checkbox"
                    label="Enable Analytics Tracking"
                    checked={settings.enableAnalytics}
                    onChange={(e) =>
                      handleInputChange("enableAnalytics", e.target.checked)
                    }
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          {/* Email Notifications */}
          <Col lg={12}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  <i className="fas fa-envelope me-2"></i>Email Notifications
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Check
                        type="checkbox"
                        label="Enable Email Notifications"
                        checked={settings.emailNotifications}
                        onChange={(e) =>
                          handleInputChange(
                            "emailNotifications",
                            e.target.checked
                          )
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Check
                        type="checkbox"
                        label="Notify on New Contact"
                        checked={settings.notifyOnNewContact}
                        onChange={(e) =>
                          handleInputChange(
                            "notifyOnNewContact",
                            e.target.checked
                          )
                        }
                        disabled={!settings.emailNotifications}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Check
                        type="checkbox"
                        label="Notify on New Registration"
                        checked={settings.notifyOnNewRegistration}
                        onChange={(e) =>
                          handleInputChange(
                            "notifyOnNewRegistration",
                            e.target.checked
                          )
                        }
                        disabled={!settings.emailNotifications}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Check
                        type="checkbox"
                        label="Notify on Adoption"
                        checked={settings.notifyOnAdoption}
                        onChange={(e) =>
                          handleInputChange(
                            "notifyOnAdoption",
                            e.target.checked
                          )
                        }
                        disabled={!settings.emailNotifications}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Save Button */}
        <div className="d-flex justify-content-end mt-4">
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
          <ul>
            <li>Current system settings</li>
            <li>Database statistics summary</li>
            <li>Configuration snapshot</li>
          </ul>
          <Alert variant="info">
            <i className="fas fa-info-circle me-2"></i>
            This backup contains configuration data only, not user data or
            images.
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
