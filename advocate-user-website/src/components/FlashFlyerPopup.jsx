import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSite } from '../context/SiteContext';

const INTERVAL_MS  = 20 * 60 * 1000; // 20 minutes
const STORAGE_KEY  = 'flashFlyerLastShown';
const SHOW_DELAY   = 3000; // 3 seconds after page load

export default function FlashFlyerPopup() {
  const { settings: s } = useSite();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const last = localStorage.getItem(STORAGE_KEY);
      if (!last || Date.now() - Number(last) >= INTERVAL_MS) {
        setVisible(true);
      }
    }, SHOW_DELAY);
    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setVisible(false);
  };

  const go = (path) => { close(); navigate(path); };

  if (!visible) return null;

  return (
    <div className="flyer-overlay" onClick={close}>
      <div className="flyer-popup" onClick={e => e.stopPropagation()}>
        <button className="flyer-close" onClick={close} aria-label="Close">&times;</button>

        {/* Header */}
        <div className="flyer-header">
          <div className="flyer-badge">Special Announcement</div>
          <h3 className="flyer-title">
            Expert Legal Services<br />
            <span>by Advocate Chauhan</span>
          </h3>
          <p className="flyer-subtitle">Balu Law Chamber, Hasthinapuram, LB Nagar, Hyderabad</p>
        </div>

        {/* Offers Grid */}
        <div className="flyer-grid">
          <div className="flyer-item">
            <div className="flyer-item-icon"><i className="fas fa-gavel"></i></div>
            <div className="flyer-item-body">
              <div className="flyer-item-title">Legal Services</div>
              <div className="flyer-item-desc">Criminal, Civil, Family & Property Law — 15+ years expertise</div>
            </div>
            <button className="flyer-item-btn" onClick={() => go('/#services')}>Consult Now</button>
          </div>

          <div className="flyer-item flyer-item-highlight">
            <div className="flyer-item-icon"><i className="fas fa-graduation-cap"></i></div>
            <div className="flyer-item-body">
              <div className="flyer-item-title">LLB Internship Programme</div>
              <div className="flyer-item-desc">45-Day Internship · Certificate · Live Legal Training</div>
            </div>
            <button className="flyer-item-btn" onClick={() => go('/#join')}>Apply Now</button>
          </div>

          <div className="flyer-item">
            <div className="flyer-item-icon"><i className="fas fa-book-open"></i></div>
            <div className="flyer-item-body">
              <div className="flyer-item-title">Legal Books for Sale</div>
              <div className="flyer-item-desc">Solutions to Legal Problems & more — available now</div>
            </div>
            <button className="flyer-item-btn" onClick={() => go('/books')}>View Books</button>
          </div>

          <div className="flyer-item">
            <div className="flyer-item-icon"><i className="fas fa-file-alt"></i></div>
            <div className="flyer-item-body">
              <div className="flyer-item-title">Free Legal Drafts</div>
              <div className="flyer-item-desc">Download 3 free legal draft templates — rental, NDA & more</div>
            </div>
            <button className="flyer-item-btn" onClick={() => go('/drafts')}>Download Free</button>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="flyer-footer">
          <button className="btn btn-gold w-100 py-2" onClick={() => go('/#appointment')}>
            <i className="fas fa-calendar-alt me-2"></i>Book a Free Consultation
          </button>
          <div className="flyer-contact">
            <i className="fas fa-phone me-1"></i>
            {s.contact_phone || '+91 93925 38226'}
          </div>
        </div>
      </div>
    </div>
  );
}
