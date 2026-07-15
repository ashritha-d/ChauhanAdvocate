import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLiveStatus, getUpcomingSessions, getPastSessions, getLiveJoinUrl } from '../api';
import { useUserAuth } from '../context/UserAuthContext';

/* ── Helpers ── */
const PLATFORM_ICONS = {
  'Google Meet':     'fab fa-google',
  'Zoom':            'fas fa-video',
  'Microsoft Teams': 'fab fa-microsoft',
  'YouTube Live':    'fab fa-youtube',
  'Webex':           'fas fa-video',
  'Other':           'fas fa-video',
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

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '';
const fmtShortDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
const fmtAnn  = d => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

/* ── Main Page ── */
export default function Live() {
  const { user } = useUserAuth();
  const navigate  = useNavigate();
  const [now, setNow]           = useState(() => new Date());
  const [session, setSession]   = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast]         = useState([]);
  const [loading, setLoading]   = useState(true);

  // Tick every second for countdown + auto-status
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [curr, upc, pst] = await Promise.all([
        getLiveStatus(), getUpcomingSessions(), getPastSessions(),
      ]);
      setSession(curr.data.data);
      setUpcoming(upc.data.data || []);
      setPast(pst.data.data || []);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const id = setInterval(fetchData, 30000); return () => clearInterval(id); }, [fetchData]);

  // SEC-02: meetUrl is now fetched from an authenticated endpoint — never exposed publicly
  const handleJoin = async () => {
    if (!user) { navigate('/login', { state: { from: '/live' } }); return; }
    if (!session?._id) return;
    try {
      const token = localStorage.getItem('userToken');
      const res = await getLiveJoinUrl(session._id, token ? { Authorization: `Bearer ${token}` } : {});
      const url = res.data?.meetUrl;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } catch { /* session ended or no URL — no-op */ }
  };

  const effectiveStatus = getEffectiveStatus(session, now);
  const cd = effectiveStatus === 'upcoming' ? getCountdown(session, now) : null;
  const otherUpcoming = upcoming.filter(s => s._id !== session?._id);
  const platformIcon  = PLATFORM_ICONS[session?.platform] || 'fas fa-video';

  /* ── Loading ── */
  if (loading) return (
    <div className="live-page d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
      <div className="text-center">
        <div className="spinner-border text-warning mb-3" style={{ width: 40, height: 40 }} />
        <p className="text-muted mb-0">Loading session info…</p>
      </div>
    </div>
  );

  return (
    <div className="live-page">

      {/* ═══════════════════ Current / Active Session ═══════════════════ */}
      {session ? (
        <section className="live-hero-section">
          <div className="container py-5">

            {/* Status Badge */}
            <div className="text-center mb-4">
              {effectiveStatus === 'live' && (
                <span className="live-status-badge live-status-live">
                  <span className="live-pulse-dot" />🔴 LIVE NOW
                </span>
              )}
              {effectiveStatus === 'upcoming' && (
                <span className="live-status-badge live-status-upcoming">
                  <i className="fas fa-calendar-alt me-1" />UPCOMING
                </span>
              )}
              {effectiveStatus === 'ended' && (
                <span className="live-status-badge live-status-ended">
                  <i className="fas fa-check-circle me-1" />Session Ended
                </span>
              )}
              {effectiveStatus === 'cancelled' && (
                <span className="live-status-badge live-status-ended">
                  <i className="fas fa-times-circle me-1" />Cancelled
                </span>
              )}
            </div>

            {/* Banner */}
            {session.banner && (
              <div className="text-center mb-4">
                <img src={session.banner} alt={session.title} className="live-banner-img" />
              </div>
            )}

            {/* Title + Description */}
            <h1 className="live-page-title text-center">{session.title}</h1>
            {session.description && <p className="live-page-desc text-center">{session.description}</p>}

            {/* Meta row */}
            <div className="live-meta-row">
              {session.speaker && (
                <span className="live-meta-item"><i className="fas fa-user-tie" />{session.speaker}</span>
              )}
              <span className="live-meta-item"><i className="fas fa-calendar" />{fmtDate(session.date)}</span>
              {session.startTime && (
                <span className="live-meta-item">
                  <i className="fas fa-clock" />
                  {session.startTime}{session.endTime ? ` – ${session.endTime}` : ''}
                  {session.timezone ? ` (${session.timezone})` : ''}
                </span>
              )}
              <span className="live-meta-item">
                <i className={platformIcon} />{session.platform || 'Online'}
              </span>
            </div>

            {/* Countdown */}
            {effectiveStatus === 'upcoming' && cd && (
              <div className="live-countdown-wrap">
                <p className="live-cd-label">⏳ Session starts in</p>
                <div className="live-cd-row">
                  {cd.days > 0 && (
                    <div className="live-cd-unit">
                      <div className="live-cd-num">{cd.days}</div>
                      <div className="live-cd-text">Days</div>
                    </div>
                  )}
                  <div className="live-cd-unit">
                    <div className="live-cd-num">{String(cd.hours).padStart(2,'0')}</div>
                    <div className="live-cd-text">Hours</div>
                  </div>
                  <div className="live-cd-unit">
                    <div className="live-cd-num">{String(cd.minutes).padStart(2,'0')}</div>
                    <div className="live-cd-text">Min</div>
                  </div>
                  <div className="live-cd-unit">
                    <div className="live-cd-num">{String(cd.seconds).padStart(2,'0')}</div>
                    <div className="live-cd-text">Sec</div>
                  </div>
                </div>
              </div>
            )}

            {/* Live in progress message */}
            {effectiveStatus === 'live' && (
              <p className="text-center mt-3" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem' }}>
                <i className="fas fa-circle text-danger me-1" style={{ fontSize: '0.55rem', verticalAlign: 'middle' }} />
                Live session is in progress
              </p>
            )}

            {/* CTA Buttons */}
            <div className="text-center mt-4">
              {effectiveStatus === 'live' && (
                <button className="btn live-join-btn" onClick={handleJoin}>
                  <i className={`${platformIcon} me-2`} />
                  {user ? `Join on ${session.platform || 'Google Meet'}` : 'Login to Join Live'}
                </button>
              )}
              {effectiveStatus === 'upcoming' && !user && (
                <button className="btn live-login-btn" onClick={() => navigate('/login', { state: { from: '/live' } })}>
                  <i className="fas fa-sign-in-alt me-2" />Login to get session updates
                </button>
              )}
              {effectiveStatus === 'ended' && (
                <p className="text-center" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: 8 }}>
                  This session has ended. See upcoming sessions below.
                </p>
              )}
            </div>

            {/* Agenda */}
            {session.agenda && (
              <div className="live-agenda-box mt-5">
                <h5><i className="fas fa-list-ul me-2" />Session Agenda</h5>
                <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{session.agenda}</p>
              </div>
            )}

            {/* Announcements */}
            {session.announcements?.length > 0 && (
              <div className="live-ann-box mt-4">
                <h5><i className="fas fa-bullhorn me-2" />Latest Announcements</h5>
                <ul className="live-ann-list">
                  {[...session.announcements].reverse().map(a => (
                    <li key={a._id} className="live-ann-item">
                      <span className="live-ann-text">{a.text}</span>
                      <span className="live-ann-time">{fmtAnn(a.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        </section>

      ) : (
        /* ══════════════ No active session ══════════════ */
        <section className="live-offline-section">
          <div className="container py-5 text-center">
            <div className="live-offline-icon"><i className="fas fa-broadcast-tower" /></div>
            <h2 className="mt-3 mb-2">No Upcoming Live Sessions</h2>
            <p className="text-muted">No live or upcoming session right now. Check the schedule below or come back soon.</p>
          </div>
        </section>
      )}

      {/* ═══════════════════ Upcoming Sessions ═══════════════════ */}
      {otherUpcoming.length > 0 && (
        <section className="live-upcoming-section py-5">
          <div className="container">
            <h3 className="live-section-title">
              <i className="fas fa-calendar-alt me-2" />Upcoming Sessions
            </h3>
            <div className="live-upcoming-grid">
              {otherUpcoming.map(s => {
                const icon = PLATFORM_ICONS[s.platform] || 'fas fa-video';
                const ucd  = getCountdown(s, now);
                return (
                  <div key={s._id} className="live-upcoming-card">
                    <div className="live-upcoming-date">{fmtDate(s.date)}</div>
                    <div className="live-upcoming-title">{s.title}</div>
                    {s.speaker   && <div className="live-upcoming-meta"><i className="fas fa-user-tie me-1" />{s.speaker}</div>}
                    {s.startTime && <div className="live-upcoming-meta"><i className="fas fa-clock me-1" />{s.startTime}{s.endTime ? ` – ${s.endTime}` : ''}{s.timezone ? ` (${s.timezone})` : ''}</div>}
                    <div className="live-upcoming-meta"><i className={`${icon} me-1`} />{s.platform || 'Online'}</div>
                    {s.description && <div className="live-upcoming-desc">{s.description}</div>}
                    {ucd && (
                      <div className="live-upc-cd">
                        <i className="fas fa-hourglass-half me-1" />
                        {ucd.days > 0 ? `${ucd.days}d ` : ''}{String(ucd.hours).padStart(2,'0')}:{String(ucd.minutes).padStart(2,'0')}:{String(ucd.seconds).padStart(2,'0')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════ Past Sessions ═══════════════════ */}
      {past.length > 0 && (
        <section className="live-past-section py-5">
          <div className="container">
            <h3 className="live-section-title live-section-title--dark">
              <i className="fas fa-history me-2" />Past Sessions
            </h3>
            <div className="live-past-grid">
              {past.map(s => (
                <div key={s._id} className="live-past-card">
                  {s.banner && <img src={s.banner} alt={s.title} className="live-past-img" />}
                  <div className="live-past-body">
                    <span className={`live-past-badge ${s.status === 'cancelled' ? 'live-past-badge--cancelled' : ''}`}>
                      {s.status === 'cancelled' ? 'Cancelled' : 'Completed'}
                    </span>
                    <div className="live-past-title">{s.title}</div>
                    <div className="live-past-meta">
                      <i className="fas fa-calendar me-1" />{fmtShortDate(s.date)}
                      {s.platform && <><i className="fas fa-circle mx-2" style={{ fontSize: '0.25rem', verticalAlign: 'middle', opacity: 0.4 }} />{s.platform}</>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
