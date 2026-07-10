import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import usePolling from '../hooks/usePolling';
import SEOHead from '../components/SEOHead';
import { getDrafts, purchaseDraft, getPaymentSettings } from '../api';
import { mediaUrl } from '../utils/helpers';
import { useUserAuth } from '../context/UserAuthContext';

const PER_PAGE = 9;
const DOWNLOADS_KEY = 'downloadedDraftIds';

const TYPE_BADGE = {
  blog:      { cls: 'bg-info text-dark',    label: 'Blog' },
  course:    { cls: 'bg-primary',           label: 'Course' },
  magazine:  { cls: 'bg-secondary',         label: 'Magazine' },
  news:      { cls: 'bg-warning text-dark', label: 'News' },
  facebook:  { cls: 'bg-primary',           label: 'Facebook' },
  youtube:   { cls: 'bg-danger',            label: 'YouTube' },
};

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getDownloads() {
  try { return JSON.parse(localStorage.getItem(DOWNLOADS_KEY) || '[]'); } catch { return []; }
}
function saveDownload(id) {
  try {
    const ids = getDownloads();
    if (!ids.includes(id)) { ids.push(id); localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(ids)); }
  } catch {}
}

export default function DraftsPage() {
  const navigate = useNavigate();
  const { user, authHeader } = useUserAuth();
  const [drafts, setDrafts]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [slowLoad, setSlowLoad]   = useState(false);
  const [search, setSearch]       = useState('');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage]           = useState(1);
  const [view, setView]           = useState('browse');
  const [downloads, setDownloads] = useState(getDownloads);
  // Purchase modal state
  const [payModal, setPayModal]       = useState(null); // draft object
  const [paySettings, setPaySettings] = useState({});
  const [payMethod, setPayMethod]     = useState('upi_id');
  const [payUtr, setPayUtr]           = useState('');
  const [payScreen, setPayScreen]     = useState(null);
  const [payLoading, setPayLoading]   = useState(false);
  const [payErr, setPayErr]           = useState('');
  const [paySuccess, setPaySuccess]   = useState(false);

  const fetchDrafts = useCallback(() => {
    setLoading(true);
    setSlowLoad(false);
    const timer = setTimeout(() => setSlowLoad(true), 5000);
    getDrafts()
      .then(r => { if (r.data.success) setDrafts(r.data.data || []); })
      .catch(() => {
        setTimeout(() => {
          getDrafts()
            .then(r => { if (r.data.success) setDrafts(r.data.data || []); })
            .catch(() => {})
            .finally(() => setLoading(false));
        }, 10000);
        return;
      })
      .finally(() => { clearTimeout(timer); setLoading(false); });
  }, []);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);
  usePolling(fetchDrafts, 60000);

  const handleDownload = (d) => {
    const file = d.contentDataJson?.file;
    if (!file) {
      alert(`"${d.title}" is not available for download yet. Please contact us to request this draft.`);
      return;
    }
    const url = file.startsWith('http') ? file : mediaUrl(file);
    const a = document.createElement('a');
    a.href = url; a.download = `${d.title}.pdf`; a.target = '_blank';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    saveDownload(d._id);
    setDownloads(getDownloads());
  };

  const handlePurchase = (d) => {
    if (!user) { navigate('/login', { state: { from: '/drafts' } }); return; }
    setPayModal(d);
    setPayUtr(''); setPayScreen(null); setPayErr(''); setPaySuccess(false); setPayMethod('upi_id');
    if (!Object.keys(paySettings).length) {
      getPaymentSettings().then(r => { if (r.data.success) setPaySettings(r.data.data); }).catch(() => {});
    }
  };

  const handlePaySubmit = async () => {
    if (!payUtr.trim()) { setPayErr('Please enter your UTR / Transaction Reference Number.'); return; }
    setPayLoading(true); setPayErr('');
    try {
      const fd = new FormData();
      fd.append('paymentMethod', payMethod);
      fd.append('utrNumber', payUtr.trim());
      if (payScreen) fd.append('screenshot', payScreen);
      const { data } = await purchaseDraft(payModal._id, fd, authHeader());
      if (data.success) {
        setPaySuccess(true);
      } else {
        setPayErr(data.message || 'Submission failed.');
      }
    } catch (e) {
      setPayErr(e.response?.data?.message || e.message || 'Network error.');
    }
    setPayLoading(false);
  };

  const switchView = (v) => { setView(v); setSearch(''); setFilterType('all'); setPage(1); };

  const sourceList = view === 'mydownloads'
    ? drafts.filter(d => downloads.includes(d._id))
    : drafts;

  const contentTypes = ['all', ...new Set(sourceList.map(d => d.contentType).filter(Boolean))];

  const filtered = sourceList.filter(d => {
    const matchType = filterType === 'all' || d.contentType === filterType;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      d.title?.toLowerCase().includes(q) ||
      d.contentType?.toLowerCase().includes(q) ||
      String(d.contentDataJson?.description || '').toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <section id="drafts" className="section-padding bg-light" style={{ paddingTop: '2rem' }}>
      <SEOHead
        title="Legal Draft Templates"
        description="Download professionally drafted legal document templates by Advocate Chauhan — rental agreements, NDAs, employment contracts, sale deeds, and more."
        canonical="/drafts"
      />
      <div className="container">
        <div className="text-center mb-4" data-aos="fade-up">
          <div className="section-label">Legal Templates</div>
          <h2 className="section-title">Legal <span className="text-gold">Drafts</span></h2>
          <p className="section-subtitle">Download professionally drafted legal document templates</p>
        </div>

        {/* View toggle */}
        <div className="draft-view-tabs mb-4">
          <button
            className={`draft-tab-btn ${view === 'browse' ? 'active' : ''}`}
            onClick={() => switchView('browse')}
          >
            <i className="fas fa-th-large me-2"></i>Browse Library
          </button>
          <button
            className={`draft-tab-btn ${view === 'mydownloads' ? 'active' : ''}`}
            onClick={() => switchView('mydownloads')}
          >
            <i className="fas fa-download me-2"></i>My Downloads
            {downloads.length > 0 && (
              <span className="draft-tab-count">{downloads.length}</span>
            )}
          </button>
        </div>

        {/* Search + filter controls */}
        <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-3">
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 400 }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }}></i>
            <input
              type="text"
              className="form-control"
              placeholder={view === 'mydownloads' ? 'Search my downloads…' : 'Search drafts…'}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: 40, borderRadius: 30, border: '1px solid #ddd' }}
            />
          </div>
          {contentTypes.length > 2 && (
            <div className="d-flex gap-2 flex-wrap">
              {contentTypes.map(t => (
                <button
                  key={t}
                  className={`btn btn-sm ${filterType === t ? 'btn-gold' : 'btn-outline-secondary'}`}
                  onClick={() => { setFilterType(t); setPage(1); }}
                >
                  {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {!loading && (
          <p className="text-muted small mb-4">
            {filtered.length} draft{filtered.length !== 1 ? 's' : ''} found
            {search && ` for "${search}"`}
          </p>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--gold)' }}></div>
            {slowLoad && (
              <div className="mt-3">
                <p className="text-muted small mb-2">Server is starting up, please wait a moment…</p>
                <button className="btn btn-sm btn-outline-secondary" onClick={fetchDrafts}>
                  <i className="fas fa-redo me-1"></i>Retry Now
                </button>
              </div>
            )}
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-5">
            <i className={`fas ${view === 'mydownloads' ? 'fa-download' : 'fa-file-alt'} fa-3x mb-3`} style={{ color: 'var(--gold)' }}></i>
            <h5>
              {view === 'mydownloads' && !search && filterType === 'all'
                ? 'No Downloads Yet'
                : search || filterType !== 'all'
                  ? 'No drafts match your filters'
                  : 'No Legal Drafts Yet'}
            </h5>
            <p className="text-muted">
              {view === 'mydownloads' && !search && filterType === 'all'
                ? 'Drafts you download will appear here for quick access.'
                : search || filterType !== 'all'
                  ? 'Try a different keyword or clear the type filter.'
                  : 'Legal draft templates are being prepared. Check back soon!'}
            </p>
            {view === 'mydownloads' && !search && filterType === 'all' ? (
              <button className="btn btn-gold mt-3 px-4" onClick={() => switchView('browse')}>
                <i className="fas fa-th-large me-2"></i>Browse Library
              </button>
            ) : (search || filterType !== 'all') && (
              <button className="btn btn-outline-secondary btn-sm mt-2"
                onClick={() => { setSearch(''); setFilterType('all'); }}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="draft-grid">
              {paginated.map((d, i) => {
                const isPaid      = d.accessType === 'paid';
                const price       = d.price || 0;
                const description = d.contentDataJson?.description || '';
                const hasFile    = !!(d.contentDataJson?.file);
                const badge      = TYPE_BADGE[d.contentType] || { cls: 'bg-secondary', label: d.contentType };

                return (
                  <div key={d._id} className="draft-grid-item card-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="draft-card">
                      <div className="draft-card-thumb">
                        {d.thumbnail
                          ? <img src={mediaUrl(d.thumbnail)} alt={d.title}
                              onError={e => { e.target.style.display = 'none'; e.target.parentElement.querySelector('.draft-thumb-placeholder').style.display = 'flex'; }} />
                          : null
                        }
                        <div className="draft-thumb-placeholder" style={{ display: d.thumbnail ? 'none' : 'flex' }}>
                          <i className="fas fa-file-contract"></i>
                        </div>
                        <span className={`draft-type-badge badge ${badge.cls}`}>{badge.label}</span>
                        <span className={`draft-price-badge ${isPaid ? 'draft-price-paid' : 'draft-price-free'}`}>
                          {isPaid ? `₹${price}` : 'FREE'}
                        </span>
                        {downloads.includes(d._id) && (
                          <span className="draft-downloaded-badge"><i className="fas fa-check-circle"></i></span>
                        )}
                      </div>

                      <div className="draft-card-body">
                        <h5 className="draft-card-title">{d.title}</h5>
                        <p className="draft-card-desc">{description || 'Professional legal document template.'}</p>
                        <div className="draft-card-meta">
                          <span><i className="fas fa-folder me-1"></i>{badge.label}</span>
                          {d.lastSavedAt && (
                            <span><i className="fas fa-calendar me-1"></i>{formatDate(d.lastSavedAt)}</span>
                          )}
                        </div>
                      </div>

                      <div className="draft-card-footer">
                        {isPaid ? (
                          <button
                            className="btn btn-sm w-100 draft-purchase-btn"
                            onClick={() => handlePurchase(d)}
                          >
                            <i className="fas fa-shopping-cart me-1"></i>
                            Buy Now — ₹{price}
                          </button>
                        ) : (
                          <button
                            className={`btn btn-sm w-100 ${hasFile ? 'btn-gold' : 'btn-outline-secondary'}`}
                            onClick={() => handleDownload(d)}
                          >
                            <i className={`fas ${hasFile ? 'fa-download' : 'fa-lock'} me-1`}></i>
                            {hasFile ? 'Download Free' : 'Not Available'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="d-flex justify-content-center align-items-center gap-2 mt-5">
                <button className="btn btn-outline-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <i className="fas fa-chevron-left"></i>
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(p => (
                  <button
                    key={p}
                    className={`btn btn-sm ${page === p ? 'btn-gold' : 'btn-outline-secondary'}`}
                    onClick={() => setPage(p)}
                    style={{ minWidth: 36 }}
                  >
                    {p}
                  </button>
                ))}
                <button className="btn btn-outline-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Draft Purchase Modal ── */}
      {payModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 500 }}>
            <div className="modal-content" style={{ borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', padding: '18px 24px', color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>Purchase Draft</div>
                    <div style={{ color: '#aaa', fontSize: '0.78rem' }}>{payModal.title}</div>
                  </div>
                  <button onClick={() => setPayModal(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                </div>
              </div>
              <div className="modal-body p-4">
                {paySuccess ? (
                  <div className="text-center py-3">
                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <i className="fas fa-check" style={{ color: '#fff', fontSize: '1.5rem' }}></i>
                    </div>
                    <h5 className="fw-bold">Payment Submitted!</h5>
                    <p className="text-muted small mb-3">Your payment is pending verification. We'll update your access within 24 hours.</p>
                    <button className="btn btn-gold" onClick={() => setPayModal(null)}>Done</button>
                  </div>
                ) : (
                  <>
                    {/* Summary */}
                    <div style={{ background: '#f9f5e8', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                        <span className="text-muted">Draft</span>
                        <span className="fw-semibold">{payModal.title}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginTop: 6 }}>
                        <span className="text-muted">Amount</span>
                        <span className="fw-bold" style={{ color: '#C9A84C', fontSize: '1.1rem' }}>₹{payModal.price}</span>
                      </div>
                    </div>

                    {/* Payment method */}
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Payment Method</label>
                      <div className="d-flex gap-2">
                        {[{ id: 'upi_id', label: 'UPI ID' }, { id: 'qr_code', label: 'QR Code' }].map(m => (
                          <button key={m.id} type="button"
                            className={`btn btn-sm ${payMethod === m.id ? 'btn-gold' : 'btn-outline-secondary'}`}
                            onClick={() => setPayMethod(m.id)}>{m.label}</button>
                        ))}
                      </div>
                    </div>

                    {/* UPI details */}
                    {paySettings.payment_upi_id && (
                      <div style={{ background: '#fff', border: '1.5px dashed #C9A84C', borderRadius: 8, padding: '8px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <i className="fas fa-mobile-alt" style={{ color: '#C9A84C' }}></i>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, flex: 1 }}>{paySettings.payment_upi_id}</span>
                        <button className="btn btn-sm btn-outline-secondary py-0 px-2" style={{ fontSize: '0.72rem' }}
                          onClick={() => navigator.clipboard?.writeText(paySettings.payment_upi_id)}>Copy</button>
                      </div>
                    )}

                    {/* UTR input */}
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">UTR / Transaction Reference <span className="text-danger">*</span></label>
                      <input className="form-control" value={payUtr} onChange={e => { setPayUtr(e.target.value); setPayErr(''); }} placeholder="e.g. 423198765432" style={{ borderRadius: 10 }} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Screenshot <span className="text-muted fw-normal">(optional)</span></label>
                      <input type="file" className="form-control" accept="image/*" onChange={e => setPayScreen(e.target.files[0])} style={{ borderRadius: 10 }} />
                    </div>

                    {payErr && <div className="alert alert-danger py-2 small">{payErr}</div>}

                    <button className="btn btn-gold w-100 py-2 fw-bold" onClick={handlePaySubmit} disabled={payLoading}>
                      {payLoading ? <><i className="fas fa-spinner fa-spin me-2"></i>Submitting…</> : <><i className="fas fa-paper-plane me-2"></i>Submit Payment</>}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
