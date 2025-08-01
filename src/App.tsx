import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './components/LoginPage';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ClientDirectory } from './components/ClientDirectory';
import { VisitLogger } from './components/VisitLogger';
import { OrderForm } from './components/OrderForm';
import { TaskList } from './components/TaskList';
import { SyncQueue } from './components/SyncQueue';
import { SyncService } from './services/sync';

function App() {
  useEffect(() => {
    // Initialize sync service
    SyncService.initialize();

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/clients" element={
            <ProtectedRoute>
              <Layout>
                <ClientDirectory />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/visits" element={
            <ProtectedRoute>
              <Layout>
                <VisitLogger />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute>
              <Layout>
                <OrderForm />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/tasks" element={
            <ProtectedRoute>
              <Layout>
                <TaskList />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/sync" element={
            <ProtectedRoute>
              <Layout>
                <SyncQueue />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;