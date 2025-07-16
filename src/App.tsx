import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import MenuManagement from './pages/superadmin/MenuManagement';
import UserManagement from './pages/superadmin/UserManagement';
import DynamicPricing from './pages/superadmin/DynamicPricing';
import PackageManagement from './pages/superadmin/PackageManagement';
import SystemSettings from './pages/superadmin/SystemSettings';
import AdminDashboard from './pages/admin/Dashboard';
import QuoteCreation from './pages/admin/QuoteCreation';
import AdminQuotes from './pages/admin/AdminQuotes';
import CustomerManagement from './pages/admin/CustomerManagement';
import OrderTracking from './pages/admin/OrderTracking';
import CustomerDashboard from './pages/customer/Dashboard';
import CustomerQuotes from './pages/customer/CustomerQuotes';
import Analytics from './pages/superadmin/Analytics';
import OrderTrackingSuper from './pages/superadmin/OrderTracking';
import LoadingSpinner from './components/ui/LoadingSpinner';
import './App.css';
import AuthPage from './pages/Auth';

// Dashboard router component to handle role-based routing
const DashboardRouter: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  // Route based on user role
  switch (currentUser.role) {
    case 'superadmin':
      return <SuperAdminDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'customer':
      return <CustomerDashboard />;
    default:
      return <Navigate to="/auth" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/dashboard" element={<DashboardRouter />} />
                      <Route 
                        path="/menu-management" 
                        element={
                          <ProtectedRoute allowedRoles={['superadmin']}>
                            <MenuManagement />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/create-quote" 
                        element={
                          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                            <QuoteCreation />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/manage-quotes" 
                        element={
                          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                            <AdminQuotes />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/customers" 
                        element={
                          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                            <CustomerManagement />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/orders" 
                        element={
                          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                            <OrderTrackingSuper />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/reports" 
                        element={
                          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                            <Analytics />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/users" 
                        element={
                          <ProtectedRoute allowedRoles={['superadmin']}>
                            <UserManagement />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/pricing" 
                        element={
                          <ProtectedRoute allowedRoles={['superadmin']}>
                            <DynamicPricing />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/packages" 
                        element={
                          <ProtectedRoute allowedRoles={['superadmin']}>
                            <PackageManagement />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/settings" 
                        element={
                          <ProtectedRoute allowedRoles={['superadmin']}>
                            <SystemSettings />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/my-quotes" 
                        element={
                          <ProtectedRoute allowedRoles={['customer']}>
                            <CustomerQuotes />
                          </ProtectedRoute>
                        } 
                      />
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } 
            />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--color-gray-800)',
                color: 'var(--color-text-inverse)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                padding: 'var(--spacing-md) var(--spacing-lg)',
                boxShadow: 'var(--shadow-lg)',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: 'var(--color-accent)',
                  secondary: 'var(--color-text-inverse)',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: 'var(--color-danger)',
                  secondary: 'var(--color-text-inverse)',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
