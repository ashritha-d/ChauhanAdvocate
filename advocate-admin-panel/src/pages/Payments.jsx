import { useEffect, useState } from 'react';
import { getPayments, getPayment, updatePayment, deletePayment } from '../api';
import { formatDate } from '../utils/helpers';
import ConfirmModal from '../components/ConfirmModal';

const BACKEND = 'https://chauhanadvocate.onrender.com';
const STATUS_COLORS = {
  pending_verification: 'warning',
  approved: 'success',
  rejected: 'danger',
  completed: 'primary',
};
const STATUS_LABELS = {
  pending_verification: 'Pending Verification',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
};

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
        <div className="col-5 text-muted">Date</div><div className="col-7">{formatDate(payment.approvedAt || payment.updatedAt)}</div>
        <div className="col-5 text-muted">Client Name</div><div className="col-7">{payment.clientName}</div>
        <div className="col-5 text-muted">Mobile</div><div className="col-7">{payment.clientPhone}</div>
        <div className="col-5 text-muted">Email</div><div className="col-7">{payment.clientEmail || '—'}</div>
        <div className="col-12"><hr className="my-1" /></div>
        <div className="col-5 text-muted">{isAppt ? 'Service' : 'Book'}</div>
        <div className="col-7">{isAppt ? d.service : d.bookTitle}</div>
        {isAppt && <><div className="col-5 text-muted">Date</div><div className="col-7">{d.date ? new Date(d.date).toLocaleDateString('en-IN') : '—'}</div></>}
        {isAppt && <><div className="col-5 text-muted">Time</div><div className="col-7">{d.time || '—'}</div></>}
        {!isAppt && <><div className="col-5 text-muted">Qty</div><div className="col-7">{d.quantity || 1}</div></>}
        {!isAppt && <><div className="col-5 text-muted">Address</div><div className="col-7">{d.address || '—'}</div></>}
        <div className="col-12"><hr className="my-1" /></div>
        <div className="col-5 text-muted">Amount Paid</div><div className="col-7 fw-bold">₹{payment.amount}</div>
        <div className="col-5 text-muted">Method</div><div className="col-7">PhonePe / UPI QR</div>
        <div className="col-5 text-muted">UTR / Ref</div><div className="col-7">{payment.utrNumber || '—'}</div>
        <div className="col-5 text-muted">Status</div><div className="col-7"><span className={`badge bg-${STATUS_COLORS[payment.status]}`}>{STATUS_LABELS[payment.status]}</span></div>
      </div>
      <hr className="my-2" />
      <div className="text-center text-muted small">Thank you for choosing Balu Law Chamber</div>
    </div>
  );
}

