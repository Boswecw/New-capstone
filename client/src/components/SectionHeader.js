// client/src/components/SectionHeader.js
import React from 'react';
import PropTypes from 'prop-types';

const SectionHeader = ({ 
  title, 
  subtitle, 
  className = "", 
  titleClass = "",
  subtitleClass = "",
  centered = true,
  showDivider = true,
  icon = null,
  ...props 
}) => {
  return (
    <div className={`section-header mb-4 ${className}`} {...props}>
      <div className={centered ? "text-center" : ""}>
        {title && (
          <h2 className={`section-title mb-2 ${titleClass}`}>
            {icon && <i className={`${icon} me-2`}></i>}
            {title}
          </h2>
        )}
        
        {subtitle && (
          <p className={`section-subtitle text-muted ${subtitleClass}`}>
            {subtitle}
          </p>
        )}
        
        {showDivider && (
          <hr className="section-divider w-25 mx-auto my-4" style={{height: '2px', backgroundColor: '#007bff'}} />
        )}
      </div>
    </div>
  );
};

SectionHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  className: PropTypes.string,
  titleClass: PropTypes.string,
  subtitleClass: PropTypes.string,
  centered: PropTypes.bool,
  showDivider: PropTypes.bool,
  icon: PropTypes.string,
};

export default SectionHeader;