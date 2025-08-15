// src/components/Button/Button.jsx
import React from 'react';
import PropTypes from 'prop-types';
import styles from './Button.module.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon = false,
  onClick,
  type = 'button',
  className = '',
  ariaLabel,
  ...props
}) => {
  // Build class names array
  const classNames = [
    styles.button,
    styles[variant],
    size !== 'medium' && styles[size],
    icon && styles.iconButton,
    loading && styles.loading,
    className
  ].filter(Boolean).join(' ');

  // Handle click events
  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    
    if (onClick) {
      onClick(e);
    }
  };

  // For icon buttons, ensure accessibility
  const accessibilityProps = {
    'aria-label': icon ? (ariaLabel || 'Button') : ariaLabel,
    'aria-disabled': disabled || loading,
    ...(loading && { 'aria-busy': true })
  };

  return (
    <button
      className={classNames}
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      {...accessibilityProps}
      {...props}
    >
      {children}
    </button>
  );
};

// PropTypes for development validation
Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  icon: PropTypes.bool,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
  ariaLabel: PropTypes.string
};

export default Button;