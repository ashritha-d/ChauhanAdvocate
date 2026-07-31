import { useEffect, useState } from 'react';
import usePolling from '../hooks/usePolling';
import SEOHead from '../components/SEOHead';
import { getPublicCourses, getMyEnrollments } from '../api';
import { useUserAuth } from '../context/UserAuthContext';
import CourseCard from '../components/CourseCard';
import CourseEnrollModal from '../components/CourseEnrollModal';
import CoursePreviewModal from '../components/CoursePreviewModal';

export default function Courses() {
  const { user, authHeader } = useUserAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slowLoad, setSlowLoad] = useState(false);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
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

  const handlePayNow = (course) => {
    setPreviewCourse(null);
    setSelectedCourse(course);
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
            {courses.map((course, i) => (
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
