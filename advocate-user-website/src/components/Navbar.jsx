import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { savePendingAction } from '../utils/pendingAction';

// Dedicated pages: News, Courses, Gallery. All others are home-page anchors.
const NAV_LINKS = [
  { id: 'home',     label: 'Home',     page: null },
  { id: 'services', label: 'Services', page: null },
  { id: 'news',     label: 'News',     page: '/news' },
  { id: 'courses',  label: 'Courses',  page: '/courses' },
  { id: 'gallery',  label: 'Gallery',  page: '/gallery' },
  { id: 'blog',     label: 'Blog',     page: null },
  { id: 'faq',      label: 'FAQ',      page: null },
  { id: 'contact',  label: 'Contact',  page: null },
];

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navRef = useRef(null);
  const { user, logout, unreadCount, openModal } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  // Works from ANY page — home: smooth scroll; elsewhere: full nav to hash
  const handleSection = (id) => (e) => {
    e.preventDefault();
    close();
    const base = import.meta.env.BASE_URL; // '/ChauhanAdvocate/'
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
    if (user) {
      // Logged in: open modal directly
      openModal('appointment');
    } else {
      // Guest: save intent, navigate to login
      savePendingAction('appointment');
      navigate('/login');
    }
  };

  return (
    <nav
      ref={navRef}
      className={`navbar navbar-dark fixed-top ${scrolled ? 'scrolled' : ''}`}
      id="mainNavbar"
    >
      <div className="container">

        {/* Logo — left on mobile */}
        <a
          className="navbar-brand navbar-logo d-flex align-items-center"
          href={import.meta.env.BASE_URL}
          onClick={handleSection('home')}
        >
          <img
            src={`${import.meta.env.BASE_URL}logo.jpeg`}
            alt="Advocate Chauhan Logo"
            style={{ height: '44px', objectFit: 'contain' }}
          />
        </a>

        {/* Mobile: Book button centered + optional notification bell */}
        <div className="d-lg-none mobile-nav-center">
          {user && (
            <Link to="/profile?tab=notifications" className="navbar-notif-btn me-1" onClick={close}>
              <i className="fas fa-bell"></i>
              {unreadCount > 0 && <span className="navbar-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </Link>
          )}
          <a href="#appointment" className="btn btn-gold mobile-appt-btn" onClick={handleAppointment}>
            Book an Appointment
          </a>
        </div>

        {/* Hamburger — right on mobile */}
        <button
          className={`hamburger d-lg-none ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle navigation"
          type="button"
        >
          <span></span><span></span><span></span>
        </button>

        {/* Desktop nav */}
        <div className="d-none d-lg-flex ms-auto align-items-center gap-1">
          {NAV_LINKS.map(({ id, label, page }) => (
            page
              ? <Link key={id} to={page} className={`nav-link ${location.pathname === page ? 'active' : ''}`} onClick={close}>{label}</Link>
              : <a key={id} className="nav-link" href={`#${id}`} onClick={handleSection(id)}>{label}</a>
          ))}
          <a href="#appointment" className="btn btn-gold ms-2" onClick={handleAppointment}>
            Book an Appointment
          </a>

          {/* Auth — desktop */}
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
                  {/* Profile card */}
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
                      <span className={`badge ${user.isActive ? 'bg-success' : 'bg-secondary'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <small>Member since {formatDate(user.createdAt)}</small>
                    </div>
                  </div>

                  <div className="nav-user-dd-divider"></div>

                  <Link to="/profile?tab=settings" className="nav-user-dd-item" onClick={close}>
                    <i className="fas fa-user-cog"></i> Profile Settings
                  </Link>
                  <Link to="/profile?tab=notifications" className="nav-user-dd-item" onClick={close}>
                    <i className="fas fa-bell"></i> Notifications
                    {unreadCount > 0 && <span className="ms-auto badge bg-danger">{unreadCount}</span>}
                  </Link>

                  <div className="nav-user-dd-divider"></div>

                  <button className="nav-user-dd-item" style={{ color: '#ff6b6b' }} onClick={handleLogout}>
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

        {/* Mobile dropdown menu */}
        <div className={`nav-links d-lg-none ${menuOpen ? 'active' : ''}`}>
          {NAV_LINKS.map(({ id, label, page }) => (
            page
              ? <Link key={id} to={page} className="nav-link" onClick={close}>{label}</Link>
              : <a key={id} className="nav-link" href={`#${id}`} onClick={handleSection(id)}>{label}</a>
          ))}
          <a className="nav-link" href="#appointment" onClick={handleAppointment}>
            <i className="fas fa-calendar-check me-2"></i>Book an Appointment
          </a>

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
              <button
                className="nav-link text-start w-100"
                style={{ color: '#ff6b6b', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={handleLogout}
              >
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
