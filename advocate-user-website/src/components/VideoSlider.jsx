import { useRef } from 'react';

function SkeletonVideoCards() {
  return Array.from({ length: 4 }).map((_, i) => (
    <div className="skeleton-video-card" key={i}>
      <div className="skeleton-shimmer skeleton-video-thumb" />
      <div className="skeleton-shimmer skeleton-video-title" />
    </div>
  ));
}

export default function VideoSlider({ id, label, title, subscribeHref, subscribeText, subscribeIcon, subscribeColor, items, loading = false, bg = 'bg-white' }) {
  const trackRef = useRef(null);
  const scroll = (dir) => trackRef.current?.scrollBy({ left: dir * 310, behavior: 'smooth' });

  return (
    <section id={id} className={`section-padding ${bg}`}>
      <div className="container">
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-5">
          <div data-aos="fade-right">
            {label && <div className="section-label">{label}</div>}
            <h2 className="section-title mb-0">{title}</h2>
          </div>
          <a
            href={subscribeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="video-subscribe-btn mt-3 mt-md-0"
            style={{ background: subscribeColor }}
            data-aos="fade-left"
          >
            {subscribeIcon && <i className={`${subscribeIcon} me-2`}></i>}
            {subscribeText}
          </a>
        </div>
        <div className="slider-outer">
          <button className="slider-scroll-btn" onClick={() => scroll(-1)} aria-label="Scroll left">&#8249;</button>
          <div className="slider-track" ref={trackRef}>
            {loading ? <SkeletonVideoCards /> : items.map((item, i) => (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="video-card"
                key={i}
                data-aos="fade-up"
                data-aos-delay={i * 70}
              >
                <div className="video-card-thumb">
                  <img
                    src={item.thumb}
                    alt={item.title}
                    loading="lazy"
                    onError={e => {
                      const src = e.target.src;
                      // YouTube quality fallback chain
                      if (src.includes('maxresdefault')) {
                        e.target.src = src.replace('maxresdefault', 'sddefault');
                      } else if (src.includes('sddefault')) {
                        e.target.src = src.replace('sddefault', 'hqdefault');
                      } else if (item.fallbackThumb && e.target.src !== item.fallbackThumb) {
                        e.target.src = item.fallbackThumb;
                      } else {
                        e.target.style.display = 'none';
                      }
                    }}
                  />
                  <div className="video-play-overlay">
                    <div className="video-play-btn">&#9654;</div>
                  </div>
                </div>
                <div className="video-card-title">{item.title}</div>
              </a>
            ))}
          </div>
          <button className="slider-scroll-btn" onClick={() => scroll(1)} aria-label="Scroll right">&#8250;</button>
        </div>
      </div>
    </section>
  );
}
