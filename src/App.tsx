import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<ClientDirectory />} />
          <Route path="/visits" element={<VisitLogger />} />
          <Route path="/orders" element={<OrderForm />} />
          <Route path="/tasks" element={<TaskList />} />
          <Route path="/sync" element={<SyncQueue />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;