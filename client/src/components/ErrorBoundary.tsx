import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Something went wrong</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{this.state.error?.message ?? 'An unexpected error occurred.'}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => this.setState({ hasError: false, error: null })}>Try again</Button>
              <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>Go to dashboard</Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
