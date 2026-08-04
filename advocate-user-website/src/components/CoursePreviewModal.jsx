import { useState, useEffect, useRef, useCallback } from 'react';
import { getPublicCourse } from '../api';
import { useUserAuth } from '../context/UserAuthContext';
import { resolveVideoSrc } from '../utils/videoStream';

const PREVIEW_SECONDS = 60;

function getVideoType(url) {
  if (!url) return null;
  if (/(?:youtube\.com|youtu\.be)/.test(url)) return 'youtube';
  if (/drive\.google\.com/.test(url)) return 'drive';
  return 'mp4';
}

function getYouTubeId(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return m?.[1] ?? null;
}

function getDriveId(url) {
  const m = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  return m?.[1] ?? null;
}

// ── YouTube preview via IFrame API ─────────────────────────────────────────────
function YouTubePreview({ videoId, onTimeUpdate, onLock }) {
  const playerRef = useRef(null);
  const containerIdRef = useRef(`yt-prev-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const pollRef = useRef(null);
  const lockedRef = useRef(false);
  const mountedRef = useRef(true);

  const stopPolling = useCallback(() => {
    clearInterval(pollRef.current);
    pollRef.current = null;
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current || lockedRef.current) return;
    pollRef.current = setInterval(() => {
      if (!playerRef.current || lockedRef.current || !mountedRef.current) return;
      try {
        const t = playerRef.current.getCurrentTime();
        onTimeUpdate(Math.floor(t));
        if (t >= PREVIEW_SECONDS) {
          lockedRef.current = true;
          stopPolling();
          playerRef.current.pauseVideo();
          playerRef.current.seekTo(PREVIEW_SECONDS - 1, true);
          onLock();
        }
      } catch {}
    }, 300);
  }, [onTimeUpdate, onLock, stopPolling]);

  useEffect(() => {
    mountedRef.current = true;

    const createPlayer = () => {
      if (!mountedRef.current || !window.YT?.Player || playerRef.current) return;
      playerRef.current = new window.YT.Player(containerIdRef.current, {
        videoId,
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1 },
        events: {
          onStateChange: ({ data }) => {
            if (data === 1) startPolling();
            else stopPolling();
          },
        },
      });
    };

    if (window.YT?.Player) {
      createPlayer();
    } else {
      const prevCb = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prevCb?.();
        createPlayer();
      };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const s = document.createElement('script');
        s.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(s);
      }
    }

    return () => {
      mountedRef.current = false;
      stopPolling();
      try { playerRef.current?.destroy(); } catch {}
      playerRef.current = null;
    };
  }, [videoId, startPolling, stopPolling]);

  return <div id={containerIdRef.current} style={{ width: '100%', height: '100%' }} />;
}

// ── MP4 / uploaded video preview ──────────────────────────────────────────────
function Mp4Preview({ src, onTimeUpdate, onLock }) {
  const videoRef = useRef(null);
  const lockedRef = useRef(false);

  const handleTimeUpdate = () => {
    if (!videoRef.current || lockedRef.current) return;
    const t = videoRef.current.currentTime;
    onTimeUpdate(Math.floor(t));
    if (t >= PREVIEW_SECONDS) {
      lockedRef.current = true;
      videoRef.current.pause();
      videoRef.current.currentTime = PREVIEW_SECONDS - 0.1;
      onLock();
    }
  };

  const handleSeeking = () => {
    if (!videoRef.current || lockedRef.current) return;
    if (videoRef.current.currentTime >= PREVIEW_SECONDS) {
      videoRef.current.currentTime = PREVIEW_SECONDS - 0.1;
    }
  };

  return (
    <video
      ref={videoRef}
      src={src}
      controls
      controlsList="nodownload"
      disablePictureInPicture
      onContextMenu={e => e.preventDefault()}
      autoPlay
      style={{ width: '100%', height: '100%', background: '#000', display: 'block' }}
      onTimeUpdate={handleTimeUpdate}
      onSeeking={handleSeeking}
    />
  );
}

// ── Google Drive iframe — wall-clock timer overlay ─────────────────────────────
function DrivePreview({ driveId, onTimeUpdate, onLock }) {
  const startRef = useRef(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      onTimeUpdate(elapsed);
      if (elapsed >= PREVIEW_SECONDS) {
        clearInterval(timerRef.current);
        onLock();
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [onTimeUpdate, onLock]);

  return (
    <iframe
      src={`https://drive.google.com/file/d/${driveId}/preview`}
      title="Course Preview"
      allowFullScreen
      allow="autoplay; encrypted-media"
      style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
    />
  );
}

