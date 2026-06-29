import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function SystemHealth() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/super-admin/system-health');
      setData(r.data.data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const refresh = () => { setRefreshing(true); load(); };

  const pct = data ? Math.round((data.server.memory.used / data.server.memory.total) * 100) : 0;

  const StatusDot = ({ ok }) => (
    <div style={{ width: 10, height: 10, borderRadius: '50%', background: ok ? '#34d399' : '#f87171', boxShadow: ok ? '0 0 6px #34d399' : 'none', flexShrink: 0 }}></div>
  );

  if (loading) return <div className="text-center py-5"><div className="spinner-border sa-spinner"></div></div>;

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h4 className="sa-page-title"><i className="fas fa-heartbeat me-2"></i>System Health</h4>
          <p className="sa-page-subtitle">Server status, database health, memory and uptime</p>
        </div>
        <button className="btn sa-btn-outline" onClick={refresh} disabled={refreshing}>
          <i className={`fas fa-sync me-2 ${refreshing ? 'fa-spin' : ''}`}></i>Refresh
        </button>
      </div>

      {data && (
        <>
          {/* Overview chips */}
          <div className="d-flex gap-3 flex-wrap mb-4">
            <div className="sa-card px-4 py-3 d-flex align-items-center gap-3">
              <StatusDot ok={data.database.status === 'connected'} />
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Database</div>
                <div style={{ fontWeight: 700, color: data.database.status === 'connected' ? '#34d399' : '#f87171', fontSize: '0.9rem' }}>
                  {data.database.status}
                </div>
              </div>
            </div>
            <div className="sa-card px-4 py-3 d-flex align-items-center gap-3">
              <StatusDot ok />
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Server</div>
                <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.9rem' }}>Online</div>
              </div>
            </div>
            <div className="sa-card px-4 py-3 d-flex align-items-center gap-3">
              <i className="fas fa-clock" style={{ color: '#C9A84C' }}></i>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Uptime</div>
                <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.9rem' }}>{data.server.uptime}</div>
              </div>
            </div>
            <div className="sa-card px-4 py-3 d-flex align-items-center gap-3">
              <i className="fab fa-node-js" style={{ color: '#34d399' }}></i>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Node.js</div>
                <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.9rem' }}>{data.server.nodeVersion}</div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* Database */}
            <div className="col-lg-6">
              <div className="sa-card">
                <div className="sa-card-header"><span><i className="fas fa-database me-2"></i>Database</span></div>
                <div className="sa-card-body p-0">
                  {[
                    { label: 'Status',    value: data.database.status,   ok: data.database.status === 'connected' },
                    { label: 'Host',      value: data.database.host },
                    { label: 'Database',  value: data.database.name },
                  ].map((r, i) => (
                    <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px', borderBottom: i < 2 ? '1px solid #1e2436' : 'none' }}>
                      <div style={{ color: '#6b7280', fontSize: '0.82rem', width: 100 }}>{r.label}</div>
                      <div style={{ color: r.ok !== undefined ? (r.ok ? '#34d399' : '#f87171') : '#e2e8f0', fontWeight: 600, fontSize: '0.85rem', fontFamily: 'monospace' }}>{r.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Memory */}
            <div className="col-lg-6">
              <div className="sa-card">
                <div className="sa-card-header">
                  <span><i className="fas fa-memory me-2"></i>Memory Usage</span>
                  <span style={{ color: pct > 80 ? '#f87171' : '#34d399', fontWeight: 700 }}>{pct}%</span>
                </div>
                <div className="sa-card-body">
                  <div style={{ background: '#1e2436', borderRadius: 8, height: 10, overflow: 'hidden', marginBottom: 16 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct > 80 ? '#f87171' : pct > 60 ? '#fbbf24' : '#34d399', borderRadius: 8, transition: 'width 0.5s' }}></div>
                  </div>
                  {[
                    { label: 'Heap Used',  value: `${data.server.memory.used} MB` },
                    { label: 'Heap Total', value: `${data.server.memory.total} MB` },
                    { label: 'RSS',        value: `${data.server.memory.rss} MB` },
                  ].map((r, i) => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 2 ? '1px solid #1a2030' : 'none' }}>
                      <span style={{ color: '#6b7280', fontSize: '0.82rem' }}>{r.label}</span>
                      <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.82rem', fontFamily: 'monospace' }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Records */}
            <div className="col-lg-12">
              <div className="sa-card">
                <div className="sa-card-header"><span><i className="fas fa-database me-2"></i>Database Records</span></div>
                <div className="sa-card-body">
                  <div className="row g-3">
                    {Object.entries(data.records).map(([k, v]) => (
                      <div key={k} className="col-6 col-md-3">
                        <div style={{ background: '#1a1f2e', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#C9A84C' }}>{v.toLocaleString()}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4, textTransform: 'capitalize' }}>{k}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ color: '#4a5568', fontSize: '0.75rem', marginTop: 16 }}>
            <i className="fas fa-clock me-1"></i>Last checked: {new Date(data.timestamp).toLocaleString('en-IN')}
          </div>
        </>
      )}
    </div>
  );
}
