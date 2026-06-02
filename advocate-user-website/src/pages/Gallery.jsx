import { useEffect, useState } from 'react';

const BASE = import.meta.env.BASE_URL;
const STATIC_IMAGES = [
  'g1.jpeg','g2.jpeg','g3.jpeg','g4.jpeg',
  'g6.jpeg','g7.jpeg','g8.jpeg','g9.jpeg','g10.jpeg',
].map(f => ({ filename: f, url: `${BASE}gallery/${f}` }));

export default function Gallery() {
  const [images] = useState(STATIC_IMAGES);
  const [loading] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightbox === null) return;
    const handle = e => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') setLightbox(i => (i + 1) % images.length);
      if (e.key === 'ArrowLeft') setLightbox(i => (i - 1 + images.length) % images.length);
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [lightbox, images.length]);

  return (
    <div className="gallery-page">
      {/* Hero */}
      <div className="gallery-hero">
        <div className="container text-center">
          <div className="section-label" style={{ color: 'rgba(201,168,76,0.9)' }}>Our Gallery</div>
          <h1 className="gallery-hero-title">Photo <span className="text-gold">Gallery</span></h1>
          <p className="gallery-hero-sub">Moments from our practice and community engagements</p>
        </div>
      </div>

      {/* Grid */}
      <div className="section-padding bg-white">
        <div className="container">
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-warning"></div>
              <p className="mt-3 text-muted">Loading gallery…</p>
            </div>
          )}

          {!loading && images.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-images fa-3x text-muted mb-3 d-block"></i>
              <h5 className="text-muted">No photos yet</h5>
              <p className="text-muted small">Gallery images can be uploaded from the Admin Panel → Gallery</p>
            </div>
          )}

          {!loading && images.length > 0 && (
            <>
              <p className="text-muted mb-4 text-center small">{images.length} photo{images.length !== 1 ? 's' : ''} — click to enlarge</p>
              <div className="gallery-grid">
                {images.map((img, i) => (
                  <div
                    key={img.filename}
                    className="gallery-item"
                    onClick={() => setLightbox(i)}
                    data-aos="fade-up"
                    data-aos-delay={Math.min(i * 40, 400)}
                  >
                    <img src={img.url} alt={img.filename} loading="lazy" />
                    <div className="gallery-item-overlay">
                      <i className="fas fa-expand-alt"></i>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && images[lightbox] && (
        <div className="gallery-lightbox" onClick={() => setLightbox(null)}>
          <button className="gallery-lb-close" onClick={() => setLightbox(null)}>
            <i className="fas fa-times"></i>
          </button>
          <button className="gallery-lb-prev" onClick={e => { e.stopPropagation(); setLightbox(i => (i - 1 + images.length) % images.length); }}>
            <i className="fas fa-chevron-left"></i>
          </button>
          <img
            src={images[lightbox].url}
            alt={images[lightbox].filename}
            onClick={e => e.stopPropagation()}
          />
          <button className="gallery-lb-next" onClick={e => { e.stopPropagation(); setLightbox(i => (i + 1) % images.length); }}>
            <i className="fas fa-chevron-right"></i>
          </button>
          <div className="gallery-lb-counter">{lightbox + 1} / {images.length}</div>
        </div>
      )}
    </div>
  );
}
