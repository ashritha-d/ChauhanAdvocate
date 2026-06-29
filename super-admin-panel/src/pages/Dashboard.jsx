import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ACTION_META = {
  ADMIN_CREATED: { label: 'Created', color: '#34d399' }, ADMIN_UPDATED: { label: 'Updated', color: '#60a5fa' },
  ADMIN_DELETED: { label: 'Deleted', color: '#f87171' }, ADMIN_ACTIVATED: { label: 'Activated', color: '#34d399' },
  ADMIN_DEACTIVATED: { label: 'Deactivated', color: '#fbbf24' }, PASSWORD_RESET: { label: 'Pwd Reset', color: '#a78bfa' },
  LOGIN: { label: 'Login', color: '#22d3ee' }, LOGOUT: { label: 'Logout', color: '#6c757d' }, FAILED_LOGIN: { label: 'Failed', color: '#f87171' },
};

const PERMS = [
  { icon: 'fa-tachometer-alt', text: 'Full dashboard access' },
  { icon: 'fa-user-cog',       text: 'Create / Edit / Delete Admins' },
  { icon: 'fa-user-check',     text: 'Approve or reject admin accounts' },
  { icon: 'fa-users',          text: 'Manage all users' },
  { icon: 'fa-calendar-alt',   text: 'Manage all appointments' },
  { icon: 'fa-book-open',      text: 'Manage books, magazines, drafts & YouTube' },
  { icon: 'fa-credit-card',    text: 'Manage payment settings' },
  { icon: 'fa-university',     text: 'Change bank account details' },
  { icon: 'fa-cog',            text: 'Configure website settings' },
  { icon: 'fa-paint-brush',    text: 'Update logo, theme, banners & homepage' },
  { icon: 'fa-chart-bar',      text: 'View analytics and reports' },
  { icon: 'fa-bell',           text: 'Manage notifications' },
  { icon: 'fa-toggle-on',      text: 'Enable / disable features' },
  { icon: 'fa-database',       text: 'Backup and restore the database' },
  { icon: 'fa-clipboard-list', text: 'View activity logs' },
  { icon: 'fa-shield-alt',     text: 'Manage security settings' },
  { icon: 'fa-user-slash',     text: 'Suspend or delete any account' },
];

