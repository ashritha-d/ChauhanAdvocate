import { useSite } from '../context/SiteContext';

export default function WhatsAppButton() {
  const { settings: s } = useSite();
  const number = s.contact_whatsapp ? s.contact_whatsapp.replace(/\D/g, '') : '';
  const href = number ? `https://wa.me/${number}?text=Hello, I need legal assistance.` : '#';

  return (
    <a href={href} className="whatsapp-float" target="_blank" rel="noreferrer" title="Chat on WhatsApp">
      <i className="fab fa-whatsapp"></i>
      <span className="whatsapp-tooltip">Chat with us!</span>
    </a>
  );
}
