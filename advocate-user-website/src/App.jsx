import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SiteProvider } from './context/SiteContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import BackToTop from './components/BackToTop';
import Home from './pages/Home';
import PrivacyPolicy from './pages/PrivacyPolicy';

function AppLayout({ children }) {
  useEffect(() => {
    if (window.AOS) window.AOS.init({ duration: 800, once: true, offset: 60 });
  }, []);
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <WhatsAppButton />
      <BackToTop />
    </>
  );
}

export default function App() {
  return (
    <SiteProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </SiteProvider>
  );
}
