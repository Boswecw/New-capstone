// client/src/components/ToastContainer.js - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext'; // ✅ Get toasts from context
import styles from './Toast.module.css';

const ToastContainer = () => { // ✅ No props needed - gets data from context
  const { toasts, removeToast } = useToast(); // ✅ Get toasts and removeToast from context
  const [exitingToasts, setExitingToasts] = useState(new Set());

  const getToastIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📋';
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleClose = (toastId) => {
    // Add to exiting set to trigger exit animation
    setExitingToasts(prev => new Set(prev).add(toastId));
    
    // Remove after animation completes
    setTimeout(() => {
      removeToast(toastId);
      setExitingToasts(prev => {
        const newSet = new Set(prev);
        newSet.delete(toastId);
        return newSet;
      });
    }, 300); // Match animation duration
  };

  if (toasts.length === 0) return null;

  return (
    <div className={styles.toastContainer}>
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          isExiting={exitingToasts.has(toast.id)}
          onClose={() => handleClose(toast.id)}
          getToastIcon={getToastIcon}
          formatTime={formatTime}
        />
      ))}
    </div>
  );
};

// Separate Toast Item Component for better performance
const ToastItem = React.memo(({ 
  toast, 
  isExiting, 
  onClose, 
  getToastIcon, 
  formatTime 
}) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-dismiss timer with progress bar
  useEffect(() => {
    if (toast.type === 'error' || isPaused || isExiting || toast.duration === null) return;

    const duration = toast.duration || 5000;
    const interval = 50; // Update every 50ms
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - step;
        if (newProgress <= 0) {
          onClose();
          return 0;
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [toast, isPaused, isExiting, onClose]);

  const toastClasses = [
    styles.toast,
    styles[toast.type],
    isExiting ? styles.exiting : ''
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={toastClasses}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div className={styles.toastHeader}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <span className={styles.toastIcon} aria-hidden="true">
            {getToastIcon(toast.type)}
          </span>
          <h3 className={styles.toastTitle}>
            {toast.title}
          </h3>
          {toast.timestamp && (
            <span className={styles.toastTimestamp}>
              {formatTime(toast.timestamp)}
            </span>
          )}
        </div>
        <button
          className={styles.toastCloseButton}
          onClick={onClose}
          aria-label={`Close ${toast.title} notification`}
          type="button"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      
      <div className={styles.toastBody}>
        {toast.message}
      </div>

      {/* Progress bar for auto-dismiss (except for errors) */}
      {toast.type !== 'error' && !isExiting && toast.duration !== null && (
        <div 
          className={styles.toastProgress}
          style={{ 
            width: `${progress}%`,
            opacity: isPaused ? 0.5 : 1
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
});

ToastItem.displayName = 'ToastItem';

export default ToastContainer;