function StatCard({ icon, label, value, sub, color, onClick }) {
  return (
    <div className="sa-stat-card" style={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div className="sa-stat-icon" style={{ background: color + '22', color }}><i className={icon}></i></div>
      <div>
        <div className="sa-stat-value">{value ?? '—'}</div>
        <div className="sa-stat-label">{label}</div>
        {sub && <div className="sa-stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard({ onNavigate }) {
  const { admin } = useAuth();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/super-admin/dashboard-stats').then(r => setData(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const fmtAmt = a => `₹${(a || 0).toLocaleString('en-IN')}`;
  const fmtDT  = d => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="sa-page">
      {/* Header */}
      <div className="sa-page-header">
        <div>
          <h4 className="sa-page-title"><i className="fas fa-tachometer-alt me-2"></i>Dashboard</h4>
          <p className="sa-page-subtitle">Welcome back, <strong>{admin?.name}</strong> — here's your complete overview</p>
        </div>
        <div className="sa-badge-superadmin"><i className="fas fa-user-shield me-1"></i>Super Admin</div>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border sa-spinner"></div></div>
      ) : data && (
        <>
          {/* Stats Row 1 */}
          <div className="sa-stats-grid mb-3">
            <StatCard icon="fas fa-users"        label="Total Users"    value={data.users.total}         sub={`+${data.users.newThisMonth} this month`} color="#0d6efd" onClick={() => onNavigate('users')} />
            <StatCard icon="fas fa-user-shield"  label="Admins"         value={data.admins.total}        sub={`${data.admins.active} active`}            color="#C9A84C" onClick={() => onNavigate('adminmanagement')} />
            <StatCard icon="fas fa-calendar-alt" label="Appointments"   value={data.appointments.total}  sub={`${data.appointments.pending} pending`}     color="#60a5fa" onClick={() => onNavigate('appointments')} />
            <StatCard icon="fas fa-credit-card"  label="Payments"       value={data.payments.total}      sub={`${data.payments.pending} pending`}         color="#fbbf24" onClick={() => onNavigate('payments')} />
          </div>

          {/* Stats Row 2 */}
          <div className="sa-stats-grid mb-4">
            <StatCard icon="fas fa-rupee-sign"   label="Total Revenue"  value={fmtAmt(data.revenue.total)}     sub={`${fmtAmt(data.revenue.thisMonth)} this month`} color="#34d399" />
            <StatCard icon="fas fa-book"         label="Books"          value={data.content.books}    color="#a78bfa" />
            <StatCard icon="fas fa-newspaper"    label="Magazines"      value={data.content.magazines} color="#f87171" />
            <StatCard icon="fas fa-file-alt"     label="Drafts"         value={data.content.drafts}   color="#22d3ee" />
          </div>

          {/* Revenue Chart */}
          <div className="sa-card mb-4">
            <div className="sa-card-header">
              <span><i className="fas fa-chart-area me-2"></i>Revenue — Last 6 Months</span>
              <button className="sa-link-btn" onClick={() => onNavigate('analytics')}>Full Analytics</button>
            </div>
            <div className="sa-card-body" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.charts.monthlyRevenue}>
                  <defs>
                    <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2436" />
                  <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                  <Tooltip contentStyle={{ background: '#1e2436', border: '1px solid #2d3748', borderRadius: 8 }} formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#C9A84C" strokeWidth={2} fill="url(#rg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="row g-4 mb-4">
            {/* Recent Appointments */}
            <div className="col-lg-6">
              <div className="sa-card">
                <div className="sa-card-header">
                  <span><i className="fas fa-calendar-alt me-2"></i>Recent Appointments</span>
                  <button className="sa-link-btn" onClick={() => onNavigate('appointments')}>View All</button>
                </div>
                <div className="sa-card-body p-0">
                  {data.recent.appointments.length === 0 ? (
                    <div className="text-center py-4" style={{ color: '#6b7280' }}>No appointments yet</div>
                  ) : data.recent.appointments.map(a => (
                    <div key={a._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #1a2030' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.status === 'pending' ? '#fbbf24' : a.status === 'confirmed' ? '#34d399' : '#9ca3af', flexShrink: 0 }}></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.83rem', fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                        <div style={{ fontSize: '0.73rem', color: '#6b7280' }}>{a.service}</div>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#9ca3af', flexShrink: 0 }}>{new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Payments */}
            <div className="col-lg-6">
              <div className="sa-card">
                <div className="sa-card-header">
                  <span><i className="fas fa-credit-card me-2"></i>Recent Payments</span>
                  <button className="sa-link-btn" onClick={() => onNavigate('payments')}>View All</button>
                </div>
                <div className="sa-card-body p-0">
                  {data.recent.payments.length === 0 ? (
                    <div className="text-center py-4" style={{ color: '#6b7280' }}>No payments yet</div>
                  ) : data.recent.payments.map(p => (
                    <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #1a2030' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.83rem', fontWeight: 600, color: '#e2e8f0' }}>{p.clientName}</div>
                        <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>{p.paymentMethod}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: '#C9A84C', fontSize: '0.88rem' }}>₹{parseFloat(p.amount || 0).toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: '0.68rem', color: p.status === 'approved' ? '#34d399' : p.status === 'pending_verification' ? '#fbbf24' : '#f87171' }}>{p.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Audit Logs */}
          <div className="sa-card mb-4">
            <div className="sa-card-header">
              <span><i className="fas fa-clipboard-list me-2"></i>Recent Activity</span>
              <button className="sa-link-btn" onClick={() => onNavigate('auditlogs')}>View All</button>
            </div>
            <div className="sa-card-body p-0">
              {data.recent.logs.map(log => {
                const meta = ACTION_META[log.action] || { label: log.action, color: '#9ca3af' };
                return (
                  <div key={log._id} className="sa-log-row">
                    <div className="sa-log-dot" style={{ background: meta.color }}></div>
                    <div className="sa-log-content">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="sa-action-badge" style={{ background: meta.color + '22', color: meta.color }}>{meta.label}</span>
                        <span className="sa-log-actor">{log.adminName}</span>
                      </div>
                      <div className="sa-log-time">{fmtDT(log.createdAt)}{log.ipAddress ? ` · ${log.ipAddress}` : ''}</div>
                    </div>
                  </div>
                );
              })}
              {data.recent.logs.length === 0 && <div className="text-center py-4" style={{ color: '#6b7280' }}>No activity yet</div>}
            </div>
          </div>
        </>
      )}

      {/* Permissions Card */}
      <div className="sa-permissions-card">
        <div className="sa-permissions-header">
          <div className="sa-permissions-icon"><i className="fas fa-user-shield"></i></div>
          <div>
            <div className="sa-permissions-title">Super Admin <span style={{ color: '#4a5568', fontSize: '0.8rem', fontWeight: 400 }}>(You)</span></div>
            <div className="sa-permissions-sub">This account belongs only to the website owner. Full unrestricted access.</div>
          </div>
        </div>
        <div className="sa-permissions-grid">
          {PERMS.map((p, i) => (
            <div key={i} className="sa-perm-item">
              <div className="sa-perm-check"><i className="fas fa-check"></i></div>
              <i className={`fas ${p.icon} sa-perm-icon`}></i>
              <span>{p.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
