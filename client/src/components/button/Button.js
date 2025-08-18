// src/components/Button/Button.js
import React from 'react';
import styles from './Button.module.css';

const Button = ({ 
  variant = 'primary', 
  size = 'medium', 
  children, 
  disabled = false,
  onClick,
  ...props 
}) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    size === 'large' ? styles.large : '',
    disabled ? styles.disabled : ''
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={buttonClasses}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;