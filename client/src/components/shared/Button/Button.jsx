import React from 'react';
import PropTypes from 'prop-types';
import styles from './Button.module.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    loading && styles.loading,
    fullWidth && styles.fullWidth,
    className
  ].filter(Boolean).join(' ');

  const renderIcon = () => {
    if (loading) {
      return <i className={`fas fa-spinner ${styles.spinner}`} />;
    }
    if (icon) {
      return <i className={`${icon} ${styles.icon}`} />;
    }
    return null;
  };

  return (
    <button 
      className={buttonClasses} 
      disabled={disabled || loading}
      {...props}
    >
      {iconPosition === 'left' && renderIcon()}
      {children && <span className={styles.text}>{children}</span>}
      {iconPosition === 'right' && renderIcon()}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark', 'outline-primary', 'outline-secondary']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  fullWidth: PropTypes.bool,
  icon: PropTypes.string,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  className: PropTypes.string,
};

export default Button;