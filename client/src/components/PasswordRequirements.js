// client/src/components/PasswordRequirements.js
import React from 'react';
import './PasswordRequirements.css';

const PasswordRequirements = ({ password = '', className = '' }) => {
  // Individual requirement checks
  const requirements = [
    {
      text: 'At least 6 characters long',
      met: password.length >= 6
    },
    {
      text: 'Contains at least one lowercase letter (a-z)',
      met: /(?=.*[a-z])/.test(password)
    },
    {
      text: 'Contains at least one uppercase letter (A-Z)', 
      met: /(?=.*[A-Z])/.test(password)
    },
    {
      text: 'Contains at least one number (0-9)',
      met: /(?=.*\d)/.test(password)
    }
  ];

  return (
    <div className={`password-requirements ${className}`}>
      <div className="mb-2">
        <strong className="text-muted">Password Requirements:</strong>
      </div>
      
      <div className="requirements-list">
        {requirements.map((req, index) => (
          <div 
            key={index}
            className={`requirement-item d-flex align-items-center mb-1 small ${
              password ? (req.met ? 'text-success' : 'text-danger') : 'text-muted'
            }`}
          >
            <i 
              className={`fas ${
                password 
                  ? (req.met ? 'fa-check-circle text-success' : 'fa-times-circle text-danger')
                  : 'fa-circle text-muted'
              } me-2`}
              style={{ fontSize: '0.8rem' }}
            ></i>
            <span>{req.text}</span>
          </div>
        ))}
      </div>
      
      {password && (
        <div className="mt-2">
          <div className="password-strength-bar">
            <div className="progress" style={{ height: '4px' }}>
              <div 
                className={`progress-bar ${getStrengthColor(requirements)}`}
                role="progressbar"
                style={{ width: `${getStrengthPercentage(requirements)}%` }}
                aria-valuenow={getStrengthPercentage(requirements)}
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
            <small className={`text-${getStrengthColor(requirements)} mt-1 d-block`}>
              {getStrengthText(requirements)}
            </small>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions for strength indicator
const getStrengthPercentage = (requirements) => {
  const metCount = requirements.filter(req => req.met).length;
  return (metCount / requirements.length) * 100;
};

const getStrengthColor = (requirements) => {
  const metCount = requirements.filter(req => req.met).length;
  if (metCount === 0) return 'secondary';
  if (metCount === 1) return 'danger';
  if (metCount === 2) return 'warning';
  if (metCount === 3) return 'info';
  return 'success';
};

const getStrengthText = (requirements) => {
  const metCount = requirements.filter(req => req.met).length;
  if (metCount === 0) return 'Enter a password';
  if (metCount === 1) return 'Very Weak';
  if (metCount === 2) return 'Weak';
  if (metCount === 3) return 'Good';
  return 'Strong';
};

export default PasswordRequirements;