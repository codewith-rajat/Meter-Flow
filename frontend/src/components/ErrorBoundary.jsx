import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);

    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Send error to monitoring service (optional)
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8">
            <div className="flex justify-center mb-6">
              <div className="bg-red-100 p-4 rounded-full">
                <AlertTriangle className="text-red-600" size={32} />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Oops! Something went wrong
            </h1>

            <p className="text-gray-600 text-center mb-6">
              We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="bg-red-50 border border-red-200 rounded p-4 mb-6 text-sm">
                <summary className="cursor-pointer font-semibold text-red-700 mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-red-600 overflow-auto max-h-40 text-xs">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Try Again
              </button>

              <a
                href="/"
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-2 px-4 rounded-lg transition duration-200 text-center"
              >
                Go Home
              </a>
            </div>

            {this.state.errorCount > 3 && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  Multiple errors detected. Try clearing your browser cache or contacting support@meterflow.com
                </p>
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
