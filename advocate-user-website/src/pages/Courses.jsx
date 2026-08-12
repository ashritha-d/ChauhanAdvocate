import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { getPublicCourses } from '../api';
import { COURSE_CATEGORY_LIST } from '../utils/courseCategories';
import { getEffectivePrice } from '../utils/helpers';

export default function Courses() {
  const [stats, setStats] = useState(null); // { [programType]: { count, startingPrice, duration } }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicCourses()
      .then(r => {
        if (!r.data.success) return;
        const byCategory = {};
        r.data.data.forEach(c => {
          const key = c.programType || 'training';
          if (!byCategory[key]) byCategory[key] = { count: 0, startingPrice: null, duration: '' };
          byCategory[key].count += 1;
          const price = getEffectivePrice(c);
          if (byCategory[key].startingPrice === null || price < byCategory[key].startingPrice) {
            byCategory[key].startingPrice = price;
          }
          // Real admin-entered duration from the first course that has one set —
          // courses within a category are rarely wildly different in length, and
          // this avoids inventing a made-up "typical duration" figure.
          if (!byCategory[key].duration && c.duration) byCategory[key].duration = c.duration;
        });
        setStats(byCategory);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="courses" className="section-padding" style={{ background: 'var(--darker)', paddingTop: '2rem' }}>
      <SEOHead
        title="Our Courses"
        description="Choose the learning path that matches your career goals — Internship Program, Junior Advocate Training, or Judiciary Exam Preparation."
        canonical="/courses"
      />
      <div className="container">
        <h1 className="visually-hidden">Our Learning Programs</h1>

        <div className="row g-4 justify-content-center">
          {COURSE_CATEGORY_LIST.map((cat, i) => {
            const st = stats?.[cat.key];
            return (
              <div className="col-lg-4 col-md-6" key={cat.key} data-aos="fade-up" data-aos-delay={i * 100}>
                <Link to={`/courses/category/${cat.key}`} className="course-category-card">
                  <div className="course-category-icon"><i className={cat.icon}></i></div>
                  <h4 className="course-category-title">{cat.shortTitle}</h4>
                  <p className="course-category-desc">{cat.description}</p>
                  <div className="course-category-stats">
                    {loading ? (
                      <span className="skeleton-shimmer" style={{ display: 'inline-block', height: 14, width: 100, borderRadius: 4 }} />
                    ) : st ? (
                      <>
                        <span><i className="fas fa-graduation-cap me-1"></i>{st.count} course{st.count !== 1 ? 's' : ''}</span>
                        {st.duration && <span><i className="fas fa-clock me-1"></i>{st.duration}</span>}
                        <span><i className="fas fa-rupee-sign me-1"></i>From {st.startingPrice === 0 ? 'Free' : `₹${st.startingPrice}`}</span>
                      </>
                    ) : (
                      <span>Coming Soon</span>
                    )}
                  </div>
                  <span className="course-category-cta">{cat.buttonLabel}<i className="fas fa-arrow-right ms-2"></i></span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
