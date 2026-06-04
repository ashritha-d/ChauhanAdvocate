import { useEffect, useState } from 'react';
import { getSiteSettings, updateSiteSettings, seedSiteSettings } from '../api';
import ImageUpload from '../components/ImageUpload';

const TABS = ['General','Contact','Social','Stats','SEO','Payment'];

export default function SiteSettings() {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('General');

  const load = () => {
    setLoading(true);
    getSiteSettings()
      .then(r => { if (r.data.success) setForm(r.data.data || {}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSeed = async () => {
    try { await seedSiteSettings(); load(); setSuccess('Default settings seeded!'); } catch {}
  };

  const handleSave = async e => {
    e.preventDefault(); setSaving(true); setError(''); setSuccess('');
    try {
      await updateSiteSettings(form);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target?.value ?? e }));

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-gold"></div></div>;

  const FIELDS = {
    General: [
      { key:'site_name', label:'Site Name', type:'text' },
      { key:'site_tagline', label:'Tagline', type:'text' },
      { key:'hero_title', label:'Hero Title', type:'text' },
      { key:'hero_subtitle', label:'Hero Subtitle', type:'textarea' },
      { key:'about_content', label:'About Content', type:'textarea' },
      { key:'advocate_name', label:'Advocate Name', type:'text' },
      { key:'advocate_designation', label:'Designation', type:'text' },
      { key:'advocate_qualification', label:'Qualification (e.g. LLB, LLM)', type:'text' },
      { key:'advocate_enrollment', label:'Bar Enrollment Number', type:'text' },
      { key:'advocate_experience', label:'Years of Experience', type:'number' },
      { key:'advocate_bio', label:'Advocate Bio', type:'textarea' },
      { key:'advocate_photo', label:'Advocate Photo', type:'image' },
    ],
    Contact: [
      { key:'contact_phone', label:'Phone Number', type:'text' },
      { key:'contact_email', label:'Email Address', type:'email' },
      { key:'contact_address', label:'Office Address', type:'textarea' },
      { key:'contact_whatsapp', label:'WhatsApp Number (with country code)', type:'text' },
      { key:'contact_phone2', label:'Secondary Phone', type:'text' },
      { key:'office_hours_weekday', label:'Weekday Hours (Mon–Sat)', type:'text' },
      { key:'office_hours_sunday', label:'Sunday Hours', type:'text' },
    ],
    Social: [
      { key:'social_facebook', label:'Facebook URL', type:'url' },
      { key:'social_twitter', label:'Twitter / X URL', type:'url' },
      { key:'social_linkedin', label:'LinkedIn URL', type:'url' },
      { key:'social_instagram', label:'Instagram URL', type:'url' },
    ],
    Stats: [
      { key:'stats_cases', label:'Cases Won', type:'text' },
      { key:'stats_clients', label:'Happy Clients', type:'text' },
      { key:'stats_years', label:'Years of Experience', type:'text' },
      { key:'stats_courts', label:'Courts Handled', type:'text' },
    ],
    SEO: [
      { key:'seo_title', label:'Page Title', type:'text' },
      { key:'seo_description', label:'Meta Description', type:'textarea' },
      { key:'seo_keywords', label:'Keywords (comma separated)', type:'text' },
    ],
    Payment: [
      { key:'consultation_fee_offline', label:'Offline Consultation Fee (₹)', type:'text' },
      { key:'consultation_fee_online', label:'Online Consultation Fee (₹)', type:'text' },
      { key:'payment_upi_id', label:'UPI ID (e.g. name@upi)', type:'text' },
      { key:'payment_qr_image', label:'PhonePe / UPI QR Code Image', type:'image' },
      { key:'razorpay_key_id', label:'Razorpay Key ID (rzp_live_...)', type:'text' },
      { key:'razorpay_secret', label:'Razorpay Secret Key', type:'text' },
      { key:'admin_email', label:'Admin Email (for payment receipts)', type:'email' },
    ],
  };

  return (
    <div>
      <div className="page-card">
        <div className="page-card-header">
          <h6 className="mb-0 fw-bold">Site Settings</h6>
          <div className="d-flex gap-2">
            {!form._id && <button className="btn btn-outline-secondary btn-sm" onClick={handleSeed}><i className="fas fa-database me-1"></i>Seed Defaults</button>}
            <button className="btn btn-gold btn-sm" form="settings-form" type="submit" disabled={saving}>
              {saving ? <><i className="fas fa-spinner fa-spin me-1"></i>Saving...</> : <><i className="fas fa-save me-1"></i>Save All</>}
            </button>
          </div>
        </div>
        <div className="page-card-body">
          {success && <div className="alert alert-success py-2 mb-3"><i className="fas fa-check me-2"></i>{success}</div>}
          {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}
          <ul className="nav nav-tabs mb-4">
            {TABS.map(t => <li key={t} className="nav-item"><button className={`nav-link ${tab===t?'active':''}`} onClick={() => setTab(t)}>{t}</button></li>)}
          </ul>
          {tab === 'Payment' && (
            <div className="alert mb-4" style={{ background:'#fff8e1', border:'1.5px solid #f59e0b', borderRadius:12 }}>
              <div className="fw-bold mb-1" style={{ color:'#92400e' }}>
                <i className="fas fa-info-circle me-2"></i>About Razorpay Test Mode (MockSharp)
              </div>
              <p className="small mb-2" style={{ color:'#78350f' }}>
                If you see a "<strong>Welcome to Razorpay Software Private Ltd Bank</strong>" page with Success/Failure buttons during payment, this is Razorpay's <strong>MockSharp simulator</strong>. It appears only when Test Mode keys (<code>rzp_test_...</code>) are active.
              </p>
              <p className="small mb-0" style={{ color:'#78350f' }}>
                <i className="fas fa-check-circle me-1 text-success"></i>
                After configuring <strong>Live Keys</strong> (<code>rzp_live_...</code>) in the fields below, all payments will use real banking flows (UPI apps, actual bank OTPs) and MockSharp will disappear automatically — <strong>no code changes required</strong>.
              </p>
            </div>
          )}
          <form id="settings-form" onSubmit={handleSave}>
            <div className="row g-4">
              {(FIELDS[tab] || []).map(field => (
                <div className={field.type==='textarea' ? 'col-12' : 'col-md-6'} key={field.key}>
                  {field.type === 'image' ? (
                    <ImageUpload label={field.label} value={form[field.key] || ''} onChange={set(field.key)} />
                  ) : field.type === 'textarea' ? (
                    <>
                      <label className="form-label">{field.label}</label>
                      <textarea className="form-control" rows="3" value={form[field.key]||''} onChange={set(field.key)}></textarea>
                    </>
                  ) : (
                    <>
                      <label className="form-label">{field.label}</label>
                      <input type={field.type} className="form-control" value={form[field.key]||''} onChange={set(field.key)} />
                    </>
                  )}
                </div>
              ))}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
