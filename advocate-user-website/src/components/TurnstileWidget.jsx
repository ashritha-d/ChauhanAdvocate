import { useEffect, useRef, useState } from 'react';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

const CB_NAME = '__onTurnstileLoad';

export default function TurnstileWidget({ onVerify, onExpire }) {
  const containerRef = useRef(null);
  const widgetIdRef  = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | verified | expired | error

  useEffect(() => {
    if (!SITE_KEY) return;

    function renderWidget() {
      if (!containerRef.current || widgetIdRef.current !== null) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        theme: 'light',
        callback: token => {
          setStatus('verified');
          onVerify?.(token);
        },
        'expired-callback': () => {
          setStatus('expired');
          widgetIdRef.current = null;
          onExpire?.();
        },
        'error-callback': () => {
          setStatus('error');
          widgetIdRef.current = null;
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
        document.head.appendChild(s);
      }
    }

    return () => {
      if (widgetIdRef.current !== null && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch { /* ignore */ }
        widgetIdRef.current = null;
      }
    };
  }, []);

  if (!SITE_KEY) return null;

  return (
    <div style={{ margin: '12px 0' }}>
      {/* Cloudflare renders the checkbox widget here */}
      <div ref={containerRef} />
      {/* Status badge — visible when the widget completes non-interactively */}
      {status === 'verified' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#15803d', marginTop: 4 }}>
          <i className="fas fa-shield-check"></i>
          Security check passed
        </div>
      )}
      {status === 'error' && (
        <div style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: 4 }}>
          <i className="fas fa-exclamation-circle me-1"></i>
          Security check failed — please reload the page
        </div>
      )}
      {status === 'expired' && (
        <div style={{ fontSize: '0.8rem', color: '#d97706', marginTop: 4 }}>
          <i className="fas fa-clock me-1"></i>
          Security check expired — please verify again
        </div>
      )}
    </div>
  );
}
