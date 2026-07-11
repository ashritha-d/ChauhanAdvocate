import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SliderSection from './SliderSection';
import { useSite } from '../context/SiteContext';
import { useUserAuth } from '../context/UserAuthContext';
import JrAdvocateModal from './JrAdvocateModal';
import { savePendingAction } from '../utils/pendingAction';

const BASE = import.meta.env.BASE_URL;

export default function JoinUs() {
  const { settings: s } = useSite();
  const { user } = useUserAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const waNumber = (s.contact_whatsapp || s.contact_phone || '919392538226').replace(/\D/g, '');

  const handleApplyClick = () => {
    if (user) {
      setShowModal(true);
    } else {
      savePendingAction('jr_advocate');
      navigate('/login');
    }
  };

  const handleInternshipClick = () => {
    if (!user) {
      navigate('/login', { state: { from: '/internship-payment' } });
      return;
    }
    sessionStorage.setItem('pendingInternship', JSON.stringify({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
    }));
    navigate('/internship-payment');
  };

  const items = [
    {
      img: `${import.meta.env.BASE_URL}placeholder-lawyer.svg`,
      title: 'LLB Internship Programme',
      description: '45-Day internship with live legal training, practical case exposure, mentorship and a certificate upon completion. Ideal for law students. Enrolment fee: ₹1,000.',
      buttonText: 'Enroll Now — ₹1,000',
      isButton: true,
      onClick: handleInternshipClick,
      badge: '45 Days · Certificate',
    },
    {
      img: `${import.meta.env.BASE_URL}placeholder-lawyer.svg`,
      title: 'Join as Jr. Advocate',
      description: 'Start your legal career with us. Apply for a junior advocate position with full details and resume.',
      buttonText: 'Apply Now',
      isButton: true,
      onClick: handleApplyClick,
    },
    {
      img: `${import.meta.env.BASE_URL}placeholder-lawyer.svg`,
      title: 'WhatsApp Legal Updates Group',
      description: 'Join our exclusive WhatsApp group for daily legal updates, case studies, and quick legal tips.',
      buttonText: 'Join Now',
      href: `https://wa.me/${waNumber}?text=I want to join the legal updates group`,
      external: true,
    },
    {
      img: `${import.meta.env.BASE_URL}placeholder-lawyer.svg`,
      title: 'Telegram Legal Updates Channel',
      description: 'Subscribe to our Telegram channel for in-depth legal analysis, judgment updates, and legislative changes.',
      buttonText: 'Subscribe Now',
      href: s.telegram_link || 'https://t.me/advocatechauhan',
      external: true,
    },
    {
      img: `${import.meta.env.BASE_URL}placeholder-lawyer.svg`,
      title: 'Monthly Legal Newsletter',
      description: 'Get our comprehensive monthly newsletter featuring landmark judgments, legal amendments, and expert commentary.',
      buttonText: 'Subscribe',
      href: '#contact',
    },
  ];

  return (
    <>
      <SliderSection
        id="join"
        label="Community"
        title={<>Join <span className="text-gold">With Us</span></>}
        description="Become part of our legal community and stay updated with the latest insights"
        items={items}
        bg="bg-light"
      />
      {showModal && (
        <JrAdvocateModal
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
        />
      )}
    </>
  );
}
