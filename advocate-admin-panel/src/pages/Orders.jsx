import { useEffect, useState } from 'react';
import usePolling from '../hooks/usePolling';
import { getOrders, updateOrder, deleteOrder } from '../api';
import { formatDate } from '../utils/helpers';
import ConfirmModal from '../components/ConfirmModal';

const STATUSES = ['pending', 'reviewed', 'closed'];
const STATUS_BADGE = { pending: 'badge-pending', reviewed: 'badge-confirmed', closed: 'badge-completed' };
const BACKEND = import.meta.env.VITE_API_BASE?.replace('/api', '') || 'https://chauhanadvocate.onrender.com';

export default function Orders() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getOrders(1, 100, filter)
      .then(r => setItems(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [filter]);
  usePolling(load, 30000);

  const handleView = async (item) => {
    setSelected(item);
    if (!item.isRead) {
      await updateOrder(item._id, { isRead: true }).catch(() => {});
      setItems(prev => prev.map(i => i._id === item._id ? { ...i, isRead: true } : i));
    }
  };

  const handleStatus = async (id, status) => {
    setSaving(true);
    try { await updateOrder(id, { status }); load(); } catch {}
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteOrder(confirm); setConfirm(null); load(); } catch {}
    setDeleting(false);
  };

  const filtered = items.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.phone?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-card">
        <div className="page-card-header flex-wrap gap-2">
          <h6 className="mb-0 fw-bold">
            Orders ({items.length})
            {items.filter(i => !i.isRead).length > 0 && (
              <span className="badge bg-danger ms-2">{items.filter(i => !i.isRead).length} new</span>
            )}
          </h6>
          <div className="d-flex gap-2 flex-wrap">
            <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." />
            <select className="form-select form-select-sm" style={{ width: 'auto' }} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table admin-table">
            <thead><tr><th>Client</th><th>Service</th><th>Contact</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="6" className="text-center py-4"><div className="spinner-border spinner-border-sm"></div></td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan="6" className="text-center text-muted py-4">No orders found</td></tr>}
              {filtered.map(item => (
                <tr key={item._id} className={!item.isRead ? 'table-warning' : ''}>
                  <td>
                    <div className="fw-semibold">{item.name}{!item.isRead && <span className="badge bg-danger ms-1" style={{ fontSize: '0.65rem' }}>NEW</span>}</div>
                    <small className="text-muted">{item.email}</small><br />
                    <small className="text-muted">{item.phone}</small>
                  </td>
                  <td>{item.serviceType}</td>
                  <td><span className="badge bg-secondary">{item.contactMethod}</span></td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={item.status}
                      onChange={e => handleStatus(item._id, e.target.value)}
                      disabled={saving}
                      style={{ width: 'auto', minWidth: 110 }}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-info me-1" onClick={() => handleView(item)} title="View"><i className="fas fa-eye"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => setConfirm(item._id)}><i className="fas fa-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Order Details</h5>
                <button className="btn-close" onClick={() => setSelected(null)}></button>
              </div>
              <div className="modal-body">
                {[
                  ['Client Name', selected.name],
                  ['Email', selected.email],
                  ['Phone', selected.phone],
                  ['Service Type', selected.serviceType],
                  ['Contact Method', selected.contactMethod],
                  ['Address', selected.address || '—'],
                  ['Status', selected.status],
                  ['Submitted On', formatDate(selected.createdAt)],
                ].map(([label, value]) => (
                  <div className="row mb-2" key={label}>
                    <div className="col-4 text-muted small fw-semibold">{label}</div>
                    <div className="col-8">{value}</div>
                  </div>
                ))}
                {selected.description && (
                  <div className="mt-3">
                    <div className="text-muted small fw-semibold mb-1">Case Description</div>
                    <div className="bg-light p-3 rounded">{selected.description}</div>
                  </div>
                )}
                {selected.documents?.length > 0 && (
                  <div className="mt-3">
                    <div className="text-muted small fw-semibold mb-2">Uploaded Documents</div>
                    <div className="d-flex flex-wrap gap-2">
                      {selected.documents.map((doc, i) => (
                        <a key={i} href={`${BACKEND}${doc}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                          <i className="fas fa-file me-1"></i> Document {i + 1}
                        </a>
                      ))}
                    </div>
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
      <ConfirmModal show={!!confirm} title="Delete Order" message="Delete this order?" onConfirm={handleDelete} onCancel={() => setConfirm(null)} loading={deleting} />
    </div>
  );
}
