import { useState } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import { enrollCourse } from '../api';
import { mediaUrl, getTotalVideos, getEffectivePrice } from '../utils/helpers';
import { useSite } from '../context/SiteContext';

export default function CourseEnrollModal({ course, onClose }) {
  const { user, authHeader } = useUserAuth();
  const { settings: s } = useSite();
  const [step, setStep] = useState('details'); // details | payment | success
  const [screenshot, setScreenshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const price = getEffectivePrice(course);
  const isFree = price === 0;

  const handleEnroll = async () => {
    if (!isFree && !screenshot) { setError('Please upload payment screenshot'); return; }
    setSubmitting(true);
    setError('');
    try {
      let screenshotUrl = '';
      if (screenshot) {
        const fd = new FormData();
        fd.append('file', screenshot);
        const upRes = await fetch(`${import.meta.env.VITE_API_URL || 'https://chauhanadvocate.onrender.com/api'}/upload`, {
          method: 'POST',
          headers: authHeader(),
          body: fd,
        });
        const upData = await upRes.json();
        screenshotUrl = upData.url || '';
      }

      const r = await enrollCourse({
        courseId: course._id,
        paymentScreenshot: screenshotUrl,
        amountPaid: price,
      }, authHeader());

      if (r.data.success) {
        setStep('success');
      } else {
        setError(r.data.message || 'Enrollment failed');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Server error. Please try again.');
    }
    setSubmitting(false);
  };

  const totalVideos = getTotalVideos(course);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="course-enroll-modal" onClick={e => e.stopPropagation()}>
        <button className="jr-modal-close" onClick={onClose}>&times;</button>

        {step === 'success' ? (
          <div className="form-success-screen py-3">
            <div className="form-success-icon"><i className="fas fa-check-circle"></i></div>
            <h5 className="form-success-title">
              {isFree ? 'Enrolled Successfully!' : 'Payment Submitted!'}
            </h5>
            <p className="form-success-msg">
              {isFree
                ? `You now have full access to "${course.title}". Go to My Profile → My Courses to start learning.`
                : `Your payment is under review. You will receive access within 24 hours after verification.`
              }
            </p>
            <button className="btn btn-gold mt-3 px-5" onClick={onClose}>
              <i className="fas fa-graduation-cap me-2"></i>
              {isFree ? 'Start Learning' : 'Got it'}
            </button>
          </div>
        ) : step === 'payment' ? (
          <>
            <h5 className="mb-1" style={{ fontFamily: "'Playfair Display',serif" }}>
              <i className="fas fa-credit-card text-gold me-2"></i>Complete Payment
            </h5>
            <p className="text-muted small mb-3">Pay via UPI / PhonePe and upload screenshot</p>

            <div className="course-payment-box">
              <div className="course-payment-amount">
                <span className="text-muted small">Amount to Pay</span>
                <div className="course-payment-price">₹{price.toLocaleString('en-IN')}</div>
              </div>
              {s.payment_qr_image && (
                <div className="course-payment-qr">
                  <img src={mediaUrl(s.payment_qr_image)} alt="Payment QR Code" />
                </div>
              )}
              <div className="course-payment-upi">
                <i className="fas fa-mobile-alt text-gold me-2"></i>
                <strong>UPI ID:</strong> {s.payment_upi_id || 'Pay to your advocate\'s UPI ID'}
                <p className="small text-muted mt-1">Scan QR code or use UPI / PhonePe / Google Pay</p>
              </div>
            </div>

            {error && <div className="alert alert-danger py-2 small mt-2">{error}</div>}

            <div className="mt-3">
              <label className="form-label fw-semibold">Upload Payment Screenshot *</label>
              <div
                className={`jr-upload-zone ${screenshot ? 'has-file' : ''} mt-1`}
                onClick={() => document.getElementById('pay-ss-input').click()}
              >
                {screenshot
                  ? <><i className="fas fa-image me-2 text-success"></i>{screenshot.name}</>
                  : <><i className="fas fa-upload me-2"></i>Click to upload screenshot</>
                }
              </div>
              <input
                id="pay-ss-input"
                type="file"
                accept="image/*"
                className="d-none"
                onChange={e => setScreenshot(e.target.files[0] || null)}
              />
            </div>

            <div className="d-flex gap-2 mt-4">
              <button className="btn btn-outline-secondary" onClick={() => setStep('details')}>
                <i className="fas fa-arrow-left me-1"></i>Back
              </button>
              <button className="btn btn-gold flex-grow-1" onClick={handleEnroll} disabled={submitting}>
                {submitting
                  ? <><i className="fas fa-spinner fa-spin me-2"></i>Submitting...</>
                  : <><i className="fas fa-paper-plane me-2"></i>Submit Payment</>
                }
              </button>
            </div>
          </>
        ) : (
          <>
            <h5 className="mb-1" style={{ fontFamily: "'Playfair Display',serif" }}>
              <i className="fas fa-graduation-cap text-gold me-2"></i>{course.title}
            </h5>
            <p className="text-muted small mb-3">by {course.instructor}</p>

            {course.thumbnail && (
              <img
                src={mediaUrl(course.thumbnail)}
                alt={course.title}
                style={{ width: '100%', borderRadius: 10, marginBottom: 12, maxHeight: 180, objectFit: 'cover' }}
              />
            )}

            <div className="course-enroll-details">
              <div className="row g-2 mb-3">
                {[
                  { icon: 'fa-video', label: `${totalVideos} Videos` },
                  { icon: 'fa-clock', label: course.duration || 'Self-paced' },
                  { icon: 'fa-language', label: course.language },
                  { icon: 'fa-certificate', label: course.certificate ? 'Certificate included' : 'No certificate' },
                ].map(({ icon, label }) => (
                  <div key={label} className="col-6">
                    <div className="course-detail-item">
                      <i className={`fas ${icon} text-gold me-2`}></i>
                      <small>{label}</small>
                    </div>
                  </div>
                ))}
              </div>
              <p className="small text-muted">{course.shortDescription || course.description}</p>
            </div>

            <div className="course-enroll-price-row">
              <div>
                {isFree ? (
                  <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '1.3rem' }}>Free</span>
                ) : (
                  <>
                    <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '1.3rem' }}>₹{price.toLocaleString('en-IN')}</span>
                    {course.discountPrice > 0 && (
                      <span className="text-muted text-decoration-line-through ms-2">₹{course.price.toLocaleString('en-IN')}</span>
                    )}
                  </>
                )}
              </div>
              <span className="small text-muted">{course.validityDays || 365} Days Access</span>
            </div>

            <button
              className="btn btn-gold w-100 mt-3 py-2"
              onClick={() => isFree ? handleEnroll() : setStep('payment')}
              disabled={submitting}
            >
              {submitting
                ? <><i className="fas fa-spinner fa-spin me-2"></i>Processing...</>
                : isFree
                  ? <><i className="fas fa-graduation-cap me-2"></i>Enroll for Free</>
                  : <><i className="fas fa-lock-open me-2"></i>Proceed to Payment — ₹{price.toLocaleString('en-IN')}</>
              }
            </button>

            {!isFree && (
              <p className="text-center text-muted small mt-2">
                <i className="fas fa-shield-alt me-1 text-success"></i>
                Access granted after payment verification
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
