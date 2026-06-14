import { useRef } from 'react';

function SkeletonBookCards({ count = 3 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div className="skeleton-book-card" key={i}>
      <div className="skeleton-shimmer skeleton-book-img" />
      <div className="skeleton-shimmer skeleton-book-line w90" />
      <div className="skeleton-shimmer skeleton-book-line w65" />
      <div className="skeleton-shimmer skeleton-book-line w80" />
      <div className="skeleton-shimmer skeleton-book-line w50" />
      <div className="skeleton-shimmer skeleton-book-btn" />
    </div>
  ));
}

export default function SliderSection({ id, label, title, description, items, loading = false, bg = 'bg-white' }) {
  const trackRef = useRef(null);
  const scroll = (dir) => trackRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });

  return (
    <section id={id} className={`section-padding ${bg}`}>
      <div className="container">
        <div className="text-center mb-5" data-aos="fade-up">
          {label && <div className="section-label">{label}</div>}
          <h2 className="section-title">{title}</h2>
          {description && <p className="section-subtitle">{description}</p>}
        </div>
        <div className="slider-outer">
          <button className="slider-scroll-btn" onClick={() => scroll(-1)} aria-label="Scroll left">&#8249;</button>
          <div className="slider-track" ref={trackRef}>
            {loading ? <SkeletonBookCards /> : items.map((item, i) => (
              <div className="book-card" key={i} data-aos="fade-up" data-aos-delay={i * 60}>
                <div className="book-card-img">
                  <img
                    src={item.img}
                    alt={item.title}
                    onError={e => { e.target.src = `https://placehold.co/280x180/1a1a2e/c9a84c?text=${encodeURIComponent(item.title)}`; }}
                  />
                </div>
                <div className="book-card-body">
                  <div className="book-title">{item.title}</div>
                  {item.author && <div className="book-author">{item.author}</div>}
                  {item.rating && (
                    <div className="book-rating">
                      {item.rating} {item.reviews && <span>({item.reviews} reviews)</span>}
                    </div>
                  )}
                  <p className="book-desc">{item.description}</p>
                  {item.price && <div className="book-price">{item.price}</div>}
                  {item.isButton ? (
                    <button className="btn btn-gold btn-sm mt-auto" onClick={item.onClick}>{item.buttonText}</button>
                  ) : (
                    <a
                      href={item.href || '#'}
                      target={item.external ? '_blank' : undefined}
                      rel={item.external ? 'noopener noreferrer' : undefined}
                      download={item.download || undefined}
                      className="btn btn-gold btn-sm mt-auto"
                    >
                      {item.buttonText}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button className="slider-scroll-btn" onClick={() => scroll(1)} aria-label="Scroll right">&#8250;</button>
        </div>
      </div>
    </section>
  );
}