// ── Main modal component ───────────────────────────────────────────────────────
export default function CoursePreviewModal({ course, onClose, onPayNow }) {
  const { user, authHeader } = useUserAuth();
  const [loading, setLoading] = useState(true);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [effectiveUrl, setEffectiveUrl] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const headers = user ? authHeader() : {};
    getPublicCourse(course._id, headers)
      .then(async r => {
        if (!r.data.success) return;
        setIsPaid(!!r.data.enrolled);
        const modules = r.data.data.modules || [];
        let first = null;
        for (const mod of modules) {
          for (const vid of mod.videos || []) {
            if (vid.videoUrl || vid.hasUpload) { first = vid; break; }
          }
          if (first) break;
        }
        setPreviewVideo(first);
        if (first) {
          // The raw Cloudinary URL never reaches this component — an uploaded
          // video resolves to a short-lived streaming token instead. Awaited here
          // (rather than left to resolve after loading flips false) so the modal
          // doesn't flash "no preview available" for a moment first.
          try { setEffectiveUrl(await resolveVideoSrc(first, course._id, headers)); }
          catch { setEffectiveUrl(null); }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [course._id]);

  const handleTimeUpdate = useCallback((t) => setElapsed(t), []);
  const handleLock = useCallback(() => setLocked(true), []);

  const remaining = Math.max(0, PREVIEW_SECONDS - elapsed);
  const videoType = getVideoType(effectiveUrl);

  const renderVideo = () => {
    if (!previewVideo || !effectiveUrl) return null;

    if (isPaid) {
      // Full access — no lock
      if (videoType === 'youtube') {
        const ytId = getYouTubeId(effectiveUrl);
        return (
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?rel=0&autoplay=1`}
            title={previewVideo.title}
            allowFullScreen
            allow="autoplay; encrypted-media"
            style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
          />
        );
      }
      if (videoType === 'drive') {
        return (
          <iframe
            src={`https://drive.google.com/file/d/${getDriveId(effectiveUrl)}/preview`}
            title={previewVideo.title}
            allowFullScreen
            allow="autoplay"
            style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
          />
        );
      }
      // MP4 or uploaded video
      return (
        <video
          controls
          controlsList="nodownload"
          disablePictureInPicture
          onContextMenu={e => e.preventDefault()}
          autoPlay
          src={effectiveUrl}
          style={{ width: '100%', height: '100%', background: '#000', display: 'block' }}
        />
      );
    }

    // Preview mode — 60-second restriction
    if (videoType === 'youtube') {
      return (
        <YouTubePreview
          videoId={getYouTubeId(effectiveUrl)}
          onTimeUpdate={handleTimeUpdate}
          onLock={handleLock}
        />
      );
    }
    if (videoType === 'drive') {
      return (
        <DrivePreview
          driveId={getDriveId(effectiveUrl)}
          onTimeUpdate={handleTimeUpdate}
          onLock={handleLock}
        />
      );
    }
    // MP4 or uploaded video
    return (
      <Mp4Preview
        src={effectiveUrl}
        onTimeUpdate={handleTimeUpdate}
        onLock={handleLock}
      />
    );
  };

  return (
    <div className="preview-modal-backdrop" onClick={onClose}>
      <div className="preview-modal-container" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="preview-modal-header">
          <span className="preview-modal-title">
            <i className="fas fa-play-circle me-2" style={{ color: 'var(--gold)' }}></i>
            {course.title}
          </span>
          <button className="preview-modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        {/* Player */}
        <div className="preview-modal-player">
          {loading ? (
            <div className="d-flex align-items-center justify-content-center" style={{ width: '100%', height: '100%', background: '#111' }}>
              <div className="spinner-border text-warning"></div>
            </div>
          ) : !previewVideo || !effectiveUrl ? (
            <div className="d-flex align-items-center justify-content-center flex-column gap-3"
              style={{ width: '100%', height: '100%', background: '#111', color: '#aaa', padding: 24 }}>
              <i className="fas fa-video-slash fa-3x" style={{ opacity: 0.35 }}></i>
              <p className="mb-0 small text-center">
                No preview video available for this course.<br />
                Enroll to access the full content.
              </p>
              <button className="btn btn-gold btn-sm px-4" onClick={onPayNow}>
                <i className="fas fa-graduation-cap me-2"></i>Enroll Now
              </button>
            </div>
          ) : (
            <>
              {renderVideo()}

              {/* Countdown badge */}
              {!isPaid && !locked && (
                <div className="preview-timer-badge">
                  <i className="fas fa-eye me-1"></i>
                  Preview — {remaining}s left
                </div>
              )}

              {/* Lock overlay */}
              {locked && !isPaid && (
                <div className="preview-lock-overlay">
                  <div className="preview-lock-modal">
                    <div className="preview-lock-icon">
                      <i className="fas fa-lock"></i>
                    </div>
                    <h5 className="preview-lock-title">Unlock Full Course</h5>
                    <p className="preview-lock-msg">
                      Your free preview has ended. Complete payment to continue watching the full course.
                    </p>
                    <div className="preview-lock-actions">
                      <button className="btn btn-gold px-4 py-2" onClick={onPayNow}>
                        <i className="fas fa-credit-card me-2"></i>Pay Now
                      </button>
                      <button className="btn btn-outline-secondary px-4 py-2" onClick={onClose}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="preview-modal-footer">
          <div className="preview-video-title">
            {previewVideo?.title || course.title}
          </div>
          {!isPaid ? (
            <div className="preview-video-meta">
              <i className="fas fa-clock me-1 text-warning"></i>
              Free 1-minute preview
            </div>
          ) : (
            <div className="preview-video-meta" style={{ color: '#16a34a' }}>
              <i className="fas fa-check-circle me-1"></i>
              Full access
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
