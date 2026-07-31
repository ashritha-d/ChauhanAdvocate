import { useEffect, useState, useCallback } from 'react';
import usePolling from '../hooks/usePolling';
import { getPublicCourses, getMyEnrollments } from '../api';
import { useUserAuth } from '../context/UserAuthContext';
import CardCarousel from './CardCarousel';
import CourseCard, { CourseCardSkeleton } from './CourseCard';
import CourseEnrollModal from './CourseEnrollModal';
import CoursePreviewModal from './CoursePreviewModal';

export default function CoursesPreview() {
  const { user, authHeader } = useUserAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [previewCourse, setPreviewCourse] = useState(null);

  const loadCourses = useCallback(async () => {
    try {
      const r = await getPublicCourses();
      if (r.data?.success) setCourses(r.data.data || []);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { setLoading(true); loadCourses(); }, [retryKey, loadCourses]);
  usePolling(loadCourses, 60000);

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
    <>
      <div className="latest-header mb-4" data-aos="fade-left">
        <h2 className="section-title mb-0">
          <span className="text-gold">Courses</span>
        </h2>
        {!loading && courses.length > 0 && (
          <p className="section-subtitle mt-2 mb-0">
            Explore our latest legal courses
          </p>
        )}
      </div>

      <div className="luc-content-area">
        {loading ? (
          <CardCarousel ariaLabel="courses" loading>
            <CourseCardSkeleton />
            <CourseCardSkeleton />
            <CourseCardSkeleton />
          </CardCarousel>
        ) : courses.length === 0 ? (
          <div className="luc-empty-state">
            <div className="luc-empty-icon"><i className="fas fa-graduation-cap" /></div>
            <h5>No Courses Available Currently</h5>
            <p>We are preparing comprehensive legal training courses. Stay tuned!</p>
            <button className="btn btn-gold btn-sm mt-1" onClick={() => setRetryKey(k => k + 1)}>
              <i className="fas fa-sync-alt me-2" />Refresh
            </button>
          </div>
        ) : (
          <CardCarousel ariaLabel="courses">
            {courses.map(course => (
              <CourseCard
                key={course._id}
                course={course}
                enrolled={enrolledIds.has(course._id)}
                onEnroll={() => setSelectedCourse(course)}
                onPreview={() => setPreviewCourse(course)}
              />
            ))}
          </CardCarousel>
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
    </>
  );
}
