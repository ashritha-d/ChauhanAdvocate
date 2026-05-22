import { useEffect, useState } from 'react';
import { getFAQs } from '../api';

const FALLBACK = [
  { _id:'1', question:'What areas of law do you specialize in?', answer:'We specialize in criminal law, civil litigation, family law, property law, corporate law, and constitutional law.' },
  { _id:'2', question:'How can I book a consultation?', answer:"You can book a free consultation through our website's appointment form, by calling us directly, or by visiting our office during business hours (Mon-Sat, 9AM-7PM)." },
  { _id:'3', question:'What documents should I bring for my first consultation?', answer:'Please bring any relevant documents related to your case such as FIR copies, property documents, court notices, contracts, or any other relevant paperwork.' },
  { _id:'4', question:'How long will my case take?', answer:'Case duration depends on the type and complexity of your matter. We will give you a realistic timeline after reviewing your case.' },
  { _id:'5', question:'What are your fees?', answer:'We offer a free initial consultation. After reviewing your case, we provide transparent fee structures with no hidden charges.' },
  { _id:'6', question:'Do you handle cases outside Delhi?', answer:'Yes, we handle cases in High Courts across India and the Supreme Court. We have an extensive network of associate advocates.' },
];

export default function FAQs() {
  const [faqs, setFaqs] = useState([]);

  useEffect(() => {
    getFAQs()
      .then(r => setFaqs(r.data.success && r.data.data.length ? r.data.data : FALLBACK))
      .catch(() => setFaqs(FALLBACK));
  }, []);

  return (
    <section id="faq" className="section-padding bg-light">
      <div className="container">
        <div className="row g-5 align-items-start">
          <div className="col-lg-4" data-aos="fade-right">
            <div className="section-label">Common Questions</div>
            <h2 className="section-title">Frequently Asked <span className="text-gold">Questions</span></h2>
            <p className="text-muted">Find answers to the most common legal questions. Can't find what you're looking for? Contact us directly.</p>
            <a href="#contact" className="btn btn-gold mt-3">Ask a Question</a>
          </div>
          <div className="col-lg-8" data-aos="fade-left">
            <div className="accordion accordion-flush" id="faqAccordion">
              {faqs.map((f, i) => (
                <div className="accordion-item" key={f._id}>
                  <h2 className="accordion-header">
                    <button
                      className={`accordion-button ${i !== 0 ? 'collapsed' : ''}`}
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#faq${i}`}
                    >
                      {f.question}
                    </button>
                  </h2>
                  <div id={`faq${i}`} className={`accordion-collapse collapse ${i === 0 ? 'show' : ''}`} data-bs-parent="#faqAccordion">
                    <div className="accordion-body">{f.answer}</div>
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
