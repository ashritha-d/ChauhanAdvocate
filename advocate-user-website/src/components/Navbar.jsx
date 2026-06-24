import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { savePendingAction } from '../utils/pendingAction';

const NAV_LINKS = [
  { id: 'home',     label: 'Home',     page: null,       icon: 'fa-home',            publicOnly: true },
  { id: 'services', label: 'Services', page: null,       icon: 'fa-balance-scale',   publicOnly: true },
  { id: 'news',     label: 'News',     page: '/news',    icon: 'fa-newspaper',       publicOnly: true },
  { id: 'courses',  label: 'Courses',  page: '/courses', icon: 'fa-graduation-cap' },
  { id: 'gallery',  label: 'Gallery',  page: '/gallery', icon: 'fa-images',          publicOnly: true },
  { id: 'blog',     label: 'Blog',     page: null,       icon: 'fa-pen-nib',         publicOnly: true },
  { id: 'faq',      label: 'FAQ',      page: null,       icon: 'fa-question-circle', publicOnly: true },
  { id: 'contact',  label: 'Contact',  page: null,       icon: 'fa-envelope' },
];

const USER_LINKS = [
  { to: '/profile',                   icon: 'fa-user-circle',    label: 'My Profile' },
  { to: '/profile?tab=appointments',  icon: 'fa-calendar-alt',   label: 'My Appointments' },
  { to: '/profile?tab=orders',        icon: 'fa-book',           label: 'My Orders' },
  { to: '/profile?tab=notifications', icon: 'fa-bell',           label: 'Notifications', badge: true },
  { to: '/profile?tab=magazines',     icon: 'fa-book-open',      label: 'My Magazines' },
  { to: '/profile?tab=courses',       icon: 'fa-graduation-cap', label: 'Purchased Courses' },
];

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Navbar() {
  const [scrolled, setScrolled]         = useState(false);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const navRef = useRef(null);
  const { user, logout, unreadCount, openModal } = useUserAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('drawer-open');
    } else {
      document.body.classList.remove('drawer-open');
    }
    return () => document.body.classList.remove('drawer-open');
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = e => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const close = () => { setMenuOpen(false); setUserMenuOpen(false); };

  const handleLogoutClick = () => { setMenuOpen(false); setLogoutConfirm(true); };
  const confirmLogout = () => { setLogoutConfirm(false); logout(); navigate('/'); };

  const handleSection = (id) => (e) => {
    e.preventDefault();
    close();
    const base        = import.meta.env.BASE_URL;
    const currentPath = window.location.pathname.replace(/\/$/, '');
    const basePath    = base.replace(/\/$/, '');
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
            <a href="#appointment" className="btn btn-gold mobile-appt-btn" onClick={handleAppointment}>
              Book an Appointment
            </a>
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
            {NAV_LINKS.filter(l => !user || !l.publicOnly).map(({ id, label, page }) => (
              page
                ? <Link key={id} to={page} className={`nav-link ${location.pathname === page ? 'active' : ''}`} onClick={close}>{label}</Link>
                : <a key={id} className="nav-link" href={`#${id}`} onClick={handleSection(id)}>{label}</a>
            ))}
            <a href="#appointment" className="btn btn-gold ms-2" onClick={handleAppointment}>Book an Appointment</a>

            {user ? (
              <div className="nav-user-menu ms-2">
                <button className="nav-user-btn" onClick={() => setUserMenuOpen(o => !o)}>
                  {user.profilePhoto
                    ? <img src={user.profilePhoto} alt={user.name} className="nav-user-avatar" />
                    : <div className="nav-user-initial">{user.name.charAt(0).toUpperCase()}</div>
                  }
                  <span className="nav-user-name">{user.name.split(' ')[0]}</span>
                  {unreadCount > 0 && <span className="navbar-notif-badge-sm">{unreadCount > 9 ? '9+' : unreadCount}</span>}
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
                    <Link to="/profile?tab=settings" className="nav-user-dd-item" onClick={close}><i className="fas fa-user-cog"></i> Profile Settings</Link>
                    <Link to="/profile?tab=notifications" className="nav-user-dd-item" onClick={close}>
                      <i className="fas fa-bell"></i> Notifications
                      {unreadCount > 0 && <span className="ms-auto badge bg-danger">{unreadCount}</span>}
                    </Link>
                    <div className="nav-user-dd-divider"></div>
                    <button className="nav-user-dd-item" style={{ color: '#ff6b6b' }} onClick={handleLogoutClick}>
                      <i className="fas fa-sign-out-alt"></i> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="d-flex gap-2 ms-2">
                <Link to="/login" className="btn btn-outline-light btn-sm"><i className="fas fa-sign-in-alt me-1"></i>Login</Link>
                <Link to="/register" className="btn btn-gold btn-sm"><i className="fas fa-user-plus me-1"></i>Register</Link>
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

        {/* Drawer Scrollable Body */}
        <div className="mobile-drawer-body">

          <div className="mobile-drawer-section-label">Navigation</div>
          {NAV_LINKS.filter(l => !user || !l.publicOnly).map(({ id, label, page, icon }) => (
            page
              ? <Link key={id} to={page} className="mobile-drawer-link" onClick={close}>
                  <i className={`fas ${icon} mobile-drawer-link-icon`}></i>{label}
                </Link>
              : <a key={id} href={`#${id}`} className="mobile-drawer-link" onClick={handleSection(id)}>
                  <i className={`fas ${icon} mobile-drawer-link-icon`}></i>{label}
                </a>
          ))}

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
              {USER_LINKS.map(({ to, icon, label, badge }) => (
                <Link key={to} to={to} className="mobile-drawer-link" onClick={close}>
                  <i className={`fas ${icon} mobile-drawer-link-icon`}></i>
                  {label}
                  {badge && unreadCount > 0 && (
                    <span className="mobile-drawer-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
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

        {/* Drawer Footer — Logout always visible */}
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
