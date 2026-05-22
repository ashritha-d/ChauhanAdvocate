import { useSite } from '../context/SiteContext';
import { mediaUrl } from '../utils/helpers';

export default function Hero() {
  const { settings: s } = useSite();

  return (
    <section id="home" className="hero-section d-flex align-items-center">
      <div className="hero-overlay"></div>
      <div className="container position-relative" style={{ zIndex: 2 }}>
        <div className="row align-items-center">
          <div className="col-lg-7" data-aos="fade-right" data-aos-duration="1000">
            <div className="hero-badge mb-3">
              <i className="fas fa-gavel me-2"></i>
              <span>{s.advocate_experience ? `Trusted Legal Partner Since 2009` : 'Trusted Legal Partner'}</span>
            </div>
            <h1 className="hero-title display-3 fw-bold mb-4">
              {s.hero_title || 'Your Trusted'} <span className="text-gold">Legal Advocate</span>
            </h1>
            <p className="hero-subtitle lead mb-5">
              {s.hero_subtitle || 'Expert legal representation across criminal, civil, family & corporate law. Your rights, our commitment.'}
            </p>
            <div className="d-flex flex-wrap gap-3">
              <a href="#appointment" className="btn btn-gold btn-lg px-5">
                <i className="fas fa-calendar-check me-2"></i> Book Free Consultation
              </a>
              <a href="#services" className="btn btn-outline-light btn-lg px-5">
                <i className="fas fa-briefcase me-2"></i> Our Services
              </a>
            </div>
            <div className="hero-stats row g-3 mt-5">
              {[
                { num: s.stats_cases || '500+', label: 'Cases Won' },
                { num: s.stats_clients || '1000+', label: 'Happy Clients' },
                { num: s.stats_years || '15+', label: 'Years Experience' },
                { num: s.stats_courts || '50+', label: 'Courts' },
              ].map(({ num, label }) => (
                <div className="col-auto" key={label}>
                  <div className="stat-item">
                    <span className="stat-number">{num}</span>
                    <span className="stat-label">{label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="col-lg-5 text-center mt-5 mt-lg-0" data-aos="fade-left" data-aos-duration="1000">
            <div className="hero-image-wrap">
              <div className="hero-card-float">
                <i className="fas fa-balance-scale"></i>
                <span>Scales of Justice</span>
              </div>
              <img
                src={mediaUrl(s.advocate_photo) || '/placeholder-lawyer.svg'}
                alt={s.advocate_name || 'Advocate'}
                className="hero-img"
                onError={e => { e.target.src = 'https://via.placeholder.com/320x400/1a1a2e/c9a84c?text=Advocate'; }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="hero-scroll-indicator">
        <a href="#services"><i className="fas fa-chevron-down"></i></a>
      </div>
    </section>
  );
}
