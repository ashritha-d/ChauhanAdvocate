import { useState, useEffect, useCallback } from 'react';
import SEOHead from '../components/SEOHead';
import { getDrafts } from '../api';
import { mediaUrl } from '../utils/helpers';

const PER_PAGE = 9;

const TYPE_BADGE = {
  blog:      'bg-info',
  course:    'bg-primary',
  magazine:  'bg-secondary',
  news:      'bg-warning text-dark',
  facebook:  'bg-primary',
  youtube:   'bg-danger',
};

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slowLoad, setSlowLoad] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);

  const fetchDrafts = useCallback(() => {
    setLoading(true);
    setSlowLoad(false);
    const timer = setTimeout(() => setSlowLoad(true), 5000);
    getDrafts()
      .then(r => { if (r.data.success) setDrafts(r.data.data || []); })
      .catch(() => {
        setTimeout(() => {
          getDrafts()
            .then(r => { if (r.data.success) setDrafts(r.data.data || []); })
            .catch(() => {})
            .finally(() => setLoading(false));
        }, 10000);
        return;
      })
      .finally(() => { clearTimeout(timer); setLoading(false); });
  }, []);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  const contentTypes = ['all', ...new Set(drafts.map(d => d.contentType).filter(Boolean))];

  const filtered = drafts.filter(d => {
    const matchType = filterType === 'all' || d.contentType === filterType;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      d.title?.toLowerCase().includes(q) ||
      d.contentType?.toLowerCase().includes(q) ||
      String(d.contentDataJson?.description || '').toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleDownload = (d) => {
    const file = d.contentDataJson?.file;
    if (!file) {
      alert(`"${d.title}" is not available for download yet. Please contact us to request this draft.`);
      return;
    }
    const url = file.startsWith('http') ? file : mediaUrl(file);
    const a = document.createElement('a');
    a.href = url; a.download = `${d.title}.pdf`; a.target = '_blank';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <section id="drafts" className="section-padding bg-light">
      <SEOHead
        title="Legal Draft Templates"
        description="Download professionally drafted legal document templates by Advocate Chauhan — rental agreements, NDAs, employment contracts, sale deeds, and more."
        canonical="/drafts"
      />
      <div className="container">
        <div className="text-center mb-5" data-aos="fade-up">
          <div className="section-label">Legal Templates</div>
          <h2 className="section-title">Legal <span className="text-gold">Drafts</span></h2>
          <p className="section-subtitle">Download professionally drafted legal document templates</p>
        </div>

        {/* Search + filter controls */}
        <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-3">
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 400 }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }}></i>
            <input
              type="text"
              className="form-control"
              placeholder="Search drafts…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: 40, borderRadius: 30, border: '1px solid #ddd' }}
            />
          </div>
          {contentTypes.length > 2 && (
            <div className="d-flex gap-2 flex-wrap">
              {contentTypes.map(t => (
                <button
                  key={t}
                  className={`btn btn-sm ${filterType === t ? 'btn-gold' : 'btn-outline-secondary'}`}
                  onClick={() => { setFilterType(t); setPage(1); }}
                >
                  {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {!loading && (
          <p className="text-muted small mb-4">
            {filtered.length} draft{filtered.length !== 1 ? 's' : ''} found
            {search && ` for "${search}"`}
          </p>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--gold)' }}></div>
            {slowLoad && (
              <div className="mt-3">
                <p className="text-muted small mb-2">Server is starting up, please wait a moment…</p>
                <button className="btn btn-sm btn-outline-secondary" onClick={fetchDrafts}>
                  <i className="fas fa-redo me-1"></i>Retry Now
                </button>
              </div>
            )}
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-5">
            <i className="fas fa-file-alt fa-3x mb-3" style={{ color: 'var(--gold)' }}></i>
            <h5>
              {search || filterType !== 'all'
                ? 'No drafts match your filters'
                : 'No Legal Drafts Yet'}
            </h5>
            <p className="text-muted">
              {search || filterType !== 'all'
                ? 'Try a different keyword or clear the type filter.'
                : 'Legal draft templates are being prepared. Check back soon!'}
            </p>
            {(search || filterType !== 'all') && (
              <button className="btn btn-outline-secondary btn-sm mt-2"
                onClick={() => { setSearch(''); setFilterType('all'); }}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="row g-4">
              {paginated.map((d, i) => {
                const description = d.contentDataJson?.description || '';
                const hasFile = !!(d.contentDataJson?.file);
                const badgeClass = TYPE_BADGE[d.contentType] || 'bg-secondary';

                return (
                  <div key={d._id} className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay={i * 80}>
                    <div className="course-card">
                      <div className="course-card-thumb">
                        {d.thumbnail
                          ? <img src={mediaUrl(d.thumbnail)} alt={d.title}
                              onError={e => { e.target.style.display = 'none'; e.target.nextSibling?.remove(); e.target.parentElement.innerHTML += '<div class="course-card-thumb-placeholder"><i class="fas fa-file-alt"></i></div>'; }} />
                          : <div className="course-card-thumb-placeholder">
                              <i className="fas fa-file-alt"></i>
                            </div>
                        }
                        <span className={`course-badge-level badge ${badgeClass}`}>
                          {d.contentType}
                        </span>
                      </div>

                      <div className="course-card-body">
                        <h5 className="course-card-title">{d.title}</h5>
                        {description && (
                          <p className="course-card-desc">{description}</p>
                        )}
                        <div className="course-card-meta">
                          <span>
                            <i className="fas fa-folder me-1"></i>
                            {d.contentType?.charAt(0).toUpperCase() + d.contentType?.slice(1)}
                          </span>
                          {d.lastSavedAt && (
                            <span><i className="fas fa-calendar me-1"></i>{formatDate(d.lastSavedAt)}</span>
                          )}
                        </div>
                      </div>

                      <div className="course-card-footer">
                        <div></div>
                        <button
                          className={`btn btn-sm px-4 ${hasFile ? 'btn-gold' : 'btn-outline-secondary'}`}
                          onClick={() => handleDownload(d)}
                        >
                          <i className={`fas ${hasFile ? 'fa-download' : 'fa-lock'} me-1`}></i>
                          {hasFile ? 'Download PDF' : 'Not Available'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="d-flex justify-content-center align-items-center gap-2 mt-5">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(p => (
                  <button
                    key={p}
                    className={`btn btn-sm ${page === p ? 'btn-gold' : 'btn-outline-secondary'}`}
                    onClick={() => setPage(p)}
                    style={{ minWidth: 36 }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
