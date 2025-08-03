// client/src/hooks/useColdStartHandler.js
import { useState, useEffect, useCallback } from 'react';
import { testConnection, wakeUpServer } from '../services/api';

export const useColdStartHandler = () => {
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [serverStatus, setServerStatus] = useState('unknown'); // 'unknown', 'awake', 'sleeping', 'error'
  const [error, setError] = useState(null);

  const checkServerStatus = useCallback(async () => {
    try {
      const result = await testConnection();
      if (result.success) {
        setServerStatus('awake');
        setError(null);
        return true;
      } else {
        setServerStatus('sleeping');
        setError(result.error);
        return false;
      }
    } catch (err) {
      setServerStatus('error');
      setError(err);
      return false;
    }
  }, []);

  const wakeUpServerIfNeeded = useCallback(async () => {
    if (serverStatus === 'awake') return true;
    
    setIsWakingUp(true);
    setError(null);
    
    try {
      const isAwake = await wakeUpServer();
      if (isAwake) {
        setServerStatus('awake');
        return true;
      } else {
        setServerStatus('sleeping');
        return false;
      }
    } catch (err) {
      setServerStatus('error');
      setError(err);
      return false;
    } finally {
      setIsWakingUp(false);
    }
  }, [serverStatus]);

  useEffect(() => {
    checkServerStatus();
  }, [checkServerStatus]);

  return {
    isWakingUp,
    serverStatus,
    error,
    wakeUpServerIfNeeded,
    checkServerStatus
  };
};

// Component to show cold start loading state
import React from 'react';
import { Spinner, Alert, Button } from 'react-bootstrap';

export const ColdStartLoader = ({ 
  isWakingUp, 
  serverStatus, 
  error, 
  onRetry,
  children 
}) => {
  if (serverStatus === 'awake') {
    return children;
  }

  if (isWakingUp) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" className="mb-3" />
        <h4>Waking up the server...</h4>
        <p className="text-muted">
          This may take up to 30 seconds if the server was sleeping.
        </p>
      </div>
    );
  }

  if (serverStatus === 'sleeping' || serverStatus === 'error') {
    return (
      <div className="text-center py-5">
        <Alert variant="warning">
          <Alert.Heading>Server is Starting Up</Alert.Heading>
          <p>
            The server appears to be in sleep mode. This is normal for applications
            deployed on Render's free tier.
          </p>
          {error && (
            <small className="text-muted d-block mt-2">
              Error: {error.message}
            </small>
          )}
          <Button 
            variant="primary" 
            onClick={onRetry}
            className="mt-3"
          >
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="text-center py-5">
      <Spinner animation="border" variant="primary" className="mb-3" />
      <h4>Checking server status...</h4>
    </div>
  );
};