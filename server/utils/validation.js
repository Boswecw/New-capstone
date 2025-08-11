// server/utils/validation.js

const validateName = (name) => {
  const errors = [];
  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  if (!/^[A-Za-z\s]+$/.test(name)) {
    errors.push('Name can only contain letters and spaces');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateEmail = (email) => {
  const errors = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Invalid email address');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validatePassword = (password) => {
  const errors = [];
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Include at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Include at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Include at least one number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Include at least one special character (!@#$%^&*)');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateName,
  validateEmail,
  validatePassword
};

