import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './components/auth/AuthProvider';
import { ProtectedRoute, GuestRoute } from './components/auth/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { FullPageSpinner } from './components/ui/Spinner';
import { useTheme } from './hooks/useTheme';

// Lazy-loaded pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const WorkspacesPage = lazy(() => import('./pages/WorkspacesPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const BoardPage = lazy(() => import('./pages/BoardPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const TaskDetailPage = lazy(() => import('./pages/TaskDetailPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const MembersPage = lazy(() => import('./pages/MembersPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function ThemeInitializer({ children }: { children: React.ReactNode }) {
  useTheme(); // Initialize theme on mount
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeInitializer>
          <AuthProvider>
            <Suspense fallback={<FullPageSpinner />}>
              <Routes>
                {/* Guest routes */}
                <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
                <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

                {/* Protected routes — dashboard layout */}
                <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/workspaces" element={<WorkspacesPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/:projectId/board" element={<BoardPage />} />
                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/members" element={<MembersPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </ThemeInitializer>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
