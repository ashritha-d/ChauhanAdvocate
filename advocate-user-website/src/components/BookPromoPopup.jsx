import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBooks } from '../api';
import { mediaUrl } from '../utils/helpers';
import { useUserAuth } from '../context/UserAuthContext';
import { savePendingAction } from '../utils/pendingAction';

const SHOW_DELAY   = 1500;   // ms after page load before first show
const RESHOW_DELAY = 30000;  // ms after close before reshowing

const STATS_KEY = 'bookPromoStats';

function track(field) {
  try {
    const s = JSON.parse(localStorage.getItem(STATS_KEY) || '{}');
    s[field] = (s[field] || 0) + 1;
    s[`${field}LastAt`] = new Date().toISOString();
    localStorage.setItem(STATS_KEY, JSON.stringify(s));
  } catch {}
}

export default function BookPromoPopup() {
  const [book, setBook]       = useState(null);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const { user } = useUserAuth();
  const showTimer   = useRef(null);
  const reshowTimer = useRef(null);
  const buying      = useRef(false);

  useEffect(() => {
    getBooks()
      .then(r => {
        if (!r.data.success) return;
        const list = r.data.data || [];
        const pick =
          list.find(b => b.name?.toLowerCase().includes('chattaparamina') && b.isActive && b.stockStatus !== 'out_of_stock') ||
          list.find(b => b.isActive && b.stockStatus !== 'out_of_stock');
        if (pick) setBook(pick);
      })
      .catch(() => {});
    return () => { clearTimeout(showTimer.current); clearTimeout(reshowTimer.current); };
  }, []);

  useEffect(() => {
    if (!book || user) return;
    showTimer.current = setTimeout(() => { setVisible(true); track('impressions'); }, SHOW_DELAY);
    return () => clearTimeout(showTimer.current);
  }, [book, user]);

  // Clear popup immediately if user logs in during the session
  useEffect(() => {
    if (user) {
      setVisible(false);
      clearTimeout(showTimer.current);
      clearTimeout(reshowTimer.current);
    }
  }, [user]);

  const handleClose = () => {
    setVisible(false);
    clearTimeout(reshowTimer.current);
    reshowTimer.current = setTimeout(() => { setVisible(true); track('impressions'); }, RESHOW_DELAY);
  };

  const handleBuyNow = () => {
    if (buying.current) return;
    buying.current = true;
    track('clicks');
    setVisible(false);
    clearTimeout(reshowTimer.current);
    if (user) {
      navigate('/books', { state: { bookId: book._id } });
    } else {
      savePendingAction('order', { bookId: book._id });
      navigate('/login', { state: { from: '/books', message: 'Please log in to purchase this book.' } });
    }
  };

  if (!visible || !book) return null;

  return (
    <>
      <style>{`
        @keyframes bppFadeIn {
          from { opacity: 0; transform: scale(.88) translateY(24px); }
          to   { opacity: 1; transform: scale(1)   translateY(0);    }
        }
        @keyframes bppPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(201,168,76,.7), 0 4px 20px rgba(201,168,76,.35); }
          50%     { box-shadow: 0 0 0 10px rgba(201,168,76,0), 0 4px 28px rgba(201,168,76,.6); }
        }
        .bpp-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,.65);
          z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          backdrop-filter: blur(3px);
        }
        .bpp-card {
          background: linear-gradient(145deg, #0b1d45 0%, #132453 55%, #0b1d45 100%);
          border: 2px solid #c9a84c;
          border-radius: 20px;
          width: 100%; max-width: 490px;
          position: relative;
          animation: bppFadeIn .45s cubic-bezier(.34,1.56,.64,1) forwards;
          box-shadow: 0 24px 70px rgba(0,0,0,.65), 0 0 50px rgba(201,168,76,.12);
          overflow: hidden;
        }
        .bpp-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, transparent, #c9a84c 40%, #f0d060 60%, transparent);
        }
        .bpp-close {
          position: absolute; top: 12px; right: 12px; z-index: 2;
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2);
          color: #fff; font-size: 15px; line-height: 1;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background .2s, transform .2s;
        }
        .bpp-close:hover { background: rgba(255,255,255,.25); transform: rotate(90deg); }
        .bpp-badge {
          display: inline-flex; align-items: center; gap: 5px;
          background: linear-gradient(90deg, #c9a84c, #f0d060);
          color: #0b1d45; font-size: .62rem; font-weight: 800;
          letter-spacing: 1.4px; text-transform: uppercase;
          padding: 4px 14px; border-radius: 20px; margin-bottom: 16px;
        }
        .bpp-book-wrap {
          width: 190px; height: 280px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; border-radius: 16px;
          background: #0f1d4d;
          border: 2.5px solid rgba(201,168,76,.45);
          box-shadow: 0 8px 26px rgba(0,0,0,.45);
        }
        .bpp-book-img {
          width: 100%; height: 100%;
          object-fit: contain; object-position: center;
          display: block;
        }
        .bpp-book-placeholder {
          width: 190px; height: 280px; flex-shrink: 0; border-radius: 16px;
          background: rgba(201,168,76,.08);
          border: 2px dashed rgba(201,168,76,.35);
          display: flex; align-items: center; justify-content: center;
        }
        .bpp-buy-btn {
          display: block; width: 100%;
          background: linear-gradient(135deg, #c9a84c 0%, #f0d060 50%, #c9a84c 100%);
          background-size: 200% auto;
          color: #0b1d45; border: none;
          font-weight: 800; font-size: 1rem; letter-spacing: .4px;
          padding: 14px 32px; border-radius: 50px; cursor: pointer;
          animation: bppPulse 2.2s ease-in-out infinite;
          transition: transform .2s, filter .2s, background-position .4s;
        }
        .bpp-buy-btn:hover {
          transform: translateY(-2px) scale(1.03);
          filter: brightness(1.1);
          animation: none;
          box-shadow: 0 0 35px rgba(201,168,76,.85), 0 10px 28px rgba(201,168,76,.35);
          background-position: right center;
        }
        .bpp-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,.3), transparent);
          margin: 20px 0;
        }
        @media (max-width: 480px) {
          .bpp-card { border-radius: 16px; }
          .bpp-book-wrap, .bpp-book-placeholder { width: 120px; height: 175px; border-radius: 12px; }
          .bpp-buy-btn { font-size: .93rem; padding: 12px 24px; }
        }
      `}</style>

      <div className="bpp-overlay" onClick={e => e.target === e.currentTarget && handleClose()}>
        <div className="bpp-card" role="dialog" aria-modal="true" aria-label="Book promotion">

          <button className="bpp-close" onClick={handleClose} aria-label="Close promotion">✕</button>

          <div style={{ padding: '28px 24px 22px' }}>

            {/* Badge */}
            <div className="text-center">
              <span className="bpp-badge">
                <i className="fas fa-star"></i> Featured Book
              </span>
            </div>

            {/* Book row */}
            <div className="d-flex gap-4 align-items-start">
              {book.image
                ? (
                  <div className="bpp-book-wrap">
                    <img src={mediaUrl(book.image)} alt={book.name} className="bpp-book-img" />
                  </div>
                )
                : (
                  <div className="bpp-book-placeholder">
                    <i className="fas fa-book fa-2x" style={{ color: '#c9a84c', opacity: .5 }}></i>
                  </div>
                )
              }

              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ color: '#fff', fontWeight: 700, lineHeight: 1.3, marginBottom: 8, fontSize: '1.1rem' }}>
                  {book.name}
                </h4>
                {book.author && (
                  <p style={{ color: 'rgba(255,255,255,.55)', fontSize: '.8rem', marginBottom: 10 }}>
                    <i className="fas fa-user-pen me-1" style={{ color: '#c9a84c' }}></i>{book.author}
                  </p>
                )}
                <p style={{ color: 'rgba(255,255,255,.78)', fontSize: '.86rem', lineHeight: 1.6, marginBottom: 14 }}>
                  Get practical solutions to common legal problems. Order your copy today!
                </p>
                {book.price > 0 && (
                  <div>
                    <span style={{ color: '#f0d060', fontWeight: 800, fontSize: '1.5rem' }}>₹{book.price}</span>
                    <span style={{ color: 'rgba(255,255,255,.35)', fontSize: '.76rem', marginLeft: 6 }}>only</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bpp-divider"></div>

            {/* CTA */}
            <button className="bpp-buy-btn" onClick={handleBuyNow}>
              <i className="fas fa-shopping-cart me-2"></i>Buy Now
            </button>

            <p style={{ color: 'rgba(255,255,255,.28)', fontSize: '.7rem', textAlign: 'center', marginTop: 10, marginBottom: 0 }}>
              <i className="fas fa-shield-alt me-1"></i>Secure purchase · Trusted by hundreds of readers
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
