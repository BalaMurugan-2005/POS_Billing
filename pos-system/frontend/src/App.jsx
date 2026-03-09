import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import CashierDashboard from './pages/CashierDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import CustomerRegister from './pages/CustomerRegister';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  const { user } = useAuth();

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<CustomerRegister />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cashier/*"
              element={
                <ProtectedRoute allowedRoles={['cashier', 'admin']}>
                  <CashierDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/*"
              element={
                <ProtectedRoute allowedRoles={['customer', 'cashier', 'admin']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;