import { useEffect, useState } from 'react';
import { getYouTubeVideos } from '../api';
import { useSite } from '../context/SiteContext';

export default function YouTubeSection() {
  const { settings: s } = useSite();
  const [videos, setVideos] = useState([]);
  const [playing, setPlaying] = useState(null);

  useEffect(() => {
    getYouTubeVideos()
      .then(r => { if (r.data.success) setVideos(r.data.data); })
      .catch(() => {});
  }, []);

  if (videos.length === 0) return null;

  const channelUrl = s.social_youtube || 'https://youtube.com/@vakeelchauhan2024';

  return (
    <section id="videos" className="section-padding" style={{ background: '#0f0f0f' }}>
      <div className="container">
        <div className="text-center mb-5" data-aos="fade-up">
          <div className="section-label" style={{ color: '#ff0000' }}>Watch & Learn</div>
          <h2 className="section-title text-white">Our <span style={{ color: '#ff0000' }}>YouTube</span> Channel</h2>
          <p className="section-subtitle" style={{ color: 'rgba(255,255,255,.6)' }}>Legal insights, rights awareness, and case discussions by Advocate Chauhan</p>
        </div>

        <div className="row g-4">
          {videos.map((v, i) => (
            <div className="col-md-6 col-lg-4" key={v._id} data-aos="fade-up" data-aos-delay={i * 80}>
              <div className="yt-card" onClick={() => setPlaying(playing === v._id ? null : v._id)}>
                {playing === v._id ? (
                  <div className="yt-player">
                    <iframe
                      src={`https://www.youtube.com/embed/${v.videoId}?autoplay=1`}
                      title={v.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                  </div>
                ) : (
                  <div className="yt-thumb">
                    <img
                      src={`https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`}
                      alt={v.title}
                      onError={e => { e.target.src = `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`; }}
                    />
                    <div className="yt-play-btn">
                      <i className="fab fa-youtube"></i>
                    </div>
                  </div>
                )}
                <div className="yt-info">
                  <h6 className="yt-title">{v.title}</h6>
                  {v.description && <p className="yt-desc">{v.description}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-5" data-aos="fade-up">
          <a href={channelUrl} target="_blank" rel="noreferrer" className="btn btn-lg px-5 py-3"
            style={{ background: '#ff0000', color: '#fff', borderRadius: 30, fontWeight: 600 }}>
            <i className="fab fa-youtube me-2"></i>Subscribe to Our Channel
          </a>
        </div>
      </div>

      <style>{`
        .yt-card { background: #1a1a1a; border-radius: 12px; overflow: hidden; cursor: pointer; transition: transform .3s, box-shadow .3s; }
        .yt-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(255,0,0,.25); }
        .yt-thumb { position: relative; aspect-ratio: 16/9; overflow: hidden; }
        .yt-thumb img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s; }
        .yt-card:hover .yt-thumb img { transform: scale(1.05); }
        .yt-play-btn { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.35); }
        .yt-play-btn i { font-size: 3.5rem; color: #ff0000; filter: drop-shadow(0 2px 8px rgba(0,0,0,.6)); transition: transform .2s; }
        .yt-card:hover .yt-play-btn i { transform: scale(1.15); }
        .yt-player { aspect-ratio: 16/9; }
        .yt-info { padding: 14px 16px; }
        .yt-title { color: #fff; font-weight: 600; font-size: .95rem; margin-bottom: 4px; line-height: 1.4; }
        .yt-desc { color: rgba(255,255,255,.5); font-size: .8rem; margin: 0; }
      `}</style>
    </section>
  );
}
