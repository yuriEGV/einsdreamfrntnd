import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import ClientDashboard from './pages/ClientDashboard';
import NightMonitor from './pages/NightMonitor';
import NightTimeline from './pages/NightTimeline';
import AudioSessionsList from './pages/AudioSessionsList';
import DiagnosticsPage from './pages/DiagnosticsPage';
import SettingsPage from './pages/SettingsPage';
import UsersList from './pages/UsersList';
import LoginLogsList from './pages/LoginLogsList';
import Login from './pages/Login';
import './index.css';

// Simple Auth Wrapper
const ProtectedRoute = ({ children, requireAdmin }) => {
  const token = localStorage.getItem('adminToken');
  const userString = localStorage.getItem('adminUser');
  const user = userString ? JSON.parse(userString) : null;

  if (!token) return <Navigate to="/login" replace />;
  if (requireAdmin && user?.role !== 'admin') return <Navigate to="/" replace />;

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Header />
        {children}
      </main>
    </div>
  );
};

const HomeRouter = () => {
  const userString = localStorage.getItem('adminUser');
  const user = userString ? JSON.parse(userString) : null;

  if (user?.role === 'admin') {
    return <Dashboard />;
  } else {
    return <ClientDashboard />;
  }
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Core Einsdream 2.0 User & Admin Routes */}
        <Route path="/" element={<ProtectedRoute><HomeRouter /></ProtectedRoute>} />
        <Route path="/monitor" element={<ProtectedRoute><NightMonitor /></ProtectedRoute>} />
        <Route path="/timeline" element={<ProtectedRoute><NightTimeline /></ProtectedRoute>} />
        <Route path="/recordings" element={<ProtectedRoute><AudioSessionsList /></ProtectedRoute>} />
        <Route path="/sessions" element={<ProtectedRoute><AudioSessionsList /></ProtectedRoute>} />
        <Route path="/diagnostics" element={<ProtectedRoute><DiagnosticsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

        {/* Admin Specific Routes */}
        <Route path="/users" element={<ProtectedRoute requireAdmin><UsersList /></ProtectedRoute>} />
        <Route path="/logs" element={<ProtectedRoute requireAdmin><LoginLogsList /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
