import { useEffect, useState } from 'react';
import usePolling from '../hooks/usePolling';
import { getBookOrders, updateBookOrder, deleteBookOrder } from '../api';
import { formatDate } from '../utils/helpers';
import ConfirmModal from '../components/ConfirmModal';

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_BADGE = {
  pending: 'bg-warning text-dark',
  confirmed: 'bg-info text-dark',
  processing: 'bg-primary',
  shipped: 'bg-info text-dark',
  delivered: 'bg-success',
  cancelled: 'bg-danger',
};

function TrackingModal({ order, onConfirm, onClose, saving }) {
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');

  return (
    <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fas fa-truck me-2 text-info"></i>Ship Order
            </h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p className="text-muted mb-3">
              Order by <strong>{order.name}</strong>
              {order.orderId && <span className="ms-1 badge bg-secondary">{order.orderId}</span>}
            </p>
            <div className="mb-3">
              <label className="form-label fw-semibold">Book: {order.bookTitle}</label>
            </div>
            <div className="mb-3">
              <label className="form-label">Tracking Number (optional)</label>
              <input
                type="text"
                className="form-control"
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                placeholder="e.g. DTDC12345678"
              />
              <div className="form-text">Leave blank if no tracking number available.</div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-light" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-info text-white"
              onClick={() => onConfirm(trackingNumber)}
              disabled={saving}
            >
              {saving
                ? <><i className="fas fa-spinner fa-spin me-1"></i>Saving…</>
                : <><i className="fas fa-truck me-1"></i>Mark as Shipped</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookOrders() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [shipTarget, setShipTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getBookOrders(1, 100, filter)
      .then(r => setItems(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);
  usePolling(load, 30000);

  const handleView = async (item) => {
    setSelected(item);
    if (!item.isRead) {
      await updateBookOrder(item._id, { isRead: true }).catch(() => {});
      setItems(prev => prev.map(i => i._id === item._id ? { ...i, isRead: true } : i));
    }
  };

  const handleAction = async (id, status, extra = {}) => {
    setSaving(true);
    try { await updateBookOrder(id, { status, ...extra }); load(); } catch {}
    setSaving(false);
  };

  const handleShip = async (trackingNumber) => {
    if (!shipTarget) return;
    setSaving(true);
    try {
      await updateBookOrder(shipTarget._id, { status: 'shipped', trackingNumber });
      setShipTarget(null);
      load();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteBookOrder(confirm); setConfirm(null); load(); } catch {}
    setDeleting(false);
  };

  const filtered = items.filter(a =>
    !search ||
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.bookTitle?.toLowerCase().includes(search.toLowerCase()) ||
    a.orderId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-card">
        <div className="page-card-header flex-wrap gap-2">
          <h6 className="mb-0 fw-bold">
            Book Orders ({items.length})
            {items.filter(i => !i.isRead).length > 0 && (
              <span className="badge bg-danger ms-2">{items.filter(i => !i.isRead).length} new</span>
            )}
          </h6>
          <div className="d-flex gap-2 flex-wrap">
            <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, order ID…" />
            <select className="form-select form-select-sm" style={{ width: 'auto' }} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Book</th>
                <th>Qty</th>
                <th>Status</th>
                <th>Tracking</th>
                <th>Ordered On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="8" className="text-center py-4"><div className="spinner-border spinner-border-sm"></div></td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan="8" className="text-center text-muted py-4">No book orders found</td></tr>}
              {filtered.map(item => (
                <tr key={item._id} className={!item.isRead ? 'table-warning' : ''}>
                  <td>
                    <small style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#666' }}>
                      {item.orderId || item._id.slice(-6)}
                    </small>
                  </td>
                  <td>
                    <div className="fw-semibold">
                      {item.name}
                      {!item.isRead && <span className="badge bg-danger ms-1" style={{ fontSize: '0.65rem' }}>NEW</span>}
                    </div>
                    <small className="text-muted">{item.email}</small><br />
                    <small className="text-muted">{item.phone}</small>
                  </td>
                  <td>
                    <div className="fw-semibold">{item.bookTitle}</div>
                    {item.bookPrice && <small className="text-muted">{item.bookPrice}</small>}
                  </td>
                  <td>{item.quantity}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[item.status] || 'bg-secondary'}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    {item.trackingNumber
                      ? <small className="text-info fw-semibold">{item.trackingNumber}</small>
                      : <small className="text-muted">—</small>
                    }
                  </td>
                  <td><small>{formatDate(item.createdAt)}</small></td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      {item.status === 'pending' && (
                        <button
                          className="btn btn-xs btn-success"
                          onClick={() => handleAction(item._id, 'confirmed')}
                          disabled={saving}
                          title="Confirm"
                        >
                          <i className="fas fa-check me-1"></i>Confirm
                        </button>
                      )}
                      {item.status === 'confirmed' && (
                        <button
                          className="btn btn-xs btn-primary"
                          onClick={() => handleAction(item._id, 'processing')}
                          disabled={saving}
                          title="Mark Processing"
                        >
                          <i className="fas fa-cogs me-1"></i>Process
                        </button>
                      )}
                      {['confirmed', 'processing'].includes(item.status) && (
                        <button
                          className="btn btn-xs btn-info text-white"
                          onClick={() => setShipTarget(item)}
                          disabled={saving}
                          title="Ship"
                        >
                          <i className="fas fa-truck me-1"></i>Ship
                        </button>
                      )}
                      {item.status === 'shipped' && (
                        <button
                          className="btn btn-xs btn-success"
                          onClick={() => handleAction(item._id, 'delivered')}
                          disabled={saving}
                          title="Mark Delivered"
                        >
                          <i className="fas fa-check-double me-1"></i>Delivered
                        </button>
                      )}
                      {['pending', 'confirmed', 'processing'].includes(item.status) && (
                        <button
                          className="btn btn-xs btn-danger"
                          onClick={() => handleAction(item._id, 'cancelled')}
                          disabled={saving}
                          title="Cancel"
                        >
                          <i className="fas fa-times me-1"></i>Cancel
                        </button>
                      )}
                      <button className="btn btn-xs btn-outline-info" onClick={() => handleView(item)} title="View"><i className="fas fa-eye"></i></button>
                      <button className="btn btn-xs btn-outline-danger" onClick={() => setConfirm(item._id)}><i className="fas fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Book Order Details</h5>
                <button className="btn-close" onClick={() => setSelected(null)}></button>
              </div>
              <div className="modal-body">
                {[
                  ['Order ID', selected.orderId || '—'],
                  ['Customer Name', selected.name],
                  ['Email', selected.email],
                  ['Phone', selected.phone],
                  ['Book Title', selected.bookTitle],
                  ['Price', selected.bookPrice || '—'],
                  ['Quantity', selected.quantity],
                  ['Status', selected.status],
                  ['Tracking', selected.trackingNumber || '—'],
                  ['Ordered On', formatDate(selected.createdAt)],
                ].map(([label, value]) => (
                  <div className="row mb-2" key={label}>
                    <div className="col-4 text-muted small fw-semibold">{label}</div>
                    <div className="col-8">{value}</div>
                  </div>
                ))}
                {selected.address && (
                  <div className="mt-3">
                    <div className="text-muted small fw-semibold mb-1">Delivery Address</div>
                    <div className="bg-light p-3 rounded">{selected.address}</div>
                  </div>
                )}
                {selected.notes && (
                  <div className="mt-3">
                    <div className="text-muted small fw-semibold mb-1">Additional Notes</div>
                    <div className="bg-light p-3 rounded">{selected.notes}</div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={() => setSelected(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ship Modal */}
      {shipTarget && (
        <TrackingModal
          order={shipTarget}
          onConfirm={handleShip}
          onClose={() => setShipTarget(null)}
          saving={saving}
        />
      )}

      <ConfirmModal
        show={!!confirm}
        title="Delete Book Order"
        message="Delete this book order permanently?"
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
        loading={deleting}
      />
    </div>
  );
}
