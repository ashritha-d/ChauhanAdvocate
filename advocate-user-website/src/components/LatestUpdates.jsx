import { useEffect, useRef, useState } from 'react';
import { getYouTubeVideos, getFacebookPosts, getMagazines, getDrafts, getBooks } from '../api';
import { mediaUrl, formatDate } from '../utils/helpers';

const TYPE_META = {
  youtube:  { label: 'YouTube',  color: '#ff0000', btnText: 'Watch',    icon: 'fab fa-youtube' },
  facebook: { label: 'Facebook', color: '#1877f2', btnText: 'View Post', icon: 'fab fa-facebook' },
  magazine: { label: 'Magazine', color: '#8B0000', btnText: 'View PDF',  icon: 'fas fa-book-open' },
  draft:    { label: 'Draft',    color: '#2c5f2e', btnText: 'Download',  icon: 'fas fa-file-alt' },
  book:     { label: 'Book',     color: '#a8893a', btnText: 'Order Now', icon: 'fas fa-book' },
};

function buildItems(results) {
  const [yt, fb, mag, dr, bk] = results;
  const all = [];

  if (yt.status === 'fulfilled' && yt.value.data?.success) {
    yt.value.data.data.slice(0, 6).forEach(v => all.push({
      type: 'youtube', id: v._id,
      title: v.title,
      thumb: `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`,
      href: `https://youtu.be/${v.videoId}`,
      external: true,
      date: v.createdAt,
    }));
  }

  if (fb.status === 'fulfilled' && fb.value.data?.success) {
    fb.value.data.data.slice(0, 6).forEach(p => all.push({
      type: 'facebook', id: p._id,
      title: p.title,
      thumb: p.thumbnail
        ? mediaUrl(p.thumbnail)
        : 'https://placehold.co/300x170/1877f2/ffffff?text=Facebook',
      href: p.facebookUrl || '#',
      external: true,
      date: p.date || p.createdAt,
    }));
  }

  if (mag.status === 'fulfilled' && mag.value.data?.success) {
    mag.value.data.data.slice(0, 6).forEach(m => all.push({
      type: 'magazine', id: m._id,
      title: m.title,
      thumb: m.coverImage
        ? mediaUrl(m.coverImage)
        : 'https://placehold.co/300x170/1a1a2e/c9a84c?text=Magazine',
      href: m.pdfFile ? mediaUrl(m.pdfFile) : '#',
      external: true,
      date: m.publishedDate || m.createdAt,
      description: m.description,
    }));
  }

  if (dr.status === 'fulfilled' && dr.value.data?.success) {
    dr.value.data.data.slice(0, 6).forEach(d => all.push({
      type: 'draft', id: d._id,
      title: d.title,
      thumb: 'https://placehold.co/300x170/1a1a2e/c9a84c?text=Legal+Draft',
      href: d.file ? mediaUrl(d.file) : '#',
      external: true,
      date: d.date || d.createdAt,
      description: d.category ? `Category: ${d.category}` : d.description,
    }));
  }

  if (bk.status === 'fulfilled' && bk.value.data?.success) {
    bk.value.data.data.slice(0, 6).forEach(b => all.push({
      type: 'book', id: b._id,
      title: b.name,
      thumb: b.image
        ? mediaUrl(b.image)
        : 'https://placehold.co/300x170/1a1a2e/c9a84c?text=Book',
      href: '#books',
      external: false,
      date: b.createdAt,
      price: `₹${b.price}`,
      author: b.author,
    }));
  }

  all.sort((a, b) => new Date(b.date) - new Date(a.date));
  return all;
}

export default function LatestUpdates() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef(null);

  useEffect(() => {
    Promise.allSettled([
      getYouTubeVideos(),
      getFacebookPosts(),
      getMagazines(),
      getDrafts(),
      getBooks(),
    ])
      .then(results => setItems(buildItems(results)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const scroll = (dir) => trackRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });

  if (loading || items.length === 0) return null;

  return (
    <section id="latest-updates" className="section-padding bg-light">
      <div className="container-fluid px-3 px-md-4">
        <div className="latest-header mb-4" data-aos="fade-right">
          <span className="latest-badge">LATEST</span>
          <h2 className="section-title d-inline ms-3 mb-0">
            Latest <span className="text-gold">Updates</span>
          </h2>
          <p className="section-subtitle mt-2 ms-1 mb-0">
            Freshly added content across all categories
          </p>
        </div>

        <div className="latest-slider-outer">
          <button className="slider-scroll-btn" onClick={() => scroll(-1)} aria-label="Scroll left">&#8249;</button>
          <div className="latest-scroll" ref={trackRef}>
            {items.map((item, i) => {
              const meta = TYPE_META[item.type];
              return (
                <div className="latest-card" key={`${item.type}-${item.id}`} data-aos="fade-up" data-aos-delay={Math.min(i * 40, 200)}>
                  <div className="latest-card-img">
                    <img
                      src={item.thumb}
                      alt={item.title}
                      onError={e => {
                        e.target.src = `https://placehold.co/300x170/1a1a2e/c9a84c?text=${encodeURIComponent(meta.label)}`;
                      }}
                    />
                    <span className="latest-type-pill" style={{ background: meta.color }}>
                      <i className={`${meta.icon} me-1`}></i>{meta.label}
                    </span>
                    {item.type === 'youtube' && (
                      <div className="video-play-overlay">
                        <div className="video-play-btn">&#9654;</div>
                      </div>
                    )}
                  </div>
                  <div className="latest-card-body">
                    <div className="latest-card-title" title={item.title}>{item.title}</div>
                    {item.author && <div className="latest-card-meta">{item.author}</div>}
                    {item.description && <div className="latest-card-desc">{item.description}</div>}
                    {item.price && <div className="latest-card-price">{item.price}</div>}
                    <div className="latest-card-date">
                      <i className="fas fa-calendar-alt me-1"></i>{formatDate(item.date)}
                    </div>
                    <a
                      href={item.href}
                      target={item.external ? '_blank' : undefined}
                      rel={item.external ? 'noopener noreferrer' : undefined}
                      className="btn btn-gold btn-sm w-100 mt-auto"
                    >
                      {meta.btnText} <i className="fas fa-arrow-right ms-1"></i>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="slider-scroll-btn" onClick={() => scroll(1)} aria-label="Scroll right">&#8250;</button>
        </div>
      </div>
    </section>
  );
}
