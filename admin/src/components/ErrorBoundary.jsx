import React from 'react';
import { crashReporter } from '../lib/crashReporter.js';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Admin ErrorBoundary caught an error:', error, errorInfo);
    void crashReporter.reportReactError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>Something went wrong</h2>
          <p>The incident has been logged. Refresh the page to try again.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
