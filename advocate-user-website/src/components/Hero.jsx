import { useSite } from '../context/SiteContext';
import { useUserAuth } from '../context/UserAuthContext';
import { useNavigate } from 'react-router-dom';
import { mediaUrl } from '../utils/helpers';
import { savePendingAction } from '../utils/pendingAction';
import useCounter from '../hooks/useCounter';

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

function HeroSkeleton() {
  return (
    <>
      <style>{`
        @keyframes heroPulse {
          0%,100% { opacity:.65; } 50% { opacity:.3; }
        }
        .hsk { background:rgba(255,255,255,.13); border-radius:8px; animation:heroPulse 1.6s ease-in-out infinite; }
      `}</style>
      <section id="home" className="hero-section d-flex">
        <div className="hero-overlay"></div>
        <div className="container position-relative" style={{ zIndex:2 }}>
          <div className="row align-items-center">
            <div className="col-lg-7">
              <div className="hsk" style={{ height:56, width:'62%', marginBottom:18 }}></div>
              <div className="hsk" style={{ height:56, width:'44%', marginBottom:28 }}></div>
              <div className="hsk" style={{ height:20, width:'92%', marginBottom:10 }}></div>
              <div className="hsk" style={{ height:20, width:'72%', marginBottom:44 }}></div>
              <div className="d-flex gap-3">
                <div className="hsk" style={{ height:52, width:205, borderRadius:50 }}></div>
                <div className="hsk" style={{ height:52, width:175, borderRadius:50 }}></div>
              </div>
              <div className="hero-stats row g-3 mt-5">
                {[140,130,120,140].map((w,i) => (
                  <div className="col-auto" key={i}>
                    <div className="hsk" style={{ height:44, width:w, borderRadius:8 }}></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-lg-5 text-center mt-5 mt-lg-0">
              <div className="hsk" style={{ width:270, height:330, borderRadius:16, margin:'0 auto' }}></div>
              <div className="hsk" style={{ height:72, borderRadius:12, marginTop:20 }}></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function Hero() {
  const { settings: s, loading } = useSite();
  const { user, openModal } = useUserAuth();
  const navigate = useNavigate();

  if (loading) return <HeroSkeleton />;

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
            <p className="hero-subtitle lead mb-5">
              {s.hero_subtitle || 'Expert legal representation across criminal, civil, family and corporate law. Your rights, our commitment.'}
            </p>
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
                src={s.advocate_photo ? mediaUrl(s.advocate_photo) : (import.meta.env.BASE_URL + 'advocate.jpeg')}
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
