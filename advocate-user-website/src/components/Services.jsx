import { useEffect, useState } from 'react';
import { getServices } from '../api';

const FALLBACK = [
  { _id:'1', title:'Criminal Defense', icon:'fas fa-gavel', shortDescription:'Expert criminal defense across all courts including bail applications and trial representation.' },
  { _id:'2', title:'Civil Litigation', icon:'fas fa-balance-scale', shortDescription:'Handling all civil litigation including property disputes, contract enforcement and money recovery.' },
  { _id:'3', title:'Family Law', icon:'fas fa-users', shortDescription:'Comprehensive family law services covering divorce, custody, maintenance and matrimonial matters.' },
  { _id:'4', title:'Corporate Law', icon:'fas fa-building', shortDescription:'Corporate legal services including company formation, contracts, compliance and commercial disputes.' },
  { _id:'5', title:'Property Law', icon:'fas fa-home', shortDescription:'Property law services including title verification, transactions and real estate disputes.' },
  { _id:'6', title:'Constitutional Law', icon:'fas fa-scroll', shortDescription:'Writ petitions, PIL filings and constitutional matters before High Courts and Supreme Court.' },
];

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <div className="row g-4">
          {loading ? (
            <div className="col-12 text-center py-5">
              <div className="spinner-border spinner-gold" role="status"></div>
            </div>
          ) : services.map((s, i) => (
            <div className="col-lg-4 col-md-6" key={s._id} data-aos="fade-up" data-aos-delay={i * 80}>
              <div className="service-card">
                <div className="service-icon"><i className={s.icon || 'fas fa-balance-scale'}></i></div>
                <h5>{s.title}</h5>
                <p>{s.shortDescription || (s.description ? s.description.substring(0, 120) + '...' : '')}</p>
                {s.features?.length > 0 && (
                  <ul className="service-features mt-3">
                    {s.features.slice(0, 4).map(f => <li key={f}>{f}</li>)}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
