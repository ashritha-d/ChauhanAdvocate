import Hero from '../components/Hero';
import About from '../components/About';
import Services from '../components/Services';
import Profile from '../components/Profile';
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
      <About />
      <Services />
      <Profile />
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
