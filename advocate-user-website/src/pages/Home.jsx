import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import Hero from '../components/Hero';
import Services from '../components/Services';
import LatestUpdates from '../components/LatestUpdates';
import YouTubeSection from '../components/YouTubeSection';
import FacebookSection from '../components/FacebookSection';
import Books from '../components/Books';
import Drafts from '../components/Drafts';
import Magazines from '../components/Magazines';
import JoinUs from '../components/JoinUs';
import Testimonials from '../components/Testimonials';
import Appointment from '../components/Appointment';
import Blogs from '../components/Blogs';
import FAQs from '../components/FAQs';
import Contact from '../components/Contact';
import { useUserAuth } from '../context/UserAuthContext';

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
      <LatestUpdates />
      <YouTubeSection />
      <FacebookSection />
      <Books />
      <Drafts />
      <Magazines />
      <JoinUs />
      <Testimonials />
      <Appointment />
      <Blogs />
      <FAQs />
      <Contact />
    </>
  );
}
