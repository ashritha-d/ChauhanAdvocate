import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import usePolling from '../hooks/usePolling';
import SEOHead from '../components/SEOHead';
import { getPublicCourses, getMyEnrollments } from '../api';
import { useUserAuth } from '../context/UserAuthContext';
import CourseCard from '../components/CourseCard';
import CourseEnrollModal from '../components/CourseEnrollModal';
import CoursePreviewModal from '../components/CoursePreviewModal';
import { COURSE_CATEGORIES } from '../utils/courseCategories';

export default function CourseCategoryListing() {
  const { programType } = useParams();
  const category = COURSE_CATEGORIES[programType];
  const { user, authHeader } = useUserAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slowLoad, setSlowLoad] = useState(false);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [previewCourse, setPreviewCourse] = useState(null);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  const fetchCourses = () => {
    setLoading(true);
    setSlowLoad(false);
    const slowTimer = setTimeout(() => setSlowLoad(true), 5000);
    getPublicCourses(programType)
      .then(r => { if (r.data.success) setCourses(r.data.data); })
      .catch(() => {
        setTimeout(() => {
          getPublicCourses(programType)
            .then(r => { if (r.data.success) setCourses(r.data.data); })
            .catch(() => {})
            .finally(() => setLoading(false));
        }, 10000);
        return;
      })
      .finally(() => { clearTimeout(slowTimer); setLoading(false); });
  };

  useEffect(() => { if (category) fetchCourses(); }, [programType]);
  usePolling(fetchCourses, 60000);

  useEffect(() => {
    if (!user) { setEnrolledIds(new Set()); return; }
    getMyEnrollments(authHeader())
      .then(r => {
        if (r.data?.success) {
          const ids = r.data.data
            .filter(e => e.paymentStatus === 'paid')
            .map(e => e.courseId?._id)
            .filter(Boolean);
          setEnrolledIds(new Set(ids));
        }
      })
      .catch(() => {});
  }, [user]);

  if (!category) return <Navigate to="/courses" replace />;

  const handlePayNow = (course) => {
    setPreviewCourse(null);
    setSelectedCourse(course);
  };

  const visibleCourses = courses.filter(c => {
    if (levelFilter && c.level !== levelFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.title?.toLowerCase().includes(q) || c.category?.toLowerCase().includes(q) || c.instructor?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <section id="course-category" className="section-padding" style={{ background: 'var(--darker)' }}>
      <SEOHead
        title={category.title}
        description={category.description}
        canonical={`/courses/category/${programType}`}
      />
      <div className="container">
        <Link to="/courses" className="course-details-back" style={{ color: 'rgba(255,255,255,0.6)' }}>
          <i className="fas fa-arrow-left me-2"></i>Back to All Categories
        </Link>

        <div className="text-center mb-5 mt-3" data-aos="fade-up">
          <div className="course-category-icon-lg"><i className={category.icon}></i></div>
          <h2 className="section-title" style={{ color: '#fff' }}>{category.shortTitle}</h2>
          <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.65)', maxWidth: 640, margin: '0 auto' }}>{category.description}</p>
        </div>

        <div className="d-flex gap-2 flex-wrap justify-content-center mb-4">
          <input
            className="form-control form-control-sm"
            style={{ maxWidth: 260, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
            placeholder="Search courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 180, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value)}
          >
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {loading ? (
          <div className="row g-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="col-xl-3 col-lg-4 col-md-6 col-12">
                <div className="course-card">
                  <div className="course-card-thumb"><div className="skeleton-shimmer" style={{ position: 'absolute', inset: 0 }} /></div>
                  <div className="course-card-body">
                    <div className="skeleton-shimmer" style={{ height: 18, width: '85%', borderRadius: 4 }} />
                    <div className="skeleton-shimmer" style={{ height: 13, width: '95%', borderRadius: 4, marginTop: 8 }} />
                  </div>
                </div>
              </div>
            ))}
            {slowLoad && (
              <div className="col-12 text-center mt-3">
                <p className="small mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Server is starting up, please wait a moment…</p>
                <button className="btn btn-sm btn-outline-light" onClick={fetchCourses}><i className="fas fa-redo me-1"></i>Retry Now</button>
              </div>
            )}
          </div>
        ) : visibleCourses.length === 0 ? (
          <div className="text-center py-5">
            <i className={`${category.icon} fa-3x mb-3`} style={{ color: 'var(--gold)' }}></i>
            <h5 style={{ color: '#fff' }}>No Courses Available Yet</h5>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>
              {courses.length === 0 ? 'We are preparing courses for this program. Stay tuned!' : 'No courses match your search/filter.'}
            </p>
          </div>
        ) : (
          <div className="row g-4">
            {visibleCourses.map((course, i) => (
              <div key={course._id} className="col-xl-3 col-lg-4 col-md-6 col-12" data-aos="fade-up" data-aos-delay={i * 80}>
                <CourseCard
                  course={course}
                  enrolled={enrolledIds.has(course._id)}
                  onEnroll={() => setSelectedCourse(course)}
                  onPreview={() => setPreviewCourse(course)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCourse && (
        <CourseEnrollModal course={selectedCourse} onClose={() => setSelectedCourse(null)} />
      )}
      {previewCourse && (
        <CoursePreviewModal
          course={previewCourse}
          onClose={() => setPreviewCourse(null)}
          onPayNow={() => handlePayNow(previewCourse)}
        />
      )}
    </section>
  );
}
