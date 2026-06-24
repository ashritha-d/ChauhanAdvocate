import { useEffect, useState } from 'react';
import { getYouTubeVideos } from '../api';
import VideoSlider from './VideoSlider';

const YT_CHANNEL = 'https://youtube.com/@vakeelchauhan2024?si=hqLxM-wcI4ARn4OI';

// maxresdefault = 1280×720 (crisp on retina); falls back to sddefault via onError in VideoSlider
const FALLBACK = [
  { id: 'kH4PwBezGzU', title: 'Civil Litigation Basics' },
  { id: 'zlVD_L9OEmY', title: 'Civil Litigation Basics' },
  { id: 'eUk-hRPpV3k', title: 'Civil Litigation Basics' },
  { id: 'Yw6Ojzot9K0', title: 'Civil Litigation Basics' },
].map(v => ({
  thumb: `https://img.youtube.com/vi/${v.id}/maxresdefault.jpg`,
  href: `https://youtu.be/${v.id}`,
  title: v.title,
}));

export default function YouTubeSection() {
  // null = still fetching; never pre-populate with FALLBACK so demo videos never flash on first load
  const [videos, setVideos] = useState(null);

  useEffect(() => {
    getYouTubeVideos()
      .then(r => {
        if (r.data?.success && r.data.data.length) {
          setVideos(r.data.data.map(v => ({
            thumb: `https://img.youtube.com/vi/${v.videoId}/maxresdefault.jpg`,
            href: `https://youtu.be/${v.videoId}`,
            title: v.title,
          })));
        } else {
          setVideos(FALLBACK);
        }
      })
      .catch(() => setVideos(FALLBACK));
  }, []);

  return (
    <VideoSlider
      id="youtube"
      label="Watch & Learn"
      title={<>Social Media Legal Insights <span className="text-gold">&amp; Updates</span></>}
      subscribeHref={YT_CHANNEL}
      subscribeText="Subscribe for more"
      subscribeIcon="fab fa-youtube"
      subscribeColor="#ff0000"
      items={videos || []}
      loading={videos === null}
      bg="bg-light"
    />
  );
}
