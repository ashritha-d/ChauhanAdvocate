import { useSite } from '../context/SiteContext';
import { mediaUrl } from '../utils/helpers';

const SOCIALS = [
  { key: 'social_facebook', icon: 'fab fa-facebook-f' },
  { key: 'social_twitter', icon: 'fab fa-twitter' },
  { key: 'social_linkedin', icon: 'fab fa-linkedin-in' },
  { key: 'social_instagram', icon: 'fab fa-instagram' },
];

export default function Profile() {
  const { settings: s } = useSite();

  return (
    <section id="profile" className="section-padding profile-section">
      <div className="container">
        <div className="text-center mb-5" data-aos="fade-up">
          <div className="section-label" style={{ color: 'rgba(201,168,76,0.8)' }}>Meet The Advocate</div>
          <h2 className="section-title text-white">Professional <span className="text-gold">Profile</span></h2>
        </div>
        <div className="row align-items-center g-5">
          <div className="col-lg-4 text-center" data-aos="fade-right">
            <div className="profile-card">
              <div className="profile-image-wrap mx-auto">
                <img
                  src={mediaUrl(s.advocate_photo) || 'https://via.placeholder.com/160x160/c9a84c/fff?text=AC'}
                  alt={s.advocate_name || 'Advocate'}
                  className="profile-photo"
                  onError={e => { e.target.src = 'https://via.placeholder.com/160x160/c9a84c/fff?text=AC'; }}
                />
              </div>
              <h3 className="profile-name mt-4">{s.advocate_name || 'Adv. Rajesh Chauhan'}</h3>
              <p className="profile-designation">{s.advocate_designation || 'Senior Advocate, High Court'}</p>
              <div className="profile-badges mt-3">
                <span className="badge-pill"><i className="fas fa-certificate me-1"></i> Bar Council Member</span>
                <span className="badge-pill"><i className="fas fa-star me-1"></i> Senior Advocate</span>
              </div>
              <div className="profile-social-links mt-4">
                {SOCIALS.filter(soc => s[soc.key]).map(soc => (
                  <a key={soc.key} href={s[soc.key]} target="_blank" rel="noreferrer">
                    <i className={soc.icon}></i>
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="col-lg-8" data-aos="fade-left">
            <div className="profile-content">
              <h4 className="mb-3 fw-bold text-white">About the Advocate</h4>
              <p className="mb-4" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {s.advocate_bio || 'With over 15 years of dedicated legal practice, Advocate Chauhan has successfully represented thousands of clients across various courts in India.'}
              </p>
              <div className="row g-4">
                {[
                  { icon: 'fas fa-graduation-cap', title: 'Education', text: 'LL.B. from University of Delhi\nLL.M. in Constitutional Law' },
                  { icon: 'fas fa-trophy', title: 'Achievements', text: 'Best Advocate Award 2020\nSupreme Court Senior Designation' },
                  { icon: 'fas fa-gavel', title: 'Specialization', text: 'Criminal, Civil, Family\n& Corporate Law' },
                  { icon: 'fas fa-language', title: 'Languages', text: 'English, Hindi\nPunjabi, Urdu' },
                ].map(({ icon, title, text }) => (
                  <div className="col-md-6" key={title}>
                    <div className="expertise-card">
                      <i className={`${icon} text-gold`}></i>
                      <h5>{title}</h5>
                      <p>{text.split('\n').map((t, i) => <span key={i}>{t}{i === 0 && <br />}</span>)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
