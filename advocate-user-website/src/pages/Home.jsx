import Hero from '../components/Hero';
import Services from '../components/Services';
import Testimonials from '../components/Testimonials';
import Appointment from '../components/Appointment';
import Blogs from '../components/Blogs';
import YouTubeSection from '../components/YouTubeSection';
import FacebookSection from '../components/FacebookSection';
import FAQs from '../components/FAQs';
import Contact from '../components/Contact';

export default function Home() {
  return (
    <>
      <Hero />
      <Services />
      <Testimonials />
      <Appointment />
      <Blogs />
      <YouTubeSection />
      <FacebookSection />
      <FAQs />
      <Contact />
    </>
  );
}
