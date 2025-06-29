// components/LoadingSpinner.js
import React from 'react';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'blue', 
  text = 'Loading...', 
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    gray: 'text-gray-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600'
  };

  const spinnerElement = (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className="relative">
        <div
          className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}
        >
          <svg
            className="w-full h-full"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      </div>
      {text && (
        <div className={`text-sm font-medium ${colorClasses[color]}`}>
          {text}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80 backdrop-blur-sm">
        {spinnerElement}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      {spinnerElement}
    </div>
  );
};

// Alternative pulse loading animation
export const PulseLoader = ({ count = 3, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    gray: 'bg-gray-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600'
  };

  return (
    <div className="flex space-x-1">
      {[...Array(count)].map((_, index) => (
        <div
          key={index}
          className={`h-2 w-2 rounded-full ${colorClasses[color]} animate-pulse`}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );
};

// Skeleton loader for content
export const SkeletonLoader = ({ lines = 3, className = '' }) => {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {[...Array(lines)].map((_, index) => (
        <div
          key={index}
          className={`h-4 bg-gray-200 rounded ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
};

export default LoadingSpinner;