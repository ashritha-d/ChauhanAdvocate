import { useEffect, useState } from 'react';
import usePolling from '../hooks/usePolling';
import api from '../api/axios';

const STATUS_META = {
  pending_verification: { color: '#fbbf24', label: 'Pending Verification' },
  approved:  { color: '#34d399', label: 'Verified' },
  rejected:  { color: '#f87171', label: 'Rejected' },
  completed: { color: '#9ca3af', label: 'Completed' },
  failed:    { color: '#f87171', label: 'Failed' },
  refunded:  { color: '#60a5fa', label: 'Refunded' }, // reserved for future support — no payment can hold this status yet
};

const REJECT_REASONS = ['Invalid UTR', 'Payment Not Received', 'Duplicate Payment', 'Wrong Amount', 'Other'];

const METHOD_LABELS = { phonepe: 'PhonePe', googlepay: 'Google Pay', upi_id: 'UPI ID', qr_code: 'QR Code', cash: 'Cash', bank_transfer: 'Bank Transfer' };

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: type === 'error' ? '#dc3545' : '#198754', color: '#fff', padding: '12px 20px', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', minWidth: 260, display: 'flex', alignItems: 'center', gap: 10 }}>
      <i className={type === 'error' ? 'fas fa-times-circle' : 'fas fa-check-circle'}></i>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>&times;</button>
    </div>
  );
}

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [stats, setStats]       = useState(null);
  const [revenue, setRevenue]   = useState(null);
  const [statusFilter, setStatus] = useState('');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [total, setTotal]       = useState(0);
  const [modal, setModal]       = useState(null); // 'edit' | 'confirm' | 'reject' | 'view'
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState({ status: '', adminNotes: '' });
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);
  const [actingId, setActingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectOther, setRejectOther]   = useState('');

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const load = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 15 });
      if (statusFilter) params.set('status', statusFilter);
      const r = await api.get(`/payments?${params}`);
      setPayments(r.data.data || []);
      setTotal(r.data.total || 0);
      setPages(r.data.pages || 1);
    } catch { showToast('Failed to load', 'error'); }
    setLoading(false);
  };

  useEffect(() => {
    api.get('/payments/stats').then(r => setStats(r.data.data || r.data)).catch(() => {});
    api.get('/payments/revenue').then(r => setRevenue(r.data.data || r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(1); setPage(1); }, [statusFilter]);
  usePolling(() => load(page), 30000);

  const patchLocal = (id, data) => setPayments(list => list.map(p => (p._id === id ? { ...p, ...data } : p)));

  const closeModal = () => { setModal(null); setSelected(null); setRejectReason(''); setRejectOther(''); };

  const openEdit = p => { setSelected(p); setForm({ status: p.status, adminNotes: p.adminNotes || '' }); setModal('edit'); };
  const openConfirm = p => { setSelected(p); setModal('confirm'); };
  const openReject = p => { setSelected(p); setRejectReason(''); setRejectOther(''); setModal('reject'); };
  const openView = p => { setSelected(p); setModal('view'); };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const r = await api.put(`/payments/${selected._id}`, form);
      patchLocal(selected._id, r.data.data);
      showToast('Payment updated');
      closeModal();
      api.get('/payments/stats').then(r => setStats(r.data.data || r.data)).catch(() => {});
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    setSaving(false);
  };

  const handleConfirm = async () => {
    setActingId(selected._id);
    try {
      const r = await api.put(`/payments/${selected._id}/approve`);
      patchLocal(selected._id, r.data.data);
      showToast('Payment verified successfully.');
      closeModal();
    } catch (e) { showToast(e.response?.data?.message || 'Failed to confirm payment.', 'error'); }
    setActingId(null);
  };

  const finalRejectReason = rejectReason === 'Other' ? rejectOther.trim() : rejectReason;

  const handleReject = async () => {
    if (!finalRejectReason) return;
    setActingId(selected._id);
    try {
      const r = await api.put(`/payments/${selected._id}/reject`, { rejectionReason: finalRejectReason });
      patchLocal(selected._id, r.data.data);
      showToast('Payment rejected.');
      closeModal();
    } catch (e) { showToast(e.response?.data?.message || 'Failed to reject payment.', 'error'); }
    setActingId(null);
  };

  const fmtDate = d => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtAmt  = a => `₹${parseFloat(a || 0).toLocaleString('en-IN')}`;

  const visiblePayments = payments.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.clientName?.toLowerCase().includes(q) ||
      p.clientPhone?.includes(q) ||
      p.utrNumber?.toLowerCase().includes(q) ||
      (METHOD_LABELS[p.paymentMethod] || p.paymentMethod || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="sa-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="sa-page-header">
        <div>
          <h4 className="sa-page-title"><i className="fas fa-credit-card me-2"></i>Payment Management</h4>
          <p className="sa-page-subtitle">Verify payments, manage transactions, view revenue</p>
        </div>
        <span className="sa-badge-count">{total} payments</span>
      </div>

      {/* Stats + Revenue */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="sa-stat-card">
            <div className="sa-stat-icon" style={{ background: '#fbbf2422', color: '#fbbf24' }}><i className="fas fa-clock"></i></div>
            <div><div className="sa-stat-value">{stats?.pending || 0}</div><div className="sa-stat-label">Pending</div></div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="sa-stat-card">
            <div className="sa-stat-icon" style={{ background: '#34d39922', color: '#34d399' }}><i className="fas fa-check-circle"></i></div>
            <div><div className="sa-stat-value">{stats?.approved || 0}</div><div className="sa-stat-label">Verified</div></div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="sa-stat-card">
            <div className="sa-stat-icon" style={{ background: '#C9A84C22', color: '#C9A84C' }}><i className="fas fa-rupee-sign"></i></div>
            <div><div className="sa-stat-value" style={{ fontSize: '1.2rem' }}>{fmtAmt(revenue?.total)}</div><div className="sa-stat-label">Total Revenue</div></div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="sa-stat-card">
            <div className="sa-stat-icon" style={{ background: '#60a5fa22', color: '#60a5fa' }}><i className="fas fa-calendar"></i></div>
            <div><div className="sa-stat-value" style={{ fontSize: '1.2rem' }}>{fmtAmt(revenue?.thisMonth)}</div><div className="sa-stat-label">This Month</div></div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="sa-card mb-4">
        <div className="sa-card-body py-2">
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <label style={{ color: '#9ca3af', fontSize: '0.83rem', fontWeight: 600 }}>Filter:</label>
            <select className="form-select sa-input" style={{ maxWidth: 200 }} value={statusFilter} onChange={e => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="approved">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
            {statusFilter && <button className="btn sa-btn-outline btn-sm" onClick={() => setStatus('')}>Clear</button>}
            <input
              className="form-control sa-input"
              style={{ maxWidth: 260 }}
              placeholder="Search name, phone, UTR, method..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="sa-card">
        <div className="sa-card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border sa-spinner"></div></div>
          ) : (
            <div className="table-responsive">
              <table className="table sa-table mb-0">
                <thead>
                  <tr>
                    <th className="px-4">Client</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>UTR / TxnID</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th className="px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePayments.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-5" style={{ color: '#6c757d' }}>No payments found</td></tr>
                  ) : visiblePayments.map(p => {
                    const sm = STATUS_META[p.status] || { color: '#9ca3af', label: p.status };
                    const busy = actingId === p._id;
                    return (
                      <tr key={p._id}>
                        <td className="px-4">
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827' }}>{p.clientName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>{p.clientPhone}</div>
                        </td>
                        <td style={{ fontWeight: 700, color: '#C9A84C', fontSize: '0.95rem' }}>{fmtAmt(p.amount)}</td>
                        <td style={{ fontSize: '0.8rem', color: '#374151' }}>{METHOD_LABELS[p.paymentMethod] || p.paymentMethod}</td>
                        <td style={{ fontSize: '0.75rem', color: '#374151', fontFamily: 'monospace' }}>{p.utrNumber || p.transactionId || '—'}</td>
                        <td>
                          <span style={{ background: sm.color + '22', color: sm.color, padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600 }}>
                            {sm.label}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: '#374151' }}>{fmtDate(p.createdAt)}</td>
                        <td className="px-4">
                          <div className="d-flex gap-1 align-items-center">
                            {p.status === 'pending_verification' && (
                              <>
                                <button
                                  className="sa-action-btn" style={{ background: '#065f4633', color: '#34d399', border: 'none' }}
                                  title="Confirm Payment" disabled={busy} onClick={() => openConfirm(p)}
                                >
                                  {busy ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                                </button>
                                <button
                                  className="sa-action-btn" style={{ background: '#7f1d1d33', color: '#f87171', border: 'none' }}
                                  title="Reject Payment" disabled={busy} onClick={() => openReject(p)}
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </>
                            )}
                            {p.status === 'approved' && (
                              <span className="sa-action-btn" style={{ background: '#065f4633', color: '#34d399', border: 'none', cursor: 'default', opacity: 0.8 }} title="Verified">
                                <i className="fas fa-check-double"></i>
                              </span>
                            )}
                            {p.status === 'rejected' && (
                              <span className="sa-action-btn" style={{ background: '#7f1d1d33', color: '#f87171', border: 'none', cursor: 'default', opacity: 0.8 }} title="Rejected">
                                <i className="fas fa-ban"></i>
                              </span>
                            )}
                            <button className="sa-action-btn" style={{ background: '#1e293b', color: '#60a5fa', border: 'none' }} title="View Details" onClick={() => openView(p)}>
                              <i className="fas fa-eye"></i>
                            </button>
                            <button className="sa-action-btn sa-action-edit" title="Edit" onClick={() => openEdit(p)}><i className="fas fa-edit"></i></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {pages > 1 && (
            <div className="d-flex justify-content-center py-3 gap-2">
              <button className="btn sa-btn-outline btn-sm" disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); load(p); }}><i className="fas fa-chevron-left"></i></button>
              <span className="btn sa-btn-primary btn-sm px-3">{page} / {pages}</span>
              <button className="btn sa-btn-outline btn-sm" disabled={page >= pages} onClick={() => { const p = page + 1; setPage(p); load(p); }}><i className="fas fa-chevron-right"></i></button>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {modal === 'edit' && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
            <div className="modal-content sa-modal">
              <div className="modal-header sa-modal-header">
                <h5 className="modal-title fw-bold"><i className="fas fa-edit me-2" style={{ color: '#C9A84C' }}></i>Update Payment</h5>
                <button className="btn-close btn-close-white" onClick={closeModal}></button>
              </div>
              <div className="modal-body sa-modal-body">
                <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{selected?.clientName} — {fmtAmt(selected?.amount)}</p>
                <label className="sa-label mt-2">Status</label>
                <select className="form-select sa-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {Object.entries(STATUS_META).filter(([k]) => k !== 'refunded').map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <label className="sa-label mt-3">Admin Notes</label>
                <textarea className="form-control sa-input" rows={3} value={form.adminNotes} onChange={e => setForm(f => ({ ...f, adminNotes: e.target.value }))} placeholder="Optional notes..."></textarea>
              </div>
              <div className="modal-footer sa-modal-footer">
                <button className="btn sa-btn-outline" onClick={closeModal}>Cancel</button>
                <button className="btn sa-btn-primary" onClick={handleUpdate} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm payment modal */}
      {modal === 'confirm' && selected && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
            <div className="modal-content sa-modal">
              <div className="modal-header sa-modal-header">
                <h5 className="modal-title fw-bold" style={{ color: '#34d399' }}><i className="fas fa-check-circle me-2"></i>Confirm Payment</h5>
                <button className="btn-close btn-close-white" onClick={closeModal}></button>
              </div>
              <div className="modal-body sa-modal-body">
                <p style={{ color: '#9ca3af' }}>Are you sure you want to confirm this payment?</p>
                <div style={{ background: '#1e2436', borderRadius: 8, padding: 12, fontSize: '0.85rem', color: '#e2e8f0' }}>
                  <div><strong>Client:</strong> {selected.clientName}</div>
                  <div><strong>Amount:</strong> {fmtAmt(selected.amount)}</div>
                  <div><strong>Payment Type:</strong> {METHOD_LABELS[selected.paymentMethod] || selected.paymentMethod}</div>
                  <div><strong>UTR:</strong> {selected.utrNumber || selected.transactionId || '—'}</div>
                </div>
              </div>
              <div className="modal-footer sa-modal-footer">
                <button className="btn sa-btn-outline" onClick={closeModal} disabled={actingId === selected._id}>Cancel</button>
                <button className="btn sa-btn-primary" onClick={handleConfirm} disabled={actingId === selected._id}>
                  {actingId === selected._id ? <><i className="fas fa-spinner fa-spin me-2"></i>Confirming…</> : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject payment modal */}
      {modal === 'reject' && selected && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
            <div className="modal-content sa-modal">
              <div className="modal-header sa-modal-header">
                <h5 className="modal-title fw-bold" style={{ color: '#f87171' }}><i className="fas fa-times-circle me-2"></i>Reject Payment</h5>
                <button className="btn-close btn-close-white" onClick={closeModal}></button>
              </div>
              <div className="modal-body sa-modal-body">
                <div style={{ background: '#1e2436', borderRadius: 8, padding: 12, fontSize: '0.85rem', color: '#e2e8f0', marginBottom: 14 }}>
                  <div><strong>Client:</strong> {selected.clientName}</div>
                  <div><strong>Amount:</strong> {fmtAmt(selected.amount)}</div>
                  <div><strong>UTR:</strong> {selected.utrNumber || selected.transactionId || '—'}</div>
                </div>
                <label className="sa-label">Rejection Reason *</label>
                <select className="form-select sa-input" value={rejectReason} onChange={e => setRejectReason(e.target.value)}>
                  <option value="">Select a reason…</option>
                  {REJECT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {rejectReason === 'Other' && (
                  <textarea
                    className="form-control sa-input mt-2" rows={2} placeholder="Please specify the reason…"
                    value={rejectOther} onChange={e => setRejectOther(e.target.value)}
                  />
                )}
              </div>
              <div className="modal-footer sa-modal-footer">
                <button className="btn sa-btn-outline" onClick={closeModal} disabled={actingId === selected._id}>Cancel</button>
                <button
                  className="btn" style={{ background: '#dc3545', color: '#fff', fontWeight: 600 }}
                  onClick={handleReject}
                  disabled={!finalRejectReason || actingId === selected._id}
                >
                  {actingId === selected._id ? <><i className="fas fa-spinner fa-spin me-2"></i>Rejecting…</> : 'Reject Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View details modal */}
      {modal === 'view' && selected && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 480 }}>
            <div className="modal-content sa-modal">
              <div className="modal-header sa-modal-header">
                <h5 className="modal-title fw-bold" style={{ color: '#60a5fa' }}><i className="fas fa-eye me-2"></i>Payment Details</h5>
                <button className="btn-close btn-close-white" onClick={closeModal}></button>
              </div>
              <div className="modal-body sa-modal-body" style={{ fontSize: '0.88rem' }}>
                <div className="row g-2">
                  <div className="col-6"><strong>Client Name:</strong><br />{selected.clientName}</div>
                  <div className="col-6"><strong>Mobile Number:</strong><br />{selected.clientPhone}</div>
                  <div className="col-6"><strong>Payment Type:</strong><br />{METHOD_LABELS[selected.paymentMethod] || selected.paymentMethod}</div>
                  <div className="col-6"><strong>Amount:</strong><br />{fmtAmt(selected.amount)}</div>
                  <div className="col-6"><strong>UTR / Reference:</strong><br />{selected.utrNumber || selected.transactionId || 'Not available'}</div>
                  <div className="col-6"><strong>Created:</strong><br />{fmtDate(selected.createdAt)}</div>
                  <div className="col-6">
                    <strong>Status:</strong><br />
                    <span style={{ background: (STATUS_META[selected.status]?.color || '#9ca3af') + '22', color: STATUS_META[selected.status]?.color || '#9ca3af', padding: '2px 8px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 }}>
                      {STATUS_META[selected.status]?.label || selected.status}
                    </span>
                  </div>
                  {selected.status === 'approved' && (
                    <>
                      <div className="col-6"><strong>Verified At:</strong><br />{fmtDate(selected.verifiedAt || selected.approvedAt)}</div>
                    </>
                  )}
                  {selected.status === 'rejected' && (
                    <>
                      <div className="col-6"><strong>Rejected At:</strong><br />{fmtDate(selected.rejectedAt)}</div>
                      <div className="col-12"><strong>Rejection Reason:</strong><br />{selected.rejectionReason || 'Not available'}</div>
                    </>
                  )}
                  <div className="col-12">
                    <strong>Payment Screenshot:</strong><br />
                    {selected.screenshot ? (
                      <img src={selected.screenshot} alt="Payment screenshot" style={{ maxWidth: '100%', maxHeight: 260, borderRadius: 8, marginTop: 6, border: '1px solid #2d3748' }} />
                    ) : <span style={{ color: '#6b7280' }}>Not available</span>}
                  </div>
                </div>
              </div>
              <div className="modal-footer sa-modal-footer">
                <button className="btn sa-btn-outline" onClick={closeModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
