import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLiveStatus, getUpcomingSessions } from '../api';
import { useUserAuth } from '../context/UserAuthContext';

const PLATFORM_ICONS = {
  'Google Meet':      'fab fa-google',
  'Zoom':             'fas fa-video',
  'Microsoft Teams':  'fab fa-microsoft',
  'YouTube Live':     'fab fa-youtube',
  'Webex':            'fas fa-video',
  'Other':            'fas fa-video',
};

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
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [retryKey, setRetryKey] = useState(0);
  const trackRef = useRef(null);

  const loadSessions = useCallback(async () => {
    try {
      const [currResult, upcResult] = await Promise.allSettled([
        getLiveStatus(),
        getUpcomingSessions(),
      ]);

      const seen = new Set();
      const all  = [];

      // Current / actively live session goes first
      if (currResult.status === 'fulfilled') {
        const s = currResult.value?.data?.data;
        if (s && s.displayInUpdates !== false && s.status !== 'ended' && s.status !== 'cancelled') {
          seen.add(s._id);
          all.push(s);
        }
      }

      // All upcoming sessions (dedup against current)
      if (upcResult.status === 'fulfilled') {
        const list = upcResult.value?.data?.data || [];
        list.forEach(s => {
          if (!seen.has(s._id) && s.displayInUpdates !== false) {
            seen.add(s._id);
            all.push(s);
          }
        });
      }

      setSessions(all);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadSessions();
  }, [retryKey, loadSessions]);

  // Refresh live status every 60 s
  useEffect(() => {
    const id = setInterval(loadSessions, 60000);
    return () => clearInterval(id);
  }, [loadSessions]);

  // After render, reset scroll so first card is always visible
  useEffect(() => {
    if (!loading && trackRef.current) trackRef.current.scrollLeft = 0;
  }, [loading]);

  const scroll = dir => trackRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });

  /* ── Empty state ── */
  if (!loading && sessions.length === 0) {
    return (
      <section id="latest-updates" className="section-padding bg-light">
        <div className="container-fluid px-3 px-md-4">
          <div className="latest-header mb-4" data-aos="fade-right">
            <span className="latest-badge">LIVE</span>
            <h2 className="section-title d-inline ms-3 mb-0">
              Live <span className="text-gold">Sessions</span>
            </h2>
          </div>
          <div className="text-center py-5">
            <div style={{ fontSize: '3rem', opacity: 0.18, marginBottom: 16 }}>
              <i className="fas fa-broadcast-tower" />
            </div>
            <h5 style={{ color: '#555', marginBottom: 8 }}>No Live Sessions Available Currently</h5>
            <p className="text-muted mb-3">Please check back later for upcoming live sessions.</p>
            <button className="btn btn-gold btn-sm" onClick={() => setRetryKey(k => k + 1)}>
              <i className="fas fa-sync-alt me-2" />Refresh
            </button>
          </div>
        </div>
      </section>
    );
  }

  /* ── Carousel ── */
  return (
    <section id="latest-updates" className="section-padding bg-light">
      <div className="container-fluid px-3 px-md-4">
        <div className="latest-header mb-4" data-aos="fade-right">
          <span className="latest-badge">LIVE</span>
          <h2 className="section-title d-inline ms-3 mb-0">
            Live <span className="text-gold">Sessions</span>
          </h2>
          <p className="section-subtitle mt-2 ms-1 mb-0">
            Upcoming and active live legal sessions
          </p>
        </div>

        <div className="latest-slider-outer">
          <button className="slider-scroll-btn" onClick={() => scroll(-1)} aria-label="Scroll left">&#8249;</button>
          <div className="latest-scroll" ref={trackRef}>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div className="skeleton-latest-card" key={i}>
                    <div className="skeleton-shimmer skeleton-latest-img" />
                    <div className="skeleton-shimmer skeleton-latest-line" style={{ width: '85%' }} />
                    <div className="skeleton-shimmer skeleton-latest-line" style={{ width: '60%' }} />
                    <div className="skeleton-shimmer skeleton-latest-btn" />
                  </div>
                ))
              : sessions.map(session => (
                  <LiveSessionCard key={session._id} session={session} />
                ))
            }
          </div>
          <button className="slider-scroll-btn" onClick={() => scroll(1)} aria-label="Scroll right">&#8250;</button>
        </div>
      </div>
    </section>
  );
}
