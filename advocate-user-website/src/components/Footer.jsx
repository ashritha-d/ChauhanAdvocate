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
  const address = s.contact_address || 'Balu Law Chamber, New Venkatramana Colony, Hasthinapuram, LB Nagar';

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
                {['home','services','appointment','blog','contact'].map(l => (
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
                <li><i className="fas fa-clock"></i><span>{s.office_hours_weekday || 'Mon–Sat: 9:00 AM – 7:00 PM'}</span></li>
                <li><i className="fas fa-clock"></i><span>{s.office_hours_sunday || 'Sunday: 2:00 PM – 7:00 PM'}</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          {/* JK Cloud Technologies CTA */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.03) 100%)',
            border: '1px solid rgba(201,168,76,0.18)',
            borderRadius: 12,
            padding: '14px 20px',
            marginBottom: 16,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 3 }}>
                Need a Professional Website for Your Business?
              </p>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)' }}>
                <i className="fas fa-code me-1" style={{ color: '#C9A84C' }}></i>
                Website Development &nbsp;·&nbsp; Web Apps &nbsp;·&nbsp; AI Solutions &nbsp;·&nbsp; E-Commerce
              </p>
            </div>
            <a
              href="https://j-kcloud-technologies.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                background: 'linear-gradient(135deg, #C9A84C, #f0cc70)',
                color: '#1a1a2e',
                fontWeight: 700,
                fontSize: '0.78rem',
                padding: '7px 16px',
                borderRadius: 20,
                textDecoration: 'none',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 2px 12px rgba(201,168,76,0.25)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(201,168,76,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(201,168,76,0.25)'; }}
            >
              <i className="fas fa-rocket"></i> Get Your Website
            </a>
          </div>

          {/* Copyright + Dev credit */}
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <p className="mb-0 text-white-50" style={{ fontSize: '0.8rem' }}>
              &copy; {new Date().getFullYear()} {s.site_name || 'Advocate Chauhan'}. All Rights Reserved.
            </p>
            <p className="mb-0" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
              Designed &amp; Developed by&nbsp;
              <a
                href="https://j-kcloud-technologies.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#C9A84C',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'color 0.3s, text-shadow 0.3s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#f0cc70'; e.currentTarget.style.textShadow = '0 0 12px rgba(201,168,76,0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.textShadow = 'none'; }}
              >
                JK Cloud Technologies
              </a>
              &nbsp;<i className="fas fa-rocket" style={{ color: '#C9A84C', fontSize: '0.72rem' }}></i>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
