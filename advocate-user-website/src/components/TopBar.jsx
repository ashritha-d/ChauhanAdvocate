import { useSite } from '../context/SiteContext';

export default function TopBar() {
  const { settings: s } = useSite();

  const phone    = s.contact_phone    || '+91 9392538226';
  const email    = s.contact_email    || 'email@gmail.com';
  const whatsapp = s.contact_whatsapp || s.contact_phone || '919392538226';
  const instagram = s.social_instagram || 'https://instagram.com';
  const facebook  = s.social_facebook  || 'https://www.facebook.com/share/1B761tqcFM/';
  const youtube   = s.social_youtube   || 'https://youtube.com/@vakeelchauhan2024?si=hqLxM-wcI4ARn4OI';
  const waHref = `https://wa.me/${whatsapp.replace(/\D/g, '')}`;

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <a href="https://maps.google.com/?q=Hyderabad" target="_blank" rel="noopener noreferrer" className="top-bar-item location-item">
          <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
          Hyderabad
        </a>
        <span className="top-bar-divider"></span>
        <a href={`mailto:${email}`} className="top-bar-item">
          <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
          {email}
        </a>
        <span className="top-bar-divider"></span>
        <span className="top-bar-item">
          <svg viewBox="0 0 24 24"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 01.99 1v3.51a1 1 0 01-1 1A17 17 0 013.24 5.44 1 1 0 014.25 4h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z"/></svg>
          contact {phone}
        </span>
      </div>
      <div className="top-bar-right">
        <a href={instagram} target="_blank" rel="noopener noreferrer" className="top-bar-social instagram" title="Instagram">
          <svg viewBox="0 0 24 24"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 017.8 2zm-.2 2A3.6 3.6 0 004 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 003.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zM12 7a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z"/></svg>
        </a>
        <a href={facebook} target="_blank" rel="noopener noreferrer" className="top-bar-social facebook" title="Facebook">
          <svg viewBox="0 0 24 24"><path d="M22.675 0h-20.35c-1.81 0-3.276 1.466-3.276 3.276v17.448c0 1.81 1.466 3.276 3.276 3.276h5.067v-7.23h-3.31v-3.17h3.31v-2.07c0-2.456 1.43-3.878 3.766-3.878 1.074 0 2.156.097 2.356.125v2.96h-1.48c-1.16 0-1.406.535-1.406 1.24v2.01h3.37l-.46 3.17h-2.91v7.23h3.96c1.81 0 3.276-1.466 3.276-3.276v-17.448c0-1.81-1.466-3.276-3.276-3.276z"/></svg>
        </a>
        <a href={waHref} target="_blank" rel="noopener noreferrer" className="top-bar-social whatsapp" title="WhatsApp">
          <svg viewBox="0 0 24 24"><path d="M19.6 11.63c-.24-.12-1.41-.7-1.63-.77-.21-.07-.37-.12-.53.12-.16.24-.61.77-.75.93-.14.16-.28.19-.51.06-.24-.12-.99-.36-1.88-1.14-.69-.6-1.16-1.33-1.3-1.59-.14-.26-.02-.4.07-.52.07-.12.16-.29.24-.44.07-.15.04-.29-.02-.41-.06-.12-.53-1.28-.72-1.75-.19-.47-.38-.41-.53-.41-.14 0-.3 0-.46 0-.16 0-.41.06-.62.29-.21.24-.82.79-.82 1.92s.84 2.24.94 2.4c.1.15 1.64 2.5 3.95 3.49.54.24.97.38 1.3.49.54.18.99.15 1.28.09.39-.06 1.18-.47 1.33-.92.16-.45.16-.82.11-.94-.06-.12-.2-.18-.44-.3z"/><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-18c4.411 0 8 3.589 8 8s-3.589 8-8 8-8-3.589-8-8 3.589-8 8-8z"/></svg>
        </a>
        <a href={youtube} target="_blank" rel="noopener noreferrer" className="top-bar-social youtube" title="YouTube">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/><polygon points="15.803,9.014 15.803,14.986 9.707,12.022" fill="#fff"/></svg>
        </a>
      </div>
    </div>
  );
}
