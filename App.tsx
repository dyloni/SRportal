import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { useSync } from './hooks/useSync';
import Login from './pages/Login';
import Layout from './components/layout/Layout';

// Agent Pages
import AgentDashboard from './pages/agent/AgentDashboard';
import AgentCustomers from './pages/agent/AgentCustomers';
import NewPolicyPage from './pages/agent/NewPolicyPage';
import PaymentPage from './pages/agent/PaymentPage';
import AgentRequests from './pages/agent/AgentRequests';
import AgentClaims from './pages/agent/AgentClaims';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAgents from './pages/admin/AdminAgents';
import AdminCustomers from './pages/admin/AdminCustomers';
import AgentProfilePage from './pages/admin/AgentProfilePage';
import AdminRequests from './pages/admin/AdminRequests';
import AdminSales from './pages/admin/AdminSales';
import AdminClaims from './pages/admin/AdminClaims';

// Shared Pages
import PolicyDetailsPage from './pages/PolicyDetailsPage';
import MessagesPage from './pages/MessagesPage';
import ProfilePage from './pages/ProfilePage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <Main />
      </DataProvider>
    </AuthProvider>
  );
};

const Main: React.FC = () => {
  const { user } = useAuth();
  const { dispatch } = useData();
  useSync(dispatch);

  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ video: true });
          console.log('Camera permission granted');
        }
      } catch (error) {
        console.warn('Camera permission denied or unavailable:', error);
      }
    };

    if (user) {
      requestCameraPermission();
    }
  }, [user]);

  if (!user) {
    return <Login />;
  }

  return (
    <HashRouter>
      <Layout>
        <Routes>
          {user.type === 'agent' && (
            <>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<AgentDashboard />} />
              <Route path="/customers" element={<AgentCustomers />} />
              <Route path="/customers/:id" element={<PolicyDetailsPage />} />
              <Route path="/new-policy" element={<NewPolicyPage />} />
              <Route path="/payment" element={<PaymentPage />} />
              <Route path="/requests" element={<AgentRequests />} />
              <Route path="/claims" element={<AgentClaims />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </>
          )}
          {user.type === 'admin' && (
            <>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<AdminDashboard />} />
              <Route path="/sales" element={<AdminSales />} />
              <Route path="/agents" element={<AdminAgents />} />
              <Route path="/agents/:id" element={<AgentProfilePage />} />
              <Route path="/customers" element={<AdminCustomers />} />
              <Route path="/customers/:id" element={<PolicyDetailsPage />} />
              <Route path="/requests" element={<AdminRequests />} />
              <Route path="/claims" element={<AdminClaims />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </>
          )}
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;