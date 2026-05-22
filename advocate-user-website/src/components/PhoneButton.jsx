import { useSite } from '../context/SiteContext';

export default function PhoneButton() {
  const { settings: s } = useSite();
  const phone = s.contact_phone || '+919392538226';
  const href = `tel:${phone.replace(/\s/g, '')}`;

  return (
    <a href={href} className="phone-float" title="Call Us">
      <i className="fas fa-phone-alt"></i>
      <span className="phone-tooltip">Call us!</span>
    </a>
  );
}
