import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { SiteProvider } from './context/SiteContext';
import { UserAuthProvider } from './context/UserAuthContext';
import TopBar from './components/TopBar';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PhoneButton from './components/PhoneButton';
import WhatsAppButton from './components/WhatsAppButton';
import BackToTop from './components/BackToTop';
import Home from './pages/Home';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import Gallery from './pages/Gallery';
import Courses from './pages/Courses';
import NewsPage from './pages/News';

function ScrollToHash() {
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);
  return null;
}

function AppLayout({ children, hideFooterExtras }) {
  useEffect(() => {
    if (window.AOS) window.AOS.init({ duration: 800, once: true, offset: 60 });
  }, []);
  return (
    <>
      <TopBar />
      <Navbar />
      <main>{children}</main>
      {!hideFooterExtras && (
        <>
          <PhoneButton />
          <WhatsAppButton />
          <BackToTop />
        </>
      )}
      <Footer />
    </>
  );
}

function AuthLayout({ children }) {
  return (
    <>
      <TopBar />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <SiteProvider>
      <UserAuthProvider>
        <BrowserRouter basename="/ChauhanAdvocate">
          <ScrollToHash />
          <Routes>
            <Route path="/" element={
              <AppLayout>
                <Home />
              </AppLayout>
            } />
            <Route path="/privacy-policy" element={
              <AppLayout>
                <PrivacyPolicy />
              </AppLayout>
            } />
            <Route path="/login" element={
              <AuthLayout>
                <Login />
              </AuthLayout>
            } />
            <Route path="/register" element={
              <AuthLayout>
                <Register />
              </AuthLayout>
            } />
            <Route path="/forgot-password" element={
              <AuthLayout>
                <ForgotPassword />
              </AuthLayout>
            } />
            <Route path="/profile" element={
              <AuthLayout>
                <Profile />
              </AuthLayout>
            } />
            <Route path="/gallery" element={
              <AppLayout>
                <Gallery />
              </AppLayout>
            } />
            <Route path="/courses" element={
              <AppLayout>
                <Courses />
              </AppLayout>
            } />
            <Route path="/news" element={
              <AppLayout>
                <NewsPage />
              </AppLayout>
            } />
          </Routes>
        </BrowserRouter>
      </UserAuthProvider>
    </SiteProvider>
  );
}
