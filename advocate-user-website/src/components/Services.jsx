import { useEffect, useRef, useState } from 'react';
import { getServices } from '../api';

const FALLBACK = [
  { _id:'1', title:'Criminal Defense',   icon:'fas fa-gavel',         shortDescription:'Expert criminal defense across all courts including bail applications and trial representation.' },
  { _id:'2', title:'Civil Litigation',   icon:'fas fa-balance-scale', shortDescription:'Handling all civil litigation including property disputes, contract enforcement and money recovery.' },
  { _id:'3', title:'Family Law',         icon:'fas fa-users',         shortDescription:'Sensitive and effective family legal matters.',
    features:['Divorce Proceedings','Child Custody','Maintenance','Domestic Violence and RCR (Restitution of Conjugal Rights)'] },
  { _id:'4', title:'Corporate Law',      icon:'fas fa-building',      shortDescription:'Corporate legal services including company formation, contracts, compliance and commercial disputes.' },
  { _id:'5', title:'Property Law',       icon:'fas fa-home',          shortDescription:'Expert property and real estate legal services.',
    features:['Title Verification','Sale / Purchase Deeds','Property Disputes','RERA Matters and Legal Opinion'] },
  { _id:'8', title:'Legal Opinion',      icon:'fas fa-file-alt',      shortDescription:'Professional legal opinions on property matters, contracts, business transactions and regulatory compliance to help you make informed decisions.' },
  { _id:'6', title:'Constitutional Law', icon:'fas fa-scroll',        shortDescription:'Writ petitions, PIL filings and constitutional matters before High Courts and Supreme Court.' },
];

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const trackRef = useRef(null);
  const scroll = (dir) => trackRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });

  useEffect(() => {
    getServices()
      .then(r => setServices(r.data.success && r.data.data.length ? r.data.data : FALLBACK))
      .catch(() => setServices(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="services" className="section-padding bg-light">
      <div className="container">
        <div className="text-center mb-5" data-aos="fade-up">
          <div className="section-label">Practice Areas</div>
          <h2 className="section-title">Our Legal <span className="text-gold">Services</span></h2>
          <p className="section-subtitle">Comprehensive legal services across multiple areas of law</p>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border spinner-gold" role="status"></div>
          </div>
        ) : (
          <div className="slider-outer">
            <button className="slider-scroll-btn" onClick={() => scroll(-1)} aria-label="Scroll left">&#8249;</button>
            <div className="slider-track" ref={trackRef}>
              {services.map((s, i) => (
                <div className="service-card service-card-slide" key={s._id} data-aos="fade-up" data-aos-delay={i * 70}>
                  <div className="service-icon"><i className={s.icon || 'fas fa-balance-scale'}></i></div>
                  <h5>{s.title}</h5>
                  <p>{s.shortDescription || (s.description ? s.description.substring(0, 120) + '...' : '')}</p>
                  {s.features?.length > 0 && (
                    <ul className="service-features mt-3">
                      {s.features.map(f => <li key={f}>{f}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <button className="slider-scroll-btn" onClick={() => scroll(1)} aria-label="Scroll right">&#8250;</button>
          </div>
        )}
      </div>
    </section>
  );
}
