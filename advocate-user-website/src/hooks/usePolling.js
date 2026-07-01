import { useEffect, useRef } from 'react';

export default function usePolling(fn, ms = 60000) {
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
