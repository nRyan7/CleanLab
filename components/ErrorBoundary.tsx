import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icons } from './Icon'; // Assuming Icons are available

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error caught by Error Boundary:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-6">
          <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-full max-w-md p-8 text-center space-y-6">
            <Icons.Error className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-3xl font-bold text-red-400">应用发生错误</h2>
            <p className="text-gray-300 text-lg">抱歉，应用遇到了一个意料之外的问题。</p>
            <p className="text-gray-400 text-sm font-mono break-all max-h-40 overflow-y-auto custom-scrollbar bg-gray-900 p-3 rounded-md">
              {this.state.error?.message || "未知错误"}
            </p>
            <p className="text-gray-500 text-xs">请尝试重新加载页面，如果问题持续存在，请联系支持。</p>
            <button
              onClick={this.handleReload}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors shadow-md"
            >
              重新加载应用
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
