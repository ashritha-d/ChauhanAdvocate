import { useSite } from '../context/SiteContext';

export default function About() {
  const { settings: s } = useSite();
  const stats = [
    { num: s.stats_cases || '500+', lbl: 'Cases Won' },
    { num: s.stats_clients || '1000+', lbl: 'Clients' },
    { num: s.stats_years || '15+', lbl: 'Years' },
    { num: s.stats_courts || '50+', lbl: 'Courts' },
  ];
  return (
    <section id="about" className="section-padding bg-white">
      <div className="container">
        <div className="row align-items-center g-5">
          <div className="col-lg-5" data-aos="fade-right">
            <div className="about-image-wrap">
              <img
                src="https://via.placeholder.com/480x420/1a1a2e/c9a84c?text=Law+Office"
                alt="Law Office"
                className="about-img rounded-4 shadow-lg"
              />
              <div className="about-badge-box">
                <div className="about-badge">
                  <span className="badge-num">{s.stats_years || '15+'}</span>
                  <span className="badge-text">Years of Excellence</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-7" data-aos="fade-left">
            <div className="section-label">About Our Firm</div>
            <h2 className="section-title">Committed to Justice,<br /><span className="text-gold">Dedicated to You</span></h2>
            <p className="lead text-muted mb-4">
              {s.about_content || 'We are a premier law firm providing comprehensive legal services with a commitment to excellence and client satisfaction.'}
            </p>
            <div className="about-features">
              {[
                'Personalized legal strategies for every client',
                'Transparent communication throughout the process',
                'Proven track record in High Courts and Supreme Court',
                'Free initial consultation for all cases',
              ].map(f => (
                <div className="feature-item" key={f}>
                  <i className="fas fa-check-circle text-gold"></i>
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <div className="row g-3 mt-4">
              {stats.map(({ num, lbl }) => (
                <div className="col-6 col-md-3" key={lbl}>
                  <div className="stat-card text-center">
                    <div className="stat-num">{num}</div>
                    <div className="stat-lbl">{lbl}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
