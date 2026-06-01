import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navRef = useRef(null);
  const { user, logout, unreadCount } = useUserAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = e => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMenuOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const close = () => { setMenuOpen(false); setUserMenuOpen(false); };

  const handleLogout = () => {
    logout();
    close();
    navigate('/');
  };

  const links = ['home', 'services', 'testimonials', 'blog', 'faq', 'contact'];

  return (
    <nav
      ref={navRef}
      className={`navbar navbar-dark fixed-top ${scrolled ? 'scrolled' : ''}`}
      id="mainNavbar"
    >
      <div className="container">
        {/* Hamburger — mobile only */}
        <button
          className={`hamburger d-lg-none ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle navigation"
          type="button"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Logo */}
        <a className="navbar-brand navbar-logo d-flex align-items-center" href="#home">
          <img
            src={`${import.meta.env.BASE_URL}logo.jpeg`}
            alt="Advocate Chauhan Logo"
            style={{ height: '44px', objectFit: 'contain' }}
          />
        </a>

        {/* Book button + notification — mobile only */}
        <div className="d-lg-none d-flex align-items-center gap-2">
          {user && (
            <Link to="/profile?tab=notifications" className="navbar-notif-btn" onClick={close}>
              <i className="fas fa-bell"></i>
              {unreadCount > 0 && <span className="navbar-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </Link>
          )}
          <a href="#appointment" className="btn btn-gold mobile-appt-btn book-appointment-btn" onClick={close}>
            <i className="fas fa-calendar-check"></i>
            <span className="mobile-appt-label"> Book</span>
          </a>
        </div>

        {/* Desktop nav */}
        <div className="d-none d-lg-flex ms-auto align-items-center gap-1">
          {links.map(l => (
            <a key={l} className="nav-link" href={`#${l}`}>
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </a>
          ))}
          <a href="#appointment" className="btn btn-gold ms-2">
            Book Appointment
          </a>

          {/* Auth buttons — desktop */}
          {user ? (
            <div className="nav-user-menu ms-2">
              <button
                className="nav-user-btn"
                onClick={() => setUserMenuOpen(o => !o)}
              >
                {user.profilePhoto
                  ? <img src={user.profilePhoto} alt={user.name} className="nav-user-avatar" />
                  : <div className="nav-user-initial">{user.name.charAt(0).toUpperCase()}</div>
                }
                <span className="nav-user-name">{user.name.split(' ')[0]}</span>
                {unreadCount > 0 && <span className="navbar-notif-badge-sm">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                <i className="fas fa-chevron-down ms-1" style={{ fontSize: '0.65rem', opacity: 0.6 }}></i>
              </button>

              {userMenuOpen && (
                <div className="nav-user-dropdown">
                  <Link to="/profile" className="nav-user-dd-item" onClick={close}>
                    <i className="fas fa-user-circle"></i> My Profile
                  </Link>
                  <Link to="/profile?tab=appointments" className="nav-user-dd-item" onClick={close}>
                    <i className="fas fa-calendar-alt"></i> My Appointments
                  </Link>
                  <Link to="/profile?tab=orders" className="nav-user-dd-item" onClick={close}>
                    <i className="fas fa-book"></i> My Orders
                  </Link>
                  <Link to="/profile?tab=notifications" className="nav-user-dd-item" onClick={close}>
                    <i className="fas fa-bell"></i> Notifications
                    {unreadCount > 0 && <span className="ms-auto badge bg-danger">{unreadCount}</span>}
                  </Link>
                  <div className="nav-user-dd-divider"></div>
                  <button className="nav-user-dd-item text-danger" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="d-flex gap-2 ms-2">
              <Link to="/login" className="btn btn-outline-light btn-sm">
                <i className="fas fa-sign-in-alt me-1"></i>Login
              </Link>
              <Link to="/register" className="btn btn-gold btn-sm">
                <i className="fas fa-user-plus me-1"></i>Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile dropdown */}
        <div className={`nav-links d-lg-none ${menuOpen ? 'active' : ''}`}>
          {links.map(l => (
            <a key={l} className="nav-link" href={`#${l}`} onClick={close}>
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </a>
          ))}
          <div className="nav-links-divider"></div>
          {user ? (
            <>
              <Link to="/profile" className="nav-link" onClick={close}>
                <i className="fas fa-user-circle me-2"></i>My Profile
              </Link>
              <Link to="/profile?tab=appointments" className="nav-link" onClick={close}>
                <i className="fas fa-calendar-alt me-2"></i>My Appointments
              </Link>
              <Link to="/profile?tab=orders" className="nav-link" onClick={close}>
                <i className="fas fa-book me-2"></i>My Orders
              </Link>
              <Link to="/profile?tab=notifications" className="nav-link" onClick={close}>
                <i className="fas fa-bell me-2"></i>Notifications
                {unreadCount > 0 && <span className="badge bg-danger ms-2">{unreadCount}</span>}
              </Link>
              <button className="nav-link text-start w-100" style={{ color: '#ff6b6b !important', background: 'none', border: 'none', cursor: 'pointer' }} onClick={handleLogout}>
                <i className="fas fa-sign-out-alt me-2"></i>Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={close}>
                <i className="fas fa-sign-in-alt me-2"></i>Login
              </Link>
              <Link to="/register" className="nav-link" onClick={close}>
                <i className="fas fa-user-plus me-2"></i>Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
