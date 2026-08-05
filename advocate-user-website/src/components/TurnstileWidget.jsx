import { useEffect, useRef, useState } from 'react';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

const CB_NAME = '__onTurnstileLoad';

export default function TurnstileWidget({ onVerify, onExpire }) {
  const containerRef = useRef(null);
  const widgetIdRef  = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | verified | expired | error | script-error
  // Bumping this forces the render effect to run again on manual retry.
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    function renderWidget() {
      if (cancelled || !containerRef.current || widgetIdRef.current !== null) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        theme: 'light',
        callback: token => {
          setStatus('verified');
          onVerify?.(token);
        },
        'expired-callback': () => {
          // The widget itself is still valid here — just needs a fresh token.
          // Don't null the ref or remove it; reset() re-uses the same instance.
          setStatus('expired');
          onExpire?.();
        },
        'error-callback': () => {
          // The widget may be in a broken state — tear it down cleanly so a
          // retry re-renders fresh rather than piling up orphaned instances.
          if (widgetIdRef.current !== null) {
            try { window.turnstile.remove(widgetIdRef.current); } catch { /* ignore */ }
            widgetIdRef.current = null;
          }
          setStatus('error');
          onExpire?.();
        },
      });
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      // Queue this widget's render for when the API loads
      window.__turnstileQueue = window.__turnstileQueue || [];
      window.__turnstileQueue.push(renderWidget);

      if (!document.getElementById('cf-turnstile-script')) {
        // Use Cloudflare's own onload callback — more reliable than script.onload
        window[CB_NAME] = () => {
          const q = window.__turnstileQueue || [];
          window.__turnstileQueue = [];
          q.forEach(fn => fn());
        };

        const s = document.createElement('script');
        s.id  = 'cf-turnstile-script';
        s.src = `https://challenges.cloudflare.com/turnstile/v0/api.js?onload=${CB_NAME}&render=explicit`;
        s.async = true;
        // Mobile networks/ad-blockers/DNS issues can block this script outright —
        // without this, the widget silently sits in "loading" forever.
        s.onerror = () => {
          if (!cancelled) setStatus('script-error');
          document.getElementById('cf-turnstile-script')?.remove();
        };
        document.head.appendChild(s);
      }
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch { /* ignore */ }
        widgetIdRef.current = null;
      }
    };
  }, [retryTick]);

  if (!SITE_KEY) return null;

  const handleRetry = () => {
    if (status === 'expired' && widgetIdRef.current !== null && window.turnstile) {
      // Same widget, fresh challenge — no need to tear anything down.
      window.turnstile.reset(widgetIdRef.current);
      setStatus('loading');
      return;
    }
    // 'error' (widget already removed above) or 'script-error' (script never
    // loaded) — force the render effect to run again from scratch.
    setStatus('loading');
    setRetryTick(t => t + 1);
  };

  return (
    <div style={{ margin: '12px 0' }}>
      {/* Cloudflare renders the checkbox widget here */}
      <div ref={containerRef} />
      {status === 'verified' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#15803d', marginTop: 4 }}>
          <i className="fas fa-shield-check"></i>
          Security check passed
        </div>
      )}
      {(status === 'error' || status === 'script-error' || status === 'expired') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', marginTop: 4, flexWrap: 'wrap' }}>
          <span style={{ color: status === 'expired' ? '#d97706' : '#dc2626' }}>
            <i className={`fas ${status === 'expired' ? 'fa-clock' : 'fa-exclamation-circle'} me-1`}></i>
            {status === 'expired' && 'Security check expired — please verify again'}
            {status === 'error' && 'Security check failed — please try again'}
            {status === 'script-error' && 'Could not load the security check — check your connection and try again'}
          </span>
          <button
            type="button"
            onClick={handleRetry}
            className="btn btn-sm btn-outline-secondary py-0 px-2"
            style={{ fontSize: '0.75rem' }}
          >
            <i className="fas fa-rotate-right me-1"></i>Retry
          </button>
        </div>
      )}
    </div>
  );
}
