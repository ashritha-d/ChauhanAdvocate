import { useEffect, useState } from 'react';
import { getDrafts } from '../api';
import { mediaUrl } from '../utils/helpers';
import SliderSection from './SliderSection';

const FALLBACK = [
  {
    img: '/adv-photos/p1.webp',
    title: 'Rental Agreement Draft',
    description: 'Standard rental agreement template for residential properties.',
    buttonText: 'Download PDF',
    href: '#',
    download: false,
  },
  {
    img: '/adv-photos/p2.webp',
    title: 'Employment Contract Draft',
    description: 'Comprehensive employment contract template for employers.',
    buttonText: 'Download PDF',
    href: '#',
    download: false,
  },
  {
    img: '/adv-photos/p3.webp',
    title: 'NDA Draft',
    description: 'Non-disclosure agreement template for business use.',
    buttonText: 'Download PDF',
    href: '#',
    download: false,
  },
];

export default function Drafts() {
  const [items, setItems] = useState(FALLBACK);

  useEffect(() => {
    getDrafts()
      .then(r => {
        if (r.data?.success && r.data.data.length) {
          setItems(r.data.data.map(d => ({
            img: '/adv-photos/p1.webp',
            title: d.title,
            description: d.description || (d.category ? `Category: ${d.category}` : ''),
            buttonText: 'Download PDF',
            href: d.file ? mediaUrl(d.file) : '#',
            external: true,
          })));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <SliderSection
      id="drafts"
      label="Legal Templates"
      title={<>Legal <span className="text-gold">Drafts</span></>}
      description="Download ready-to-use legal draft templates"
      items={items}
      bg="bg-light"
    />
  );
}
