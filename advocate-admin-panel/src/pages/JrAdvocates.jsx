import { useEffect, useState } from 'react';
import usePolling from '../hooks/usePolling';
import { getJrAdvocates, updateJrAdvocate, deleteJrAdvocate } from '../api';
import { formatDate } from '../utils/helpers';
import ConfirmModal from '../components/ConfirmModal';

const STATUSES = ['pending', 'reviewed', 'selected', 'rejected'];
const BACKEND = import.meta.env.VITE_API_BASE?.replace('/api', '') || 'https://chauhanadvocate.onrender.com';

const STATUS_COLOR = { pending: 'warning', reviewed: 'info', selected: 'success', rejected: 'danger' };

export default function JrAdvocates() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  const load = () => {
    setLoading(true);
    getJrAdvocates(1, 100, filter)
      .then(r => setItems(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [filter]);
  usePolling(load, 30000);

  const handleView = async (item) => {
    setSelected(item);
    setAdminNote(item.adminNotes || '');
    if (!item.isRead) {
      await updateJrAdvocate(item._id, { isRead: true }).catch(() => {});
      setItems(prev => prev.map(i => i._id === item._id ? { ...i, isRead: true } : i));
    }
  };

  const handleStatus = async (id, status) => {
    setSaving(true);
    try { await updateJrAdvocate(id, { status }); load(); } catch {}
    setSaving(false);
  };

  const handleSaveNote = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateJrAdvocate(selected._id, { adminNotes: adminNote });
      setSelected(s => ({ ...s, adminNotes: adminNote }));
    } catch {}
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteJrAdvocate(confirm); setConfirm(null); load(); } catch {}
    setDeleting(false);
  };

  const filtered = items.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.qualification?.toLowerCase().includes(search.toLowerCase())
  );

  const waLink = (phone) => {
    if (!phone) return null;
    const num = phone.replace(/\D/g, '');
    return `https://wa.me/${num.startsWith('91') ? num : '91' + num}`;
  };

  return (
    <div>
      <div className="page-card">
        <div className="page-card-header flex-wrap gap-2">
          <h6 className="mb-0 fw-bold">
            Jr. Advocate Applications ({items.length})
            {items.filter(i => !i.isRead).length > 0 && (
              <span className="badge bg-danger ms-2">{items.filter(i => !i.isRead).length} new</span>
            )}
          </h6>
          <div className="d-flex gap-2 flex-wrap">
            <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, qualification…" />
            <select className="form-select form-select-sm" style={{ width: 'auto' }} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table admin-table">
            <thead>
              <tr><th>Applicant</th><th>Qualification</th><th>Files</th><th>Status</th><th>Applied On</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="6" className="text-center py-4"><div className="spinner-border spinner-border-sm"></div></td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan="6" className="text-center text-muted py-4">No applications found</td></tr>}
              {filtered.map(item => (
                <tr key={item._id} className={!item.isRead ? 'table-warning' : ''}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      {item.passportPhoto && (
                        <img src={`${BACKEND}${item.passportPhoto}`} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #c9a84c' }} onError={e => e.target.style.display='none'} />
                      )}
                      <div>
                        <div className="fw-semibold">{item.name}{!item.isRead && <span className="badge bg-danger ms-1" style={{ fontSize: '0.65rem' }}>NEW</span>}</div>
                        <small className="text-muted d-block">{item.email}</small>
                        <small className="text-muted">{item.phone}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>{item.qualification}</div>
                    {item.college && <small className="text-muted d-block">{item.college} {item.yearOfPassing && `(${item.yearOfPassing})`}</small>}
                  </td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      {item.resume
                        ? <a href={`${BACKEND}${item.resume}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary" title="View Resume"><i className="fas fa-file-pdf"></i></a>
                        : <span className="text-muted small">No resume</span>}
                      {item.passportPhoto && (
                        <a href={`${BACKEND}${item.passportPhoto}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary" title="View Photo"><i className="fas fa-image"></i></a>
                      )}
                    </div>
                  </td>
                  <td>
                    <select
                      className={`form-select form-select-sm border-${STATUS_COLOR[item.status] || 'secondary'}`}
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
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-outline-info" onClick={() => handleView(item)} title="View Details"><i className="fas fa-eye"></i></button>
                      {waLink(item.whatsapp || item.phone) && (
                        <a className="btn btn-sm btn-outline-success" href={waLink(item.whatsapp || item.phone)} target="_blank" rel="noreferrer" title="WhatsApp"><i className="fab fa-whatsapp"></i></a>
                      )}
                      <button className="btn btn-sm btn-outline-danger" onClick={() => setConfirm(item._id)}><i className="fas fa-trash"></i></button>
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
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Application — {selected.name}
                  <span className={`badge bg-${STATUS_COLOR[selected.status] || 'secondary'} ms-2`}>{selected.status}</span>
                </h5>
                <button className="btn-close" onClick={() => setSelected(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  {/* Photo */}
                  {selected.passportPhoto && (
                    <div className="col-12 text-center mb-2">
                      <img src={`${BACKEND}${selected.passportPhoto}`} alt="Passport Photo" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid #c9a84c' }} />
                    </div>
                  )}

                  {/* Personal */}
                  <div className="col-12"><h6 className="text-muted fw-bold border-bottom pb-1">Personal Details</h6></div>
                  {[
                    ['Full Name', selected.name],
                    ["Father's Name", selected.fatherName],
                    ['Date of Birth', selected.dob],
                    ['Gender', selected.gender],
                    ['Mobile', selected.phone],
                    ['WhatsApp', selected.whatsapp],
                    ['Email', selected.email],
                    ['Address', selected.address],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div className="col-md-6" key={label}>
                      <label className="form-label fw-semibold text-muted small mb-0">{label}</label>
                      <div style={{ wordBreak: 'break-word' }}>{value}</div>
                    </div>
                  ))}

                  {/* Education */}
                  <div className="col-12 mt-2"><h6 className="text-muted fw-bold border-bottom pb-1">Education</h6></div>
                  {[
                    ['Qualification', selected.qualification],
                    ['College / University', selected.college],
                    ['Year of Passing', selected.yearOfPassing],
                    ['Percentage / CGPA', selected.percentage],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div className="col-md-6" key={label}>
                      <label className="form-label fw-semibold text-muted small mb-0">{label}</label>
                      <div>{value}</div>
                    </div>
                  ))}

                  {/* Professional */}
                  {(selected.skills || selected.experience || selected.coverLetter) && (
                    <>
                      <div className="col-12 mt-2"><h6 className="text-muted fw-bold border-bottom pb-1">Professional</h6></div>
                      {selected.skills && <div className="col-12"><label className="form-label fw-semibold text-muted small mb-0">Skills</label><div>{selected.skills}</div></div>}
                      {selected.experience && <div className="col-12"><label className="form-label fw-semibold text-muted small mb-0">Experience</label><div className="bg-light p-2 rounded">{selected.experience}</div></div>}
                      {selected.coverLetter && <div className="col-12"><label className="form-label fw-semibold text-muted small mb-0">Cover Letter</label><div className="bg-light p-2 rounded">{selected.coverLetter}</div></div>}
                    </>
                  )}

                  {/* Files */}
                  <div className="col-12 mt-2"><h6 className="text-muted fw-bold border-bottom pb-1">Documents</h6></div>
                  <div className="col-12 d-flex gap-2 flex-wrap">
                    {selected.resume
                      ? <a href={`${BACKEND}${selected.resume}`} target="_blank" rel="noreferrer" className="btn btn-outline-primary btn-sm"><i className="fas fa-file-pdf me-1"></i>Download Resume</a>
                      : <span className="text-muted small">No resume uploaded</span>}
                    {selected.passportPhoto && (
                      <a href={`${BACKEND}${selected.passportPhoto}`} target="_blank" rel="noreferrer" className="btn btn-outline-secondary btn-sm"><i className="fas fa-image me-1"></i>Download Photo</a>
                    )}
                  </div>

                  {/* Admin controls */}
                  <div className="col-12 mt-2"><h6 className="text-muted fw-bold border-bottom pb-1">Admin Actions</h6></div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold text-muted small mb-1">Update Status</label>
                    <select
                      className="form-select form-select-sm"
                      value={selected.status}
                      onChange={e => { handleStatus(selected._id, e.target.value); setSelected(s => ({ ...s, status: e.target.value })); }}
                      disabled={saving}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold text-muted small mb-1">Admin Notes (visible to applicant)</label>
                    <div className="d-flex gap-2">
                      <textarea className="form-control form-control-sm" rows={2} value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Add notes for the applicant…" />
                      <button className="btn btn-sm btn-outline-primary flex-shrink-0" onClick={handleSaveNote} disabled={saving}>Save</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer gap-2">
                {waLink(selected.whatsapp || selected.phone) && (
                  <a className="btn btn-success btn-sm" href={waLink(selected.whatsapp || selected.phone)} target="_blank" rel="noreferrer">
                    <i className="fab fa-whatsapp me-1"></i>WhatsApp
                  </a>
                )}
                <a className="btn btn-outline-primary btn-sm" href={`mailto:${selected.email}`}><i className="fas fa-envelope me-1"></i>Email</a>
                <button className="btn btn-light btn-sm" onClick={() => setSelected(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal show={!!confirm} title="Delete Application" message="Delete this application permanently?" onConfirm={handleDelete} onCancel={() => setConfirm(null)} loading={deleting} />
    </div>
  );
}
