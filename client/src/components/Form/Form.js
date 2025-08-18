// src/components/Form/Form.js - COMPLETE VERSION with missing components
import React, { useState } from 'react';

const Form = ({ 
  children, 
  onSubmit, 
  validation = {}, 
  className = '', 
  ...otherProps 
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value, allData = formData) => {
    const rules = validation[name];
    if (!rules) return null;

    if (rules.required && (!value || value.toString().trim() === '')) {
      return typeof rules.required === 'string' ? rules.required : `${name} is required`;
    }

    if (!value || value.toString().trim() === '') return null;

    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.patternMessage || `${name} format is invalid`;
    }

    if (rules.minLength && value.toString().length < rules.minLength) {
      return `${name} must be at least ${rules.minLength} characters`;
    }

    if (rules.maxLength && value.toString().length > rules.maxLength) {
      return `${name} must be no more than ${rules.maxLength} characters`;
    }

    if (rules.custom && typeof rules.custom === 'function') {
      return rules.custom(value, allData);
    }

    return null;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    const newFormData = { ...formData, [name]: fieldValue };
    setFormData(newFormData);

    setTouched(prev => ({ ...prev, [name]: true }));

    const error = validateField(name, fieldValue, newFormData);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    let hasErrors = false;

    Object.keys(validation).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName], formData);
      if (error) {
        newErrors[fieldName] = error;
        hasErrors = true;
      }
    });

    const allTouched = {};
    Object.keys(validation).forEach(fieldName => {
      allTouched[fieldName] = true;
    });
    setTouched(allTouched);
    setErrors(newErrors);

    if (!hasErrors && onSubmit) {
      await onSubmit(formData);
    }
  };

  // More aggressive detection of form components
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      const componentName = child.type?.displayName || child.type?.name;
      const childProps = child.props || {};
      
      const isFormComponent = 
        ['FormField', 'CompleteField', 'Input', 'Checkbox', 'FormRow', 'FormCol', 'FormActions', 'Label', 'Textarea', 'Select'].includes(componentName) ||
        ('name' in childProps) ||
        ('id' in childProps && 'label' in childProps) ||
        (childProps.type === 'checkbox') ||
        Boolean(childProps.name);
      
      if (isFormComponent) {
        return React.cloneElement(child, {
          formData,
          errors,
          touched,
          handleChange,
          validation
        });
      }
    }
    return child;
  });

  // Don't pass form-specific props to the form DOM element
  const { formData: _, errors: __, touched: ___, handleChange: ____, validation: _____, ...cleanProps } = otherProps;

  return (
    <form 
      onSubmit={handleSubmit} 
      className={className}
      noValidate
      {...cleanProps}
    >
      {childrenWithProps}
    </form>
  );
};

export default Form;

// =============================================================================
// LAYOUT COMPONENTS
// =============================================================================

export const FormRow = ({ children, className = '' }) => (
  <div className={`row ${className}`}>{children}</div>
);

export const FormCol = ({ children, size = 'full', className = '' }) => {
  const getColClass = () => {
    switch (size) {
      case 'half': return 'col-md-6';
      case 'third': return 'col-md-4';
      case 'quarter': return 'col-md-3';
      case 'full':
      default: return 'col-12';
    }
  };
  return <div className={`${getColClass()} ${className}`}>{children}</div>;
};

export const FormField = ({ 
  children, 
  required = false, 
  className = '', 
  formData, 
  errors, 
  touched, 
  handleChange, 
  validation,
  ...props
}) => {
  const { formData: _, errors: __, touched: ___, handleChange: ____, validation: _____, ...cleanProps } = props;
  
  return (
    <div className={`mb-3 ${className}`} {...cleanProps}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            formData,
            errors,
            touched,
            handleChange,
            validation
          });
        }
        return child;
      })}
    </div>
  );
};

// =============================================================================
// INPUT COMPONENTS
// =============================================================================

export const Label = ({ htmlFor, children, required = false, className = '' }) => (
  <label htmlFor={htmlFor} className={`form-label ${className}`}>
    {children}{required && <span className="text-danger ms-1">*</span>}
  </label>
);

export const Input = ({ 
  name, 
  type = 'text', 
  className = '', 
  formData, 
  errors, 
  touched, 
  handleChange, 
  ...props
}) => {
  const hasError = touched?.[name] && errors?.[name];
  const value = formData?.[name] || '';

  const { formData: _, errors: __, touched: ___, validation: ____, ...cleanProps } = props;

  return (
    <>
      <input
        type={type}
        name={name}
        value={type === 'checkbox' ? undefined : value}
        checked={type === 'checkbox' ? value : undefined}
        onChange={handleChange}
        className={`form-control ${hasError ? 'is-invalid' : ''} ${className}`}
        {...cleanProps}
      />
      {hasError && <div className="invalid-feedback">{errors[name]}</div>}
    </>
  );
};

