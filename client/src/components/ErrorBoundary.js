// components/ErrorBoundary.js
import React from 'react';
import { Container, Alert, Button } from 'react-bootstrap';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log the error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container className="py-5 text-center">
          <div className="max-w-md mx-auto">
            <Alert variant="danger" className="p-4">
              <Alert.Heading>
                <i className="fas fa-exclamation-triangle me-2"></i>
                Something went wrong
              </Alert.Heading>
              
              <p className="mb-3">
                We're sorry, but something unexpected happened. 
                Please try refreshing the page or contact support if the problem persists.
              </p>
              
              <div className="d-flex gap-2 justify-content-center">
                <Button 
                  variant="outline-danger" 
                  onClick={this.handleReset}
                  size="sm"
                >
                  <i className="fas fa-redo me-1"></i>
                  Try Again
                </Button>
                
                <Button 
                  variant="danger" 
                  onClick={this.handleRefresh}
                  size="sm"
                >
                  <i className="fas fa-sync me-1"></i>
                  Refresh Page
                </Button>
              </div>
              
              {/* Development Error Details */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4 text-start">
                  <summary className="cursor-pointer text-muted">
                    <small>Error Details (Development Only)</small>
                  </summary>
                  
                  <div className="mt-3 p-3 bg-light rounded">
                    {/* Safe error display */}
                    {this.state.error && (
                      <div className="mb-2">
                        <strong className="text-danger">Error:</strong>
                        <pre className="small text-muted mt-1 mb-0">
                          {this.state.error.toString()}
                        </pre>
                      </div>
                    )}
                    
                    {/* Safe component stack display */}
                    {this.state.errorInfo && this.state.errorInfo.componentStack && (
                      <div>
                        <strong className="text-danger">Component Stack:</strong>
                        <pre className="small text-muted mt-1 mb-0" style={{ 
                          maxHeight: '200px', 
                          overflow: 'auto',
                          fontSize: '11px'
                        }}>
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                    
                    {/* Fallback if no detailed error info */}
                    {(!this.state.error && !this.state.errorInfo) && (
                      <small className="text-muted">
                        No detailed error information available.
                      </small>
                    )}
                  </div>
                </details>
              )}
            </Alert>
          </div>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;