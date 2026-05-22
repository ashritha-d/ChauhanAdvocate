import SliderSection from './SliderSection';

const drafts = [
  {
    img: '/adv-photos/p1.webp',
    title: 'Rental Agreement Draft',
    description: 'Standard rental agreement template for residential properties.',
    buttonText: 'Download PDF',
    href: '/drafts/rental-agreement.pdf',
    download: true,
  },
  {
    img: '/adv-photos/p2.webp',
    title: 'Employment Contract Draft',
    description: 'Comprehensive employment contract template for employers.',
    buttonText: 'Download PDF',
    href: '/drafts/employment-contract.pdf',
    download: true,
  },
  {
    img: '/adv-photos/p3.webp',
    title: 'NDA Draft',
    description: 'Non-disclosure agreement template for business use.',
    buttonText: 'Download PDF',
    href: '/drafts/nda.pdf',
    download: true,
  },
];

export default function Drafts() {
  return (
    <SliderSection
      id="drafts"
      label="Legal Templates"
      title={<>Legal <span className="text-gold">Drafts</span></>}
      description="Download ready-to-use legal draft templates"
      items={drafts}
      bg="bg-light"
    />
  );
}