export const Textarea = ({ 
  name, 
  className = '', 
  formData, 
  errors, 
  touched, 
  handleChange, 
  rows = 3,
  ...props
}) => {
  const hasError = touched?.[name] && errors?.[name];
  const value = formData?.[name] || '';

  const { formData: _, errors: __, touched: ___, validation: ____, ...cleanProps } = props;

  return (
    <>
      <textarea
        name={name}
        value={value}
        onChange={handleChange}
        rows={rows}
        className={`form-control ${hasError ? 'is-invalid' : ''} ${className}`}
        {...cleanProps}
      />
      {hasError && <div className="invalid-feedback">{errors[name]}</div>}
    </>
  );
};

export const Select = ({ 
  name, 
  options = [], 
  className = '', 
  formData, 
  errors, 
  touched, 
  handleChange, 
  children,
  ...props
}) => {
  const hasError = touched?.[name] && errors?.[name];
  const value = formData?.[name] || '';

  const { formData: _, errors: __, touched: ___, validation: ____, ...cleanProps } = props;

  return (
    <>
      <select
        name={name}
        value={value}
        onChange={handleChange}
        className={`form-select ${hasError ? 'is-invalid' : ''} ${className}`}
        {...cleanProps}
      >
        {/* Render children (option elements) if provided */}
        {children}
        
        {/* Render options array if provided and no children */}
        {!children && options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hasError && <div className="invalid-feedback">{errors[name]}</div>}
    </>
  );
};

export const InputGroup = ({ children, className = '' }) => (
  <div className={`input-group ${className}`}>{children}</div>
);

export const Checkbox = ({ 
  id, name, label, className = '', formData, errors, touched, handleChange, ...props
}) => {
  const hasError = touched?.[name] && errors?.[name];
  const checked = Boolean(formData?.[name]);

  const { formData: _, errors: __, touched: ___, validation: ____, ...cleanProps } = props;

  const onChange = handleChange || (() => {
    console.warn(`No handleChange provided for checkbox: ${name}`);
  });

  return (
    <div className={`form-check ${className}`}>
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={onChange}
        className={`form-check-input ${hasError ? 'is-invalid' : ''}`}
        {...cleanProps}
      />
      <label htmlFor={id} className="form-check-label">{label}</label>
      {hasError && <div className="invalid-feedback">{errors[name]}</div>}
    </div>
  );
};

// =============================================================================
// COMPOSITE COMPONENTS
// =============================================================================

export const CompleteField = ({ 
  label, name, type = 'text', required = false, helpText, floating = false, inputProps = {}, className = '', 
  formData, errors, touched, handleChange, validation, ...props
}) => {
  const hasError = touched?.[name] && errors?.[name];
  const value = formData?.[name] || '';

  const { formData: _, errors: __, touched: ___, validation: ____, ...cleanProps } = props;

  if (floating) {
    return (
      <div className={`form-floating mb-3 ${className}`} {...cleanProps}>
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          className={`form-control ${hasError ? 'is-invalid' : ''}`}
          placeholder={label}
          {...inputProps}
        />
        <label htmlFor={name}>{label}{required && <span className="text-danger ms-1">*</span>}</label>
        {hasError && <div className="invalid-feedback">{errors[name]}</div>}
        {helpText && !hasError && <div className="form-text">{helpText}</div>}
      </div>
    );
  }

  return (
    <div className={`mb-3 ${className}`} {...cleanProps}>
      <Label htmlFor={name} required={required}>{label}</Label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        className={`form-control ${hasError ? 'is-invalid' : ''}`}
        {...inputProps}
      />
      {hasError && <div className="invalid-feedback">{errors[name]}</div>}
      {helpText && !hasError && <div className="form-text">{helpText}</div>}
    </div>
  );
};

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

export const FormActions = ({ children, alignment = 'left', className = '' }) => {
  const getAlignmentClass = () => {
    switch (alignment) {
      case 'center': return 'text-center';
      case 'right': return 'text-end';
      default: return 'text-start';
    }
  };

  return <div className={`${getAlignmentClass()} ${className}`}>{children}</div>;
};

export const HelpText = ({ children, size = 'normal', className = '' }) => {
  const sizeClass = size === 'small' ? 'small' : '';
  return <div className={`form-text ${sizeClass} ${className}`}>{children}</div>;
};

// =============================================================================
// ADD DISPLAY NAMES FOR BETTER COMPONENT DETECTION
// =============================================================================

FormRow.displayName = 'FormRow';
FormCol.displayName = 'FormCol';
FormField.displayName = 'FormField';
Label.displayName = 'Label';
Input.displayName = 'Input';
Textarea.displayName = 'Textarea';
Select.displayName = 'Select';
InputGroup.displayName = 'InputGroup';
Checkbox.displayName = 'Checkbox';
CompleteField.displayName = 'CompleteField';
FormActions.displayName = 'FormActions';
HelpText.displayName = 'HelpText';