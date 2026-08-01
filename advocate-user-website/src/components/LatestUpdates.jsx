import { useEffect, useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLiveStatus, getUpcomingSessions } from '../api';
import { useUserAuth } from '../context/UserAuthContext';
import CardCarousel from './CardCarousel';

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
  // UX-02: Admin-set 'live' status always wins — do not override with client clock
  if (s.status === 'live')      return 'live';
  // For 'upcoming' sessions, use time window as a secondary signal only
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

/* ── Skeleton that exactly mirrors LiveSessionCard height ── */
function LiveCardSkeleton() {
  return (
    <div className="luc-skeleton-card">
      {/* Header row */}
      <div className="luc-skeleton-header">
        <div className="skeleton-shimmer" style={{ height: 22, width: 90, borderRadius: 20 }} />
        <div className="skeleton-shimmer" style={{ height: 14, width: 70, borderRadius: 4 }} />
      </div>
      {/* Banner */}
      <div className="skeleton-shimmer" style={{ height: 130, width: '100%' }} />
      {/* Body */}
      <div className="luc-skeleton-body">
        <div className="skeleton-shimmer" style={{ height: 18, width: '88%', borderRadius: 4 }} />
        <div className="skeleton-shimmer" style={{ height: 14, width: '60%', borderRadius: 4 }} />
        <div className="skeleton-shimmer" style={{ height: 13, width: '75%', borderRadius: 4 }} />
        <div className="skeleton-shimmer" style={{ height: 13, width: '55%', borderRadius: 4 }} />
        {/* Countdown blocks */}
        <div className="luc-skeleton-countdown">
          {[0,1,2,3].map(j => (
            <div key={j} className="skeleton-shimmer luc-skeleton-cd-unit" />
          ))}
        </div>
        {/* Button */}
        <div className="skeleton-shimmer" style={{ height: 38, width: '100%', borderRadius: 8 }} />
      </div>
    </div>
  );
}

/* ── Live Session Card ── */
const LiveSessionCard = memo(function LiveSessionCard({ session }) {
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
    // SEC-02: Navigate to /live — the Live page fetches meetUrl via the authenticated endpoint
    navigate('/live');
  };

  const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="live-update-card">
      <div className="luc-header">
        {status === 'live' ? (
          <span className="luc-badge luc-badge--live"><span className="luc-blink-dot" />LIVE NOW</span>
        ) : (
          <span className="luc-badge luc-badge--upcoming"><i className="fas fa-calendar-alt me-1" />UPCOMING</span>
        )}
        <span className="luc-platform"><i className={`${icon} me-1`} />{session.platform || 'Online'}</span>
      </div>

      {session.banner ? (
        <div className="luc-banner"><img src={session.banner} alt={session.title} loading="lazy" /></div>
      ) : (
        <div className="luc-banner luc-banner--placeholder"><i className="fas fa-broadcast-tower" /></div>
      )}

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

        {status === 'live' ? (
          <button className="btn luc-join-btn" onClick={handleJoin}>
            <i className="fas fa-video me-1" />{user ? 'Join Live Now' : 'Login to Join'}
          </button>
        ) : (
          <button className="btn luc-more-btn" onClick={() => navigate('/live')}>
            <i className="fas fa-info-circle me-1" />View Details
          </button>
        )}
      </div>
    </div>
  );
});

/* ── Main Component ── */
export default function LatestUpdates() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [retryKey, setRetryKey] = useState(0);

  const loadSessions = useCallback(async () => {
    try {
      const [currResult, upcResult] = await Promise.allSettled([
        getLiveStatus(),
        getUpcomingSessions(),
      ]);

      const seen = new Set();
      const all  = [];

      if (currResult.status === 'fulfilled') {
        const s = currResult.value?.data?.data;
        if (s && s.displayInUpdates !== false && s.status !== 'ended' && s.status !== 'cancelled') {
          seen.add(s._id); all.push(s);
        }
      }
      if (upcResult.status === 'fulfilled') {
        const list = upcResult.value?.data?.data || [];
        list.forEach(s => {
          if (!seen.has(s._id) && s.displayInUpdates !== false) {
            seen.add(s._id); all.push(s);
          }
        });
      }

      setSessions(all);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { setLoading(true); loadSessions(); }, [retryKey, loadSessions]);

  useEffect(() => {
    const id = setInterval(loadSessions, 60000);
    return () => clearInterval(id);
  }, [loadSessions]);

  /* Embedded in the home page's two-column split (HomeSessionsAndCourses) —
     renders only its heading + content, no outer <section>/container of its own. */
  return (
    <>
      <div className="latest-header mb-4" data-aos="fade-right">
        <span className="latest-badge">LIVE</span>
        <h2 className="section-title d-inline ms-3 mb-0">
          Live <span className="text-gold">Sessions</span>
        </h2>
        {!loading && sessions.length > 0 && (
          <p className="section-subtitle mt-2 ms-1 mb-0">
            Upcoming and active live legal sessions
          </p>
        )}
      </div>

      {/* Stable min-height container — prevents layout shift */}
      <div className="luc-content-area">
        {loading ? (
          /* Skeleton mirrors live card structure exactly */
          <CardCarousel ariaLabel="live sessions" loading>
            <LiveCardSkeleton />
            <LiveCardSkeleton />
            <LiveCardSkeleton />
          </CardCarousel>
        ) : sessions.length === 0 ? (
          /* Empty state — same height container */
          <div className="luc-empty-state">
            <div className="luc-empty-icon"><i className="fas fa-broadcast-tower" /></div>
            <h5>No Live Sessions Available Currently</h5>
            <p>Please check back later for upcoming live sessions.</p>
            <button className="btn btn-gold btn-sm mt-1" onClick={() => setRetryKey(k => k + 1)}>
              <i className="fas fa-sync-alt me-2" />Refresh
            </button>
          </div>
        ) : (
          /* Live session cards — horizontal carousel */
          <CardCarousel ariaLabel="live sessions">
            {sessions.map(session => (
              <LiveSessionCard key={session._id} session={session} />
            ))}
          </CardCarousel>
        )}
      </div>
    </>
  );
}
