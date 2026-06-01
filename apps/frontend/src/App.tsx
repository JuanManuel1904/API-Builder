import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useMe } from '@/lib/api/hooks';
import { useAuthStore } from '@/store/auth.store';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { EditorPage } from '@/pages/EditorPage';

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
  );
}
