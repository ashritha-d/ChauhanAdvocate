import { useState } from 'react';
import api from '../api/axios';
import { useUserAuth } from '../context/UserAuthContext';

function generateOrderId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
}

function Receipt({ order, onClose }) {
  const handlePrint = () => window.print();
  return (
    <div className="order-receipt">
      <div className="receipt-header">
        <div className="receipt-logo">
          <img src={`${import.meta.env.BASE_URL}logo.jpeg`} alt="Advocate Chauhan" />
        </div>
        <div>
          <h5 className="mb-1">Advocate Chauhan</h5>
          <small className="text-muted">Book Order Receipt</small>
        </div>
      </div>
      <div className="receipt-divider"></div>
      <div className="receipt-row"><span>Order ID</span><strong>{order.orderId}</strong></div>
      <div className="receipt-row"><span>Date</span><span>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
      <div className="receipt-divider"></div>
      <div className="receipt-row"><span>Customer</span><span>{order.name}</span></div>
      <div className="receipt-row"><span>Mobile</span><span>{order.phone}</span></div>
      <div className="receipt-row"><span>Email</span><span>{order.email || '—'}</span></div>
      <div className="receipt-row"><span>WhatsApp</span><span>{order.whatsapp || '—'}</span></div>
      <div className="receipt-row"><span>Address</span><span style={{ maxWidth: 180, textAlign: 'right' }}>{order.address}</span></div>
      <div className="receipt-divider"></div>
      <div className="receipt-row"><span>Book</span><strong>{order.bookTitle}</strong></div>
      <div className="receipt-row"><span>Quantity</span><span>{order.quantity}</span></div>
      {order.bookPrice && <div className="receipt-row"><span>Price</span><span>{order.bookPrice}</span></div>}
      <div className="receipt-divider"></div>
      <div className="receipt-status">
        <div className="text-success fw-bold mb-2" style={{ fontSize: '1.05rem' }}>
          <i className="fas fa-check-circle me-2"></i>Your order has been successfully placed!
        </div>
        <span className="badge bg-warning text-dark">Pending Confirmation</span>
      </div>
      <p className="receipt-note">We will contact you within 24 hours to confirm your order and payment details.</p>
      <div className="d-flex gap-2 justify-content-center mt-3 no-print">
        <button className="btn btn-gold btn-sm" onClick={handlePrint}><i className="fas fa-download me-1"></i>Download Receipt</button>
        <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default function OrderModal({ book, onClose, onSuccess }) {
  const { user } = useUserAuth();
  const [step, setStep] = useState('form'); // form | success
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    whatsapp: user?.phone || '',
    email: user?.email || '',
    address: '',
    quantity: 1,
    notes: '',
  });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    if (!form.name.trim()) return 'Full name is required';
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) return 'Enter a valid 10-digit mobile number';
    if (!form.address.trim()) return 'Address is required';
    if (form.quantity < 1) return 'Quantity must be at least 1';
    return null;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setSubmitting(true);

    const orderId = generateOrderId();
    const payload = {
      ...form,
      bookTitle: book.title,
      bookPrice: book.price || '',
      orderId,
      userId: user?._id || undefined,
    };

    try {
      const r = await api.post('/book-orders', payload);
      if (r.data.success) {
        setCompletedOrder({ ...payload, orderId });
        setStep('success');
        onSuccess?.();
      } else {
        setError(r.data.message || 'Failed to place order');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="order-modal" onClick={e => e.stopPropagation()}>
        <button className="jr-modal-close" onClick={onClose}>&times;</button>

        {step === 'form' && (
          <>
            <h5 className="mb-1" style={{ fontFamily: "'Playfair Display',serif" }}>
              <i className="fas fa-shopping-cart text-gold me-2"></i>Order Book
            </h5>
            <p className="text-muted small mb-3">Ordering: <strong>{book.title}</strong>{book.price && ` — ${book.price}`}</p>

            {error && <div className="alert alert-danger py-2 small">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="row g-2">
                <div className="col-12">
                  <label className="form-label form-label-sm">Full Name *</label>
                  <input className="form-control form-control-sm" value={form.name} onChange={set('name')} placeholder="Your full name" required />
                </div>
                <div className="col-md-6">
                  <label className="form-label form-label-sm">Mobile Number *</label>
                  <input className="form-control form-control-sm" type="tel" value={form.phone} onChange={set('phone')} placeholder="10-digit mobile" required />
                </div>
                <div className="col-md-6">
                  <label className="form-label form-label-sm">WhatsApp Number</label>
                  <input className="form-control form-control-sm" type="tel" value={form.whatsapp} onChange={set('whatsapp')} placeholder="WhatsApp number" />
                </div>
                <div className="col-12">
                  <label className="form-label form-label-sm">Email Address</label>
                  <input className="form-control form-control-sm" type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" />
                </div>
                <div className="col-md-8">
                  <label className="form-label form-label-sm">Complete Address *</label>
                  <textarea className="form-control form-control-sm" rows={2} value={form.address} onChange={set('address')} placeholder="Door no, Street, City, State, PIN" required />
                </div>
                <div className="col-md-4">
                  <label className="form-label form-label-sm">Quantity *</label>
                  <input className="form-control form-control-sm" type="number" min={1} max={20} value={form.quantity} onChange={set('quantity')} required />
                </div>
                <div className="col-12">
                  <label className="form-label form-label-sm">Notes (optional)</label>
                  <input className="form-control form-control-sm" value={form.notes} onChange={set('notes')} placeholder="Any special instructions" />
                </div>
              </div>
              <button type="submit" className="btn btn-gold w-100 mt-3" disabled={submitting}>
                {submitting ? <><i className="fas fa-spinner fa-spin me-2"></i>Submitting…</> : <><i className="fas fa-paper-plane me-2"></i>Submit</>}
              </button>
            </form>
          </>
        )}

        {step === 'success' && completedOrder && (
          <Receipt order={completedOrder} onClose={onClose} />
        )}
      </div>
    </div>
  );
}
