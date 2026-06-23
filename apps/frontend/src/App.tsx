import React, { useEffect, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useMe } from '@/lib/api/hooks';
import { useAuthStore } from '@/store/auth.store';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { EditorPage } from '@/pages/EditorPage';

// ── Error Boundary ────────────────────────────────────────────
interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen bg-bg flex items-center justify-center">
          <div className="max-w-md text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-xl mx-auto">
              ✕
            </div>
            <h2 className="text-lg font-semibold text-text">Something went wrong</h2>
            <p className="text-sm text-text-muted font-mono break-all">{this.state.message}</p>
            <button
              className="btn btn-primary px-4 py-2"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.reload();
              }}
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

// ── Auth gate ─────────────────────────────────────────────────
function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = useAuthStore();
  const { data: me } = useMe();

  useEffect(() => {
    if (me) setUser(me);
  }, [me, setUser]);

  return <>{children}</>;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const hasToken = !!localStorage.getItem('accessToken');
  if (!isAuthenticated && !hasToken) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const hasToken = !!localStorage.getItem('accessToken');
  if (isAuthenticated || hasToken) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// ── Root ──────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route
              path="/login"
              element={
                <RedirectIfAuthed>
                  <LoginPage />
                </RedirectIfAuthed>
              }
            />

            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <DashboardPage />
                </RequireAuth>
              }
            />

            <Route
              path="/editor/:projectId"
              element={
                <RequireAuth>
                  <EditorPage />
                </RequireAuth>
              }
            />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
