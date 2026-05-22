import { useEffect, useRef, useState } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu when clicking outside the navbar
  useEffect(() => {
    const handleClickOutside = e => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const close = () => setMenuOpen(false);
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
            src="/logo.jpeg"
            alt="Advocate Chauhan Logo"
            style={{ height: '44px', objectFit: 'contain' }}
          />
        </a>

        {/* Book button — mobile only, outside menu */}
        <a
          href="#appointment"
          className="btn btn-gold d-lg-none mobile-appt-btn book-appointment-btn"
          onClick={close}
        >
          <i className="fas fa-calendar-check"></i>
          <span className="mobile-appt-label"> Book</span>
        </a>

        {/* Desktop nav — visible only on lg+ */}
        <div className="d-none d-lg-flex ms-auto align-items-center gap-1">
          {links.map(l => (
            <a key={l} className="nav-link" href={`#${l}`}>
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </a>
          ))}
          <a href="#appointment" className="btn btn-gold ms-2">
            Book Appointment
          </a>
        </div>

        {/* Mobile dropdown */}
        <div className={`nav-links d-lg-none ${menuOpen ? 'active' : ''}`}>
          {links.map(l => (
            <a key={l} className="nav-link" href={`#${l}`} onClick={close}>
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
