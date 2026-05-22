import { useEffect, useRef, useState } from 'react';
import { getTestimonials } from '../api';
import { mediaUrl } from '../utils/helpers';

const FALLBACK = [
  { _id:'1', name:'Ramesh Kumar', designation:'Business Owner', rating:5, message:'Advocate Chauhan handled my property dispute with utmost professionalism. Highly recommend!' },
  { _id:'2', name:'Priya Sharma', designation:'Teacher', rating:5, message:'Got a fair settlement in my divorce case thanks to the expert guidance. Very supportive team.' },
  { _id:'3', name:'Anil Verma', designation:'Engineer', rating:5, message:'My criminal case was handled expertly. Got bail within 24 hours. Dismissed in 3 hearings!' },
  { _id:'4', name:'Sunita Devi', designation:'Homemaker', rating:5, message:'Best advocate for family matters. Resolved our custody issue sensitively and quickly.' },
  { _id:'5', name:'Deepak Mehta', designation:'Businessman', rating:5, message:'Corporate legal advice was invaluable. Saved our company from a major contractual dispute.' },
  { _id:'6', name:'Kavita Singh', designation:'Doctor', rating:5, message:'Very thorough and knowledgeable. Explained everything clearly throughout the process.' },
];

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [current, setCurrent] = useState(0);
  const [spv, setSpv] = useState(3);
  const timerRef = useRef(null);

  useEffect(() => {
    getTestimonials()
      .then(r => setTestimonials(r.data.success && r.data.data.length ? r.data.data : FALLBACK))
      .catch(() => setTestimonials(FALLBACK));
  }, []);

  useEffect(() => {
    const update = () => setSpv(window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1);
    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!testimonials.length) return;
    timerRef.current = setInterval(() => {
      setCurrent(c => {
        const max = Math.max(0, testimonials.length - spv);
        return c >= max ? 0 : c + 1;
      });
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [testimonials, spv]);

  const max = Math.max(0, testimonials.length - spv);
  const prev = () => setCurrent(c => Math.max(0, c - 1));
  const next = () => setCurrent(c => Math.min(max, c + 1));

  return (
    <section id="testimonials" className="section-padding bg-light">
      <div className="container">
        <div className="text-center mb-5" data-aos="fade-up">
          <div className="section-label">What Clients Say</div>
          <h2 className="section-title">Client <span className="text-gold">Testimonials</span></h2>
          <p className="section-subtitle">Real stories from real clients</p>
        </div>
        <div className="testimonials-slider">
          <div
            className="testimonials-track"
            style={{ transform: `translateX(-${current * (100 / spv)}%)` }}
          >
            {testimonials.map(t => (
              <div key={t._id} className="testimonial-slide" style={{ flex: `0 0 ${100 / spv}%` }}>
                <div className="testimonial-card">
                  <div className="testimonial-rating">
                    {'★'.repeat(t.rating || 5)}{'☆'.repeat(5 - (t.rating || 5))}
                  </div>
                  <p className="testimonial-text">"{t.message}"</p>
                  <div className="testimonial-author">
                    <div className="author-avatar">
                      {t.avatar
                        ? <img src={mediaUrl(t.avatar)} alt={t.name} onError={e => { e.target.style.display='none'; }} />
                        : t.name.charAt(0)
                      }
                    </div>
                    <div>
                      <div className="author-name">{t.name}</div>
                      <div className="author-designation">{t.designation || 'Client'}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="testimonial-nav">
          <button className="btn-nav" onClick={prev}><i className="fas fa-chevron-left"></i></button>
          <div className="dots-container">
            {testimonials.map((_, i) => (
              <div key={i} className={`dot ${i === current ? 'active' : ''}`} onClick={() => setCurrent(Math.min(i, max))}></div>
            ))}
          </div>
          <button className="btn-nav" onClick={next}><i className="fas fa-chevron-right"></i></button>
        </div>
      </div>
    </section>
  );
}
