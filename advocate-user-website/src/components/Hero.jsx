import { useState } from 'react';
import { useSite } from '../context/SiteContext';
import { useUserAuth } from '../context/UserAuthContext';
import { useNavigate } from 'react-router-dom';
import { mediaUrl } from '../utils/helpers';
import { savePendingAction } from '../utils/pendingAction';
import useCounter from '../hooks/useCounter';

const G = ({ children }) => (
  <span style={{ color: 'var(--gold, #c9a84c)', fontWeight: 700 }}>{children}</span>
);

const BIO_PARAS = [
  <>
    <b>Advocate Srinivas Chauhan</b> is a prominent legal practitioner, author, and digital educator dedicated to public legal awareness. Rising from a humble middle-class background, his journey reflects academic excellence, perseverance, and social responsibility.
  </>,
  <>
    As a top-performing student, he was honoured by state ministers and district dignitaries for his outstanding academic achievements. He successfully completed his <G>Master of Business Administration (MBA)</G> and served as an <G>Assistant Professor</G>, inspiring students through education and mentorship.
  </>,
  <>
    Driven by a passion to empower young people, he conducted numerous free motivational and career guidance seminars across educational institutions. To make quality educational resources accessible, he established <G>Balu Publications</G> in honour of his father, publishing <G>more than 62 books</G> covering education, careers, and practical knowledge.
  </>,
  <>
    His true calling emerged in the legal profession, and he graduated from the prestigious <G>Osmania University</G>. He entered legal practice with a clear mission — to simplify complex legal concepts and make justice more accessible to the common public.
  </>,
  <>
    Today, he provides expert legal services including drafting legal notices, reply notices, agreements, contracts, and legal documentation. He has extensive experience handling <G>property disputes, financial matters, family law, civil litigation, and corporate legal issues</G>, delivering practical and result-oriented legal solutions.
  </>,
  <>
    Beyond the courtroom, Advocate Srinivas Chauhan has built a strong digital presence, reaching <G>over one million followers</G> across social media platforms. Through informative and engaging videos, he explains day-to-day legal issues in simple language, helping ordinary citizens understand their rights and legal responsibilities.
  </>,
  <>
    He is also committed to mentoring aspiring legal professionals by guiding junior advocates and providing practical legal guidebooks that help them build successful careers.
  </>,
  <>
    Combining legal expertise, educational excellence, integrity, and a deep commitment to public service, <b>Advocate Srinivas Chauhan</b> continues to be a trusted legal advisor and respected voice for justice across <G>Telangana and Andhra Pradesh</G>.
  </>,
];

function StatCounter({ num, label }) {
  const { count, suffix, ref } = useCounter(num, 2200);
  return (
    <div className="col-auto" ref={ref}>
      <div className="stat-item">
        <span className="stat-number">{count.toLocaleString('en-IN')}{suffix}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
}


export default function Hero() {
  const { settings: s } = useSite();
  const { user, openModal } = useUserAuth();
  const navigate = useNavigate();
  const [bioExpanded, setBioExpanded] = useState(false);

  const handleBook = (e) => {
    e.preventDefault();
    if (user) { openModal('appointment'); }
    else { savePendingAction('appointment'); navigate('/login'); }
  };

  const stats = [
    { num: s.stats_cases   || '1000+',  label: 'Cases Won' },
    { num: s.stats_clients || '10000+', label: 'Happy Clients' },
    { num: s.stats_years   || '15+',    label: 'Years Experience' },
    { num: s.stats_courts  || '100+',   label: 'Courts Covered' },
  ];

  const advocateName = s.advocate_name       || 'Srinivas Chauhan Advocate';
  const designation  = s.advocate_designation || 'MBA, M.Sc & LL.B';
  const enrollment   = s.advocate_enrollment  || '';

  return (
    <section id="home" className="hero-section d-flex">
      <div className="hero-overlay"></div>
      <div className="container position-relative" style={{ zIndex: 2 }}>
        <div className="row align-items-center">

          <div className="col-lg-7" data-aos="fade-right" data-aos-duration="1000">
            <h1 className="hero-title display-3 fw-bold mb-4">
              {s.hero_title || 'Your Trusted'} <span className="text-gold">Legal Advocate</span>
            </h1>
            {/* ── Biography ── */}
            <div className="hero-bio" style={{ maxWidth: 660, marginBottom: '1.8rem' }}>
              {/* Always-visible paragraphs */}
              {BIO_PARAS.slice(0, 2).map((para, i) => (
                <p key={i} className="hero-bio-para">{para}</p>
              ))}

              {/* Collapsible paragraphs */}
              <div
                className="hero-bio-extra"
                style={{
                  maxHeight: bioExpanded ? '1000px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.55s cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                {BIO_PARAS.slice(2).map((para, i) => (
                  <p key={i} className="hero-bio-para">{para}</p>
                ))}
              </div>

              <button
                onClick={() => setBioExpanded(x => !x)}
                className="hero-bio-toggle"
              >
                {bioExpanded ? (
                  <><i className="fas fa-chevron-up me-1"></i>Read Less</>
                ) : (
                  <><i className="fas fa-chevron-down me-1"></i>Read More</>
                )}
              </button>
            </div>

            <div className="d-flex flex-wrap gap-3 justify-content-center justify-content-lg-start">
              <button className="btn btn-gold btn-lg px-5" onClick={handleBook}>
                <i className="fas fa-calendar-check me-2"></i>Book a Consultation
              </button>
              <a href="#services" className="btn btn-outline-light btn-lg px-5">
                <i className="fas fa-briefcase me-2"></i>Our Services
              </a>
            </div>

            <div className="hero-stats row g-3 mt-5">
              {stats.map(({ num, label }) => (
                <StatCounter key={label} num={num} label={label} />
              ))}
            </div>
          </div>

          <div className="col-lg-5 text-center mt-5 mt-lg-0" data-aos="fade-left" data-aos-duration="1000">
            <div className="hero-image-wrap">
              <img
                src={s.advocate_photo ? mediaUrl(s.advocate_photo) : (import.meta.env.BASE_URL + 'adv-photo.jpeg')}
                alt={advocateName}
                className="hero-img"
                onError={e => { e.target.src = import.meta.env.BASE_URL + 'placeholder-lawyer.svg'; }}
              />
            </div>

            <div className="advocate-profile-card" data-aos="fade-up" data-aos-delay="300">
              <div className="advocate-profile-name">{advocateName}</div>
              <div className="advocate-profile-desig">{designation}</div>
              {enrollment && (
                <>
                  <div className="advocate-profile-divider"></div>
                  <div className="advocate-profile-details">
                    <div className="advocate-profile-item">
                      <i className="fas fa-id-card"></i>
                      <span>Enroll No: {enrollment}</span>
                    </div>
                  </div>
                </>
              )}
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
