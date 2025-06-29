// pages/admin/AdminReports.js
import React, { useState } from "react";
import LoadingSpinner from "../../components/admin/LoadingSpinner";

const AdminReports = () => {
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState("");

  const reportTypes = [
    {
      id: "adoptions",
      name: "Adoption Report",
      description: "Detailed adoption statistics and trends",
    },
    {
      id: "users",
      name: "User Activity Report",
      description: "User registration and activity metrics",
    },
    {
      id: "pets",
      name: "Pet Inventory Report",
      description: "Available pets and status updates",
    },
    {
      id: "financial",
      name: "Financial Report",
      description: "Revenue and expense tracking",
    },
    {
      id: "contacts",
      name: "Contact Inquiries Report",
      description: "Contact form submissions and responses",
    },
  ];

  const handleGenerateReport = async (reportId) => {
    setLoading(true);
    setSelectedReport(reportId);

    try {
      // Simulate report generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate file download
      const blob = new Blob(["Sample report data..."], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportId}-report-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setLoading(false);
      setSelectedReport("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and download system reports</p>
        </div>

        <div className="p-6">
          <div className="grid gap-6">
            {reportTypes.map((report) => (
              <div
                key={report.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {report.name}
                    </h3>
                    <p className="text-gray-600 mt-1">{report.description}</p>
                  </div>

                  <button
                    onClick={() => handleGenerateReport(report.id)}
                    disabled={loading}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                  >
                    {loading && selectedReport === report.id ? (
                      <LoadingSpinner size="sm" color="white" text="" />
                    ) : (
                      "Generate"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Report History */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Reports
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-center text-gray-500 py-8">
                <p>No recent reports found.</p>
                <p className="text-sm mt-1">
                  Generated reports will appear here.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
