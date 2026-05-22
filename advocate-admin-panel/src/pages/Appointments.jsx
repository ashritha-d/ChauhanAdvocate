import { useEffect, useState } from 'react';
import { getAppointments, updateAppointment, deleteAppointment } from '../api';
import { formatDate } from '../utils/helpers';
import ConfirmModal from '../components/ConfirmModal';

const STATUSES = ['pending','confirmed','completed','cancelled'];
const STATUS_BADGE = { pending:'badge-pending', confirmed:'badge-confirmed', completed:'badge-completed', cancelled:'badge-cancelled' };

export default function Appointments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => { setLoading(true); getAppointments(1, 100, filter).then(r => setItems(r.data.data || [])).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, [filter]);

  const handleStatus = async (id, status) => {
    setSaving(true);
    try { await updateAppointment(id, { status }); load(); } catch {}
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteAppointment(confirm); setConfirm(null); load(); } catch {}
    setDeleting(false);
  };

  const filtered = items.filter(a => a.name?.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-card">
        <div className="page-card-header flex-wrap gap-2">
          <h6 className="mb-0 fw-bold">Appointments ({items.length})</h6>
          <div className="d-flex gap-2 flex-wrap">
            <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." />
            <select className="form-select form-select-sm" style={{width:'auto'}} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table admin-table">
            <thead><tr><th>Client</th><th>Service</th><th>Date & Time</th><th>Status</th><th>Booked On</th><th>Actions</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="6" className="text-center py-4"><div className="spinner-border spinner-border-sm"></div></td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan="6" className="text-center text-muted py-4">No appointments found</td></tr>}
              {filtered.map(item => (
                <tr key={item._id}>
                  <td>
                    <div className="fw-semibold">{item.name}</div>
                    <small className="text-muted">{item.email}</small><br />
                    <small className="text-muted">{item.phone}</small>
                  </td>
                  <td>{item.service}</td>
                  <td><div>{item.date}</div><small className="text-muted">{item.time}</small></td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={item.status}
                      onChange={e => handleStatus(item._id, e.target.value)}
                      disabled={saving}
                      style={{ width:'auto', minWidth:120 }}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                    </select>
                  </td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-info me-1" onClick={() => setSelected(item)} title="View Details"><i className="fas fa-eye"></i></button>
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
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Appointment Details</h5>
                <button className="btn-close" onClick={() => setSelected(null)}></button>
              </div>
              <div className="modal-body">
                {[
                  ['Client Name', selected.name],
                  ['Email', selected.email],
                  ['Phone', selected.phone],
                  ['Service', selected.service],
                  ['Date', selected.date],
                  ['Time', selected.time],
                  ['Status', selected.status],
                  ['Booked On', formatDate(selected.createdAt)],
                ].map(([label, value]) => (
                  <div className="row mb-2" key={label}>
                    <div className="col-4 text-muted small fw-semibold">{label}</div>
                    <div className="col-8">{value}</div>
                  </div>
                ))}
                {selected.message && (
                  <div className="mt-3">
                    <div className="text-muted small fw-semibold mb-1">Case Brief</div>
                    <div className="bg-light p-3 rounded">{selected.message}</div>
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
      <ConfirmModal show={!!confirm} title="Delete Appointment" message="Delete this appointment?" onConfirm={handleDelete} onCancel={() => setConfirm(null)} loading={deleting} />
    </div>
  );
}
