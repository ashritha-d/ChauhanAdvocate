import VideoSlider from './VideoSlider';

const FB_PAGE = 'https://www.facebook.com/share/1B761tqcFM/';
const FB_THUMB = 'https://placehold.co/320x180/1877f2/ffffff?text=Facebook+Video';

const videos = [
  { href: 'https://www.facebook.com/share/v/18zpWrGinF/', title: 'Civil Law Updates',    thumb: FB_THUMB },
  { href: 'https://www.facebook.com/share/v/1Fv7UYc1if/', title: 'Criminal Law Basics',  thumb: FB_THUMB },
  { href: 'https://www.facebook.com/share/v/1JFJmEPkA7/', title: 'Family Law Tips',       thumb: FB_THUMB },
  { href: 'https://www.facebook.com/share/v/1Fv7UYc1if/', title: 'Criminal Law Basics',  thumb: FB_THUMB },
];

export default function FacebookSection() {
  return (
    <VideoSlider
      id="facebook"
      label="Social Media"
      title={<>Facebook <span className="text-gold">Legal Updates</span></>}
      subscribeHref={FB_PAGE}
      subscribeText="Join on Facebook"
      subscribeIcon="fab fa-facebook"
      subscribeColor="#1877f2"
      items={videos}
      bg="bg-white"
    />
  );
}
