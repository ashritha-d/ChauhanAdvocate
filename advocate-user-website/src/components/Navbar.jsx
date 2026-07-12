import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { savePendingAction } from '../utils/pendingAction';
import { getLiveStatus } from '../api';

function isEffectivelyLive(s) {
  if (!s) return false;
  if (s.status === 'live') return true;
  if (s.status !== 'upcoming') return false;
  const start = new Date(s.date);
  if (s.startTime) { const [h, m] = s.startTime.split(':').map(Number); start.setHours(h, m, 0, 0); }
  const end = new Date(s.date);
  if (s.endTime) { const [h, m] = s.endTime.split(':').map(Number); end.setHours(h, m, 0, 0); }
  else { end.setTime(start.getTime() + 3600000); }
  const now = new Date();
  return now >= start && now <= end;
}

const PUBLIC_NAV_LINKS = [
  { id: 'home',      label: 'Home',      page: null,          icon: 'fa-home' },
  { id: 'services',  label: 'Services',  page: null,          icon: 'fa-balance-scale' },
  { id: 'news',      label: 'News',      page: '/news',       icon: 'fa-newspaper' },
  { id: 'courses',   label: 'Courses',   page: '/courses',    icon: 'fa-graduation-cap' },
  { id: 'magazines', label: 'Magazines', page: '/magazines',  icon: 'fa-book-open' },
  { id: 'drafts',    label: 'Drafts',    page: '/drafts',     icon: 'fa-file-alt' },
  { id: 'books',     label: 'Books',     page: '/books',      icon: 'fa-book' },
  { id: 'gallery',   label: 'Gallery',   page: '/gallery',    icon: 'fa-images' },
  { id: 'faq',       label: 'FAQ',       page: null,          icon: 'fa-question-circle' },
  { id: 'contact',   label: 'Contact',   page: '/contact',    icon: 'fa-envelope' },
];

const AUTH_NAV_LINKS = [
  { id: 'dashboard', label: 'Dashboard', page: '/profile',   icon: 'fa-tachometer-alt' },
  { id: 'courses',   label: 'Courses',   page: '/courses',   icon: 'fa-graduation-cap' },
  { id: 'magazines', label: 'Magazines', page: '/magazines', icon: 'fa-book-open' },
  { id: 'drafts',    label: 'Drafts',    page: '/drafts',    icon: 'fa-file-alt' },
  { id: 'books',     label: 'Books',     page: '/books',     icon: 'fa-book' },
  { id: 'contact',   label: 'Contact',   page: '/contact',   icon: 'fa-envelope' },
];

