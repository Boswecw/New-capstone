// pages/admin/AdminSettings.js
import React, { useState } from "react";
import LoadingSpinner from "../../components/admin/LoadingSpinner";

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    siteName: "Pet Adoption Center",
    siteDescription: "Find your perfect pet companion",
    emailNotifications: true,
    maintenanceMode: false,
    maxUploadSize: "5MB",
    allowRegistration: true,
    requireEmailVerification: true,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">
            Manage your application settings and preferences
          </p>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Site Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Site Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Name
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => handleInputChange("siteName", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Description
              </label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) =>
                  handleInputChange("siteDescription", e.target.value)
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* User Management */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              User Management
            </h2>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowRegistration"
                checked={settings.allowRegistration}
                onChange={(e) =>
                  handleInputChange("allowRegistration", e.target.checked)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="allowRegistration"
                className="ml-2 text-sm text-gray-700"
              >
                Allow new user registration
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="requireEmailVerification"
                checked={settings.requireEmailVerification}
                onChange={(e) =>
                  handleInputChange(
                    "requireEmailVerification",
                    e.target.checked
                  )
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="requireEmailVerification"
                className="ml-2 text-sm text-gray-700"
              >
                Require email verification for new accounts
              </label>
            </div>
          </div>

          {/* System Settings */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              System Settings
            </h2>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onChange={(e) =>
                  handleInputChange("maintenanceMode", e.target.checked)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="maintenanceMode"
                className="ml-2 text-sm text-gray-700"
              >
                Enable maintenance mode
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={settings.emailNotifications}
                onChange={(e) =>
                  handleInputChange("emailNotifications", e.target.checked)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="emailNotifications"
                className="ml-2 text-sm text-gray-700"
              >
                Enable email notifications
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            {saved && (
              <div className="text-green-600 text-sm font-medium">
                Settings saved successfully!
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <LoadingSpinner size="sm" color="white" text="" />
              ) : (
                "Save Settings"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
