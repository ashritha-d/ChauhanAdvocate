import { useState } from 'react';
import api from '../api/axios';
import { useUserAuth } from '../context/UserAuthContext';

function generateOrderId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
}

export default function OrderModal({ book, onClose, onSuccess }) {
  const { user } = useUserAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState(null); // { orderId, bookTitle, quantity, name }

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
    if (!form.address.trim()) return 'Delivery address is required';
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
        setPlaced({ orderId, bookTitle: book.title, quantity: form.quantity, name: form.name });
        onSuccess?.();
      } else {
        setError(r.data.message || 'Failed to place order. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="modal-backdrop" onClick={!placed ? onClose : undefined}>
      <div className="order-modal" onClick={e => e.stopPropagation()}>
        <button className="jr-modal-close" onClick={onClose}>&times;</button>

        {placed ? (
          /* ── Success Screen ── */
          <div className="form-success-screen">
            <div className="form-success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h5 className="form-success-title">Order Placed Successfully!</h5>
            <p className="form-success-msg">
              Your order has been placed successfully. Order details have been sent to your registered contact.
            </p>
            <div className="form-success-ref">
              <span className="form-success-ref-label">Order ID</span>
              <span className="form-success-ref-value">{placed.orderId}</span>
            </div>
            <div className="form-success-details">
              <div><i className="fas fa-book me-2 text-gold"></i><strong>Book:</strong> {placed.bookTitle}</div>
              <div><i className="fas fa-hashtag me-2 text-gold"></i><strong>Quantity:</strong> {placed.quantity}</div>
            </div>
            <p className="form-success-note">
              <i className="fab fa-whatsapp me-1 text-success"></i>
              A WhatsApp confirmation has been sent to your registered number. We will contact you within 24 hours.
            </p>
            <button className="btn btn-gold mt-3 px-5" onClick={onClose}>
              <i className="fas fa-times me-2"></i>Close
            </button>
          </div>
        ) : (
          /* ── Form ── */
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
      </div>
    </div>
  );
}
