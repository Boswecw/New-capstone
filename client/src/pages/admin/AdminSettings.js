import React, { useState, useEffect } from "react";
import { Toast, ToastContainer } from "react-bootstrap";
import LoadingSpinner from "../../components/admin/LoadingSpinner";
import api from "../../services/api";

const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get("/admin/settings");
        setSettings(response.data);
      } catch (err) {
        console.error("Failed to load settings:", err);
        setError("Unable to load settings.");
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
      await api.put("/admin/settings", settings);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!settings) return <p className="text-center text-danger">Error loading settings.</p>;

  return (
    <>
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600">Manage your application settings and preferences</p>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-6">
            {/* Site Info */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Site Information</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => handleInputChange("siteName", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => handleInputChange("siteDescription", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* User Management */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowRegistration"
                  checked={settings.allowRegistration}
                  onChange={(e) => handleInputChange("allowRegistration", e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="allowRegistration" className="ml-2 text-sm text-gray-700">
                  Allow new user registration
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireEmailVerification"
                  checked={settings.requireEmailVerification}
                  onChange={(e) => handleInputChange("requireEmailVerification", e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="requireEmailVerification" className="ml-2 text-sm text-gray-700">
                  Require email verification
                </label>
              </div>
            </div>

            {/* System Settings */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">System Settings</h2>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleInputChange("maintenanceMode", e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="maintenanceMode" className="ml-2 text-sm text-gray-700">
                  Enable maintenance mode
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleInputChange("emailNotifications", e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="emailNotifications" className="ml-2 text-sm text-gray-700">
                  Enable email notifications
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              {error && <div className="text-red-600 text-sm font-medium">{error}</div>}
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? <LoadingSpinner size="sm" color="white" text="" /> : "Save Settings"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ✅ Toast Container */}
      <ToastContainer position="bottom-end" className="p-3">
        <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide bg="success">
          <Toast.Header>
            <strong className="me-auto">Success</strong>
            <small>Just now</small>
          </Toast.Header>
          <Toast.Body className="text-white">Settings saved successfully!</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default AdminSettings;
