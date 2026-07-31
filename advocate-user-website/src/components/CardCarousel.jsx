import { useRef, useState, useEffect, useCallback } from 'react';

/* Reusable horizontal card carousel — native scroll + CSS scroll-snap for touch/trackpad,
   mouse drag-to-scroll for desktop, and prev/next buttons that scroll by one visible "page".
   Used by both LatestUpdates and CoursesPreview so the two home-page carousels behave identically. */
export default function CardCarousel({ children, ariaLabel = 'cards', loading = false }) {
  const trackRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  // Tolerance covers the few px of scroll-snap rounding browsers apply on initial layout
  const EPS = 10;
  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= EPS);
    setAtEnd(max <= EPS || el.scrollLeft >= max - EPS);
  }, []);

  useEffect(() => {
    updateEdges();
    const el = trackRef.current;
    if (!el) return undefined;
    el.addEventListener('scroll', updateEdges, { passive: true });
    window.addEventListener('resize', updateEdges);
    return () => {
      el.removeEventListener('scroll', updateEdges);
      window.removeEventListener('resize', updateEdges);
    };
  }, [updateEdges, children]);

  const scroll = dir => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' });
  };

  /* Mouse drag-to-scroll — touch devices already get native swipe scrolling.
     Skip drag entirely when starting on an interactive element: setPointerCapture
     re-targets the eventual pointerup/click to the track, which silently swallows
     clicks on buttons/links inside the cards (e.g. "Login to Enroll", "Join"). */
  const onPointerDown = e => {
    if (e.pointerType === 'touch') return;
    if (e.target.closest('button, a, input, textarea, select, [role="button"]')) return;
    const el = trackRef.current;
    drag.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false };
    el.setPointerCapture(e.pointerId);
  };
  const onPointerMove = e => {
    if (!drag.current.active) return;
    e.preventDefault(); // stop native text/image selection while dragging
    const el = trackRef.current;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    el.scrollLeft = drag.current.startScroll - dx;
  };
  const endDrag = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    if (drag.current.moved) {
      // Swallow the click that follows a real drag so cards/buttons don't fire navigation
      const el = trackRef.current;
      const suppress = ev => { ev.stopPropagation(); ev.preventDefault(); };
      el?.addEventListener('click', suppress, { capture: true, once: true });
    }
  };

  return (
    <div className="card-carousel">
      <button
        type="button"
        className="cc-nav-btn cc-nav-btn--prev"
        onClick={() => scroll(-1)}
        disabled={loading || atStart}
        aria-label={`Scroll ${ariaLabel} left`}
        style={loading ? { visibility: 'hidden' } : undefined}
      >
        <i className="fas fa-chevron-left" aria-hidden="true" />
      </button>

      <div
        className="card-carousel-track"
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        {children}
      </div>

      <button
        type="button"
        className="cc-nav-btn cc-nav-btn--next"
        onClick={() => scroll(1)}
        disabled={loading || atEnd}
        aria-label={`Scroll ${ariaLabel} right`}
        style={loading ? { visibility: 'hidden' } : undefined}
      >
        <i className="fas fa-chevron-right" aria-hidden="true" />
      </button>
    </div>
  );
}
