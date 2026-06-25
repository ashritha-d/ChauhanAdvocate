import { useEffect, useState } from 'react';
import { getPayments, getPayment, updatePayment, deletePayment, getPaymentRevenue, exportPaymentsCsv } from '../api';
import { formatDate } from '../utils/helpers';
import ConfirmModal from '../components/ConfirmModal';

const BACKEND = 'https://chauhanadvocate.onrender.com';

const STATUS_COLORS = {
  pending_verification: 'warning',
  approved: 'success',
  rejected: 'danger',
  completed: 'primary',
  failed: 'secondary',
};
const STATUS_LABELS = {
  pending_verification: 'Pending Verification',
  approved: 'Approved',
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

function Receipt({ payment, linked }) {
  if (!payment) return null;
  const d = payment.details || {};
  const isAppt = payment.type === 'appointment';
  return (
    <div className="receipt-box border rounded p-4 bg-white" style={{ fontFamily: 'monospace', fontSize: '.82rem', maxWidth: 420 }}>
      <div className="text-center mb-3">
        <div className="fw-bold" style={{ fontSize: '1rem' }}>BALU LAW CHAMBER</div>
        <div className="text-muted small">New Venkatramana Colony, Hasthinapuram, LB Nagar</div>
        <hr className="my-2" />
        <div className="fw-bold" style={{ fontSize: '.9rem' }}>PAYMENT RECEIPT</div>
      </div>
      <div className="row g-1 small">
        <div className="col-5 text-muted">Receipt ID</div><div className="col-7 fw-bold">{payment.receiptId || '—'}</div>
        <div className="col-5 text-muted">Transaction ID</div><div className="col-7 fw-bold">{payment.transactionId || '—'}</div>
        <div className="col-5 text-muted">Date</div><div className="col-7">{formatDate(payment.approvedAt || payment.updatedAt)}</div>
        <div className="col-5 text-muted">Client Name</div><div className="col-7">{payment.clientName}</div>
        <div className="col-5 text-muted">Mobile</div><div className="col-7">{payment.clientPhone}</div>
        <div className="col-5 text-muted">Email</div><div className="col-7">{payment.clientEmail || '—'}</div>
        <div className="col-12"><hr className="my-1" /></div>
        <div className="col-5 text-muted">{isAppt ? 'Service' : 'Book'}</div>
        <div className="col-7">{isAppt ? d.service : d.bookTitle}</div>
        {isAppt && <><div className="col-5 text-muted">Date</div><div className="col-7">{d.date ? new Date(d.date).toLocaleDateString('en-IN') : '—'}</div></>}
        {isAppt && <><div className="col-5 text-muted">Time</div><div className="col-7">{d.time || '—'}</div></>}
        {isAppt && <><div className="col-5 text-muted">Mode</div><div className="col-7">{d.appointmentMode === 'online' ? 'Online' : 'Offline'}</div></>}
        {!isAppt && <><div className="col-5 text-muted">Qty</div><div className="col-7">{d.quantity || 1}</div></>}
        {!isAppt && <><div className="col-5 text-muted">Address</div><div className="col-7">{d.address || '—'}</div></>}
        <div className="col-12"><hr className="my-1" /></div>
        <div className="col-5 text-muted">Amount Paid</div><div className="col-7 fw-bold">₹{payment.amount}</div>
        <div className="col-5 text-muted">Method</div><div className="col-7">{METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod || '—'}</div>
        {payment.utrNumber && <><div className="col-5 text-muted">UTR / Ref</div><div className="col-7">{payment.utrNumber}</div></>}
        {payment.razorpay_payment_id && <><div className="col-5 text-muted">Razorpay ID</div><div className="col-7" style={{ wordBreak:'break-all' }}>{payment.razorpay_payment_id}</div></>}
        <div className="col-5 text-muted">Status</div><div className="col-7"><span className={`badge bg-${STATUS_COLORS[payment.status]}`}>{STATUS_LABELS[payment.status]}</span></div>
      </div>
      <hr className="my-2" />
      <div className="text-center text-muted small">Thank you for choosing Balu Law Chamber</div>
    </div>
  );
}

export default function Payments() {
  const [tab, setTab] = useState('list');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [linked, setLinked] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [revenue, setRevenue] = useState(null);
  const [exporting, setExporting] = useState(false);

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

  const handleView = async (item) => {
    setShowReceipt(false);
    setNotes(item.adminNotes || '');
    try {
      const r = await getPayment(item._id);
      setSelected(r.data.data);
      setLinked(r.data.linkedRecord);
      setItems(prev => prev.map(i => i._id === item._id ? { ...i, isRead: true } : i));
    } catch { setSelected(item); setLinked(null); }
  };

  const handleAction = async (id, status) => {
    setSaving(true);
    try {
      await updatePayment(id, { status, adminNotes: notes });
      setSelected(prev => ({ ...prev, status, adminNotes: notes }));
      load(); loadRevenue();
    } catch {}
    setSaving(false);
  };

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

  const buildWhatsAppMsg = (p) => {
    const name = p?.clientName || '';
    const phone = p?.clientPhone?.replace(/\D/g, '') || '';
    if (!phone) return '#';
    const isAppt = p.type === 'appointment';
    const d = p.details || {};
    const msg = isAppt
      ? `Hello ${name} 👋,\n\nYour appointment has been *CONFIRMED*! 🎉\n\n📋 Details:\n- Service: ${d.service}\n- Date: ${d.date ? new Date(d.date).toLocaleDateString('en-IN') : '—'}\n- Time: ${d.time}\n- Mode: ${d.appointmentMode === 'online' ? 'Online' : 'Offline'}\n\n🧾 Receipt ID: ${p.receiptId || '—'}\n🔖 Transaction ID: ${p.transactionId || '—'}\n💰 Amount: ₹${p.amount}\n\n📍 Balu Law Chamber\n📞 +91 93925 38226\n\nThank you for choosing us!`
      : `Hello ${name} 👋,\n\nYour book order has been *CONFIRMED*! 📦\n\n📋 Details:\n- Book: ${d.bookTitle}\n- Qty: ${d.quantity || 1}\n\n🧾 Receipt ID: ${p.receiptId || '—'}\n💰 Amount: ₹${p.amount}\n\nWe will arrange delivery shortly.\n📞 +91 93925 38226`;
    return `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`;
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deletePayment(confirm); setConfirm(null); load(); if (selected?._id === confirm) setSelected(null); } catch {}
    setDeleting(false);
  };

  const filteredItems = items.filter(i => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      i.clientName?.toLowerCase().includes(q) ||
      i.clientPhone?.includes(q) ||
      i.transactionId?.toLowerCase().includes(q) ||
      i.receiptId?.toLowerCase().includes(q) ||
      i.utrNumber?.includes(q)
    );
  });

  const pending = items.filter(i => !i.isRead).length;
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div>
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
                style={{ width: 160 }}
                placeholder="Search name / UTR / TXN..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select className="form-select form-select-sm" style={{ width: 170 }} value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="pending_verification">Pending Verification</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="failed">Failed</option>
                <option value="completed">Completed</option>
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
                {filteredItems.map(item => (
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
                      <button className="btn btn-sm btn-outline-info me-1" onClick={() => handleView(item)} title="View"><i className="fas fa-eye"></i></button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => setConfirm(item._id)} title="Delete"><i className="fas fa-trash"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {selected && (
        <div className="modal fade show d-block" style={{ background:'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-scrollable modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Payment Details
                  <span className={`badge bg-${STATUS_COLORS[selected.status]} ms-2`}>{STATUS_LABELS[selected.status]}</span>
                </h5>
                <button className="btn-close" onClick={() => { setSelected(null); setShowReceipt(false); }}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <h6 className="fw-bold text-gold mb-3">Client & Payment Info</h6>
                    {[
                      ['Client Name', selected.clientName],
                      ['Phone', selected.clientPhone],
                      ['Email', selected.clientEmail || '—'],
                      ['Amount', `₹${selected.amount}`],
                      ['Payment Method', METHOD_LABELS[selected.paymentMethod] || selected.paymentMethod || '—'],
                      ['UTR Number', selected.utrNumber || '—'],
                      ['Transaction ID', selected.transactionId || '—'],
                      ['Razorpay Payment ID', selected.razorpay_payment_id || '—'],
                      ['Receipt ID', selected.receiptId || '—'],
                      ['Submitted On', formatDate(selected.createdAt)],
                      ['Approved On', selected.approvedAt ? formatDate(selected.approvedAt) : '—'],
                    ].map(([l, v]) => (
                      <div className="row mb-2" key={l}>
                        <div className="col-5 text-muted small fw-semibold">{l}</div>
                        <div className="col-7 small font-monospace" style={{ wordBreak:'break-all' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="col-md-6">
                    <h6 className="fw-bold text-gold mb-3">
                      {selected.type === 'appointment' ? 'Appointment Details' : 'Order Details'}
                    </h6>
                    {selected.type === 'appointment' ? (
                      [
                        ['Service', selected.details?.service],
                        ['Mode', selected.details?.appointmentMode === 'online' ? 'Online' : 'Offline'],
                        ['Date', selected.details?.date ? new Date(selected.details.date).toLocaleDateString('en-IN') : '—'],
                        ['Time', selected.details?.time],
                        ['Message', selected.details?.message || '—'],
                      ].map(([l, v]) => (
                        <div className="row mb-2" key={l}>
                          <div className="col-5 text-muted small fw-semibold">{l}</div>
                          <div className="col-7 small">{v}</div>
                        </div>
                      ))
                    ) : (
                      [
                        ['Book', selected.details?.bookTitle],
                        ['Price', selected.details?.bookPrice],
                        ['Quantity', selected.details?.quantity],
                        ['Address', selected.details?.address],
                        ['Notes', selected.details?.notes || '—'],
                      ].map(([l, v]) => (
                        <div className="row mb-2" key={l}>
                          <div className="col-5 text-muted small fw-semibold">{l}</div>
                          <div className="col-7 small">{v}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {selected.screenshot && (
                    <div className="col-12">
                      <h6 className="fw-bold text-gold mb-2">Payment Screenshot</h6>
                      <a href={`${BACKEND}${selected.screenshot}`} target="_blank" rel="noreferrer">
                        <img src={`${BACKEND}${selected.screenshot}`} alt="Screenshot"
                          className="img-fluid rounded border" style={{ maxHeight:220, objectFit:'cover' }} />
                      </a>
                    </div>
                  )}

                  <div className="col-12">
                    <label className="form-label fw-semibold small">Admin Notes</label>
                    <textarea className="form-control form-control-sm" rows="2"
                      value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Add notes (optional)..."></textarea>
                  </div>

                  {selected.status === 'pending_verification' && (
                    <div className="col-12 d-flex gap-2 flex-wrap">
                      <button className="btn btn-success" disabled={saving} onClick={() => handleAction(selected._id, 'approved')}>
                        {saving ? <i className="fas fa-spinner fa-spin me-1"></i> : <i className="fas fa-check me-1"></i>}
                        Approve Payment
                      </button>
                      <button className="btn btn-danger" disabled={saving} onClick={() => handleAction(selected._id, 'rejected')}>
                        <i className="fas fa-times me-1"></i> Reject
                      </button>
                    </div>
                  )}

                  {(selected.status === 'approved' || selected.status === 'completed') && (
                    <div className="col-12 d-flex gap-2 flex-wrap align-items-center">
                      <a href={buildWhatsAppMsg(selected)} target="_blank" rel="noreferrer" className="btn btn-success">
                        <i className="fab fa-whatsapp me-1"></i> WhatsApp Confirmation
                      </a>
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowReceipt(r => !r)}>
                        <i className="fas fa-receipt me-1"></i> {showReceipt ? 'Hide' : 'View'} Receipt
                      </button>
                    </div>
                  )}

                  {selected.status === 'rejected' && (
                    <div className="col-12">
                      <div className="alert alert-danger py-2 small mb-0">
                        <i className="fas fa-exclamation-triangle me-1"></i>
                        Payment rejected. Appointment remains pending.
                      </div>
                    </div>
                  )}

                  {showReceipt && (
                    <div className="col-12">
                      <Receipt payment={selected} linked={linked} />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={() => { setSelected(null); setShowReceipt(false); }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal show={!!confirm} title="Delete Payment" message="Delete this payment record? This cannot be undone." onConfirm={handleDelete} onCancel={() => setConfirm(null)} loading={deleting} />
    </div>
  );
}
