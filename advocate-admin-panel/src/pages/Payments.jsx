import { useEffect, useState } from 'react';
import usePolling from '../hooks/usePolling';
import { getPayments, getPaymentRevenue, exportPaymentsCsv, confirmPayment, rejectPayment } from '../api';
import { formatDate } from '../utils/helpers';
import ConfirmModal from '../components/ConfirmModal';

const STATUS_COLORS = {
  pending_verification: 'warning',
  approved: 'success',
  rejected: 'danger',
  completed: 'primary',
  failed: 'secondary',
};
const STATUS_LABELS = {
  pending_verification: 'Pending Verification',
  approved: 'Verified',
  rejected: 'Rejected',
  completed: 'Completed',
  failed: 'Failed',
};

const METHOD_LABELS = {
  razorpay: 'Razorpay',
  phonepe: 'PhonePe',
  googlepay: 'Google Pay',
  upi_id: 'UPI ID',
  qr_code: 'QR Code',
  cash: 'Cash',
};

const REJECT_REASONS = ['Invalid UTR', 'Payment Not Received', 'Duplicate Payment', 'Wrong Amount', 'Other'];

function StatCard({ icon, label, value, color = 'gold', sub }) {
  return (
    <div className="col-6 col-md-3">
      <div className="page-card mb-0 h-100">
        <div className="page-card-body py-3 px-3 text-center">
          <div className={`fs-4 text-${color} mb-1`}><i className={`fas ${icon}`}></i></div>
          <div className="fs-5 fw-bold">{value}</div>
          <div className="small text-muted">{label}</div>
          {sub && <div className="small text-success mt-1">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

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
  const [tab, setTab] = useState('list');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [revenue, setRevenue] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);
  const [actingId, setActingId] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectOther, setRejectOther] = useState('');
  const [viewTarget, setViewTarget] = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const load = () => {
    setLoading(true);
    getPayments(1, 200, filter)
      .then(r => setItems(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadRevenue = () => {
    getPaymentRevenue()
      .then(r => { if (r.data.success) setRevenue(r.data); })
      .catch(() => {});
  };

  useEffect(() => { load(); loadRevenue(); }, [filter]);
  usePolling(() => { load(); loadRevenue(); }, 30000);

  const patchLocal = (id, data) => setItems(list => list.map(i => (i._id === id ? { ...i, ...data } : i)));

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportPaymentsCsv(filter);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {}
    setExporting(false);
  };

  const doConfirm = async () => {
    const p = confirmTarget;
    setActingId(p._id);
    try {
      const r = await confirmPayment(p._id);
      patchLocal(p._id, r.data.data);
      showToast('Payment verified successfully.');
      setConfirmTarget(null);
      loadRevenue();
    } catch (e) { showToast(e.response?.data?.message || 'Failed to confirm payment.', 'error'); }
    setActingId(null);
  };

  const finalRejectReason = rejectReason === 'Other' ? rejectOther.trim() : rejectReason;

  const doReject = async () => {
    if (!finalRejectReason) return;
    const p = rejectTarget;
    setActingId(p._id);
    try {
      const r = await rejectPayment(p._id, finalRejectReason);
      patchLocal(p._id, r.data.data);
      showToast('Payment rejected.');
      setRejectTarget(null);
      setRejectReason('');
      setRejectOther('');
    } catch (e) { showToast(e.response?.data?.message || 'Failed to reject payment.', 'error'); }
    setActingId(null);
  };

  const filteredItems = items.filter(i => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      i.clientName?.toLowerCase().includes(q) ||
      i.clientPhone?.includes(q) ||
      i.transactionId?.toLowerCase().includes(q) ||
      i.receiptId?.toLowerCase().includes(q) ||
      i.utrNumber?.toLowerCase().includes(q) ||
      (METHOD_LABELS[i.paymentMethod] || i.paymentMethod || '').toLowerCase().includes(q)
    );
  });

  const pending = items.filter(i => !i.isRead).length;
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fmtDateTime = d => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Not available';

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── TABS ── */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>
            <i className="fas fa-list me-1"></i>Payment History
            {pending > 0 && <span className="badge bg-danger ms-2">{pending}</span>}
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'revenue' ? 'active' : ''}`} onClick={() => setTab('revenue')}>
            <i className="fas fa-chart-bar me-1"></i>Revenue Dashboard
          </button>
        </li>
      </ul>

      {/* ══ REVENUE DASHBOARD ══ */}
      {tab === 'revenue' && (
        <div>
          <div className="row g-3 mb-4">
            <StatCard icon="fa-rupee-sign" label="Total Revenue" value={`₹${(revenue?.totalRevenue || 0).toLocaleString('en-IN')}`} color="gold" />
            <StatCard icon="fa-check-circle" label="Approved Payments" value={revenue?.totalApproved || 0} color="success" />
            <StatCard icon="fa-times-circle" label="Failed Payments" value={revenue?.failedCount || 0} color="danger" />
            <StatCard icon="fa-clock" label="Pending Verification" value={revenue?.pendingCount || 0} color="warning" />
          </div>

          {/* Revenue by Method */}
          <div className="page-card mb-4">
            <div className="page-card-header">
              <h6 className="mb-0 fw-bold">Revenue by Payment Method</h6>
            </div>
            <div className="page-card-body">
              {(revenue?.byMethod || []).length === 0 && <p className="text-muted small">No data yet.</p>}
              {(revenue?.byMethod || []).map(m => (
                <div key={m._id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                  <div>
                    <span className="fw-semibold">{METHOD_LABELS[m._id] || m._id}</span>
                    <span className="text-muted small ms-2">({m.count} transactions)</span>
                  </div>
                  <span className="fw-bold text-success">₹{Number(m.total).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="page-card">
            <div className="page-card-header">
              <h6 className="mb-0 fw-bold">Monthly Revenue (Last 12 Months)</h6>
            </div>
            <div className="page-card-body">
              {(revenue?.byMonth || []).length === 0 && <p className="text-muted small">No data yet.</p>}
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead><tr><th>Month</th><th>Transactions</th><th>Revenue</th></tr></thead>
                  <tbody>
                    {(revenue?.byMonth || []).map(m => (
                      <tr key={`${m._id?.year}-${m._id?.month}`}>
                        <td>{MONTHS[(m._id?.month || 1) - 1]} {m._id?.year}</td>
                        <td>{m.count}</td>
                        <td className="fw-bold text-success">₹{Number(m.total).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ PAYMENT LIST ══ */}
      {tab === 'list' && (
        <div className="page-card">
          <div className="page-card-header flex-wrap gap-2">
            <h6 className="mb-0 fw-bold">
              Payment Transactions
              {pending > 0 && <span className="badge bg-danger ms-2">{pending} new</span>}
            </h6>
            <div className="d-flex gap-2 flex-wrap align-items-center">
              <input
                className="form-control form-control-sm"
                style={{ width: 200 }}
                placeholder="Search name, mobile, UTR, type..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select className="form-select form-select-sm" style={{ width: 170 }} value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="">All</option>
                <option value="pending_verification">Pending Verification</option>
                <option value="approved">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
              <button className="btn btn-sm btn-outline-secondary" onClick={handleExport} disabled={exporting} title="Export CSV">
                {exporting ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-download me-1"></i>Export</>}
              </button>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table admin-table">
              <thead>
                <tr>
                  <th>Client</th><th>Type</th><th>Amount</th><th>Method</th>
                  <th>Ref / UTR</th><th>Status</th><th>Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan="8" className="text-center py-4"><div className="spinner-border spinner-border-sm"></div></td></tr>}
                {!loading && filteredItems.length === 0 && <tr><td colSpan="8" className="text-center text-muted py-4">No payments found</td></tr>}
                {filteredItems.map(item => {
                  const busy = actingId === item._id;
                  return (
                    <tr key={item._id} className={!item.isRead ? 'table-warning' : ''}>
                      <td>
                        <div className="fw-semibold">
                          {item.clientName}
                          {!item.isRead && <span className="badge bg-danger ms-1" style={{ fontSize:'.65rem' }}>NEW</span>}
                        </div>
                        <small className="text-muted">{item.clientPhone}</small>
                      </td>
                      <td><span className="badge bg-secondary">{item.type === 'appointment' ? 'Appt' : 'Order'}</span></td>
                      <td className="fw-bold text-success">₹{item.amount}</td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {METHOD_LABELS[item.paymentMethod] || item.paymentMethod || 'QR/UPI'}
                        </span>
                      </td>
                      <td>
                        <small className="text-muted font-monospace">
                          {item.transactionId || item.utrNumber || item.razorpay_payment_id || '—'}
                        </small>
                      </td>
                      <td><span className={`badge bg-${STATUS_COLORS[item.status]}`}>{STATUS_LABELS[item.status]}</span></td>
                      <td><small>{formatDate(item.createdAt)}</small></td>
                      <td>
                        <div className="d-flex gap-1 align-items-center">
                          {item.status === 'pending_verification' && (
                            <>
                              <button
                                className="btn btn-sm btn-success" title="Confirm Payment" disabled={busy}
                                onClick={() => setConfirmTarget(item)}
                              >
                                {busy ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                              </button>
                              <button
                                className="btn btn-sm btn-danger" title="Reject Payment" disabled={busy}
                                onClick={() => { setRejectTarget(item); setRejectReason(''); setRejectOther(''); }}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </>
                          )}
                          {item.status === 'approved' && (
                            <span className="btn btn-sm btn-success disabled" title="Verified" style={{ opacity: 0.7 }}>
                              <i className="fas fa-check-double"></i>
                            </span>
                          )}
                          {item.status === 'rejected' && (
                            <span className="btn btn-sm btn-danger disabled" title="Rejected" style={{ opacity: 0.7 }}>
                              <i className="fas fa-ban"></i>
                            </span>
                          )}
                          <button className="btn btn-sm btn-outline-secondary" title="View Details" onClick={() => setViewTarget(item)}>
                            <i className="fas fa-eye"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm payment dialog */}
      <ConfirmModal
        show={!!confirmTarget}
        title="Confirm Payment"
        confirmLabel="Confirm Payment"
        loadingLabel="Confirming..."
        confirmVariant="success"
        loading={actingId === confirmTarget?._id}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={doConfirm}
      >
        {confirmTarget && (
          <>
            <p>Are you sure you want to confirm this payment?</p>
            <div className="bg-light rounded p-2 small">
              <div><strong>Client:</strong> {confirmTarget.clientName}</div>
              <div><strong>Amount:</strong> ₹{confirmTarget.amount}</div>
              <div><strong>Payment Type:</strong> {METHOD_LABELS[confirmTarget.paymentMethod] || confirmTarget.paymentMethod}</div>
              <div><strong>UTR:</strong> {confirmTarget.utrNumber || confirmTarget.transactionId || 'Not available'}</div>
            </div>
          </>
        )}
      </ConfirmModal>

      {/* Reject payment dialog */}
      <ConfirmModal
        show={!!rejectTarget}
        title="Reject Payment"
        confirmLabel="Reject Payment"
        loadingLabel="Rejecting..."
        confirmVariant="danger"
        confirmDisabled={!finalRejectReason}
        loading={actingId === rejectTarget?._id}
        onCancel={() => { setRejectTarget(null); setRejectReason(''); setRejectOther(''); }}
        onConfirm={doReject}
      >
        {rejectTarget && (
          <>
            <div className="bg-light rounded p-2 small mb-3">
              <div><strong>Client:</strong> {rejectTarget.clientName}</div>
              <div><strong>Amount:</strong> ₹{rejectTarget.amount}</div>
              <div><strong>UTR:</strong> {rejectTarget.utrNumber || rejectTarget.transactionId || 'Not available'}</div>
            </div>
            <label className="form-label fw-semibold">Rejection Reason *</label>
            <select className="form-select" value={rejectReason} onChange={e => setRejectReason(e.target.value)}>
              <option value="">Select a reason…</option>
              {REJECT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {rejectReason === 'Other' && (
              <textarea
                className="form-control mt-2" rows={2} placeholder="Please specify the reason…"
                value={rejectOther} onChange={e => setRejectOther(e.target.value)}
              />
            )}
          </>
        )}
      </ConfirmModal>

      {/* View details modal */}
      {viewTarget && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="fas fa-eye me-2"></i>Payment Details</h5>
                <button className="btn-close" onClick={() => setViewTarget(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-2 small">
                  <div className="col-6"><strong>Client Name:</strong><br />{viewTarget.clientName}</div>
                  <div className="col-6"><strong>Mobile Number:</strong><br />{viewTarget.clientPhone}</div>
                  <div className="col-6"><strong>Payment Type:</strong><br />{METHOD_LABELS[viewTarget.paymentMethod] || viewTarget.paymentMethod}</div>
                  <div className="col-6"><strong>Amount:</strong><br />₹{viewTarget.amount}</div>
                  <div className="col-6"><strong>UTR / Reference:</strong><br />{viewTarget.utrNumber || viewTarget.transactionId || 'Not available'}</div>
                  <div className="col-6"><strong>QR Used:</strong><br />{viewTarget.paymentMethod === 'qr_code' ? 'Yes' : 'No'}</div>
                  <div className="col-6"><strong>Created Date:</strong><br />{fmtDateTime(viewTarget.createdAt)}</div>
                  <div className="col-6">
                    <strong>Verification Status:</strong><br />
                    <span className={`badge bg-${STATUS_COLORS[viewTarget.status]}`}>{STATUS_LABELS[viewTarget.status]}</span>
                  </div>
                  {viewTarget.status === 'approved' && (
                    <div className="col-6"><strong>Verification Time:</strong><br />{fmtDateTime(viewTarget.verifiedAt || viewTarget.approvedAt)}</div>
                  )}
                  {viewTarget.status === 'rejected' && (
                    <>
                      <div className="col-6"><strong>Rejected At:</strong><br />{fmtDateTime(viewTarget.rejectedAt)}</div>
                      <div className="col-12"><strong>Rejection Reason:</strong><br />{viewTarget.rejectionReason || 'Not available'}</div>
                    </>
                  )}
                  <div className="col-12">
                    <strong>Payment Screenshot:</strong><br />
                    {viewTarget.screenshot ? (
                      <img src={viewTarget.screenshot} alt="Payment screenshot" className="img-fluid rounded mt-1" style={{ maxHeight: 260, border: '1px solid #dee2e6' }} />
                    ) : <span className="text-muted">Not available</span>}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={() => setViewTarget(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
