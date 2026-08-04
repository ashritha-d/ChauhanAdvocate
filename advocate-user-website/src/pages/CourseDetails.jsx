import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { getPublicCourse, getPublicCourses } from '../api';
import { useUserAuth } from '../context/UserAuthContext';
import { savePendingAction } from '../utils/pendingAction';
import { mediaUrl, getTotalVideos, getEffectivePrice } from '../utils/helpers';
import { shareCourse } from '../utils/shareCourse';
import CourseCard from '../components/CourseCard';
import CourseEnrollModal from '../components/CourseEnrollModal';
import CoursePreviewModal from '../components/CoursePreviewModal';
import { RESOURCE_LABELS_BY_CATEGORY, RESOURCE_TYPE_LABELS } from '../utils/courseCategories';

const LEVEL_BADGE = {
  beginner: 'bg-success',
  intermediate: 'bg-warning text-dark',
  advanced: 'bg-danger',
};

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, authHeader } = useUserAuth();
  const [course, setCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [related, setRelated] = useState([]);
  const [showEnroll, setShowEnroll] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [shareMsg, setShareMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    const headers = user ? authHeader() : {};
    getPublicCourse(id, headers)
      .then(r => {
        if (r.data.success) {
          setCourse(r.data.data);
          setEnrolled(!!r.data.enrolled);
          setExpired(!!r.data.expired);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, user]);

  useEffect(() => {
    if (!course?.programType) { setRelated([]); return; }
    getPublicCourses(course.programType)
      .then(r => {
        if (r.data?.success) {
          setRelated(r.data.data.filter(c => c._id !== course._id).slice(0, 4));
        }
      })
      .catch(() => {});
  }, [course]);

  const comingSoon = course?.status === 'coming-soon';

  const handlePrimaryAction = () => {
    if (!course || comingSoon) return;
    if (!user) {
      savePendingAction('courses');
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }
    if (enrolled) { navigate('/profile?tab=courses'); return; }
    setShowEnroll(true); // also covers renewal — enrollCourse detects the lapsed enrollment server-side
  };

  const handleShare = async () => {
    const result = await shareCourse({ title: course.title, url: window.location.href });
    if (result === 'copied') {
      setShareMsg('Link copied!');
      setTimeout(() => setShareMsg(''), 2000);
    }
  };

  if (loading) {
    return (
      <section className="section-padding bg-light text-center">
        <div className="spinner-border" style={{ color: 'var(--gold)' }} />
      </section>
    );
  }

  if (notFound || !course) {
    return (
      <section className="section-padding bg-light text-center">
        <i className="fas fa-graduation-cap fa-3x mb-3" style={{ color: 'var(--gold)' }} />
        <h5>Course not found</h5>
        <p className="text-muted">This course may have been removed or is no longer available.</p>
        <Link to="/courses" className="btn btn-gold btn-sm mt-2">Back to Courses</Link>
      </section>
    );
  }

  const price = getEffectivePrice(course);
  const originalPrice = course.discountPrice > 0 ? course.price : null;
  const discountPct = originalPrice ? Math.round((1 - price / originalPrice) * 100) : null;
  const videosCount = getTotalVideos(course);
  const updated = course.updatedAt
    ? new Date(course.updatedAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : null;

  return (
    <section className="section-padding bg-light course-details-page">
      <SEOHead
        title={course.title}
        description={course.shortDescription || course.description?.slice(0, 150)}
        canonical={`/courses/${id}`}
      />
      <div className="container">
        <Link to="/courses" className="course-details-back"><i className="fas fa-arrow-left me-2" />Back to Courses</Link>

        <div className="row g-4 mt-1">
          <div className="col-lg-8">
            <div className="course-details-hero">
              <div className="course-details-thumb">
                {course.thumbnail
                  ? <img src={mediaUrl(course.thumbnail)} alt={course.title} />
                  : <div className="course-card-thumb-placeholder"><i className="fas fa-graduation-cap" /></div>
                }
                {comingSoon
                  ? <span className="course-badge-featured" style={{ background: 'rgba(0,0,0,0.6)' }}>Coming Soon</span>
                  : course.isFeatured && <span className="course-badge-featured">Featured</span>
                }
              </div>

              <div className="d-flex flex-wrap gap-2 mt-3">
                <span className={`badge ${LEVEL_BADGE[course.level] || 'bg-secondary'}`}>{course.level}</span>
                {course.category && <span className="badge bg-dark">{course.category}</span>}
                <span className={`badge ${comingSoon ? 'bg-secondary' : 'bg-success'}`}>{comingSoon ? 'Coming Soon' : 'Available'}</span>
              </div>

              <h1 className="course-details-title mt-3">{course.title}</h1>
              {course.shortDescription && <p className="course-details-subtitle">{course.shortDescription}</p>}

              <div className="course-card-stats my-3">
                <span><i className="fas fa-star" />{course.rating > 0 ? course.rating.toFixed(1) : 'New'}</span>
                <span><i className="fas fa-users" />{course.totalStudents > 0 ? course.totalStudents.toLocaleString('en-IN') : 0} students</span>
                <span><i className="fas fa-video" />{videosCount} videos</span>
                <span><i className="fas fa-layer-group" />{course.modules?.length || 0} modules</span>
                {course.duration && <span><i className="fas fa-clock" />{course.duration}</span>}
                {course.language && <span><i className="fas fa-language" />{course.language}</span>}
                <span><i className="fas fa-certificate" />{course.certificate ? 'Certificate included' : 'No certificate'}</span>
                {updated && <span><i className="fas fa-calendar-alt" />Updated {updated}</span>}
              </div>

              <h5 className="course-details-heading">Description</h5>
              <p className="course-details-desc">{course.description || 'Not available.'}</p>

              <h5 className="course-details-heading">Instructor</h5>
              <div className="course-instructor-block">
                <div className="course-instructor-avatar"><i className="fas fa-user-tie" /></div>
                <div>
                  <div className="fw-semibold">{course.instructor || 'TBA'}</div>
                  <div className="text-muted small">Legal Educator</div>
                </div>
              </div>

              <h5 className="course-details-heading">Curriculum</h5>
              {course.modules?.length > 0 ? (
                <div className="course-curriculum">
                  {course.modules.map((mod, mi) => (
                    <div key={mod._id || mi} className="curriculum-module">
                      <div className="curriculum-module-title">
                        <i className="fas fa-layer-group me-2 text-gold" />
                        {mod.title}
                        <span className="text-muted small ms-2">({mod.videos?.length || 0} lessons)</span>
                      </div>
                      <ul className="curriculum-lessons">
                        {(mod.videos || []).map((v, vi) => {
                          const locked = !v.videoUrl && !v.uploadedVideoPath;
                          return (
                            <li key={v._id || vi} className={locked ? 'is-locked' : ''}>
                              <i className={`fas ${locked ? 'fa-lock' : 'fa-play-circle'} me-2`} />
                              {v.title}
                              {v.duration && <span className="text-muted small ms-2">{v.duration}</span>}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted small">Curriculum coming soon.</p>
              )}

              <h5 className="course-details-heading">What's Included</h5>
              <ul className="course-card-features course-details-features">
                <li><i className="fas fa-check" />{course.validityDays || 365} Days Access</li>
                <li><i className="fas fa-check" />Mobile Friendly</li>
                <li><i className="fas fa-check" />Downloadable Resources</li>
                <li><i className="fas fa-check" />Practical Examples</li>
                {course.certificate && <li><i className="fas fa-check" />Certificate of Completion</li>}
              </ul>

              {course.resources?.length > 0 && (() => {
                const labels = RESOURCE_LABELS_BY_CATEGORY[course.programType] || {};
                const grouped = {};
                course.resources.forEach(r => { (grouped[r.type] = grouped[r.type] || []).push(r); });
                return Object.entries(grouped).map(([type, items]) => (
                  <div key={type}>
                    <h5 className="course-details-heading">{labels[type] || RESOURCE_TYPE_LABELS[type] || type}</h5>
                    <ul className="course-resource-list">
                      {items.sort((a, b) => (a.order || 0) - (b.order || 0)).map((r, i) => (
                        <li key={r._id || i}>
                          <i className="fas fa-file-download me-2" />
                          {enrolled ? (
                            <a href={r.fileUrl} target="_blank" rel="noreferrer">{r.title}</a>
                          ) : (
                            <span className="text-muted">{r.title} <i className="fas fa-lock ms-1" /></span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ));
              })()}

              {course.programType === 'training' && (
                <div className="course-live-sessions-link">
                  <i className="fas fa-video me-2" style={{ color: 'var(--gold)' }} />
                  <span>Live training sessions are held regularly.</span>
                  <Link to="/live" className="ms-2">View Live Sessions <i className="fas fa-arrow-right ms-1" /></Link>
                </div>
              )}
            </div>
          </div>

          <div className="col-lg-4">
            <div className="course-details-sidebar">
              <div className="course-details-price-box">
                {price === 0 ? (
                  <span className="course-price-free" style={{ fontSize: '1.6rem' }}>Free</span>
                ) : (
                  <div className="d-flex align-items-baseline gap-2 flex-wrap">
                    <span className="course-price-current" style={{ fontSize: '1.6rem' }}>₹{price.toLocaleString('en-IN')}</span>
                    {originalPrice && <span className="course-price-original">₹{originalPrice.toLocaleString('en-IN')}</span>}
                    {discountPct > 0 && <span className="course-price-discount">{discountPct}% OFF</span>}
                  </div>
                )}

                <button className="btn btn-gold w-100 mt-3 py-2" onClick={handlePrimaryAction} disabled={comingSoon}>
                  {comingSoon ? 'Coming Soon' : !user ? 'Login to Enroll' : enrolled ? 'Continue Learning' : expired ? 'Renew Enrollment' : (price === 0 ? 'Enroll Free' : 'Enroll Now')}
                </button>
                {expired && <p className="text-center small text-danger mt-2 mb-0"><i className="fas fa-exclamation-circle me-1"></i>Your access has expired.</p>}
                <button className="btn btn-outline-secondary w-100 mt-2" onClick={() => setShowPreview(true)}>
                  <i className="fas fa-play me-1" style={{ color: 'var(--gold)' }} />Watch Preview
                </button>
                <button className="btn btn-link w-100 mt-1 text-decoration-none" onClick={handleShare}>
                  <i className="fas fa-share-alt me-1" />Share this course
                </button>
                {shareMsg && <div className="text-center text-success small mt-1">{shareMsg}</div>}
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-5">
            <h4 className="section-title mb-4">Related <span className="text-gold">Courses</span></h4>
            <div className="row g-4">
              {related.map(c => (
                <div key={c._id} className="col-xl-3 col-lg-4 col-md-6 col-12">
                  <CourseCard
                    course={c}
                    enrolled={false}
                    onEnroll={() => navigate(`/courses/${c._id}`)}
                    onPreview={() => navigate(`/courses/${c._id}`)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showEnroll && <CourseEnrollModal course={course} onClose={() => setShowEnroll(false)} />}
      {showPreview && (
        <CoursePreviewModal
          course={course}
          onClose={() => setShowPreview(false)}
          onPayNow={() => { setShowPreview(false); setShowEnroll(true); }}
        />
      )}
    </section>
  );
}