export default function Payments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [linked, setLinked] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);

  const load = () => {
    setLoading(true);
    getPayments(1, 100, filter)
      .then(r => setItems(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [filter]);

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
      load();
    } catch {}
    setSaving(false);
  };

  const buildWhatsAppMsg = (p) => {
    const name = p?.clientName || '';
    const phone = p?.clientPhone?.replace(/\D/g, '') || '';
    if (!phone) return '#';
    const isAppt = p.type === 'appointment';
    const d = p.details || {};
    const msg = isAppt
      ? `Hello ${name} 👋,\n\nYour appointment has been *CONFIRMED*! 🎉\n\n📋 Details:\n- Service: ${d.service}\n- Date: ${d.date ? new Date(d.date).toLocaleDateString('en-IN') : '—'}\n- Time: ${d.time}\n\n🧾 Receipt ID: ${p.receiptId}\n💰 Amount: ₹${p.amount}\n\n📍 Balu Law Chamber, Hasthinapuram, LB Nagar\n📞 +91 93925 38226\n\nThank you for choosing us!`
      : `Hello ${name} 👋,\n\nYour book order has been *CONFIRMED*! 📦\n\n📋 Details:\n- Book: ${d.bookTitle}\n- Qty: ${d.quantity || 1}\n\n🧾 Receipt ID: ${p.receiptId}\n💰 Amount: ₹${p.amount}\n\nWe will arrange delivery to your address shortly.\n\n📍 Balu Law Chamber\n📞 +91 93925 38226`;
    return `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`;
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deletePayment(confirm); setConfirm(null); load(); if (selected?._id === confirm) setSelected(null); } catch {}
    setDeleting(false);
  };

  const pending = items.filter(i => !i.isRead).length;

  return (
    <div>
      <div className="page-card">
        <div className="page-card-header flex-wrap gap-2">
          <h6 className="mb-0 fw-bold">
            Payment Notifications
            {pending > 0 && <span className="badge bg-danger ms-2">{pending} new</span>}
          </h6>
          <select className="form-select form-select-sm" style={{ width:'auto' }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="table-responsive">
          <table className="table admin-table">
            <thead>
              <tr>
                <th>Client</th><th>Type</th><th>Amount</th><th>Method</th>
                <th>UTR</th><th>Status</th><th>Received</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="8" className="text-center py-4"><div className="spinner-border spinner-border-sm"></div></td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan="8" className="text-center text-muted py-4">No payments found</td></tr>}
              {items.map(item => (
                <tr key={item._id} className={!item.isRead ? 'table-warning' : ''}>
                  <td>
                    <div className="fw-semibold">{item.clientName}{!item.isRead && <span className="badge bg-danger ms-1" style={{ fontSize:'.65rem' }}>NEW</span>}</div>
                    <small className="text-muted">{item.clientPhone}</small>
                  </td>
                  <td><span className="badge bg-secondary">{item.type === 'appointment' ? 'Appointment' : 'Book Order'}</span></td>
                  <td className="fw-bold text-success">₹{item.amount}</td>
                  <td><i className="fas fa-qrcode me-1 text-gold"></i>QR / UPI</td>
                  <td><small className="text-muted">{item.utrNumber || '—'}</small></td>
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

      {/* Detail / Action Modal */}
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
                      ['Payment Method', 'PhonePe / UPI QR'],
                      ['UTR Number', selected.utrNumber || '—'],
                      ['Submitted On', formatDate(selected.createdAt)],
                      ['Receipt ID', selected.receiptId || '—'],
                    ].map(([l, v]) => (
                      <div className="row mb-2" key={l}>
                        <div className="col-5 text-muted small fw-semibold">{l}</div>
                        <div className="col-7 small">{v}</div>
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

                  {/* Screenshot */}
                  {selected.screenshot && (
                    <div className="col-12">
                      <h6 className="fw-bold text-gold mb-2">Payment Screenshot</h6>
                      <a href={`${BACKEND}${selected.screenshot}`} target="_blank" rel="noreferrer">
                        <img src={`${BACKEND}${selected.screenshot}`} alt="Payment Screenshot"
                          className="img-fluid rounded border" style={{ maxHeight:220, objectFit:'cover' }} />
                      </a>
                    </div>
                  )}

                  {/* Admin Notes */}
                  <div className="col-12">
                    <label className="form-label fw-semibold small">Admin Notes</label>
                    <textarea className="form-control form-control-sm" rows="2"
                      value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Add notes (optional)..."></textarea>
                  </div>

                  {/* Action Buttons */}
                  {selected.status === 'pending_verification' && (
                    <div className="col-12 d-flex gap-2 flex-wrap">
                      <button className="btn btn-success" disabled={saving} onClick={() => handleAction(selected._id, 'approved')}>
                        {saving ? <i className="fas fa-spinner fa-spin me-1"></i> : <i className="fas fa-check me-1"></i>}
                        Approve Payment
                      </button>
                      <button className="btn btn-danger" disabled={saving} onClick={() => handleAction(selected._id, 'rejected')}>
                        <i className="fas fa-times me-1"></i> Reject Payment
                      </button>
                    </div>
                  )}

                  {/* WhatsApp + Receipt (after approval) */}
                  {selected.status === 'approved' && (
                    <div className="col-12 d-flex gap-2 flex-wrap align-items-center">
                      <a href={buildWhatsAppMsg(selected)} target="_blank" rel="noreferrer"
                        className="btn btn-success">
                        <i className="fab fa-whatsapp me-1"></i> Send WhatsApp Confirmation
                      </a>
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowReceipt(r => !r)}>
                        <i className="fas fa-receipt me-1"></i> {showReceipt ? 'Hide' : 'View'} Receipt
                      </button>
                    </div>
                  )}

                  {showReceipt && selected.status === 'approved' && (
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

      <ConfirmModal show={!!confirm} title="Delete Payment" message="Delete this payment record?" onConfirm={handleDelete} onCancel={() => setConfirm(null)} loading={deleting} />
    </div>
  );
}
