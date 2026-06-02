import { useState, useRef } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import api from '../api/axios';

const STEPS = ['Personal', 'Education', 'Documents'];

const INIT = {
  name: '', fatherName: '', dob: '', gender: '',
  phone: '', whatsapp: '', email: '', address: '',
  qualification: '', college: '', yearOfPassing: '', percentage: '',
  skills: '', experience: '', coverLetter: '',
};

export default function JrAdvocateModal({ onClose, onSuccess }) {
  const { user } = useUserAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    ...INIT,
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });
  const [resume, setResume] = useState(null);
  const [passportPhoto, setPassportPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const resumeRef = useRef();
  const photoRef = useRef();

  const set = k => e => { setForm(f => ({ ...f, [k]: e.target.value })); setErrors(er => ({ ...er, [k]: '' })); };

  const validateStep = () => {
    const errs = {};
    if (step === 0) {
      if (!form.name.trim()) errs.name = 'Required';
      if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) errs.phone = 'Valid 10-digit number required';
      if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email required';
      if (!form.address.trim()) errs.address = 'Required';
    }
    if (step === 1) {
      if (!form.qualification.trim()) errs.qualification = 'Required';
    }
    if (step === 2) {
      if (!resume) errs.resume = 'Resume is required (PDF/DOC/DOCX)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validateStep()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateStep()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (user?._id) fd.append('userId', user._id);
      if (resume) fd.append('resume', resume);
      if (passportPhoto) fd.append('passportPhoto', passportPhoto);
      const r = await api.post('/jr-advocates', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (r.data.success) {
        setSubmitted(true);
        onSuccess?.();
      } else {
        setSubmitError(r.data.message || 'Submission failed');
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Server error. Please try again.');
    }
    setSubmitting(false);
  };

  const FieldError = ({ name }) => errors[name] ? <div className="jr-field-error">{errors[name]}</div> : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="jr-modal jr-modal-lg" onClick={e => e.stopPropagation()}>
        <button className="jr-modal-close" onClick={onClose}>&times;</button>

        {submitted ? (
          <div className="text-center py-4">
            <i className="fas fa-check-circle fa-3x mb-3" style={{ color: 'var(--gold)' }}></i>
            <h5 style={{ fontFamily: "'Playfair Display',serif" }}>Application Submitted!</h5>
            <p className="text-muted">We will review your application and contact you within 3–5 business days.</p>
            {user && <p className="small text-muted">Track your application status in <strong>My Profile → My Applications</strong>.</p>}
            <button className="btn btn-gold mt-2" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <h5 className="mb-1" style={{ fontFamily: "'Playfair Display',serif" }}>
              Join as <span style={{ color: 'var(--gold)' }}>Jr. Advocate</span>
            </h5>
            <p className="text-muted small mb-3">Complete the application form below</p>

            <div className="jr-steps mb-4">
              {STEPS.map((s, i) => (
                <div key={s} className={`jr-step ${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                  <div className="jr-step-dot">{i < step ? <i className="fas fa-check"></i> : i + 1}</div>
                  <span>{s}</span>
                </div>
              ))}
            </div>

            {submitError && <div className="alert alert-danger py-2 small">{submitError}</div>}

            <form onSubmit={handleSubmit}>
              {step === 0 && (
                <div className="row g-2">
                  <div className="col-md-6">
                    <label className="jr-label">Full Name *</label>
                    <input className={`form-control form-control-sm ${errors.name ? 'is-invalid' : ''}`} value={form.name} onChange={set('name')} placeholder="As per certificate" />
                    <FieldError name="name" />
                  </div>
                  <div className="col-md-6">
                    <label className="jr-label">Father's Name</label>
                    <input className="form-control form-control-sm" value={form.fatherName} onChange={set('fatherName')} placeholder="Father's full name" />
                  </div>
                  <div className="col-md-4">
                    <label className="jr-label">Date of Birth</label>
                    <input className="form-control form-control-sm" type="date" value={form.dob} onChange={set('dob')} />
                  </div>
                  <div className="col-md-4">
                    <label className="jr-label">Gender</label>
                    <select className="form-select form-select-sm" value={form.gender} onChange={set('gender')}>
                      <option value="">Select</option>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="jr-label">Mobile Number *</label>
                    <input className={`form-control form-control-sm ${errors.phone ? 'is-invalid' : ''}`} type="tel" value={form.phone} onChange={set('phone')} placeholder="10-digit" />
                    <FieldError name="phone" />
                  </div>
                  <div className="col-md-6">
                    <label className="jr-label">WhatsApp Number</label>
                    <input className="form-control form-control-sm" type="tel" value={form.whatsapp} onChange={set('whatsapp')} placeholder="WhatsApp number" />
                  </div>
                  <div className="col-md-6">
                    <label className="jr-label">Email Address *</label>
                    <input className={`form-control form-control-sm ${errors.email ? 'is-invalid' : ''}`} type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" />
                    <FieldError name="email" />
                  </div>
                  <div className="col-12">
                    <label className="jr-label">Full Address *</label>
                    <textarea className={`form-control form-control-sm ${errors.address ? 'is-invalid' : ''}`} rows={2} value={form.address} onChange={set('address')} placeholder="Door no, Street, City, State, PIN" />
                    <FieldError name="address" />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="row g-2">
                  <div className="col-12">
                    <label className="jr-label">Highest Qualification *</label>
                    <input className={`form-control form-control-sm ${errors.qualification ? 'is-invalid' : ''}`} value={form.qualification} onChange={set('qualification')} placeholder="e.g., LLB, LLM, BA LLB" />
                    <FieldError name="qualification" />
                  </div>
                  <div className="col-md-6">
                    <label className="jr-label">College / University</label>
                    <input className="form-control form-control-sm" value={form.college} onChange={set('college')} placeholder="Institution name" />
                  </div>
                  <div className="col-md-3">
                    <label className="jr-label">Year of Passing</label>
                    <input className="form-control form-control-sm" value={form.yearOfPassing} onChange={set('yearOfPassing')} placeholder="e.g., 2024" maxLength={4} />
                  </div>
                  <div className="col-md-3">
                    <label className="jr-label">Percentage / CGPA</label>
                    <input className="form-control form-control-sm" value={form.percentage} onChange={set('percentage')} placeholder="e.g., 75%" />
                  </div>
                  <div className="col-12">
                    <label className="jr-label">Skills</label>
                    <input className="form-control form-control-sm" value={form.skills} onChange={set('skills')} placeholder="e.g., Legal Research, Drafting, Court Appearances" />
                  </div>
                  <div className="col-12">
                    <label className="jr-label">Experience</label>
                    <textarea className="form-control form-control-sm" rows={2} value={form.experience} onChange={set('experience')} placeholder="Internships, moot courts, previous work experience..." />
                  </div>
                  <div className="col-12">
                    <label className="jr-label">Cover Letter / Additional Information</label>
                    <textarea className="form-control form-control-sm" rows={3} value={form.coverLetter} onChange={set('coverLetter')} placeholder="Why do you want to join us?" />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="row g-3">
                  <div className="col-12">
                    <label className="jr-label">Resume / CV * (PDF, DOC, DOCX — max 5MB)</label>
                    <div
                      className={`jr-upload-zone ${errors.resume ? 'invalid' : ''} ${resume ? 'has-file' : ''}`}
                      onClick={() => resumeRef.current?.click()}
                    >
                      {resume
                        ? <><i className="fas fa-file-pdf me-2 text-gold"></i><span>{resume.name}</span><button type="button" className="jr-upload-clear" onClick={e => { e.stopPropagation(); setResume(null); }}>✕</button></>
                        : <><i className="fas fa-upload me-2"></i><span>Click to upload Resume</span></>
                      }
                    </div>
                    <input ref={resumeRef} type="file" accept=".pdf,.doc,.docx" className="d-none" onChange={e => { setResume(e.target.files[0] || null); setErrors(er => ({ ...er, resume: '' })); }} />
                    <FieldError name="resume" />
                  </div>
                  <div className="col-12">
                    <label className="jr-label">Passport Photo (JPG, PNG — max 5MB)</label>
                    <div className={`jr-upload-zone ${passportPhoto ? 'has-file' : ''}`} onClick={() => photoRef.current?.click()}>
                      {passportPhoto
                        ? <><i className="fas fa-image me-2 text-gold"></i><span>{passportPhoto.name}</span><button type="button" className="jr-upload-clear" onClick={e => { e.stopPropagation(); setPassportPhoto(null); }}>✕</button></>
                        : <><i className="fas fa-camera me-2"></i><span>Click to upload Passport Photo (optional)</span></>
                      }
                    </div>
                    <input ref={photoRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="d-none" onChange={e => setPassportPhoto(e.target.files[0] || null)} />
                  </div>
                  <div className="col-12">
                    <div className="alert alert-info py-2 small">
                      <i className="fas fa-info-circle me-1"></i>
                      By submitting, you confirm all details are accurate. We will contact you within 3–5 business days.
                    </div>
                  </div>
                </div>
              )}

              <div className="d-flex gap-2 mt-4">
                {step > 0 && <button type="button" className="btn btn-outline-secondary flex-shrink-0" onClick={back}><i className="fas fa-arrow-left me-1"></i>Back</button>}
                {step < STEPS.length - 1
                  ? <button type="button" className="btn btn-gold flex-grow-1" onClick={next}>Next <i className="fas fa-arrow-right ms-1"></i></button>
                  : <button type="submit" className="btn btn-gold flex-grow-1" disabled={submitting}>
                      {submitting ? <><i className="fas fa-spinner fa-spin me-2"></i>Submitting…</> : <><i className="fas fa-paper-plane me-2"></i>Submit Application</>}
                    </button>
                }
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
