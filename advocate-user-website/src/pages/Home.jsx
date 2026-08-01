import { lazy, Suspense, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import Hero from '../components/Hero';
import Services from '../components/Services';
import HomeSessionsAndCourses from '../components/HomeSessionsAndCourses';
import YouTubeSection from '../components/YouTubeSection';
import FacebookSection from '../components/FacebookSection';
// Contact is also statically imported by App.jsx (rendered on every page), so it's
// already in the main bundle regardless — lazy-loading it here would add an extra
// Suspense indirection with no actual byte savings.
import Contact from '../components/Contact';
import { useUserAuth } from '../context/UserAuthContext';

// Below-the-fold sections — split into separate chunks so the initial homepage
// load only parses/executes the JS for what's visible above the fold.
const Books = lazy(() => import('../components/Books'));
const Drafts = lazy(() => import('../components/Drafts'));
const Magazines = lazy(() => import('../components/Magazines'));
const JoinUs = lazy(() => import('../components/JoinUs'));
const Testimonials = lazy(() => import('../components/Testimonials'));
const Appointment = lazy(() => import('../components/Appointment'));
const Blogs = lazy(() => import('../components/Blogs'));
const FAQs = lazy(() => import('../components/FAQs'));

export default function Home() {
  const { user, loading: authLoading } = useUserAuth();
  const navigate = useNavigate();
  const { hash } = useLocation();

  useEffect(() => {
    // Allow logged-in users to reach homepage sections via hash links (e.g. goTo('magazines'))
    if (!authLoading && user && !hash) navigate('/profile', { replace: true });
  }, [user, authLoading, navigate, hash]);

  return (
    <>
      <SEOHead
        title="Expert Legal Services in Hyderabad"
        description="Advocate Chauhan – Balu Law Chamber, Hasthinapuram, LB Nagar. 15+ years expertise in criminal, civil, family, corporate, and property law. 500+ cases won. Book a consultation today."
        canonical="/"
      />
      <Hero />
      <Services />
      <HomeSessionsAndCourses />
      <YouTubeSection />
      <FacebookSection />
      <Suspense fallback={null}>
        <Books />
        <Drafts />
        <Magazines />
        <JoinUs />
        <Testimonials />
        <Appointment />
        <Blogs />
        <FAQs />
      </Suspense>
      <Contact />
    </>
  );
}
