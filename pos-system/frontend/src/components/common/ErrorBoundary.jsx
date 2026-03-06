import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="text-center p-8">
            <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-red-500" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
              Something went wrong
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              We're sorry for the inconvenience. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 btn-primary"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 text-left">
                <details className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
                  <summary className="text-sm font-medium cursor-pointer">
                    Error Details
                  </summary>
                  <pre className="mt-4 text-xs overflow-auto">
                    {this.state.error && this.state.error.toString()}
                    <br />
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;