import { useState } from 'react';

const ROLES = [
  {
    id: 'superadmin', label: 'Super Admin', color: '#C9A84C', icon: 'fas fa-user-shield',
    desc: 'Website owner. Unrestricted access to every feature, module, and system setting.',
    permissions: ['Full Dashboard', 'Admin Management', 'User Management', 'All Content', 'Payment Settings', 'Bank Details', 'Site Settings', 'Feature Toggles', 'Security Center', 'System Health', 'Audit Logs', 'Analytics', 'Notifications'],
  },
  {
    id: 'admin', label: 'Admin', color: '#0d6efd', icon: 'fas fa-user-cog',
    desc: 'Full operational access. Can manage appointments, users, content, and payments.',
    permissions: ['Dashboard', 'Appointments', 'Payments', 'Content Management', 'Books', 'Magazines', 'Users (view)', 'Notifications'],
  },
  {
    id: 'editor', label: 'Editor', color: '#198754', icon: 'fas fa-pen',
    desc: 'Content creation and editing. Cannot manage financial or user data.',
    permissions: ['Blogs', 'News', 'Services', 'Testimonials', 'FAQs', 'YouTube Videos', 'Hero Banners'],
  },
  {
    id: 'content_manager', label: 'Content Manager', color: '#fd7e14', icon: 'fas fa-tasks',
    desc: 'Manages publications and digital products.',
    permissions: ['Books', 'Magazines', 'Drafts', 'Courses', 'Content Publishing'],
  },
  {
    id: 'support', label: 'Support', color: '#6f42c1', icon: 'fas fa-headset',
    desc: 'Handles client inquiries and basic appointment operations.',
    permissions: ['Appointments (view)', 'Contacts', 'Jr. Advocates', 'Notifications (view)'],
  },
];

const MODULES = ['Dashboard', 'Users', 'Appointments', 'Payments', 'Books', 'Magazines', 'Drafts', 'Blogs', 'News', 'Courses', 'Services', 'Testimonials', 'FAQs', 'YouTube', 'Site Settings', 'Feature Toggles', 'Admin Mgmt', 'Audit Logs', 'Security', 'System'];

const ACCESS = {
  superadmin:     MODULES.map(() => 'full'),
  admin:          ['full','view','full','full','full','full','view','full','full','view','full','full','full','full','none','none','none','none','none','none'],
  editor:         ['view','none','none','none','none','none','none','full','full','none','full','full','full','full','none','none','none','none','none','none'],
  content_manager:['view','none','none','none','full','full','full','none','none','full','none','none','none','none','none','none','none','none','none','none'],
  support:        ['view','none','view','none','none','none','none','none','none','none','none','none','none','none','none','none','none','none','none','none'],
};

const ACCESS_COLORS = { full: '#34d399', view: '#60a5fa', none: '#1e2436' };
const ACCESS_ICONS  = { full: 'fas fa-check', view: 'fas fa-eye', none: '' };

export default function RoleManagement() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h4 className="sa-page-title"><i className="fas fa-user-tag me-2"></i>Roles & Permissions</h4>
          <p className="sa-page-subtitle">Role hierarchy and module-level access matrix</p>
        </div>
      </div>

      {/* Role Cards */}
      <div className="row g-3 mb-4">
        {ROLES.map(r => (
          <div key={r.id} className="col-sm-6 col-lg">
            <div
              className="sa-card"
              style={{ cursor: 'pointer', borderColor: selected?.id === r.id ? r.color + '66' : 'transparent', transition: 'border-color 0.2s' }}
              onClick={() => setSelected(selected?.id === r.id ? null : r)}
            >
              <div className="sa-card-body">
                <div style={{ width: 44, height: 44, borderRadius: 12, background: r.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <i className={r.icon} style={{ color: r.color, fontSize: '1.1rem' }}></i>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: r.color, marginBottom: 4 }}>{r.label}</div>
                <div style={{ fontSize: '0.74rem', color: '#6b7280', lineHeight: 1.5 }}>{r.desc}</div>
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {r.permissions.slice(0, 3).map(p => (
                    <span key={p} style={{ background: r.color + '15', color: r.color, padding: '2px 8px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 600 }}>{p}</span>
                  ))}
                  {r.permissions.length > 3 && (
                    <span style={{ background: '#1e2436', color: '#6b7280', padding: '2px 8px', borderRadius: 20, fontSize: '0.65rem' }}>+{r.permissions.length - 3} more</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Permission matrix */}
      <div className="sa-card mb-4">
        <div className="sa-card-header">
          <span><i className="fas fa-table me-2"></i>Permission Matrix</span>
          <div className="d-flex gap-3">
            {[['full','Full Access'],['view','View Only'],['none','No Access']].map(([k, l]) => (
              <span key={k} className="d-flex align-items-center gap-1" style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: ACCESS_COLORS[k] }}></div>{l}
              </span>
            ))}
          </div>
        </div>
        <div className="sa-card-body p-0" style={{ overflowX: 'auto' }}>
          <table className="table sa-table mb-0" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th className="px-4" style={{ minWidth: 130 }}>Module</th>
                {ROLES.map(r => (
                  <th key={r.id} style={{ textAlign: 'center', minWidth: 90 }}>
                    <span style={{ color: r.color, fontSize: '0.78rem' }}>{r.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((mod, mi) => (
                <tr key={mod}>
                  <td className="px-4" style={{ fontSize: '0.82rem', color: '#9ca3af' }}>{mod}</td>
                  {ROLES.map(r => {
                    const level = ACCESS[r.id]?.[mi] || 'none';
                    return (
                      <td key={r.id} style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, background: ACCESS_COLORS[level] + '22' }}>
                          {level !== 'none' && <i className={ACCESS_ICONS[level]} style={{ color: ACCESS_COLORS[level], fontSize: '0.65rem' }}></i>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: '#1a1f2e', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12, padding: '14px 20px', fontSize: '0.82rem', color: '#9ca3af' }}>
        <i className="fas fa-info-circle me-2" style={{ color: '#C9A84C' }}></i>
        Role assignment is done in <strong style={{ color: '#e2e8f0' }}>Admin Management</strong>. Only the Super Admin can assign or change roles.
        Dynamic role creation and custom permission sets are on the roadmap.
      </div>
    </div>
  );
}
