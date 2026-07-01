import { useEffect, useState } from 'react';
import api from '../api/axios';

const STATUS_META = {
  pending_verification: { color: '#fbbf24', label: 'Pending' },
  approved:  { color: '#34d399', label: 'Approved' },
  rejected:  { color: '#f87171', label: 'Rejected' },
  completed: { color: '#9ca3af', label: 'Completed' },
  failed:    { color: '#f87171', label: 'Failed' },
};

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
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [total, setTotal]       = useState(0);
  const [modal, setModal]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState({ status: '', adminNotes: '' });
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);

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

  const openEdit = p => { setSelected(p); setForm({ status: p.status, adminNotes: p.adminNotes || '' }); setModal('edit'); };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await api.put(`/payments/${selected._id}`, form);
      showToast('Payment updated');
      setModal(null); load();
      api.get('/payments/stats').then(r => setStats(r.data.data || r.data)).catch(() => {});
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    setSaving(false);
  };

  const quickApprove = async (p) => {
    try {
      await api.put(`/payments/${p._id}`, { status: 'approved' });
      showToast('Payment approved'); load();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
  };

  const quickReject = async (p) => {
    try {
      await api.put(`/payments/${p._id}`, { status: 'rejected' });
      showToast('Payment rejected'); load();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
  };

  const fmtDate = d => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtAmt  = a => `₹${parseFloat(a || 0).toLocaleString('en-IN')}`;

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
            <div><div className="sa-stat-value">{stats?.approved || 0}</div><div className="sa-stat-label">Approved</div></div>
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
              <option value="">All Status</option>
              {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            {statusFilter && <button className="btn sa-btn-outline btn-sm" onClick={() => setStatus('')}>Clear</button>}
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
                  {payments.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-5" style={{ color: '#6c757d' }}>No payments found</td></tr>
                  ) : payments.map(p => {
                    const sm = STATUS_META[p.status] || { color: '#9ca3af', label: p.status };
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
                          <div className="d-flex gap-1">
                            {p.status === 'pending_verification' && (
                              <>
                                <button className="sa-action-btn" style={{ background: '#065f4633', color: '#34d399', border: 'none' }} title="Approve" onClick={() => quickApprove(p)}><i className="fas fa-check"></i></button>
                                <button className="sa-action-btn" style={{ background: '#7f1d1d33', color: '#f87171', border: 'none' }} title="Reject" onClick={() => quickReject(p)}><i className="fas fa-times"></i></button>
                              </>
                            )}
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
                <button className="btn-close btn-close-white" onClick={() => setModal(null)}></button>
              </div>
              <div className="modal-body sa-modal-body">
                <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{selected?.clientName} — {fmtAmt(selected?.amount)}</p>
                <label className="sa-label mt-2">Status</label>
                <select className="form-select sa-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <label className="sa-label mt-3">Admin Notes</label>
                <textarea className="form-control sa-input" rows={3} value={form.adminNotes} onChange={e => setForm(f => ({ ...f, adminNotes: e.target.value }))} placeholder="Optional notes..."></textarea>
              </div>
              <div className="modal-footer sa-modal-footer">
                <button className="btn sa-btn-outline" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn sa-btn-primary" onClick={handleUpdate} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
