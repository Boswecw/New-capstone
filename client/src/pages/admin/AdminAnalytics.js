// pages/admin/AdminAnalytics.js
import React, { useState, useEffect } from "react";
import LoadingSpinner from "../../components/admin/LoadingSpinner";

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30days");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setAnalytics({
          totalVisits: 12543,
          uniqueVisitors: 8932,
          adoptionInquiries: 156,
          successfulAdoptions: 23,
          topPages: [
            { page: "/dogs", visits: 3421 },
            { page: "/cats", visits: 2876 },
            { page: "/browse", visits: 1987 },
            { page: "/aquatics", visits: 1234 },
          ],
          demographics: {
            ageGroups: [
              { range: "18-24", percentage: 15 },
              { range: "25-34", percentage: 35 },
              { range: "35-44", percentage: 25 },
              { range: "45-54", percentage: 15 },
              { range: "55+", percentage: 10 },
            ],
          },
        });
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Analytics Dashboard
        </h1>

        {/* Time Range Selector */}
        <div className="flex flex-wrap gap-2">
          {["7days", "30days", "90days", "1year"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                timeRange === range
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {range === "7days"
                ? "Last 7 days"
                : range === "30days"
                ? "Last 30 days"
                : range === "90days"
                ? "Last 90 days"
                : "Last year"}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Total Visits
          </h3>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {analytics.totalVisits.toLocaleString()}
          </p>
          <p className="text-sm text-green-600">+12% from last period</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Unique Visitors
          </h3>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {analytics.uniqueVisitors.toLocaleString()}
          </p>
          <p className="text-sm text-green-600">+8% from last period</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Adoption Inquiries
          </h3>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {analytics.adoptionInquiries}
          </p>
          <p className="text-sm text-blue-600">+5% from last period</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Successful Adoptions
          </h3>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {analytics.successfulAdoptions}
          </p>
          <p className="text-sm text-green-600">+15% from last period</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Pages */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Top Pages
          </h2>
          <div className="space-y-4">
            {analytics.topPages.map((page, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2"
              >
                <span className="text-gray-700 font-medium">{page.page}</span>
                <span className="font-semibold text-gray-900 text-lg">
                  {page.visits.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Age Demographics */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Age Demographics
          </h2>
          <div className="space-y-4">
            {analytics.demographics.ageGroups.map((group, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2"
              >
                <span className="text-gray-700 font-medium">{group.range}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-20 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${group.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-10 text-right">
                    {group.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