const USER_DROPDOWN_LINKS = [
  { to: '/profile',                  icon: 'fa-user-circle', label: 'My Profile' },
  { to: '/profile?tab=appointments', icon: 'fa-calendar-alt', label: 'My Appointments' },
  { to: '/profile?tab=orders',       icon: 'fa-book',         label: 'My Orders' },
  { to: '/profile?tab=settings',     icon: 'fa-user-cog',     label: 'Profile Settings' },
];

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Navbar() {
  const [scrolled, setScrolled]           = useState(false);
  const [menuOpen, setMenuOpen]           = useState(false);
  const [userMenuOpen, setUserMenuOpen]   = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [liveSession, setLiveSession]     = useState(null);
  const navRef = useRef(null);
  const { user, logout, unreadCount, openModal } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.body.classList.toggle('drawer-open', menuOpen);
    return () => document.body.classList.remove('drawer-open');
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => {
      const s = window.scrollY > 50;
      setScrolled(s);
      document.body.classList.toggle('nav-scrolled', s);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.body.classList.remove('nav-scrolled');
    };
  }, []);

  // Poll live session status for the Live button indicator
  const pollLive = useCallback(async () => {
    try {
      const r = await getLiveStatus();
      setLiveSession(r.data.data || null);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    pollLive();
    const id = setInterval(pollLive, 60000);
    return () => clearInterval(id);
  }, [pollLive]);

  // Keep --nav-bottom CSS variable in sync with actual navbar bottom edge.
  // This drives the nav-spacer height and news-ticker sticky top on all screen sizes.
  useEffect(() => {
    const navbar = document.getElementById('mainNavbar');
    if (!navbar) return;
    const update = () => {
      const bottom = Math.round(navbar.getBoundingClientRect().bottom);
      document.documentElement.style.setProperty('--nav-bottom', bottom + 'px');
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(navbar);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const handler = e => {
      if (navRef.current && !navRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const close = () => { setMenuOpen(false); setUserMenuOpen(false); };
  const handleLogoutClick = () => { setMenuOpen(false); setLogoutConfirm(true); };
  const confirmLogout = () => { setLogoutConfirm(false); logout(); navigate('/'); };

  const handleSection = (id) => (e) => {
    e.preventDefault();
    close();
    const base = import.meta.env.BASE_URL;
    const currentPath = window.location.pathname.replace(/\/$/, '');
    const basePath = base.replace(/\/$/, '');
    if (currentPath === basePath || currentPath === '') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = `${base}#${id}`;
    }
  };

  const handleAppointment = (e) => {
    e.preventDefault();
    close();
    if (user) { openModal('appointment'); }
    else { savePendingAction('appointment'); navigate('/login'); }
  };

  const isActive = ({ id, page }) => {
    if (!page) return false;
    if (id === 'dashboard') return location.pathname.startsWith('/profile');
    return location.pathname === page;
  };

  const navLinks = user ? AUTH_NAV_LINKS : PUBLIC_NAV_LINKS;

  return (
    <>
      <nav ref={navRef} className={`navbar navbar-dark fixed-top ${scrolled ? 'scrolled' : ''}`} id="mainNavbar">
        <div className="container">

          {/* Logo */}
          <a className="navbar-brand navbar-logo d-flex align-items-center" href={import.meta.env.BASE_URL} onClick={handleSection('home')}>
            <img src={`${import.meta.env.BASE_URL}logo.jpeg`} alt="Advocate Chauhan Logo" style={{ height: '44px', objectFit: 'contain' }} />
          </a>

          {/* Mobile: Book Appointment + Profile icon */}
          <div className="d-lg-none mobile-nav-center">
            <button className="btn btn-gold mobile-appt-btn" onClick={handleAppointment}>
              Book an Appointment
            </button>
            {user ? (
              <Link to="/profile" className="mobile-profile-btn" onClick={close} title={user.name}>
                {user.profilePhoto
                  ? <img src={user.profilePhoto} alt={user.name} className="mobile-profile-avatar" />
                  : <span className="mobile-profile-initial">{user.name.charAt(0).toUpperCase()}</span>
                }
                {unreadCount > 0 && <span className="mobile-notif-dot"></span>}
              </Link>
            ) : (
              <Link to="/login" className="mobile-profile-btn" onClick={close} title="Login">
                <i className="fas fa-user-circle"></i>
              </Link>
            )}
          </div>

          {/* Hamburger */}
          <button
            className={`hamburger d-lg-none ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle navigation"
            type="button"
          >
            <span></span><span></span><span></span>
          </button>

          {/* ── Desktop nav ── */}
          <div className="d-none d-lg-flex ms-auto align-items-center gap-1">
            {navLinks.map(link => (
              link.page
                ? <Link
                    key={link.id}
                    to={link.page}
                    className={`nav-link ${isActive(link) ? 'active' : ''}`}
                    onClick={close}
                  >{link.label}</Link>
                : <a key={link.id} className="nav-link" href={`#${link.id}`} onClick={handleSection(link.id)}>{link.label}</a>
            ))}

            {/* Live Button — opens meetUrl directly when live + logged in */}
            <Link
              to="/live"
              className={`live-nav-btn${isEffectivelyLive(liveSession) ? ' live-nav-btn--live' : liveSession?.status === 'upcoming' ? ' live-nav-btn--upcoming' : ''}`}
              onClick={e => {
                e.preventDefault();
                close();
                if (isEffectivelyLive(liveSession) && liveSession?.meetUrl) {
                  if (user) window.open(liveSession.meetUrl, '_blank', 'noopener,noreferrer');
                  else navigate('/login', { state: { from: '/live' } });
                } else {
                  navigate('/live');
                }
              }}
            >
              <span className="live-nav-play"><i className="fas fa-play" /></span>
              LIVE
            </Link>

            <button className="btn btn-gold ms-2" onClick={handleAppointment}>
              Book an Appointment
            </button>

            {user ? (
              <>
                {/* Notifications Bell */}
                <Link
                  to="/profile?tab=notifications"
                  className="navbar-notif-btn ms-1"
                  onClick={close}
                  title={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
                  style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
                >
                  <i className="fas fa-bell"></i>
                  {unreadCount > 0 && (
                    <span className="navbar-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </Link>

                {/* Profile Dropdown */}
                <div className="nav-user-menu ms-2">
                  <button className="nav-user-btn" onClick={() => setUserMenuOpen(o => !o)}>
                    {user.profilePhoto
                      ? <img src={user.profilePhoto} alt={user.name} className="nav-user-avatar" />
                      : <div className="nav-user-initial">{user.name.charAt(0).toUpperCase()}</div>
                    }
                    <span className="nav-user-name">{user.name.split(' ')[0]}</span>
                    <i className="fas fa-chevron-down ms-1" style={{ fontSize: '0.65rem', opacity: 0.6 }}></i>
                  </button>

                  {userMenuOpen && (
                    <div className="nav-user-dropdown nav-profile-dropdown">
                      <div className="nav-profile-card">
                        <div className="nav-profile-avatar-wrap">
                          {user.profilePhoto
                            ? <img src={user.profilePhoto} alt={user.name} className="nav-profile-avatar-img" />
                            : <div className="nav-profile-avatar-initial">{user.name.charAt(0).toUpperCase()}</div>
                          }
                        </div>
                        <div className="nav-profile-name">{user.name}</div>
                        <div className="nav-profile-detail"><i className="fas fa-envelope"></i>{user.email}</div>
                        <div className="nav-profile-detail"><i className="fas fa-phone"></i>{user.phone}</div>
                        <div className="nav-profile-meta">
                          <span className={`badge ${user.isActive ? 'bg-success' : 'bg-secondary'}`}>{user.isActive ? 'Active' : 'Inactive'}</span>
                          <small>Member since {formatDate(user.createdAt)}</small>
                        </div>
                      </div>
                      <div className="nav-user-dd-divider"></div>
                      {USER_DROPDOWN_LINKS.map(({ to, icon, label }) => (
                        <Link key={to} to={to} className="nav-user-dd-item" onClick={close}>
                          <i className={`fas ${icon}`}></i> {label}
                        </Link>
                      ))}
                      <div className="nav-user-dd-divider"></div>
                      <button className="nav-user-dd-item" style={{ color: '#ff6b6b' }} onClick={handleLogoutClick}>
                        <i className="fas fa-sign-out-alt"></i> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="d-flex gap-2 ms-2">
                <Link to="/login" className="btn btn-outline-light btn-sm" onClick={close}><i className="fas fa-sign-in-alt me-1"></i>Login</Link>
                <Link to="/register" className="btn btn-gold btn-sm" onClick={close}><i className="fas fa-user-plus me-1"></i>Register</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer Overlay ── */}
      <div className={`mobile-drawer-overlay ${menuOpen ? 'open' : ''}`} onClick={close} aria-hidden="true" />

      {/* ── Mobile Slide-in Drawer ── */}
      <div className={`mobile-drawer d-lg-none ${menuOpen ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="Navigation menu">

        {/* Drawer Header */}
        <div className="mobile-drawer-header">
          <img src={`${import.meta.env.BASE_URL}logo.jpeg`} alt="Logo" className="mobile-drawer-logo" />
          {user ? (
            <div className="mobile-drawer-user-info">
              <div className="mobile-drawer-avatar">
                {user.profilePhoto
                  ? <img src={user.profilePhoto} alt={user.name} />
                  : <span>{user.name.charAt(0).toUpperCase()}</span>
                }
              </div>
              <span className="mobile-drawer-username">{user.name.split(' ')[0]}</span>
            </div>
          ) : <div className="flex-grow-1" />}
          <button className="mobile-drawer-close" onClick={close} aria-label="Close menu">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="mobile-drawer-body">
          <div className="mobile-drawer-section-label">Navigation</div>
          {navLinks.map(link => (
            link.page
              ? <Link
                  key={link.id}
                  to={link.page}
                  className={`mobile-drawer-link ${isActive(link) ? 'active' : ''}`}
                  onClick={close}
                >
                  <i className={`fas ${link.icon} mobile-drawer-link-icon`}></i>{link.label}
                </Link>
              : <a key={link.id} href={`#${link.id}`} className="mobile-drawer-link" onClick={handleSection(link.id)}>
                  <i className={`fas ${link.icon} mobile-drawer-link-icon`}></i>{link.label}
                </a>
          ))}

          {/* Live link in mobile drawer */}
          <Link
            to="/live"
            className={`mobile-drawer-link${isEffectivelyLive(liveSession) ? ' mobile-drawer-live-active' : ''}`}
            onClick={e => {
              e.preventDefault();
              close();
              if (isEffectivelyLive(liveSession) && liveSession?.meetUrl) {
                if (user) window.open(liveSession.meetUrl, '_blank', 'noopener,noreferrer');
                else navigate('/login', { state: { from: '/live' } });
              } else {
                navigate('/live');
              }
            }}
          >
            <i className={`fas fa-video mobile-drawer-link-icon${isEffectivelyLive(liveSession) ? ' live-icon-pulse' : ''}`} />
            Live
            {isEffectivelyLive(liveSession) && (
              <span className="mobile-drawer-badge" style={{ background: '#dc3545' }}>LIVE</span>
            )}
            {!isEffectivelyLive(liveSession) && liveSession?.status === 'upcoming' && (
              <span className="mobile-drawer-badge" style={{ background: '#f59e0b', color: '#1a1a2e' }}>SOON</span>
            )}
          </Link>

          <div
            className="mobile-drawer-link mobile-drawer-appt-link"
            onClick={handleAppointment}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && handleAppointment(e)}
          >
            <i className="fas fa-calendar-check mobile-drawer-link-icon"></i>
            Book an Appointment
          </div>

          {user ? (
            <>
              <div className="mobile-drawer-divider"></div>
              <div className="mobile-drawer-section-label">My Account</div>
              <Link to="/profile?tab=notifications" className="mobile-drawer-link" onClick={close}>
                <i className="fas fa-bell mobile-drawer-link-icon"></i>
                Notifications
                {unreadCount > 0 && <span className="mobile-drawer-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </Link>
              {USER_DROPDOWN_LINKS.filter(l => l.to !== '/profile').map(({ to, icon, label }) => (
                <Link key={to} to={to} className="mobile-drawer-link" onClick={close}>
                  <i className={`fas ${icon} mobile-drawer-link-icon`}></i>{label}
                </Link>
              ))}
            </>
          ) : (
            <>
              <div className="mobile-drawer-divider"></div>
              <div className="mobile-drawer-section-label">Account</div>
              <Link to="/login" className="mobile-drawer-link" onClick={close}>
                <i className="fas fa-sign-in-alt mobile-drawer-link-icon"></i>Login
              </Link>
              <Link to="/register" className="mobile-drawer-link" onClick={close}>
                <i className="fas fa-user-plus mobile-drawer-link-icon"></i>Register
              </Link>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="mobile-drawer-footer">
          {user ? (
            <button className="mobile-drawer-logout" onClick={handleLogoutClick}>
              <i className="fas fa-sign-out-alt me-2"></i>Logout
            </button>
          ) : (
            <div className="d-flex gap-2">
              <Link to="/login" className="btn btn-gold flex-grow-1 text-center" onClick={close} style={{ minHeight: 44 }}>Login</Link>
              <Link to="/register" className="btn btn-outline-light flex-grow-1 text-center" onClick={close} style={{ minHeight: 44 }}>Register</Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Logout Confirmation Dialog ── */}
      {logoutConfirm && (
        <div className="logout-confirm-overlay" onClick={() => setLogoutConfirm(false)}>
          <div className="logout-confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="logout-confirm-icon"><i className="fas fa-sign-out-alt"></i></div>
            <h5 className="logout-confirm-title">Logout</h5>
            <p className="logout-confirm-msg">Are you sure you want to logout?</p>
            <div className="logout-confirm-actions">
              <button className="btn btn-outline-secondary" onClick={() => setLogoutConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmLogout}>
                <i className="fas fa-sign-out-alt me-1"></i>Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
