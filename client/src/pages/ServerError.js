// pages/ServerError.js
import React from 'react';
import { Link } from 'react-router-dom';

const ServerError = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
          <span className="text-3xl font-bold text-red-600">500</span>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Server Error
        </h1>
        
        <p className="text-gray-600 mb-8">
          We're experiencing some technical difficulties. 
          Please try again later or contact support if the problem persists.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          
          <Link
            to="/"
            className="block w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServerError;