import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
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
import Payment from './pages/Payment';
import NewsTicker from './components/NewsTicker';
import Contact from './components/Contact';

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
      <div className="nav-spacer" />
      <NewsTicker />
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Attorney',
      '@id': 'https://ashritha-d.github.io/ChauhanAdvocate/#attorney',
      name: 'Advocate Chauhan',
      alternateName: 'Balu Law Chamber',
      description:
        'Expert legal representation in criminal, civil, family, corporate, property, and constitutional law. Serving Hyderabad since 2009.',
      url: 'https://ashritha-d.github.io/ChauhanAdvocate/',
      telephone: '+91-93925-38226',
      image: 'https://ashritha-d.github.io/ChauhanAdvocate/advocate.jpeg',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Balu Law Chamber, Hasthinapuram',
        addressLocality: 'LB Nagar',
        addressRegion: 'Telangana',
        addressCountry: 'IN',
        postalCode: '500079',
      },
      areaServed: [
        { '@type': 'City', name: 'Hyderabad' },
        { '@type': 'State', name: 'Telangana' },
      ],
      knowsAbout: [
        'Criminal Law',
        'Civil Law',
        'Family Law',
        'Corporate Law',
        'Property Law',
        'Constitutional Law',
        'Intellectual Property Law',
      ],
      foundingDate: '2009',
      numberOfEmployees: { '@type': 'QuantitativeValue', value: 5 },
      sameAs: [
        'https://www.youtube.com/@vakeelchauhan2024',
        'https://www.facebook.com/advocatechauhan',
        'https://www.instagram.com/advocatechauhan',
      ],
    },
    {
      '@type': 'LocalBusiness',
      '@id': 'https://ashritha-d.github.io/ChauhanAdvocate/#localbusiness',
      name: 'Balu Law Chamber',
      url: 'https://ashritha-d.github.io/ChauhanAdvocate/',
      telephone: '+91-93925-38226',
      priceRange: '₹₹',
      image: 'https://ashritha-d.github.io/ChauhanAdvocate/advocate.jpeg',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Hasthinapuram',
        addressLocality: 'LB Nagar, Hyderabad',
        addressRegion: 'Telangana',
        addressCountry: 'IN',
        postalCode: '500079',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 17.3387,
        longitude: 78.5579,
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          opens: '09:00',
          closes: '19:00',
        },
      ],
    },
  ],
};

export default function App() {
  return (
    <HelmetProvider>
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
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
            <Route path="/payment" element={
              <AppLayout hideFooterExtras>
                <Payment />
              </AppLayout>
            } />
            <Route path="/contact" element={
              <AppLayout>
                <Contact />
              </AppLayout>
            } />

            {/* Tab shortcut redirects */}
            <Route path="/appointments"  element={<Navigate to="/profile?tab=appointments"  replace />} />
            <Route path="/magazines"     element={<Navigate to="/profile?tab=magazines"     replace />} />
            <Route path="/drafts"        element={<Navigate to="/profile?tab=drafts"        replace />} />
            <Route path="/notifications" element={<Navigate to="/profile?tab=notifications" replace />} />
            <Route path="/settings"      element={<Navigate to="/profile?tab=settings"      replace />} />
          </Routes>
        </BrowserRouter>
      </UserAuthProvider>
    </SiteProvider>
    </HelmetProvider>
  );
}
