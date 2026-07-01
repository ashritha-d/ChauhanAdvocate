import { useEffect, useState, useCallback } from 'react';
import usePolling from '../hooks/usePolling';
import SEOHead from '../components/SEOHead';
import { getNewsPage } from '../api';

function fmt(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const PER_PAGE = 9;

export default function NewsPage() {
  const [news, setNews]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [from, setFrom]       = useState('');
  const [to, setTo]           = useState('');
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);

  const load = useCallback((p = 1) => {
    setLoading(true);
    getNewsPage(p, PER_PAGE, search, from, to)
      .then(r => {
        if (r.data.success) {
          setNews(r.data.data);
          setTotal(r.data.total);
          setPages(r.data.pages);
          setPage(p);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, from, to]);

  useEffect(() => { load(1); }, [load]);
  usePolling(() => load(page), 60000);

  const handleSearch = e => { e.preventDefault(); load(1); };
  const clearFilters = () => { setSearch(''); setFrom(''); setTo(''); };

  return (
    <section className="news-page-section section-padding">
      <SEOHead
        title="Legal News & Updates"
        description="Stay informed with the latest legal news, landmark judgements, and law updates from Advocate Chauhan. Covering criminal, civil, family, and corporate law developments in India."
        canonical="/news"
      />
      {/* Page Header */}
      <div className="news-page-hero">
        <div className="container">
          <div className="section-label" style={{ color: 'rgba(201,168,76,0.8)' }}>Stay Informed</div>
          <h1 className="section-title text-white">
            Latest <span className="text-gold">News</span>
          </h1>
          <p className="text-white-50">Legal news, court updates, and important announcements</p>
        </div>
      </div>

      <div className="container mt-4">
        {/* Search / Filter bar */}
        <form onSubmit={handleSearch} className="news-filter-bar mb-5" data-aos="fade-up">
          <div className="row g-2 align-items-end">
            <div className="col-md-5">
              <label className="form-label small fw-semibold text-muted">Search</label>
              <div className="input-group">
                <span className="input-group-text"><i className="fas fa-search text-muted"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search news…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-2">
              <label className="form-label small fw-semibold text-muted">From Date</label>
              <input type="date" className="form-control" value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div className="col-md-2">
              <label className="form-label small fw-semibold text-muted">To Date</label>
              <input type="date" className="form-control" value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <div className="col-md-3 d-flex gap-2">
              <button type="submit" className="btn btn-gold flex-grow-1">
                <i className="fas fa-filter me-1"></i>Filter
              </button>
              {(search || from || to) && (
                <button type="button" className="btn btn-outline-secondary" onClick={clearFilters} title="Clear filters">
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Results count */}
        {!loading && (
          <p className="text-muted small mb-3">
            {total === 0 ? 'No news found' : `Showing ${news.length} of ${total} news item${total !== 1 ? 's' : ''}`}
          </p>
        )}

        {/* Cards */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--gold)' }}></div>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-5">
            <i className="fas fa-newspaper fa-3x mb-3 text-muted"></i>
            <h5 className="text-muted">No news found</h5>
            {(search || from || to) && (
              <button className="btn btn-outline-secondary btn-sm mt-2" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="row g-4">
            {news.map((item, i) => (
              <div key={item._id} className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay={i % 3 * 80}>
                <div className="news-card">
                  <div className="news-card-date">
                    <i className="fas fa-calendar-alt me-1"></i>{fmt(item.date)}
                  </div>
                  <h5 className="news-card-title">
                    {item.link
                      ? <a href={item.link} target="_blank" rel="noreferrer">{item.title}</a>
                      : item.title
                    }
                  </h5>
                  {item.description && (
                    <p className="news-card-desc">{item.description}</p>
                  )}
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="news-card-readmore"
                    >
                      {item.linkLabel || 'Read More'}
                      <i className="fas fa-external-link-alt ms-1"></i>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="d-flex justify-content-center gap-2 mt-5">
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => load(page - 1)}
              disabled={page <= 1}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`btn btn-sm ${p === page ? 'btn-gold' : 'btn-outline-secondary'}`}
                onClick={() => load(p)}
              >
                {p}
              </button>
            ))}
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => load(page + 1)}
              disabled={page >= pages}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
