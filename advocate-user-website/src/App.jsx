import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
import Profile from './pages/Profile';
import Gallery from './pages/Gallery';
import Courses from './pages/Courses';
import CourseDetails from './pages/CourseDetails';
import CourseCategoryListing from './pages/CourseCategoryListing';
import MagazinesPage from './pages/Magazines';
import DraftsPage from './pages/Drafts';
import BooksPage from './pages/Books';
import NewsPage from './pages/News';
import LivePage from './pages/Live';
import Payment from './pages/Payment';
import BookPayment from './pages/BookPayment';
import InternshipPayment from './pages/InternshipPayment';
import NewsTicker from './components/NewsTicker';
import Contact from './components/Contact';
import BookPromoPopup from './components/BookPromoPopup';
import AppointmentModal from './components/AppointmentModal';
import OrderModal from './components/OrderModal';
import JrAdvocateModal from './components/JrAdvocateModal';
import { clearPendingAction } from './utils/pendingAction';
import { useUserAuth } from './context/UserAuthContext';

// Footer is only ever shown on the Home page — every other page (public or
// authenticated) hides it. Centralized here so no page has to opt out individually.
function ConditionalFooter() {
  const location = useLocation();
  return location.pathname === '/' ? <Footer /> : null;
}

// The news ticker is a logged-out-only affordance — it disappears the moment a
// user logs in (reactive via context, no refresh needed) and stays hidden across
// every authenticated page, restoring automatically on logout.
function ConditionalNewsTicker() {
  const { user } = useUserAuth();
  return user ? null : <NewsTicker />;
}

// An admin-issued temporary password sets user.mustChangePassword — this
// redirects the user straight to the password-change form on every page until
// they set their own password, rather than just hoping they notice a banner.
function ForcePasswordChangeGuard() {
  const { user } = useUserAuth();
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (user?.mustChangePassword && location.pathname !== '/profile') {
      navigate('/profile?tab=settings&forceChangePassword=1', { replace: true });
    }
  }, [user?.mustChangePassword, location.pathname, navigate]);
  return null;
}

function GlobalModals() {
  const { activeModal, modalData, closeModal } = useUserAuth();
  const handleClose = () => { clearPendingAction(); closeModal(); };
  if (activeModal === 'appointment') return <AppointmentModal onClose={handleClose} onSuccess={handleClose} />;
  if (activeModal === 'order') return <OrderModal book={modalData || { title: 'Book', price: '' }} onClose={handleClose} onSuccess={handleClose} />;
  if (activeModal === 'jr_advocate') return <JrAdvocateModal onClose={handleClose} onSuccess={handleClose} />;
  return null;
}

function ScrollToHash() {
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      // Retry briefly — the target section may be a React.lazy chunk still loading in
      let attempts = 0;
      const tryScroll = () => {
        const el = document.querySelector(location.hash);
        if (el) { el.scrollIntoView({ behavior: 'smooth' }); return; }
        if (attempts++ < 20) setTimeout(tryScroll, 100);
      };
      tryScroll();
    } else {
      window.scrollTo(0, 0);
    }
    // Re-init AOS on every route change so data-aos elements on new pages animate
    const t = setTimeout(() => window.AOS?.init({ duration: 800, once: true, offset: 60 }), 80);
    return () => clearTimeout(t);
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
      <ConditionalNewsTicker />
      <main>{children}</main>
      <GlobalModals />
      <BookPromoPopup />
      {!hideFooterExtras && (
        <>
          <PhoneButton />
          <WhatsAppButton />
          <BackToTop />
        </>
      )}
      <ConditionalFooter />
    </>
  );
}

function AuthLayout({ children }) {
  return (
    <>
      <TopBar />
      <Navbar />
      <main>{children}</main>
      <GlobalModals />
      <ConditionalFooter />
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
      image: 'https://ashritha-d.github.io/ChauhanAdvocate/adv-photo.jpeg',
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
      image: 'https://ashritha-d.github.io/ChauhanAdvocate/adv-photo.jpeg',
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
          <ForcePasswordChangeGuard />
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
            <Route path="/courses/category/:programType" element={
              <AppLayout>
                <CourseCategoryListing />
              </AppLayout>
            } />
            <Route path="/courses/:id" element={
              <AppLayout>
                <CourseDetails />
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
            <Route path="/book-payment" element={
              <AppLayout hideFooterExtras>
                <BookPayment />
              </AppLayout>
            } />
            <Route path="/internship-payment" element={
              <AppLayout hideFooterExtras>
                <InternshipPayment />
              </AppLayout>
            } />
            <Route path="/contact" element={
              <AppLayout>
                <Contact />
              </AppLayout>
            } />

            {/* Standalone content pages */}
            <Route path="/magazines" element={<AppLayout><MagazinesPage /></AppLayout>} />
            <Route path="/drafts"    element={<AppLayout><DraftsPage /></AppLayout>} />
            <Route path="/books"     element={<AppLayout><BooksPage /></AppLayout>} />
            <Route path="/live"      element={<AppLayout><LivePage /></AppLayout>} />

            {/* Tab shortcut redirects */}
            <Route path="/appointments"  element={<Navigate to="/profile?tab=appointments"  replace />} />
            <Route path="/notifications" element={<Navigate to="/profile?tab=notifications" replace />} />
            <Route path="/settings"      element={<Navigate to="/profile?tab=settings"      replace />} />
          </Routes>
        </BrowserRouter>
      </UserAuthProvider>
    </SiteProvider>
    </HelmetProvider>
  );
}
