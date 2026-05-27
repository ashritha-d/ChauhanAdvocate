import { useEffect, useState } from 'react';
import { getMagazines } from '../api';
import { mediaUrl } from '../utils/helpers';
import SliderSection from './SliderSection';

const FALLBACK = [
  {
    img: '/adv-photos/p1.webp',
    title: 'Legal Insights Quarterly',
    description: 'Q1 2026 Edition — Latest legal updates and case studies.',
    buttonText: 'View PDF',
    href: '#',
    external: true,
  },
  {
    img: '/adv-photos/p2.webp',
    title: 'Corporate Law Review',
    description: 'Monthly magazine for corporate legal professionals.',
    buttonText: 'View PDF',
    href: '#',
    external: true,
  },
  {
    img: '/adv-photos/p3.webp',
    title: 'Family Law Digest',
    description: 'Bi-monthly publication on family law matters.',
    buttonText: 'View PDF',
    href: '#',
    external: true,
  },
];

export default function Magazines() {
  const [items, setItems] = useState(FALLBACK);

  useEffect(() => {
    getMagazines()
      .then(r => {
        if (r.data?.success && r.data.data.length) {
          setItems(r.data.data.map(m => ({
            img: m.coverImage ? mediaUrl(m.coverImage) : '/adv-photos/p1.webp',
            title: m.title,
            description: m.description || '',
            buttonText: 'View PDF',
            href: m.pdfFile ? mediaUrl(m.pdfFile) : '#',
            external: true,
          })));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <SliderSection
      id="magazines"
      label="Publications"
      title={<>Legal <span className="text-gold">Magazines</span></>}
      description="Legal magazines available for reading and download"
      items={items}
      bg="bg-white"
    />
  );
}
