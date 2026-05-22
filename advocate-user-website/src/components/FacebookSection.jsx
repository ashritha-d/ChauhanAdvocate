import { useSite } from '../context/SiteContext';

export default function FacebookSection() {
  const { settings: s } = useSite();
  const fbUrl = s.social_facebook || 'https://www.facebook.com/share/1B761tqcFM/';

  return (
    <section id="facebook" className="section-padding" style={{ background: 'linear-gradient(135deg, #1877f2 0%, #0d5ab9 100%)' }}>
      <div className="container">
        <div className="row align-items-center g-5">
          <div className="col-lg-5 text-white" data-aos="fade-right">
            <div className="mb-3">
              <i className="fab fa-facebook fa-3x mb-3" style={{ opacity: .9 }}></i>
            </div>
            <h2 className="fw-bold mb-3" style={{ fontSize: '2rem' }}>Follow Us on <br />Facebook</h2>
            <p style={{ opacity: .85, fontSize: '1.05rem' }}>
              Stay updated with the latest legal news, case updates, client stories, and important rights awareness posts by Advocate Chauhan.
            </p>
            <ul className="list-unstyled mt-4" style={{ opacity: .9 }}>
              {['Daily legal tips & rights awareness', 'Case updates & success stories', 'Live sessions & Q&A', 'Important court judgements'].map(item => (
                <li key={item} className="mb-2">
                  <i className="fas fa-check-circle me-2" style={{ color: '#90caf9' }}></i>{item}
                </li>
              ))}
            </ul>
            <a href={fbUrl} target="_blank" rel="noreferrer"
              className="btn btn-lg mt-3 px-5 py-3 fw-bold"
              style={{ background: '#fff', color: '#1877f2', borderRadius: 30 }}>
              <i className="fab fa-facebook me-2"></i>Like & Follow Page
            </a>
          </div>

          <div className="col-lg-7" data-aos="fade-left">
            <div className="fb-embed-wrapper" style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.3)', background: '#fff' }}>
              <iframe
                src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(fbUrl)}&tabs=timeline&width=500&height=500&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`}
                width="100%"
                height="500"
                style={{ border: 'none', overflow: 'hidden', display: 'block' }}
                scrolling="no"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                title="Facebook Page"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
