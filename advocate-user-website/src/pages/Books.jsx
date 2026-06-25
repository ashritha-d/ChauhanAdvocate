import { useState, useEffect, useCallback } from 'react';
import SEOHead from '../components/SEOHead';
import OrderModal from '../components/OrderModal';
import { getBooks } from '../api';
import { mediaUrl } from '../utils/helpers';
import { useUserAuth } from '../context/UserAuthContext';
import { savePendingAction } from '../utils/pendingAction';
import { useNavigate } from 'react-router-dom';

const PER_PAGE = 9;

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function BooksPage() {
  const { user } = useUserAuth();
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slowLoad, setSlowLoad] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStock, setFilterStock] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedBook, setSelectedBook] = useState(null);

  const fetchBooks = useCallback(() => {
    setLoading(true);
    setSlowLoad(false);
    const timer = setTimeout(() => setSlowLoad(true), 5000);
    getBooks()
      .then(r => { if (r.data.success) setBooks(r.data.data || []); })
      .catch(() => {
        setTimeout(() => {
          getBooks()
            .then(r => { if (r.data.success) setBooks(r.data.data || []); })
            .catch(() => {})
            .finally(() => setLoading(false));
        }, 10000);
        return;
      })
      .finally(() => { clearTimeout(timer); setLoading(false); });
  }, []);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);
  useEffect(() => { if (!loading) window.AOS?.refresh(); }, [loading]);

  const filtered = books.filter(b => {
    const matchStock =
      filterStock === 'all' ||
      (filterStock === 'available' && b.stockStatus !== 'out_of_stock') ||
      (filterStock === 'out_of_stock' && b.stockStatus === 'out_of_stock');
    const q = search.toLowerCase();
    const matchSearch = !q ||
      b.name?.toLowerCase().includes(q) ||
      b.author?.toLowerCase().includes(q) ||
      b.description?.toLowerCase().includes(q);
    return matchStock && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleOrder = (b) => {
    if (b.stockStatus === 'out_of_stock') return;
    if (user) {
      setSelectedBook({ title: b.name, price: b.price ? `₹${b.price}` : '' });
    } else {
      savePendingAction('order', { title: b.name, price: b.price ? `₹${b.price}` : '' });
      navigate('/login');
    }
  };

  return (
    <section id="books" className="section-padding bg-light">
      <SEOHead
        title="Legal Books & Publications"
        description="Purchase legal books and guides by Advocate Chauhan — covering civil law, criminal law, family law, property law, and more."
        canonical="/books"
      />
      <div className="container">
        <div className="text-center mb-5" data-aos="fade-up">
          <div className="section-label">Legal Library</div>
          <h2 className="section-title">Books &amp; <span className="text-gold">Publications</span></h2>
          <p className="section-subtitle">Purchase legal books and guides authored by Advocate Chauhan</p>
        </div>

        {/* Search + filter controls */}
        <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-3">
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 400 }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }}></i>
            <input
              type="text"
              className="form-control"
              placeholder="Search books…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: 40, borderRadius: 30, border: '1px solid #ddd' }}
            />
          </div>
          <div className="d-flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'All Books' },
              { key: 'available', label: 'Available' },
              { key: 'out_of_stock', label: 'Out of Stock' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`btn btn-sm ${filterStock === key ? 'btn-gold' : 'btn-outline-secondary'}`}
                onClick={() => { setFilterStock(key); setPage(1); }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {!loading && (
          <p className="text-muted small mb-4">
            {filtered.length} book{filtered.length !== 1 ? 's' : ''} found
            {search && ` for "${search}"`}
          </p>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--gold)' }}></div>
            {slowLoad && (
              <div className="mt-3">
                <p className="text-muted small mb-2">Server is starting up, please wait a moment…</p>
                <button className="btn btn-sm btn-outline-secondary" onClick={fetchBooks}>
                  <i className="fas fa-redo me-1"></i>Retry Now
                </button>
              </div>
            )}
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-5">
            <i className="fas fa-book fa-3x mb-3" style={{ color: 'var(--gold)' }}></i>
            <h5>
              {search || filterStock !== 'all'
                ? 'No books match your filters'
                : 'No Books Yet'}
            </h5>
            <p className="text-muted">
              {search || filterStock !== 'all'
                ? 'Try a different keyword or clear the filter.'
                : 'Books and publications are being added. Check back soon!'}
            </p>
            {(search || filterStock !== 'all') && (
              <button className="btn btn-outline-secondary btn-sm mt-2"
                onClick={() => { setSearch(''); setFilterStock('all'); }}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="row g-4">
              {paginated.map((b, i) => {
                const outOfStock = b.stockStatus === 'out_of_stock';
                return (
                  <div key={b._id} className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay={i * 80}>
                    <div className="course-card">
                      <div className="course-card-thumb">
                        {b.image
                          ? <img src={mediaUrl(b.image)} alt={b.name}
                              onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML += '<div class="course-card-thumb-placeholder"><i class="fas fa-book"></i></div>'; }} />
                          : <div className="course-card-thumb-placeholder">
                              <i className="fas fa-book"></i>
                            </div>
                        }
                        <span className={`course-badge-level badge ${outOfStock ? 'bg-secondary' : 'bg-success'}`}>
                          {outOfStock ? 'Out of Stock' : 'Available'}
                        </span>
                      </div>

                      <div className="course-card-body">
                        <h5 className="course-card-title">{b.name}</h5>
                        {b.author && (
                          <p className="text-muted small mb-1">
                            <i className="fas fa-user-pen me-1"></i>{b.author}
                          </p>
                        )}
                        {b.description && (
                          <p className="course-card-desc">{b.description}</p>
                        )}
                        <div className="course-card-meta">
                          {b.price > 0 && (
                            <span className="fw-semibold" style={{ color: 'var(--gold)' }}>
                              <i className="fas fa-tag me-1"></i>₹{b.price}
                            </span>
                          )}
                          {b.createdAt && (
                            <span><i className="fas fa-calendar me-1"></i>{formatDate(b.createdAt)}</span>
                          )}
                        </div>
                      </div>

                      <div className="course-card-footer">
                        {b.contactNumber && (
                          <a
                            href={`tel:${b.contactNumber}`}
                            className="btn btn-sm btn-outline-secondary"
                            title="Call to enquire"
                          >
                            <i className="fas fa-phone me-1"></i>Enquire
                          </a>
                        )}
                        <button
                          className={`btn btn-sm px-4 ${outOfStock ? 'btn-outline-secondary' : 'btn-gold'}`}
                          onClick={() => handleOrder(b)}
                          disabled={outOfStock}
                        >
                          <i className={`fas ${outOfStock ? 'fa-times-circle' : 'fa-shopping-cart'} me-1`}></i>
                          {outOfStock ? 'Out of Stock' : 'Order Now'}
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

      {selectedBook && (
        <OrderModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onSuccess={() => setSelectedBook(null)}
        />
      )}
    </section>
  );
}
