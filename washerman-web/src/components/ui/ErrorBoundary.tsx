import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6 text-center">
          <div>
            <p className="text-4xl mb-4">⚠️</p>
            <h1 className="text-xl font-bold text-text-primary mb-2">Something went wrong</h1>
            <p className="text-text-secondary text-sm mb-6">{this.state.error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-gold text-bg-primary font-bold rounded-xl"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
