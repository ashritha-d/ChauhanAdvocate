import { useEffect, useState } from 'react';
import { getContacts, updateContact, deleteContact } from '../api';
import { formatDateTime } from '../utils/helpers';
import ConfirmModal from '../components/ConfirmModal';

export default function Contacts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => { setLoading(true); getContacts(1,100).then(r => setItems(r.data.data||[])).catch(()=>{}).finally(()=>setLoading(false)); };
  useEffect(() => { load(); }, []);

  const markRead = async id => {
    try { await updateContact(id, { status: 'read' }); load(); } catch {}
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteContact(confirm); setConfirm(null); load(); } catch {}
    setDeleting(false);
  };

  const filtered = items.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()) || c.subject?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-card">
        <div className="page-card-header">
          <h6 className="mb-0 fw-bold">Contact Inquiries ({items.length})</h6>
          <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inquiries..." />
        </div>
        <div className="table-responsive">
          <table className="table admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Subject</th><th>Status</th><th>Received</th><th>Actions</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="6" className="text-center py-4"><div className="spinner-border spinner-border-sm"></div></td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan="6" className="text-center text-muted py-4">No inquiries yet</td></tr>}
              {filtered.map(item => (
                <tr key={item._id} className={item.status === 'unread' ? 'fw-semibold' : ''}>
                  <td>{item.name}{item.status==='unread' && <span className="badge bg-danger ms-2 small">New</span>}</td>
                  <td><a href={`mailto:${item.email}`}>{item.email}</a></td>
                  <td>{item.subject}</td>
                  <td><span className={`status-badge ${item.status==='unread'?'badge-pending':'badge-active'}`}>{item.status}</span></td>
                  <td>{formatDateTime(item.createdAt)}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-info me-1" onClick={() => { setSelected(item); if(item.status==='unread') markRead(item._id); }}><i className="fas fa-eye"></i></button>
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
                <h5 className="modal-title">Message from {selected.name}</h5>
                <button className="btn-close" onClick={() => setSelected(null)}></button>
              </div>
              <div className="modal-body">
                {[['From', selected.name],['Email', selected.email],['Phone', selected.phone||'—'],['Subject', selected.subject],['Received', formatDateTime(selected.createdAt)]].map(([l,v]) => (
                  <div className="row mb-2" key={l}><div className="col-4 text-muted small fw-semibold">{l}</div><div className="col-8">{v}</div></div>
                ))}
                <div className="mt-3"><div className="text-muted small fw-semibold mb-1">Message</div><div className="bg-light p-3 rounded">{selected.message}</div></div>
                <div className="mt-3">
                  <a href={`mailto:${selected.email}?subject=Re: ${selected.subject}`} className="btn btn-gold btn-sm"><i className="fas fa-reply me-1"></i>Reply via Email</a>
                </div>
              </div>
              <div className="modal-footer"><button className="btn btn-light" onClick={() => setSelected(null)}>Close</button></div>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal show={!!confirm} title="Delete Message" message="Delete this inquiry?" onConfirm={handleDelete} onCancel={() => setConfirm(null)} loading={deleting} />
    </div>
  );
}
