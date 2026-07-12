import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getYouTubeVideos, getFacebookPosts, getMagazines, getDrafts, getBooks, getLiveStatus } from '../api';
import { useUserAuth } from '../context/UserAuthContext';
import { mediaUrl, formatDate } from '../utils/helpers';

const TYPE_META = {
  youtube:  { label: 'YouTube',  color: '#ff0000', btnText: 'Watch',    icon: 'fab fa-youtube' },
  facebook: { label: 'Facebook', color: '#1877f2', btnText: 'View Post', icon: 'fab fa-facebook' },
  magazine: { label: 'Magazine', color: '#8B0000', btnText: 'View PDF',  icon: 'fas fa-book-open' },
  draft:    { label: 'Draft',    color: '#2c5f2e', btnText: 'Download',  icon: 'fas fa-file-alt' },
  book:     { label: 'Book',     color: '#a8893a', btnText: 'Order Now', icon: 'fas fa-book' },
};

const PLATFORM_ICONS = {
  'Google Meet':      'fab fa-google',
  'Zoom':             'fas fa-video',
  'Microsoft Teams':  'fab fa-microsoft',
  'YouTube Live':     'fab fa-youtube',
  'Webex':            'fas fa-video',
  'Other':            'fas fa-video',
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
      thumb: p.thumbnail ? mediaUrl(p.thumbnail) : 'https://placehold.co/300x170/1877f2/ffffff?text=Facebook',
      href: p.facebookUrl || '#',
      external: true,
      date: p.date || p.createdAt,
    }));
  }
  if (mag.status === 'fulfilled' && mag.value.data?.success) {
    mag.value.data.data.slice(0, 6).forEach(m => all.push({
      type: 'magazine', id: m._id,
      title: m.title,
      thumb: m.coverImage ? mediaUrl(m.coverImage) : 'https://placehold.co/300x170/1a1a2e/c9a84c?text=Magazine',
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
      thumb: b.image ? mediaUrl(b.image) : 'https://placehold.co/300x170/1a1a2e/c9a84c?text=Book',
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

/* ── effective status from stored status + current time ── */
function getEffectiveStatus(s, now) {
  if (!s) return null;
  if (s.status === 'cancelled') return 'cancelled';
  if (s.status === 'ended')     return 'ended';
  if (s.status === 'live')      return 'live';

  const start = new Date(s.date);
  if (s.startTime) { const [h, m] = s.startTime.split(':').map(Number); start.setHours(h, m, 0, 0); }
  const end = new Date(s.date);
  if (s.endTime)   { const [h, m] = s.endTime.split(':').map(Number);   end.setHours(h, m, 0, 0); }
  else             { end.setTime(start.getTime() + 3600000); }

  if (now >= start && now <= end) return 'live';
  if (now > end)                  return 'ended';
  return 'upcoming';
}

function getCountdown(s, now) {
  const target = new Date(s.date);
  if (s.startTime) { const [h, m] = s.startTime.split(':').map(Number); target.setHours(h, m, 0, 0); }
  const diff = target - now;
  if (diff <= 0) return null;
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

/* ── Live session card (pinned first in slider) ── */
function LiveSessionCard({ session }) {
  const { user } = useUserAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const status = getEffectiveStatus(session, now);
  const cd     = status === 'upcoming' ? getCountdown(session, now) : null;
  const icon   = PLATFORM_ICONS[session.platform] || 'fas fa-video';

  const handleJoin = () => {
    if (!user) { navigate('/login', { state: { from: '/live' } }); return; }
    if (session.meetUrl) window.open(session.meetUrl, '_blank', 'noopener,noreferrer');
    else navigate('/live');
  };

  const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="live-update-card">
      {/* Header */}
      <div className="luc-header">
        {status === 'live' ? (
          <span className="luc-badge luc-badge--live">
            <span className="luc-blink-dot" />LIVE NOW
          </span>
        ) : (
          <span className="luc-badge luc-badge--upcoming">
            <i className="fas fa-calendar-alt me-1" />UPCOMING
          </span>
        )}
        <span className="luc-platform">
          <i className={`${icon} me-1`} />{session.platform || 'Online'}
        </span>
      </div>

      {/* Banner */}
      {session.banner ? (
        <div className="luc-banner">
          <img src={session.banner} alt={session.title} />
        </div>
      ) : (
        <div className="luc-banner luc-banner--placeholder">
          <i className="fas fa-broadcast-tower" />
        </div>
      )}

      {/* Body */}
      <div className="luc-body">
        <div className="luc-title">{session.title}</div>

        <div className="luc-meta">
          <span><i className="fas fa-calendar" />{fmtDate(session.date)}</span>
          {session.startTime && (
            <span>
              <i className="fas fa-clock" />{session.startTime}
              {session.endTime ? ` – ${session.endTime}` : ''}
              {session.timezone ? ` ${session.timezone}` : ''}
            </span>
          )}
          {session.speaker && <span><i className="fas fa-user-tie" />{session.speaker}</span>}
        </div>

        {/* Countdown */}
        {status === 'upcoming' && cd && (
          <div className="luc-countdown">
            {cd.days > 0 && <div className="luc-cd-unit"><span>{cd.days}</span><small>d</small></div>}
            <div className="luc-cd-unit"><span>{String(cd.hours).padStart(2,'0')}</span><small>h</small></div>
            <div className="luc-cd-unit"><span>{String(cd.minutes).padStart(2,'0')}</span><small>m</small></div>
            <div className="luc-cd-unit"><span>{String(cd.seconds).padStart(2,'0')}</span><small>s</small></div>
          </div>
        )}

        {status === 'live' && (
          <p className="luc-live-msg">
            <i className="fas fa-circle text-danger me-1" style={{ fontSize: '0.6rem' }} />
            Live session is in progress
          </p>
        )}

        {/* CTA */}
        {status === 'live' ? (
          <button className="btn luc-join-btn" onClick={handleJoin}>
            <i className="fas fa-video me-1" />
            {user ? 'Join Live Now' : 'Login to Join'}
          </button>
        ) : (
          <button className="btn luc-more-btn" onClick={() => navigate('/live')}>
            <i className="fas fa-info-circle me-1" />View Details
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function LatestUpdates() {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [allFailed, setAllFailed] = useState(false);
  const [liveSession, setLive]    = useState(null);
  const [retryKey, setRetryKey]   = useState(0);
  const trackRef = useRef(null);

  const fetchLive = useCallback(async () => {
    try {
      const r = await getLiveStatus();
      const s = r.data.data;
      // Only pin in Latest Updates if displayInUpdates is true and not ended/cancelled
      if (s && s.displayInUpdates !== false && s.status !== 'ended' && s.status !== 'cancelled') {
        setLive(s);
      } else {
        setLive(null);
      }
    } catch { setLive(null); }
  }, []);

  useEffect(() => {
    setLoading(true);
    setAllFailed(false);
    Promise.allSettled([
      getYouTubeVideos(),
      getFacebookPosts(),
      getMagazines(),
      getDrafts(),
      getBooks(),
    ])
      .then(results => {
        const built = buildItems(results);
        setItems(built);
        if (built.length === 0 && results.every(r => r.status === 'rejected')) {
          setAllFailed(true);
        }
      })
      .finally(() => setLoading(false));

    fetchLive();
  }, [retryKey, fetchLive]);

  // Poll live status every 60s
  useEffect(() => {
    const id = setInterval(fetchLive, 60000);
    return () => clearInterval(id);
  }, [fetchLive]);

  const scroll = dir => trackRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });

  if (!loading && items.length === 0 && !allFailed && !liveSession) return null;

  if (!loading && allFailed && !liveSession) {
    return (
      <section id="latest-updates" className="section-padding bg-light">
        <div className="container-fluid px-3 px-md-4">
          <div className="latest-header mb-4" data-aos="fade-right">
            <span className="latest-badge">LATEST</span>
            <h2 className="section-title d-inline ms-3 mb-0">
              Latest <span className="text-gold">Updates</span>
            </h2>
          </div>
          <div className="text-center py-4">
            <p className="text-muted mb-3">Could not load latest updates — the server may still be starting up.</p>
            <button className="btn btn-gold btn-sm" onClick={() => setRetryKey(k => k + 1)}>
              <i className="fas fa-redo me-2"></i>Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

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
            {/* Pinned Live Session card — always first */}
            {liveSession && <LiveSessionCard key={liveSession._id} session={liveSession} />}

            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div className="skeleton-latest-card" key={i}>
                    <div className="skeleton-shimmer skeleton-latest-img" />
                    <div className="skeleton-shimmer skeleton-latest-line" style={{ width: '85%' }} />
                    <div className="skeleton-shimmer skeleton-latest-line" style={{ width: '60%' }} />
                    <div className="skeleton-shimmer skeleton-latest-btn" />
                  </div>
                ))
              : items.map((item, i) => {
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
