import { useEffect, useState } from 'react';
import usePolling from '../hooks/usePolling';
import SEOHead from '../components/SEOHead';
import { useNavigate } from 'react-router-dom';
import { getPublicCourses } from '../api';
import { useUserAuth } from '../context/UserAuthContext';
import { savePendingAction } from '../utils/pendingAction';
import { mediaUrl } from '../utils/helpers';
import CourseEnrollModal from '../components/CourseEnrollModal';
import CoursePreviewModal from '../components/CoursePreviewModal';

const BASE = import.meta.env.BASE_URL;

const LEVEL_BADGE = {
  beginner: 'bg-success',
  intermediate: 'bg-warning text-dark',
  advanced: 'bg-danger',
};

export default function Courses() {
  const { user } = useUserAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slowLoad, setSlowLoad] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [previewCourse, setPreviewCourse] = useState(null);

  const fetchCourses = () => {
    setLoading(true);
    setSlowLoad(false);
    const slowTimer = setTimeout(() => setSlowLoad(true), 5000);
    getPublicCourses()
      .then(r => { if (r.data.success) setCourses(r.data.data); })
      .catch(() => {
        // Auto-retry once after 10 seconds on failure (Render cold start)
        setTimeout(() => {
          getPublicCourses()
            .then(r => { if (r.data.success) setCourses(r.data.data); })
            .catch(() => {})
            .finally(() => setLoading(false));
        }, 10000);
        return;
      })
      .finally(() => { clearTimeout(slowTimer); setLoading(false); });
  };

  useEffect(() => { fetchCourses(); }, []);
  usePolling(fetchCourses, 60000);

  const handleEnroll = (course) => {
    if (!user) {
      savePendingAction('courses');
      navigate('/login');
    } else {
      setSelectedCourse(course);
    }
  };

  const handlePreview = (course) => setPreviewCourse(course);

  const handlePayNow = (course) => {
    setPreviewCourse(null);
    handleEnroll(course);
  };

  return (
    <section id="courses" className="section-padding bg-light">
      <SEOHead
        title="Junior Advocate Practice Classes"
        description="Enroll in professional legal training courses by Advocate Chauhan. Practical guidance for aspiring and junior advocates in criminal, civil, and corporate law – based in Hyderabad."
        canonical="/courses"
      />
      <div className="container">
        <div className="text-center mb-5" data-aos="fade-up">
          <div className="section-label">Learn from Experts</div>
          <h2 className="section-title">Junior Advocate <span className="text-gold">Practice Classes</span></h2>
          <p className="section-subtitle">Professional legal training courses for aspiring and junior advocates</p>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--gold)' }}></div>
            {slowLoad && (
              <div className="mt-3">
                <p className="text-muted small mb-2">Server is starting up, please wait a moment…</p>
                <button className="btn btn-sm btn-outline-secondary" onClick={fetchCourses}>
                  <i className="fas fa-redo me-1"></i>Retry Now
                </button>
              </div>
            )}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-5">
            <i className="fas fa-graduation-cap fa-3x mb-3" style={{ color: 'var(--gold)' }}></i>
            <h5>Courses Coming Soon</h5>
            <p className="text-muted">We are preparing comprehensive legal training courses. Stay tuned!</p>
          </div>
        ) : (
          <div className="row g-4">
            {courses.map((course, i) => {
              const totalVideos = course.modules?.reduce((s, m) => s + (m.videos?.length || 0), 0) || 0;
              const price = course.discountPrice > 0 ? course.discountPrice : course.price;
              const originalPrice = course.discountPrice > 0 ? course.price : null;

              return (
                <div key={course._id} className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay={i * 80}>
                  <div className="course-card">
                    <div className="course-card-thumb">
                      {course.thumbnail
                        ? <img src={mediaUrl(course.thumbnail)} alt={course.title} />
                        : <div className="course-card-thumb-placeholder"><i className="fas fa-graduation-cap"></i></div>
                      }
                      {course.isFeatured && <span className="course-badge-featured">Featured</span>}
                      <span className={`course-badge-level badge ${LEVEL_BADGE[course.level] || 'bg-secondary'}`}>
                        {course.level}
                      </span>
                    </div>

                    <div className="course-card-body">
                      <h5 className="course-card-title">{course.title}</h5>
                      <p className="course-card-desc">{course.shortDescription || course.description?.slice(0, 100)}...</p>

                      <div className="course-card-meta">
                        <span><i className="fas fa-user-tie me-1"></i>{course.instructor}</span>
                        <span><i className="fas fa-video me-1"></i>{totalVideos} videos</span>
                        {course.duration && <span><i className="fas fa-clock me-1"></i>{course.duration}</span>}
                        <span><i className="fas fa-language me-1"></i>{course.language}</span>
                      </div>

                      {course.totalStudents > 0 && (
                        <div className="course-card-students">
                          <i className="fas fa-users me-1 text-gold"></i>
                          <span>{course.totalStudents.toLocaleString('en-IN')} students enrolled</span>
                        </div>
                      )}
                    </div>

                    <div className="course-card-footer">
                      <div className="course-card-price">
                        {price === 0 ? (
                          <span className="course-price-free">Free</span>
                        ) : (
                          <>
                            <span className="course-price-current">₹{price.toLocaleString('en-IN')}</span>
                            {originalPrice && <span className="course-price-original">₹{originalPrice.toLocaleString('en-IN')}</span>}
                          </>
                        )}
                      </div>
                      <div className="d-flex flex-column align-items-end gap-2">
                        <button className="btn btn-gold btn-sm px-4" onClick={() => handleEnroll(course)}>
                          {price === 0 ? 'Enroll Free' : 'Enroll Now'}
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary px-3"
                          style={{ fontSize: '0.78rem' }}
                          onClick={() => handlePreview(course)}
                        >
                          <i className="fas fa-play me-1" style={{ color: 'var(--gold)' }}></i>Watch Preview
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedCourse && (
        <CourseEnrollModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
        />
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
