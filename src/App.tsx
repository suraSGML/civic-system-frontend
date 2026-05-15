import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Public pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Protected pages
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import ReportDetailPage from './pages/ReportDetailPage';
import CreateReportPage from './pages/CreateReportPage';
import MapPage from './pages/MapPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminAssignmentsPage from './pages/admin/AdminAssignmentsPage';
import WorkerDashboard from './pages/worker/WorkerDashboard';

// Layout
import MainLayout from './components/layout/MainLayout';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <>{children}</>;
  };

  const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user?.role !== 'authority' && user?.role !== 'super_admin') {
      return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="reports/new" element={<CreateReportPage />} />
        <Route path="reports/:id" element={<ReportDetailPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="worker" element={<WorkerDashboard />} />

        {/* Admin routes */}
        <Route
          path="admin"
          element={<AdminRoute><AdminDashboard /></AdminRoute>}
        />
        <Route
          path="admin/users"
          element={<AdminRoute><AdminUsersPage /></AdminRoute>}
        />
        <Route
          path="admin/assignments"
          element={<AdminRoute><AdminAssignmentsPage /></AdminRoute>}
        />
      </Route>
    </Routes>
  );
}

export default App;
