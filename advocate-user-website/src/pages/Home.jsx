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
import AppointmentModal from '../components/AppointmentModal';
import OrderModal from '../components/OrderModal';
import JrAdvocateModal from '../components/JrAdvocateModal';
import { useUserAuth } from '../context/UserAuthContext';
import { clearPendingAction } from '../utils/pendingAction';

export default function Home() {
  const { activeModal, modalData, closeModal } = useUserAuth();

  const handleModalSuccess = () => {
    clearPendingAction();
    closeModal();
  };

  const handleModalClose = () => {
    clearPendingAction();
    closeModal();
  };

  return (
    <>
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

      {/* Global modals — triggered by auth flow or direct button clicks */}
      {activeModal === 'appointment' && (
        <AppointmentModal onClose={handleModalClose} onSuccess={handleModalSuccess} />
      )}
      {activeModal === 'order' && (
        <OrderModal
          book={modalData || { title: 'Book', price: '' }}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
      {activeModal === 'jr_advocate' && (
        <JrAdvocateModal onClose={handleModalClose} onSuccess={handleModalSuccess} />
      )}
    </>
  );
}
