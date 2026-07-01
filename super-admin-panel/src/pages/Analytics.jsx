import { useEffect, useState } from 'react';
import usePolling from '../hooks/usePolling';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api/axios';

const COLORS = ['#C9A84C', '#60a5fa', '#34d399', '#f87171', '#a78bfa', '#fbbf24'];

const CustomTooltip = ({ active, payload, label, prefix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1e2436', border: '1px solid #2d3748', borderRadius: 8, padding: '8px 14px' }}>
      <div style={{ color: '#9ca3af', fontSize: '0.78rem', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontSize: '0.83rem', fontWeight: 600 }}>{prefix}{p.value?.toLocaleString('en-IN')}</div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [data, setData]       = useState(null);
  const [charts, setCharts]   = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      api.get('/super-admin/analytics'),
      api.get('/super-admin/dashboard-stats'),
    ]).then(([a, d]) => {
      setData(a.data.data);
      setCharts(d.data.data?.charts);
    }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  usePolling(load, 60000);

  if (loading) return <div className="text-center py-5"><div className="spinner-border sa-spinner"></div></div>;

  const paymentMethodData = (data?.paymentMethods || []).map(m => ({ name: m._id || 'Unknown', value: m.count }));
  const apptStatusData    = (data?.apptStatus    || []).map(s => ({ name: s._id,   value: s.count }));

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h4 className="sa-page-title"><i className="fas fa-chart-line me-2"></i>Analytics & Reports</h4>
          <p className="sa-page-subtitle">Revenue trends, appointments, user growth and more</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="sa-card mb-4">
        <div className="sa-card-header"><span><i className="fas fa-rupee-sign me-2"></i>Monthly Revenue (Last 6 Months)</span></div>
        <div className="sa-card-body" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={charts?.monthlyRevenue || []}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2436" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip content={<CustomTooltip prefix="₹" />} />
              <Area type="monotone" dataKey="revenue" stroke="#C9A84C" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Appointment Trend */}
        <div className="col-lg-6">
          <div className="sa-card">
            <div className="sa-card-header"><span><i className="fas fa-calendar-alt me-2"></i>Appointment Trend</span></div>
            <div className="sa-card-body" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts?.appointmentTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2436" />
                  <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="appointments" fill="#60a5fa" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* User Growth */}
        <div className="col-lg-6">
          <div className="sa-card">
            <div className="sa-card-header"><span><i className="fas fa-users me-2"></i>User Growth</span></div>
            <div className="sa-card-body" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.userGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2436" />
                  <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="users" stroke="#34d399" strokeWidth={2} dot={{ fill: '#34d399', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Payment Methods */}
        <div className="col-lg-5">
          <div className="sa-card">
            <div className="sa-card-header"><span><i className="fas fa-credit-card me-2"></i>Payment Methods</span></div>
            <div className="sa-card-body" style={{ height: 260 }}>
              {paymentMethodData.length === 0 ? (
                <div className="text-center text-muted py-5">No payment data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentMethodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={{ stroke: '#4a5568' }}>
                      {paymentMethodData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e2436', border: '1px solid #2d3748', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Appointment Status */}
        <div className="col-lg-4">
          <div className="sa-card">
            <div className="sa-card-header"><span><i className="fas fa-calendar-check me-2"></i>Appt. Status</span></div>
            <div className="sa-card-body" style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={apptStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90}>
                    {apptStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e2436', border: '1px solid #2d3748', borderRadius: 8 }} />
                  <Legend formatter={v => <span style={{ color: '#9ca3af', fontSize: '0.78rem' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Services */}
        <div className="col-lg-3">
          <div className="sa-card h-100">
            <div className="sa-card-header"><span><i className="fas fa-star me-2"></i>Top Services</span></div>
            <div className="sa-card-body p-0">
              {(data?.topServices || []).map((s, i) => (
                <div key={i} style={{ padding: '12px 20px', borderBottom: '1px solid #1a2030', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1', flex: 1, paddingRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s._id || 'Unknown'}</div>
                  <span style={{ background: '#C9A84C22', color: '#C9A84C', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 }}>{s.count}</span>
                </div>
              ))}
              {!data?.topServices?.length && <div className="text-center text-muted py-4">No data</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
