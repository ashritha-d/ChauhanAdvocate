import { useEffect, useState } from 'react';
import usePolling from '../hooks/usePolling';
import { getInternships, updateInternship, deleteInternship } from '../api';
import { formatDate } from '../utils/helpers';
import ConfirmModal from '../components/ConfirmModal';

const STATUSES      = ['pending', 'under_review', 'selected', 'rejected', 'completed'];
const PAY_STATUSES  = ['pending_verification', 'paid', 'rejected'];

const STATUS_COLOR   = { pending: 'warning', under_review: 'info', selected: 'success', rejected: 'danger', completed: 'secondary' };
const STATUS_LABEL   = { pending: 'Pending', under_review: 'Under Review', selected: 'Selected', rejected: 'Rejected', completed: 'Completed' };
const PAY_COLOR      = { pending_verification: 'warning', paid: 'success', rejected: 'danger' };
const PAY_LABEL      = { pending_verification: 'Pending Verification', paid: 'Paid', rejected: 'Rejected' };

export default function Internships() {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPay, setFilterPay] = useState('');
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm]   = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [notes, setNotes]       = useState('');
  const [alert, setAlert]       = useState(null);
  const [total, setTotal]       = useState(0);

  const showToast = (type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 4000); };

  const load = () => {
    setLoading(true);
    const params = { limit: 100 };
    if (filterStatus) params.status = filterStatus;
    if (filterPay) params.paymentStatus = filterPay;
    getInternships(params)
      .then(r => { setItems(r.data.data || []); setTotal(r.data.total || 0); })
      .catch(() => showToast('danger', 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterStatus, filterPay]);
  usePolling(load, 30000);

  const handleView = (item) => { setSelected(item); setNotes(item.notes || ''); };

  const handleStatusUpdate = async (field, value) => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateInternship(selected._id, { [field]: value });
      setSelected(s => ({ ...s, [field]: value }));
      setItems(prev => prev.map(i => i._id === selected._id ? { ...i, [field]: value } : i));
      showToast('success', 'Updated');
    } catch { showToast('danger', 'Update failed'); }
    setSaving(false);
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await updateInternship(selected._id, { notes });
      setSelected(s => ({ ...s, notes }));
      showToast('success', 'Notes saved');
    } catch { showToast('danger', 'Failed to save'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteInternship(confirm); setConfirm(null); load(); showToast('success', 'Deleted'); }
    catch { showToast('danger', 'Delete failed'); }
    setDeleting(false);
  };

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    return !q || i.name?.toLowerCase().includes(q) || i.email?.toLowerCase().includes(q) || i.phone?.includes(q);
  });

  return (
    <div className="sa-page">
      {alert && (
        <div className={`alert alert-${alert.type} position-fixed`} style={{ top: 20, right: 20, zIndex: 9999, minWidth: 260 }}>
          {alert.msg}
        </div>
      )}

      <div className="sa-page-header">
        <div>
          <h4 className="sa-page-title"><i className="fas fa-graduation-cap me-2"></i>Internship Applications</h4>
          <p className="sa-page-subtitle">LLB Internship Programme — {total} total applications</p>
        </div>
      </div>

      {/* Filters */}
      <div className="sa-card mb-4">
        <div className="sa-card-body">
          <div className="row g-3 align-items-center">
            <div className="col-md-4">
              <input
                className="form-control sa-input"
                placeholder="Search by name, email or phone…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select className="form-select sa-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Application Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select sa-input" value={filterPay} onChange={e => setFilterPay(e.target.value)}>
                <option value="">All Payment Statuses</option>
                {PAY_STATUSES.map(s => <option key={s} value={s}>{PAY_LABEL[s]}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <span className="text-muted small">{filtered.length} shown</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="sa-card">
        <div className="sa-card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border sa-spinner"></div></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5" style={{ color: '#6b7280' }}>
              <i className="fas fa-graduation-cap fa-3x mb-3" style={{ opacity: 0.3 }}></i>
              <div>No internship applications found</div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Programme</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => (
                    <tr key={item._id}>
                      <td>
                        <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>{item.name}</div>
                        <div className="text-muted small">{item.email || '—'}</div>
                        <div className="text-muted small">{item.phone}</div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{item.programmeName || 'LLB Internship'}</td>
                      <td className="fw-bold" style={{ color: '#C9A84C' }}>₹{item.amount || 1000}</td>
                      <td>
                        <span className={`badge bg-${PAY_COLOR[item.paymentStatus] || 'secondary'}`} style={{ fontSize: '0.72rem' }}>
                          {PAY_LABEL[item.paymentStatus] || item.paymentStatus}
                        </span>
                        {item.utrNumber && <div className="text-muted small mt-1">UTR: {item.utrNumber}</div>}
                      </td>
                      <td>
                        <span className={`badge bg-${STATUS_COLOR[item.status] || 'secondary'}`} style={{ fontSize: '0.72rem' }}>
                          {STATUS_LABEL[item.status] || item.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>{formatDate(item.createdAt)}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-outline-primary py-1 px-2" onClick={() => handleView(item)} title="View details">
                            <i className="fas fa-eye"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger py-1 px-2" onClick={() => setConfirm(item._id)} title="Delete">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content" style={{ background: '#1a2035', border: '1px solid #2d3748', borderRadius: 16 }}>
              <div className="modal-header" style={{ borderColor: '#2d3748' }}>
                <h5 className="modal-title" style={{ color: '#fff' }}>
                  <i className="fas fa-graduation-cap me-2" style={{ color: '#C9A84C' }}></i>
                  Internship Application
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setSelected(null)}></button>
              </div>
              <div className="modal-body" style={{ overflowY: 'auto', maxHeight: '65vh' }}>
                <div className="row g-3">
                  {/* Applicant Info */}
                  <div className="col-md-6">
                    <div className="sa-card">
                      <div className="sa-card-header"><span>Applicant Info</span></div>
                      <div className="sa-card-body">
                        {[['Name', selected.name], ['Email', selected.email || '—'], ['Phone', selected.phone], ['Programme', selected.programmeName || 'LLB Internship Programme'], ['Applied On', formatDate(selected.createdAt)]].map(([l, v]) => (
                          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #2d3748', fontSize: '0.85rem' }}>
                            <span style={{ color: '#9ca3af' }}>{l}</span>
                            <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="col-md-6">
                    <div className="sa-card">
                      <div className="sa-card-header"><span>Payment Info</span></div>
                      <div className="sa-card-body">
                        {[['Amount', `₹${selected.amount || 1000}`], ['Method', selected.paymentMethod || '—'], ['UTR / Ref', selected.utrNumber || '—']].map(([l, v]) => (
                          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #2d3748', fontSize: '0.85rem' }}>
                            <span style={{ color: '#9ca3af' }}>{l}</span>
                            <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{v}</span>
                          </div>
                        ))}
                        <div style={{ marginTop: 12 }}>
                          <label className="sa-label mb-1">Payment Status</label>
                          <select
                            className="form-select sa-input"
                            value={selected.paymentStatus}
                            onChange={e => handleStatusUpdate('paymentStatus', e.target.value)}
                            disabled={saving}
                          >
                            {PAY_STATUSES.map(s => <option key={s} value={s}>{PAY_LABEL[s]}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Application Status */}
                  <div className="col-12">
                    <div className="sa-card">
                      <div className="sa-card-header"><span>Application Status</span></div>
                      <div className="sa-card-body">
                        <div className="d-flex gap-2 flex-wrap mb-3">
                          {STATUSES.map(s => (
                            <button
                              key={s}
                              className={`btn btn-sm ${selected.status === s ? `btn-${STATUS_COLOR[s]}` : 'btn-outline-secondary'}`}
                              onClick={() => handleStatusUpdate('status', s)}
                              disabled={saving}
                            >
                              {STATUS_LABEL[s]}
                            </button>
                          ))}
                        </div>
                        <label className="sa-label">Admin Notes</label>
                        <textarea
                          className="form-control sa-input"
                          rows={3}
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          placeholder="Add internal notes about this application…"
                        />
                        <button className="btn sa-btn-primary mt-2" onClick={handleSaveNotes} disabled={saving}>
                          {saving ? <i className="fas fa-spinner fa-spin me-1"></i> : <i className="fas fa-save me-1"></i>}Save Notes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ borderColor: '#2d3748' }}>
                <button className="btn btn-outline-danger btn-sm" onClick={() => { setConfirm(selected._id); setSelected(null); }}>
                  <i className="fas fa-trash me-1"></i>Delete
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmModal
          message="Delete this internship application? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
