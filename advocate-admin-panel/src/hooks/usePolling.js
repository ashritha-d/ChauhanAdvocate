import { useEffect, useRef } from 'react';

// Calls fn() on a fixed interval AND whenever the user switches back to this tab.
// Uses a ref so the interval never restarts when fn closes over changing state.
export default function usePolling(fn, ms = 30000) {
  const cb = useRef(fn);
  useEffect(() => { cb.current = fn; });
  useEffect(() => {
    const tick = () => cb.current();
    const onVisible = () => { if (!document.hidden) tick(); };
    const id = setInterval(tick, ms);
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [ms]);
}
