import { useEffect, useState } from 'react';
import { getPayments, getPaymentRevenue, exportPaymentsCsv } from '../api';
import { formatDate } from '../utils/helpers';

const STATUS_COLORS = {
  pending_verification: 'warning',
  approved: 'success',
  rejected: 'danger',
  completed: 'primary',
  failed: 'secondary',
};
const STATUS_LABELS = {
  pending_verification: 'Pending Verification',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  failed: 'Failed',
};

const METHOD_LABELS = {
  razorpay: 'Razorpay',
  phonepe: 'PhonePe',
  googlepay: 'Google Pay',
  upi_id: 'UPI ID',
  qr_code: 'QR Code',
  cash: 'Cash',
};

function StatCard({ icon, label, value, color = 'gold', sub }) {
  return (
    <div className="col-6 col-md-3">
      <div className="page-card mb-0 h-100">
        <div className="page-card-body py-3 px-3 text-center">
          <div className={`fs-4 text-${color} mb-1`}><i className={`fas ${icon}`}></i></div>
          <div className="fs-5 fw-bold">{value}</div>
          <div className="small text-muted">{label}</div>
          {sub && <div className="small text-success mt-1">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

export default function Payments() {
  const [tab, setTab] = useState('list');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [revenue, setRevenue] = useState(null);
  const [exporting, setExporting] = useState(false);

  const load = () => {
    setLoading(true);
    getPayments(1, 200, filter)
      .then(r => setItems(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadRevenue = () => {
    getPaymentRevenue()
      .then(r => { if (r.data.success) setRevenue(r.data); })
      .catch(() => {});
  };

  useEffect(() => { load(); loadRevenue(); }, [filter]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportPaymentsCsv(filter);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {}
    setExporting(false);
  };

  const filteredItems = items.filter(i => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      i.clientName?.toLowerCase().includes(q) ||
      i.clientPhone?.includes(q) ||
      i.transactionId?.toLowerCase().includes(q) ||
      i.receiptId?.toLowerCase().includes(q) ||
      i.utrNumber?.includes(q)
    );
  });

  const pending = items.filter(i => !i.isRead).length;
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div>
      {/* ── TABS ── */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>
            <i className="fas fa-list me-1"></i>Payment History
            {pending > 0 && <span className="badge bg-danger ms-2">{pending}</span>}
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'revenue' ? 'active' : ''}`} onClick={() => setTab('revenue')}>
            <i className="fas fa-chart-bar me-1"></i>Revenue Dashboard
          </button>
        </li>
      </ul>

      {/* ══ REVENUE DASHBOARD ══ */}
      {tab === 'revenue' && (
        <div>
          <div className="row g-3 mb-4">
            <StatCard icon="fa-rupee-sign" label="Total Revenue" value={`₹${(revenue?.totalRevenue || 0).toLocaleString('en-IN')}`} color="gold" />
            <StatCard icon="fa-check-circle" label="Approved Payments" value={revenue?.totalApproved || 0} color="success" />
            <StatCard icon="fa-times-circle" label="Failed Payments" value={revenue?.failedCount || 0} color="danger" />
            <StatCard icon="fa-clock" label="Pending Verification" value={revenue?.pendingCount || 0} color="warning" />
          </div>

          {/* Revenue by Method */}
          <div className="page-card mb-4">
            <div className="page-card-header">
              <h6 className="mb-0 fw-bold">Revenue by Payment Method</h6>
            </div>
            <div className="page-card-body">
              {(revenue?.byMethod || []).length === 0 && <p className="text-muted small">No data yet.</p>}
              {(revenue?.byMethod || []).map(m => (
                <div key={m._id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                  <div>
                    <span className="fw-semibold">{METHOD_LABELS[m._id] || m._id}</span>
                    <span className="text-muted small ms-2">({m.count} transactions)</span>
                  </div>
                  <span className="fw-bold text-success">₹{Number(m.total).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="page-card">
            <div className="page-card-header">
              <h6 className="mb-0 fw-bold">Monthly Revenue (Last 12 Months)</h6>
            </div>
            <div className="page-card-body">
              {(revenue?.byMonth || []).length === 0 && <p className="text-muted small">No data yet.</p>}
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead><tr><th>Month</th><th>Transactions</th><th>Revenue</th></tr></thead>
                  <tbody>
                    {(revenue?.byMonth || []).map(m => (
                      <tr key={`${m._id?.year}-${m._id?.month}`}>
                        <td>{MONTHS[(m._id?.month || 1) - 1]} {m._id?.year}</td>
                        <td>{m.count}</td>
                        <td className="fw-bold text-success">₹{Number(m.total).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ PAYMENT LIST ══ */}
      {tab === 'list' && (
        <div className="page-card">
          <div className="page-card-header flex-wrap gap-2">
            <h6 className="mb-0 fw-bold">
              Payment Transactions
              {pending > 0 && <span className="badge bg-danger ms-2">{pending} new</span>}
            </h6>
            <div className="d-flex gap-2 flex-wrap align-items-center">
              <input
                className="form-control form-control-sm"
                style={{ width: 160 }}
                placeholder="Search name / UTR / TXN..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select className="form-select form-select-sm" style={{ width: 170 }} value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="pending_verification">Pending Verification</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="failed">Failed</option>
                <option value="completed">Completed</option>
              </select>
              <button className="btn btn-sm btn-outline-secondary" onClick={handleExport} disabled={exporting} title="Export CSV">
                {exporting ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-download me-1"></i>Export</>}
              </button>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table admin-table">
              <thead>
                <tr>
                  <th>Client</th><th>Type</th><th>Amount</th><th>Method</th>
                  <th>Ref / UTR</th><th>Status</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan="7" className="text-center py-4"><div className="spinner-border spinner-border-sm"></div></td></tr>}
                {!loading && filteredItems.length === 0 && <tr><td colSpan="7" className="text-center text-muted py-4">No payments found</td></tr>}
                {filteredItems.map(item => (
                  <tr key={item._id} className={!item.isRead ? 'table-warning' : ''}>
                    <td>
                      <div className="fw-semibold">
                        {item.clientName}
                        {!item.isRead && <span className="badge bg-danger ms-1" style={{ fontSize:'.65rem' }}>NEW</span>}
                      </div>
                      <small className="text-muted">{item.clientPhone}</small>
                    </td>
                    <td><span className="badge bg-secondary">{item.type === 'appointment' ? 'Appt' : 'Order'}</span></td>
                    <td className="fw-bold text-success">₹{item.amount}</td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {METHOD_LABELS[item.paymentMethod] || item.paymentMethod || 'QR/UPI'}
                      </span>
                    </td>
                    <td>
                      <small className="text-muted font-monospace">
                        {item.transactionId || item.utrNumber || item.razorpay_payment_id || '—'}
                      </small>
                    </td>
                    <td><span className={`badge bg-${STATUS_COLORS[item.status]}`}>{STATUS_LABELS[item.status]}</span></td>
                    <td><small>{formatDate(item.createdAt)}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
