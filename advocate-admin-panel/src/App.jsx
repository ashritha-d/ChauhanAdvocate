import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import Blogs from './pages/Blogs';
import Testimonials from './pages/Testimonials';
import FAQs from './pages/FAQs';
import Appointments from './pages/Appointments';
import Contacts from './pages/Contacts';
import SiteSettings from './pages/SiteSettings';
import HeroBanners from './pages/HeroBanners';
import Profile from './pages/Profile';
import YouTubeVideos from './pages/YouTubeVideos';
import FacebookContent from './pages/FacebookContent';
import Orders from './pages/Orders';
import JrAdvocates from './pages/JrAdvocates';
import BookOrders from './pages/BookOrders';
import Payments from './pages/Payments';
import Users from './pages/Users';
import Notifications from './pages/Notifications';
import News from './pages/News';
import Courses from './pages/Courses';
import Magazines from './pages/Magazines';
import Drafts from './pages/Drafts';
import Books from './pages/Books';
import AdminManagement from './pages/AdminManagement';
import AuditLogs from './pages/AuditLogs';

const PAGES = { dashboard: Dashboard, settings: SiteSettings, banners: HeroBanners, services: Services, blogs: Blogs, news: News, testimonials: Testimonials, faqs: FAQs, appointments: Appointments, contacts: Contacts, profile: Profile, youtube: YouTubeVideos, facebook: FacebookContent, orders: Orders, jradvocates: JrAdvocates, bookorders: BookOrders, payments: Payments, users: Users, notifications: Notifications, courses: Courses, magazines: Magazines, drafts: Drafts, books: Books, adminmanagement: AdminManagement, auditlogs: AuditLogs };

function AdminApp() {
  const { admin, loading } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) return <div className="d-flex align-items-center justify-content-center" style={{ minHeight:'100vh' }}><div className="spinner-border text-warning"></div></div>;
  if (!admin) return <Login />;

  const PageComponent = PAGES[page] || Dashboard;

  return (
    <div className="admin-layout">
      <Sidebar current={page} onChange={setPage} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="admin-main">
        <Header page={page} onMenuClick={() => setMobileOpen(true)} onNavigate={setPage} />
        <div className="admin-content">
          <PageComponent onNavigate={setPage} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AdminApp /></AuthProvider>;
}
