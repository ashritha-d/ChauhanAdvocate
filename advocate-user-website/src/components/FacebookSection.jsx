import { useEffect, useState } from 'react';
import { getFacebookPosts } from '../api';
import { mediaUrl } from '../utils/helpers';
import VideoSlider from './VideoSlider';

const FB_PAGE = 'https://www.facebook.com/share/1B761tqcFM/';
const FB_THUMB = 'https://placehold.co/320x180/1877f2/ffffff?text=Facebook+Post';

const FALLBACK = [
  { href: 'https://www.facebook.com/share/v/18zpWrGinF/', title: 'Civil Law Updates',   thumb: FB_THUMB },
  { href: 'https://www.facebook.com/share/v/1Fv7UYc1if/', title: 'Criminal Law Basics', thumb: FB_THUMB },
  { href: 'https://www.facebook.com/share/v/1JFJmEPkA7/', title: 'Family Law Tips',     thumb: FB_THUMB },
  { href: 'https://www.facebook.com/share/v/1Fv7UYc1if/', title: 'Legal Updates',       thumb: FB_THUMB },
];

export default function FacebookSection() {
  const [posts, setPosts] = useState(FALLBACK);

  useEffect(() => {
    getFacebookPosts()
      .then(r => {
        if (r.data?.success && r.data.data.length) {
          setPosts(r.data.data.map(p => {
            // Relative /uploads/ paths are from Render ephemeral storage (wiped on restart)
            // Use FB_THUMB immediately rather than making a doomed network request
            const isEphemeral = p.thumbnail && p.thumbnail.startsWith('/uploads/');
            const thumb = (!p.thumbnail || isEphemeral)
              ? FB_THUMB
              : mediaUrl(p.thumbnail);
            return {
              href:          p.facebookUrl || '#',
              title:         p.title,
              thumb,
              fallbackThumb: FB_THUMB,
            };
          }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <VideoSlider
      id="facebook"
      label="Social Media"
      title={<>Facebook <span className="text-gold">Legal Updates</span></>}
      subscribeHref={FB_PAGE}
      subscribeText="Join on Facebook"
      subscribeIcon="fab fa-facebook"
      subscribeColor="#1877f2"
      items={posts}
      bg="bg-white"
    />
  );
}
