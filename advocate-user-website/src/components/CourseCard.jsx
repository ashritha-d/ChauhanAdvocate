import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { savePendingAction } from '../utils/pendingAction';
import { mediaUrl, getTotalVideos, getEffectivePrice } from '../utils/helpers';
import { isWishlisted, toggleWishlist } from '../utils/wishlist';
import { shareCourse } from '../utils/shareCourse';

const LEVEL_BADGE = {
  beginner: 'bg-success',
  intermediate: 'bg-warning text-dark',
  advanced: 'bg-danger',
};

/* Skeleton mirrors CourseCard's structure exactly, for loading states */
export function CourseCardSkeleton() {
  return (
    <div className="course-card">
      <div className="course-card-thumb">
        <div className="skeleton-shimmer" style={{ position: 'absolute', inset: 0 }} />
      </div>
      <div className="course-card-body">
        <div className="skeleton-shimmer" style={{ height: 18, width: '85%', borderRadius: 4 }} />
        <div className="skeleton-shimmer" style={{ height: 13, width: '95%', borderRadius: 4 }} />
        <div className="skeleton-shimmer" style={{ height: 13, width: '60%', borderRadius: 4 }} />
        <div className="skeleton-shimmer" style={{ height: 13, width: '40%', borderRadius: 4, marginTop: 8 }} />
      </div>
      <div className="course-card-footer">
        <div className="skeleton-shimmer" style={{ height: 20, width: 70, borderRadius: 4 }} />
        <div className="skeleton-shimmer" style={{ height: 32, width: 110, borderRadius: 8 }} />
      </div>
    </div>
  );
}

/* Shared course card — used on the homepage Courses carousel and the /courses grid.
   `enrolled` and the onEnroll/onPreview callbacks are supplied by the parent, which
   owns the CourseEnrollModal/CoursePreviewModal state. */
function CourseCard({ course, enrolled = false, onEnroll, onPreview }) {
  const { user } = useUserAuth();
  const navigate = useNavigate();
  const [wishlisted, setWishlisted] = useState(() => isWishlisted(course._id));
  const [shareState, setShareState] = useState('');

  const price = getEffectivePrice(course);
  const originalPrice = course.discountPrice > 0 ? course.price : null;
  const discountPct = originalPrice ? Math.round((1 - price / originalPrice) * 100) : null;
  const comingSoon = course.status === 'coming-soon';

  const videosCount = getTotalVideos(course);
  const modulesCount = course.modules?.length || 0;

  const goToDetails = () => navigate(`/courses/${course._id}`);

  const handlePrimaryAction = () => {
    if (comingSoon) return;
    if (!user) {
      savePendingAction('courses');
      navigate('/login', { state: { from: '/courses' } });
      return;
    }
    if (enrolled) { navigate('/profile?tab=courses'); return; }
    onEnroll?.();
  };

  const stop = fn => e => { e.stopPropagation(); fn(); };

  const handleWishlist = () => setWishlisted(toggleWishlist(course._id));

  const handleShare = async () => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}courses/${course._id}`;
    const result = await shareCourse({ title: course.title, url });
    if (result === 'copied') {
      setShareState('Link copied!');
      setTimeout(() => setShareState(''), 2000);
    }
  };

  const handleCardKeyDown = e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToDetails(); }
  };

  return (
    <div className="course-card" onClick={goToDetails} onKeyDown={handleCardKeyDown} role="button" tabIndex={0}>
      <div className="course-card-thumb">
        {course.thumbnail
          ? <img src={mediaUrl(course.thumbnail, { width: 500 })} alt={course.title} loading="lazy" />
          : <div className="course-card-thumb-placeholder"><i className="fas fa-graduation-cap" /></div>
        }
        {comingSoon
          ? <span className="course-badge-featured" style={{ background: 'rgba(0,0,0,0.6)' }}>Coming Soon</span>
          : course.isFeatured && <span className="course-badge-featured">Featured</span>
        }
        <span className={`course-badge-level badge ${LEVEL_BADGE[course.level] || 'bg-secondary'}`}>
          {course.level}
        </span>
        <div className="course-card-icon-actions">
          <button
            className={`course-icon-btn ${wishlisted ? 'is-active' : ''}`}
            onClick={stop(handleWishlist)}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <i className={wishlisted ? 'fas fa-heart' : 'far fa-heart'} />
          </button>
          <button className="course-icon-btn" onClick={stop(handleShare)} aria-label="Share course" title="Share course">
            <i className="fas fa-share-alt" />
          </button>
        </div>
        {shareState && <span className="course-share-toast">{shareState}</span>}
      </div>

      <div className="course-card-body">
        <h5 className="course-card-title">{course.title}</h5>
        <p className="course-card-desc">{course.shortDescription || course.description}</p>

        <div className="course-card-meta">
          {course.instructor && <span><i className="fas fa-user-tie me-1" />{course.instructor}</span>}
          {course.language && <span><i className="fas fa-language me-1" />{course.language}</span>}
          <span><i className="fas fa-video me-1" />{videosCount} videos</span>
          <span><i className="fas fa-layer-group me-1" />{modulesCount} modules</span>
          {course.duration && <span><i className="fas fa-clock me-1" />{course.duration}</span>}
        </div>

        <div className="course-card-stats">
          <span><i className="fas fa-star" />{course.rating > 0 ? course.rating.toFixed(1) : 'New'}</span>
          <span><i className="fas fa-users" />{course.totalStudents > 0 ? course.totalStudents.toLocaleString('en-IN') : 0}</span>
          <span><i className="fas fa-check-circle" />{course.validityDays || 365} Days Access</span>
          {course.certificate && <span><i className="fas fa-certificate" />Certificate</span>}
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
              {discountPct > 0 && <span className="course-price-discount">{discountPct}% OFF</span>}
            </>
          )}
        </div>

        <div className="course-card-actions">
          <button className="btn btn-gold btn-sm px-3" onClick={stop(handlePrimaryAction)} disabled={comingSoon}>
            {comingSoon ? 'Coming Soon' : !user ? 'Login to Enroll' : enrolled ? 'Continue Learning' : (price === 0 ? 'Enroll Free' : 'Enroll Now')}
          </button>
          <div className="course-card-actions-row">
            <button className="btn btn-sm btn-outline-secondary" onClick={stop(() => onPreview?.())}>
              <i className="fas fa-play me-1" style={{ color: 'var(--gold)' }} />Preview
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={stop(goToDetails)}>
              <i className="fas fa-info-circle me-1" />Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(CourseCard);
