import { useEffect, useState } from 'react';
import { getMagazines } from '../api';
import { mediaUrl } from '../utils/helpers';
import SliderSection from './SliderSection';

function handleDownload(href, title) {
  if (!href || href === '#') {
    alert(`"${title}" is not available for download yet. Please contact us for access.`);
    return;
  }
  const a = document.createElement('a');
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.click();
}

export default function Magazines() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    getMagazines()
      .then(r => {
        if (r.data?.success && r.data.data.length) {
          setItems(r.data.data.map(m => ({
            img: m.coverImage ? mediaUrl(m.coverImage) : `${import.meta.env.BASE_URL}placeholder-lawyer.svg`,
            title: m.title,
            description: m.description || '',
            buttonText: 'View / Download',
            isButton: true,
            onClick: () => handleDownload(m.pdfFile ? mediaUrl(m.pdfFile) : null, m.title),
          })));
        }
      })
      .catch(() => {});
  }, []);

  const fallback = [
    { img: `${import.meta.env.BASE_URL}placeholder-lawyer.svg`, title: 'Legal Insights Quarterly', description: 'Latest legal updates and case studies — Q1 2026 Edition.', buttonText: 'Not Available', isButton: true, onClick: () => alert('This magazine is not available yet.') },
    { img: `${import.meta.env.BASE_URL}placeholder-lawyer.svg`, title: 'Corporate Law Review', description: 'Monthly magazine for corporate legal professionals.', buttonText: 'Not Available', isButton: true, onClick: () => alert('This magazine is not available yet.') },
    { img: `${import.meta.env.BASE_URL}placeholder-lawyer.svg`, title: 'Family Law Digest', description: 'Bi-monthly publication on family law matters.', buttonText: 'Not Available', isButton: true, onClick: () => alert('This magazine is not available yet.') },
  ];

  return (
    <SliderSection
      id="magazines"
      label="Publications"
      title={<>Legal <span className="text-gold">Magazines</span></>}
      description="Legal magazines available for reading and download"
      items={items.length ? items : fallback}
      bg="bg-white"
    />
  );
}
