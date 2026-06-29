import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';

function generateOrderId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
}

export default function OrderModal({ book, onClose }) {
  const { user } = useUserAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

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

  const handleProceed = e => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError('');

    const orderId = generateOrderId();
    const pending = {
      name: form.name,
      phone: form.phone,
      whatsappNumber: form.whatsapp,
      email: form.email,
      address: form.address,
      quantity: parseInt(form.quantity) || 1,
      notes: form.notes,
      bookTitle: book.title,
      bookPrice: book.rawPrice || 0,
      orderId,
      userId: user?._id || '',
    };

    sessionStorage.setItem('pendingBookOrder', JSON.stringify(pending));
    onClose();
    navigate('/book-payment');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="order-modal" onClick={e => e.stopPropagation()}>
        <button className="jr-modal-close" onClick={onClose}>&times;</button>

        <h5 className="mb-1" style={{ fontFamily: "'Playfair Display',serif" }}>
          <i className="fas fa-shopping-cart text-gold me-2"></i>Order Book
        </h5>
        <p className="text-muted small mb-3">Ordering: <strong>{book.title}</strong>{book.price && ` — ${book.price}`}</p>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <form onSubmit={handleProceed}>
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
          <button type="submit" className="btn btn-gold w-100 mt-3">
            <i className="fas fa-arrow-right me-2"></i>Proceed to Payment
          </button>
        </form>
      </div>
    </div>
  );
}
