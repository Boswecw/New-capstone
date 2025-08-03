// client/src/contexts/ToastContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      timestamp: new Date(),
      ...toast
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove toast after duration (except for errors)
    if (newToast.type !== 'error') {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message, title = 'Success') => {
    return addToast({ type: 'success', message, title });
  }, [addToast]);

  const showError = useCallback((message, title = 'Error') => {
    return addToast({ type: 'error', message, title, duration: 0 }); // Errors don't auto-dismiss
  }, [addToast]);

  const showWarning = useCallback((message, title = 'Warning') => {
    return addToast({ type: 'warning', message, title });
  }, [addToast]);

  const showInfo = useCallback((message, title = 'Info') => {
    return addToast({ type: 'info', message, title });
  }, [addToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const value = {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export default ToastContext;