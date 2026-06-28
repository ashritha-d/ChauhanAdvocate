import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminManagement from './pages/AdminManagement';
import AuditLogs from './pages/AuditLogs';

const PAGES = {
  dashboard:       Dashboard,
  adminmanagement: AdminManagement,
  auditlogs:       AuditLogs,
};

function SuperAdminApp() {
  const { admin, loading, accessDenied } = useAuth();
  const [page, setPage]       = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-border sa-spinner mb-3"></div>
          <div style={{ color: '#C9A84C', fontSize: '0.88rem' }}>Loading Super Admin Panel…</div>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#f87171' }}>
          <i className="fas fa-ban fa-3x mb-3 d-block"></i>
          <h4>Access Denied</h4>
          <p style={{ color: '#9ca3af' }}>This panel is restricted to Super Admins only.</p>
          <button className="btn sa-btn-primary mt-2" onClick={() => window.location.reload()}>Back to Login</button>
        </div>
      </div>
    );
  }

  if (!admin) return <Login />;

  const PageComponent = PAGES[page] || Dashboard;

  return (
    <div className="sa-layout">
      <Sidebar current={page} onChange={setPage} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="sa-main">
        <Header page={page} onMenuClick={() => setMobileOpen(true)} />
        <div className="sa-content">
          <PageComponent onNavigate={setPage} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return <AuthProvider><SuperAdminApp /></AuthProvider>;
}
