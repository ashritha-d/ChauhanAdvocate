export const API_BASE = import.meta.env.VITE_API_BASE?.replace('/api', '') || 'http://localhost:5000';

// `opts.width` is optional — when given, also asks Cloudinary to resize to that width
// (in addition to the automatic format/quality negotiation applied to every image).
export const mediaUrl = (path, opts = {}) => {
  if (!path) return null;
  const upgrade = url => (typeof window !== 'undefined' && window.location.protocol === 'https:')
    ? url.replace(/^http:\/\//, 'https://')
    : url;

  let url = /^https?:\/\//i.test(path) ? path : `${API_BASE}${path}`;
  url = upgrade(url);

  // Cloudinary-hosted images: request an auto-optimized format (WebP/AVIF where the
  // browser supports it) and quality on the fly instead of serving the original
  // full-size/full-weight upload every time.
  if (url.includes('res.cloudinary.com') && url.includes('/image/upload/') && !url.includes('f_auto')) {
    const transform = opts.width ? `f_auto,q_auto,w_${opts.width}` : 'f_auto,q_auto';
    url = url.replace('/image/upload/', `/image/upload/${transform}/`);
  }
  return url;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const truncate = (str, n) => (str && str.length > n ? str.substring(0, n) + '...' : str);

// Shared across CourseCard, CourseDetails, CourseEnrollModal, Profile — was duplicated
// identically in all four before being extracted here.
export const getTotalVideos = (course) =>
  course?.modules?.reduce((s, m) => s + (m.videos?.length || 0), 0) || 0;

// The price actually charged (discount price when set, else the base price) — was
// duplicated identically across CourseCard, CourseDetails, CourseEnrollModal, Courses.
export const getEffectivePrice = (course) =>
  course?.discountPrice > 0 ? course.discountPrice : (course?.price || 0);
