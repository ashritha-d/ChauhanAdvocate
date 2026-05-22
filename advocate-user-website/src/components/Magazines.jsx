import SliderSection from './SliderSection';

const magazines = [
  {
    img: '/adv-photos/p1.webp',
    title: 'Legal Insights Quarterly',
    description: 'Q1 2026 Edition — Latest legal updates and case studies.',
    buttonText: 'View PDF',
    href: '/magazines/legal-insights-q1-2026.pdf',
    external: true,
  },
  {
    img: '/adv-photos/p2.webp',
    title: 'Corporate Law Review',
    description: 'Monthly magazine for corporate legal professionals.',
    buttonText: 'View PDF',
    href: '/magazines/corporate-law-review.pdf',
    external: true,
  },
  {
    img: '/adv-photos/p3.webp',
    title: 'Family Law Digest',
    description: 'Bi-monthly publication on family law matters.',
    buttonText: 'View PDF',
    href: '/magazines/family-law-digest.pdf',
    external: true,
  },
];

export default function Magazines() {
  return (
    <SliderSection
      id="magazines"
      label="Publications"
      title={<>Legal <span className="text-gold">Magazines</span></>}
      description="Legal magazines available for reading and download"
      items={magazines}
      bg="bg-white"
    />
  );
}
