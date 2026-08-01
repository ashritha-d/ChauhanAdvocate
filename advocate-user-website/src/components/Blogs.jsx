import { useEffect, useRef, useState } from 'react';
import { getBlogs } from '../api';
import { mediaUrl, formatDate } from '../utils/helpers';
import BlogModal from './BlogModal';

const FALLBACK = [
  { _id:'1', title:'Know Your Rights: A Guide to Criminal Law', category:'Criminal Law', excerpt:'Understanding your fundamental rights when accused of a crime is essential...', icon:'fas fa-gavel' },
  { _id:'2', title:'Property Registration: Common Mistakes to Avoid', category:'Property Law', excerpt:'Many property buyers make critical errors during registration. Learn how to prevent them...', icon:'fas fa-home' },
  { _id:'3', title:'Divorce Law in India: A Complete Guide', category:'Family Law', excerpt:'Navigating divorce proceedings can be complex. This guide covers grounds, procedures...', icon:'fas fa-heart-broken' },
];

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const isFallback = useRef(false);

  useEffect(() => {
    getBlogs(1, 6)
      .then(r => {
        if (r.data.success && r.data.data.length) {
          setBlogs(r.data.data);
          setTotalPages(r.data.pages || 1);
        } else {
          isFallback.current = true;
          setBlogs(FALLBACK);
        }
      })
      .catch(() => { isFallback.current = true; setBlogs(FALLBACK); })
      .finally(() => setLoading(false));
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    const next = page + 1;
    try {
      const r = await getBlogs(next, 6);
      if (r.data.success && r.data.data.length) {
        setBlogs(prev => [...prev, ...r.data.data]);
        setPage(next);
      }
    } catch {}
    setLoadingMore(false);
  };

  return (
    <section id="blog" className="section-padding bg-white">
      <div className="container">
        <div className="text-center mb-5" data-aos="fade-up">
          <div className="section-label">Legal Insights</div>
          <h2 className="section-title">Latest <span className="text-gold">News & Articles</span></h2>
          <p className="section-subtitle">Stay informed with the latest legal updates and insights</p>
        </div>
        <div className="row g-4">
          {loading ? (
            <div className="col-12 text-center py-5">
              <div className="spinner-border spinner-gold" role="status"></div>
            </div>
          ) : blogs.map((b, i) => (
            <div className="col-lg-4 col-md-6" key={b._id} data-aos="fade-up" data-aos-delay={(i % 3) * 80}>
              <div className="blog-card">
                <div className="blog-image">
                  {b.coverImage
                    ? <img src={mediaUrl(b.coverImage, { width: 400 })} alt={b.title} loading="lazy" onError={e => { e.target.style.display='none'; }} />
                    : <div className="blog-image-placeholder"><i className={b.icon || 'fas fa-newspaper'}></i></div>
                  }
                </div>
                <div className="blog-content">
                  <span className="blog-category">{b.category || 'Legal'}</span>
                  <h5 className="blog-title">{b.title}</h5>
                  <p className="blog-excerpt">{b.excerpt || (b.content ? b.content.replace(/<[^>]*>/g,'').substring(0,120)+'...' : b.excerpt)}</p>
                  {!isFallback.current && (
                    <div className="blog-meta">
                      <span><i className="fas fa-user me-1"></i>{b.author || 'Advocate Chauhan'}</span>
                      <span><i className="fas fa-calendar me-1"></i>{formatDate(b.publishedAt || b.createdAt)}</span>
                    </div>
                  )}
                  {!isFallback.current && (
                    <button className="blog-read-btn" onClick={() => setSelectedId(b._id)}>
                      Read More <i className="fas fa-arrow-right ms-1"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {!isFallback.current && page < totalPages && (
          <div className="text-center mt-5">
            <button className="btn btn-outline-dark px-5" onClick={loadMore} disabled={loadingMore}>
              {loadingMore
                ? <><i className="fas fa-spinner fa-spin me-2"></i>Loading...</>
                : <><i className="fas fa-plus me-2"></i>Load More Articles</>
              }
            </button>
          </div>
        )}
      </div>
      {selectedId && <BlogModal id={selectedId} onClose={() => setSelectedId(null)} />}
    </section>
  );
}
