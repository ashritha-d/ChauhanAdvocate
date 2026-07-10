import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDrafts } from '../api';
import { mediaUrl } from '../utils/helpers';
import SliderSection from './SliderSection';

const FREE_COUNT = 3;
const PAID_PRICE = 50;

function handleDownload(href, title) {
  if (!href || href === '#') {
    alert(`"${title}" is not available for download yet. Please contact us to request this draft.`);
    return;
  }
  const a = document.createElement('a');
  a.href = href;
  a.download = title + '.pdf';
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function handlePurchase(title) {
  const msg = encodeURIComponent(`Hello, I would like to purchase the legal draft: "${title}" for ₹${PAID_PRICE}. Please guide me on the payment process.`);
  window.open(`https://wa.me/919392538226?text=${msg}`, '_blank');
}

export default function Drafts() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    getDrafts()
      .then(r => {
        if (r.data?.success && r.data.data.length) {
          setItems(r.data.data.map((d, idx) => {
            const isFree = idx < FREE_COUNT;
            return {
              img: `${import.meta.env.BASE_URL}placeholder-lawyer.svg`,
              title: d.title,
              description: d.description || (d.category ? `Category: ${d.category}` : ''),
              priceBadge: isFree ? 'Free' : `₹${PAID_PRICE}`,
              isFree,
              buttonText: isFree
                ? (d.file ? 'Download Free' : 'Not Available')
                : `Purchase ₹${PAID_PRICE}`,
              isButton: true,
              onClick: isFree
                ? () => handleDownload(d.file ? mediaUrl(d.file) : null, d.title)
                : () => handlePurchase(d.title),
            };
          }));
        } else {
          setItems([]);
        }
      })
      .catch(() => setItems([]));
  }, []);

  const fallback = [
    { img: `${import.meta.env.BASE_URL}placeholder-lawyer.svg`, title: 'Rental Agreement Draft', description: 'Standard rental agreement template for residential properties.', buttonText: 'Not Available', isButton: true, onClick: () => alert('This draft is not available yet. Please contact us.') },
    { img: `${import.meta.env.BASE_URL}placeholder-lawyer.svg`, title: 'Employment Contract Draft', description: 'Comprehensive employment contract template for employers.', buttonText: 'Not Available', isButton: true, onClick: () => alert('This draft is not available yet. Please contact us.') },
    { img: `${import.meta.env.BASE_URL}placeholder-lawyer.svg`, title: 'NDA Draft', description: 'Non-disclosure agreement template for business use.', buttonText: 'Not Available', isButton: true, onClick: () => alert('This draft is not available yet. Please contact us.') },
  ];

  return (
    <>
      <SliderSection
        id="drafts"
        label="Legal Templates"
        title={<>Legal <span className="text-gold">Drafts</span></>}
        description="Download ready-to-use legal draft templates"
        items={items !== null && items.length ? items : fallback}
        loading={items === null}
        bg="bg-light"
      />
      <div className="text-center pb-5" style={{ marginTop: '-2rem', background: 'var(--bs-light, #f8f9fa)' }}>
        <Link to="/drafts" className="btn btn-gold px-5">
          <i className="fas fa-file-alt me-2"></i>Browse All Drafts
        </Link>
      </div>
    </>
  );
}
