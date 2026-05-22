import { useEffect, useState } from 'react';
import { useSite } from '../context/SiteContext';
import { getServices } from '../api';

const SOCIALS = [
  { key: 'social_facebook', icon: 'fab fa-facebook-f' },
  { key: 'social_youtube', icon: 'fab fa-youtube' },
  { key: 'social_twitter', icon: 'fab fa-twitter' },
  { key: 'social_linkedin', icon: 'fab fa-linkedin-in' },
  { key: 'social_instagram', icon: 'fab fa-instagram' },
];

export default function Footer() {
  const { settings: s } = useSite();
  const [services, setServices] = useState([]);

  useEffect(() => {
    getServices().then(r => { if (r.data.success) setServices(r.data.data.slice(0, 6)); }).catch(() => {});
  }, []);

  const phone = s.contact_phone || '9392538226';
  const phone2 = s.contact_phone2 || '9441335292';
  const email = s.contact_email || 'info@advocatechauhan.com';
  const address = s.contact_address || 'District Court Complex, Hyderabad';

  return (
    <footer className="footer-section">
      <div className="footer-top">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="footer-brand d-flex align-items-center gap-2 mb-3">
                <div className="brand-icon"><i className="fas fa-balance-scale"></i></div>
                <div>
                  <span className="brand-name fs-5">{s.site_name || 'Advocate Chauhan'}</span>
                  <small className="d-block brand-tagline">{s.site_tagline || 'Justice. Integrity. Excellence.'}</small>
                </div>
              </div>
              <p className="text-white-50 mb-4">
                {s.about_content ? s.about_content.substring(0, 120) + '...' : 'Your trusted legal partner committed to justice and excellence in every case we handle.'}
              </p>
              <div className="footer-social">
                {SOCIALS.filter(soc => s[soc.key]).map(soc => (
                  <a key={soc.key} href={s[soc.key]} target="_blank" rel="noreferrer">
                    <i className={soc.icon}></i>
                  </a>
                ))}
              </div>
            </div>
            <div className="col-lg-2 col-md-4">
              <h6 className="footer-heading">Quick Links</h6>
              <ul className="footer-links">
                {['home','about','services','appointment','blog','contact'].map(l => (
                  <li key={l}><a href={`#${l}`}>{l.charAt(0).toUpperCase()+l.slice(1)}</a></li>
                ))}
              </ul>
            </div>
            <div className="col-lg-3 col-md-4">
              <h6 className="footer-heading">Practice Areas</h6>
              <ul className="footer-links">
                {(services.length ? services : [
                  'Criminal Law','Civil Law','Family Law','Corporate Law','Property Law'
                ].map(t => ({ _id:t, title:t }))).map(sv => (
                  <li key={sv._id}><a href="#services">{sv.title}</a></li>
                ))}
              </ul>
            </div>
            <div className="col-lg-3 col-md-4">
              <h6 className="footer-heading">Contact Info</h6>
              <ul className="footer-contact-list">
                <li><i className="fas fa-phone-alt"></i><a href={`tel:${phone}`}>{phone}</a></li>
                <li><i className="fas fa-phone-alt"></i><a href={`tel:${phone2}`}>{phone2}</a></li>
                <li><i className="fas fa-envelope"></i><a href={`mailto:${email}`}>{email}</a></li>
                <li><i className="fas fa-map-marker-alt"></i><span>{address}</span></li>
                <li><i className="fas fa-clock"></i><span>Mon–Sat: 9AM – 7PM</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container d-flex flex-wrap justify-content-between align-items-center">
          <p className="mb-0 text-white-50">&copy; {new Date().getFullYear()} {s.site_name || 'Advocate Chauhan'}. All Rights Reserved.</p>
          <p className="mb-0 text-white-50">Designed with <i className="fas fa-heart text-gold mx-1"></i> for Justice</p>
        </div>
      </div>
    </footer>
  );
}
