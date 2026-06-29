const SECTIONS = [
  { label: 'Books',        icon: 'fas fa-book',           color: '#C9A84C', desc: 'Manage books for sale',         api: '/books' },
  { label: 'Magazines',    icon: 'fas fa-newspaper',      color: '#60a5fa', desc: 'Manage legal magazines',        api: '/magazines' },
  { label: 'Drafts',       icon: 'fas fa-file-alt',       color: '#34d399', desc: 'Manage legal draft templates',  api: '/drafts' },
  { label: 'YouTube',      icon: 'fab fa-youtube',        color: '#f87171', desc: 'Manage YouTube video links',    api: '/youtube-videos' },
  { label: 'Services',     icon: 'fas fa-briefcase',      color: '#a78bfa', desc: 'Manage legal services listed',  api: '/services' },
  { label: 'Blogs',        icon: 'fas fa-rss',            color: '#fbbf24', desc: 'Manage blog posts',             api: '/blogs' },
  { label: 'News',         icon: 'fas fa-broadcast-tower',color: '#22d3ee', desc: 'Manage latest news',            api: '/news' },
  { label: 'Testimonials', icon: 'fas fa-star',           color: '#C9A84C', desc: 'Manage client testimonials',   api: '/testimonials' },
  { label: 'FAQs',         icon: 'fas fa-question-circle',color: '#34d399', desc: 'Manage frequently asked questions', api: '/faqs' },
  { label: 'Hero Banners', icon: 'fas fa-image',          color: '#60a5fa', desc: 'Manage homepage hero images',  api: '/hero-banners' },
  { label: 'Courses',      icon: 'fas fa-graduation-cap', color: '#a78bfa', desc: 'Manage online courses',         api: '/courses' },
  { label: 'Site Settings',icon: 'fas fa-cog',            color: '#fbbf24', desc: 'Configure website settings',   api: '/site-settings' },
];

export default function ContentOverview() {
  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h4 className="sa-page-title"><i className="fas fa-layer-group me-2"></i>Content Hub</h4>
          <p className="sa-page-subtitle">All content sections of the website. Manage content via the Admin Panel.</p>
        </div>
      </div>

      <div style={{ background: '#1a1f2e', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <i className="fas fa-info-circle" style={{ color: '#C9A84C', marginTop: 2, flexShrink: 0 }}></i>
        <div style={{ fontSize: '0.83rem', color: '#9ca3af' }}>
          Content management is handled in the <strong style={{ color: '#C9A84C' }}>Admin Panel</strong> at{' '}
          <a href="https://ashritha-d.github.io/ChauhanAdvocate/admin/" target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>
            /ChauhanAdvocate/admin/
          </a>. As Super Admin you have full access to all content sections there.
        </div>
      </div>

      <div className="row g-3">
        {SECTIONS.map(s => (
          <div key={s.label} className="col-sm-6 col-md-4 col-lg-3">
            <div className="sa-card" style={{ cursor: 'default', transition: 'border-color 0.2s', borderColor: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = s.color + '44'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
            >
              <div className="sa-card-body" style={{ padding: '20px' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: s.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <i className={s.icon} style={{ color: s.color, fontSize: '1.1rem' }}></i>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#e2e8f0', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{s.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <a href="https://ashritha-d.github.io/ChauhanAdvocate/admin/" target="_blank" rel="noreferrer" className="btn sa-btn-primary">
          <i className="fas fa-external-link-alt me-2"></i>Open Admin Panel
        </a>
      </div>
    </div>
  );
}
