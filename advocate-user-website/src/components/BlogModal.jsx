import { useEffect, useState } from 'react';
import { getBlogById } from '../api';
import { mediaUrl, formatDate } from '../utils/helpers';

export default function BlogModal({ id, onClose }) {
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getBlogById(id)
      .then(r => { if (r.data.success) setBlog(r.data.data); else setError(true); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header border-0">
            <h5 className="modal-title fw-bold">{loading ? 'Loading...' : (blog?.title || 'Article')}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {loading && <div className="text-center py-5"><div className="spinner-border spinner-gold"></div></div>}
            {error && <p className="text-danger">Failed to load article.</p>}
            {blog && (
              <>
                {blog.coverImage && <img src={mediaUrl(blog.coverImage)} className="img-fluid rounded mb-4" alt={blog.title} />}
                <div className="d-flex gap-3 mb-3 text-muted small">
                  <span><i className="fas fa-user me-1"></i>{blog.author}</span>
                  <span><i className="fas fa-calendar me-1"></i>{formatDate(blog.publishedAt)}</span>
                  <span><i className="fas fa-tag me-1"></i>{blog.category}</span>
                </div>
                <div className="blog-full-content" dangerouslySetInnerHTML={{ __html: blog.content }}></div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
