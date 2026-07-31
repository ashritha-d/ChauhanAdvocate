import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import usePolling from '../hooks/usePolling';
import { getPublicCourses } from '../api';
import { useUserAuth } from '../context/UserAuthContext';
import { savePendingAction } from '../utils/pendingAction';
import { mediaUrl } from '../utils/helpers';
import CardCarousel from './CardCarousel';

const LEVEL_BADGE = {
  beginner: 'bg-success',
  intermediate: 'bg-warning text-dark',
  advanced: 'bg-danger',
};

/* ── Skeleton that exactly mirrors CourseCard structure ── */
function CourseCardSkeleton() {
  return (
    <div className="course-card">
      <div className="course-card-thumb">
        <div className="skeleton-shimmer" style={{ position: 'absolute', inset: 0 }} />
      </div>
      <div className="course-card-body">
        <div className="skeleton-shimmer" style={{ height: 18, width: '85%', borderRadius: 4 }} />
        <div className="skeleton-shimmer" style={{ height: 13, width: '95%', borderRadius: 4 }} />
        <div className="skeleton-shimmer" style={{ height: 13, width: '60%', borderRadius: 4 }} />
      </div>
      <div className="course-card-footer">
        <div className="skeleton-shimmer" style={{ height: 20, width: 70, borderRadius: 4 }} />
        <div className="skeleton-shimmer" style={{ height: 32, width: 110, borderRadius: 8 }} />
      </div>
    </div>
  );
}

/* ── Course Card ── */
function CourseCard({ course }) {
  const { user } = useUserAuth();
  const navigate = useNavigate();

  const price = course.discountPrice > 0 ? course.discountPrice : course.price;
  const originalPrice = course.discountPrice > 0 ? course.price : null;
  const comingSoon = course.status === 'coming-soon';

  const handleEnroll = () => {
    if (comingSoon) return;
    if (!user) { savePendingAction('courses'); navigate('/login'); return; }
    navigate('/courses');
  };

  return (
    <div className="course-card">
      <div className="course-card-thumb">
        {course.thumbnail
          ? <img src={mediaUrl(course.thumbnail)} alt={course.title} />
          : <div className="course-card-thumb-placeholder"><i className="fas fa-graduation-cap" /></div>
        }
        {comingSoon
          ? <span className="course-badge-featured" style={{ background: 'rgba(0,0,0,0.6)' }}>Coming Soon</span>
          : course.isFeatured && <span className="course-badge-featured">Featured</span>
        }
        <span className={`course-badge-level badge ${LEVEL_BADGE[course.level] || 'bg-secondary'}`}>
          {course.level}
        </span>
      </div>

      <div className="course-card-body">
        <h5 className="course-card-title">{course.title}</h5>
        <div className="course-card-meta">
          {course.category && <span><i className="fas fa-tag me-1" />{course.category}</span>}
          {course.instructor && <span><i className="fas fa-user-tie me-1" />{course.instructor}</span>}
          {course.duration && <span><i className="fas fa-clock me-1" />{course.duration}</span>}
        </div>
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
        <button className="btn btn-gold btn-sm px-3" onClick={handleEnroll} disabled={comingSoon}>
          {comingSoon ? 'Coming Soon' : !user ? 'Login to Enroll' : (price === 0 ? 'Enroll Free' : 'Enroll Now')}
        </button>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function CoursesPreview() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);

  const loadCourses = useCallback(async () => {
    try {
      const r = await getPublicCourses();
      if (r.data?.success) setCourses(r.data.data || []);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { setLoading(true); loadCourses(); }, [retryKey, loadCourses]);
  usePolling(loadCourses, 60000);

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
              <CourseCard key={course._id} course={course} />
            ))}
          </CardCarousel>
        )}
      </div>
    </>
  );
}
