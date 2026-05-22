import { useEffect, useState } from 'react';
import { useSite } from '../context/SiteContext';

export default function Navbar() {
  const { settings } = useSite();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = ['home','services','testimonials','blog','faq','contact'];

  return (
    <nav className={`navbar navbar-expand-lg navbar-dark fixed-top ${scrolled ? 'scrolled' : ''}`} id="mainNavbar">
      <div className="container">
        <a className="navbar-brand d-flex align-items-center gap-2" href="#home">
          <img src="/logo.jpeg" alt="Advocate Chauhan Logo" style={{ height: '60px', width: '60px', objectFit: 'contain' }} />
        </a>
        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navMenu">
          <ul className="navbar-nav ms-auto gap-1">
            {links.map(l => (
              <li className="nav-item" key={l}>
                <a className="nav-link" href={`#${l}`} onClick={() => {
                  const el = document.getElementById('navMenu');
                  const bs = window.bootstrap?.Collapse.getInstance(el);
                  bs?.hide();
                }}>{l.charAt(0).toUpperCase() + l.slice(1)}</a>
              </li>
            ))}
          </ul>
          <a href="#appointment" className="btn btn-gold ms-3">Book Appointment</a>
        </div>
      </div>
    </nav>
  );
}
