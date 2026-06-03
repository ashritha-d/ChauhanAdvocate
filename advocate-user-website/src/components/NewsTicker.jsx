import { useEffect, useRef, useState } from 'react';
import { getActiveNews } from '../api';

function fmt(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function NewsTicker() {
  const [news, setNews]       = useState([]);
  const [loading, setLoading] = useState(true);
  const trackRef              = useRef(null);

  useEffect(() => {
    getActiveNews(10)
      .then(r => { if (r.data.success) setNews(r.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Adjust animation duration: ~6 seconds per item, min 20s
  const duration = Math.max(20, news.length * 6);

  if (loading || news.length === 0) return null;

  // Duplicate items for seamless infinite loop
  const items = [...news, ...news];

  return (
    <div className="news-ticker-section" aria-label="Latest News">
      <div className="container-fluid px-0">
        <div className="news-ticker-wrap">
          {/* Label */}
          <div className="news-ticker-label">
            <i className="fas fa-rss me-1"></i>
            <span>Latest News</span>
          </div>

          {/* Scrolling track */}
          <div className="news-ticker-outer">
            <div
              className="news-ticker-track"
              ref={trackRef}
              style={{ animationDuration: `${duration}s` }}
            >
              {items.map((item, i) => (
                <div key={`${item._id}-${i}`} className="news-ticker-item">
                  <span className="news-ticker-dot"></span>
                  <span className="news-ticker-date">{fmt(item.date)}</span>
                  <span className="news-ticker-title">
                    {item.link
                      ? <a href={item.link} target="_blank" rel="noreferrer" className="news-ticker-link">{item.title}</a>
                      : item.title
                    }
                  </span>
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="news-ticker-btn"
                    >
                      {item.linkLabel || 'Read More'}
                      <i className="fas fa-arrow-right ms-1"></i>
                    </a>
                  )}
                  <span className="news-ticker-sep">|</span>
                </div>
              ))}
            </div>
          </div>

          {/* View all link */}
          <a href="/ChauhanAdvocate/news" className="news-ticker-viewall">
            <span className="d-none d-sm-inline">View All</span>
            <i className="fas fa-chevron-right ms-1"></i>
          </a>
        </div>
      </div>
    </div>
  );
}
