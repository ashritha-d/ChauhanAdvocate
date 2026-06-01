import { useEffect, useState } from 'react';
import { getDrafts } from '../api';
import { mediaUrl } from '../utils/helpers';
import SliderSection from './SliderSection';

function handleDownload(href, title) {
  if (!href || href === '#') {
    alert(`"${title}" is not available for download yet. Please contact us to request this draft.`);
    return;
  }
  // Force download
  const a = document.createElement('a');
  a.href = href;
  a.download = title + '.pdf';
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function Drafts() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    getDrafts()
      .then(r => {
        if (r.data?.success && r.data.data.length) {
          setItems(r.data.data.map(d => ({
            img: `${import.meta.env.BASE_URL}placeholder-lawyer.svg`,
            title: d.title,
            description: d.description || (d.category ? `Category: ${d.category}` : ''),
            buttonText: d.file ? 'Download PDF' : 'Not Available',
            isButton: true,
            onClick: () => handleDownload(d.file ? mediaUrl(d.file) : null, d.title),
          })));
        }
      })
      .catch(() => {});
  }, []);

  const fallback = [
    { img: `${import.meta.env.BASE_URL}placeholder-lawyer.svg`, title: 'Rental Agreement Draft', description: 'Standard rental agreement template for residential properties.', buttonText: 'Not Available', isButton: true, onClick: () => alert('This draft is not available yet. Please contact us.') },
    { img: `${import.meta.env.BASE_URL}placeholder-lawyer.svg`, title: 'Employment Contract Draft', description: 'Comprehensive employment contract template for employers.', buttonText: 'Not Available', isButton: true, onClick: () => alert('This draft is not available yet. Please contact us.') },
    { img: `${import.meta.env.BASE_URL}placeholder-lawyer.svg`, title: 'NDA Draft', description: 'Non-disclosure agreement template for business use.', buttonText: 'Not Available', isButton: true, onClick: () => alert('This draft is not available yet. Please contact us.') },
  ];

  return (
    <SliderSection
      id="drafts"
      label="Legal Templates"
      title={<>Legal <span className="text-gold">Drafts</span></>}
      description="Download ready-to-use legal draft templates"
      items={items.length ? items : fallback}
      bg="bg-light"
    />
  );
}
