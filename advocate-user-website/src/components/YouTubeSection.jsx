import VideoSlider from './VideoSlider';

const YT_CHANNEL = 'https://youtube.com/@vakeelchauhan2024?si=hqLxM-wcI4ARn4OI';

const videos = [
  { id: 'kH4PwBezGzU', title: 'Civil Litigation Basics' },
  { id: 'zlVD_L9OEmY', title: 'Civil Litigation Basics' },
  { id: 'eUk-hRPpV3k', title: 'Civil Litigation Basics' },
  { id: 'Yw6Ojzot9K0', title: 'Civil Litigation Basics' },
].map(v => ({
  thumb: `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`,
  href:  `https://youtu.be/${v.id}`,
  title: v.title,
}));

export default function YouTubeSection() {
  return (
    <VideoSlider
      id="youtube"
      label="Watch & Learn"
      title={<>Legal Insights <span className="text-gold">&amp; Updates</span></>}
      subscribeHref={YT_CHANNEL}
      subscribeText="Subscribe for more"
      subscribeIcon="fab fa-youtube"
      subscribeColor="#ff0000"
      items={videos}
      bg="bg-light"
    />
  );
}
