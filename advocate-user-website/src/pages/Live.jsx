import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLiveStatus, getUpcomingSessions } from '../api';
import { useUserAuth } from '../context/UserAuthContext';

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function getCountdown(date, startTime, now) {
  const target = new Date(date);
  if (startTime) {
    const [h, m] = startTime.split(':').map(Number);
    target.setHours(h, m, 0, 0);
  }
  const diff = target - now;
  if (diff <= 0) return null;
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

const fmtDate = d => d
  ? new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  : '';

const fmtAnn = d => d
  ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  : '';

export default function Live() {
  const { user } = useUserAuth();
  const navigate = useNavigate();
  const now = useNow();
  const [session, setSession]   = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [curr, upc] = await Promise.all([getLiveStatus(), getUpcomingSessions()]);
      setSession(curr.data.data);
      setUpcoming(upc.data.data || []);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, [fetchData]);

  const handleJoin = () => {
    if (!user) {
      navigate('/login', { state: { from: '/live' } });
      return;
    }
    if (session?.meetUrl) window.open(session.meetUrl, '_blank', 'noopener,noreferrer');
  };

  const cd = session?.status === 'upcoming' ? getCountdown(session.date, session.startTime, now) : null;
  const otherUpcoming = upcoming.filter(s => s._id !== session?._id);

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

      {/* ── Current Session ── */}
      {session ? (
        <section className="live-hero-section">
          <div className="container py-5">

            {/* Status Badge */}
            <div className="text-center mb-4">
              <span className={`live-status-badge live-status-${session.status}`}>
                {session.status === 'live' && <span className="live-pulse-dot" />}
                {session.status === 'live' ? 'LIVE NOW' : session.status === 'upcoming' ? 'UPCOMING' : 'ENDED'}
              </span>
            </div>

            {/* Banner */}
            {session.banner && (
              <div className="text-center mb-4">
                <img src={session.banner} alt={session.title} className="live-banner-img" />
              </div>
            )}

            {/* Title + Description */}
            <h1 className="live-page-title text-center">{session.title}</h1>
            {session.description && (
              <p className="live-page-desc text-center">{session.description}</p>
            )}

            {/* Meta row */}
            <div className="live-meta-row">
              {session.speaker && (
                <span className="live-meta-item">
                  <i className="fas fa-user-tie" />{session.speaker}
                </span>
              )}
              <span className="live-meta-item">
                <i className="fas fa-calendar" />{fmtDate(session.date)}
              </span>
              {session.startTime && (
                <span className="live-meta-item">
                  <i className="fas fa-clock" />
                  {session.startTime}{session.endTime ? ` – ${session.endTime}` : ''}
                </span>
              )}
            </div>

            {/* Countdown */}
            {cd && (
              <div className="live-countdown-wrap">
                <p className="live-cd-label">Session starts in</p>
                <div className="live-cd-row">
                  {cd.days > 0 && (
                    <div className="live-cd-unit">
                      <div className="live-cd-num">{cd.days}</div>
                      <div className="live-cd-text">Days</div>
                    </div>
                  )}
                  <div className="live-cd-unit">
                    <div className="live-cd-num">{String(cd.hours).padStart(2, '0')}</div>
                    <div className="live-cd-text">Hours</div>
                  </div>
                  <div className="live-cd-unit">
                    <div className="live-cd-num">{String(cd.minutes).padStart(2, '0')}</div>
                    <div className="live-cd-text">Min</div>
                  </div>
                  <div className="live-cd-unit">
                    <div className="live-cd-num">{String(cd.seconds).padStart(2, '0')}</div>
                    <div className="live-cd-text">Sec</div>
                  </div>
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="text-center mt-4">
              {session.status === 'live' && (
                <button className="btn live-join-btn" onClick={handleJoin}>
                  <i className="fas fa-video me-2" />
                  {user ? 'Join Session on Google Meet' : 'Login to Join'}
                </button>
              )}
              {session.status === 'upcoming' && !user && (
                <button
                  className="btn live-login-btn"
                  onClick={() => navigate('/login', { state: { from: '/live' } })}
                >
                  <i className="fas fa-sign-in-alt me-2" />Login for session updates
                </button>
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
        <section className="live-offline-section">
          <div className="container py-5 text-center">
            <div className="live-offline-icon"><i className="fas fa-video-slash" /></div>
            <h2 className="mt-3 mb-2">No Active Session</h2>
            <p className="text-muted">
              There is no live or upcoming session right now. Check back soon.
            </p>
          </div>
        </section>
      )}

      {/* ── Upcoming Sessions List ── */}
      {otherUpcoming.length > 0 && (
        <section className="live-upcoming-section py-5">
          <div className="container">
            <h3 className="live-section-title">
              <i className="fas fa-calendar-alt me-2" />Upcoming Sessions
            </h3>
            <div className="live-upcoming-grid">
              {otherUpcoming.map(s => (
                <div key={s._id} className="live-upcoming-card">
                  <div className="live-upcoming-date">{fmtDate(s.date)}</div>
                  <div className="live-upcoming-title">{s.title}</div>
                  {s.speaker && (
                    <div className="live-upcoming-meta">
                      <i className="fas fa-user-tie me-1" />{s.speaker}
                    </div>
                  )}
                  {s.startTime && (
                    <div className="live-upcoming-meta">
                      <i className="fas fa-clock me-1" />
                      {s.startTime}{s.endTime ? ` – ${s.endTime}` : ''}
                    </div>
                  )}
                  {s.description && (
                    <div className="live-upcoming-desc">{s.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
