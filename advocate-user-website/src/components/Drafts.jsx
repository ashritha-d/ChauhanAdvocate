import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDrafts } from '../api';
import { mediaUrl } from '../utils/helpers';
import { useUserAuth } from '../context/UserAuthContext';
import SliderSection from './SliderSection';

function doDownload(href, title) {
  if (!href || href === '#') {
    alert(`"${title}" is not available for download yet.`);
    return;
  }
  const a = document.createElement('a');
  a.href = href; a.download = title + '.pdf'; a.target = '_blank';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

export default function Drafts() {
  const navigate = useNavigate();
  const { user } = useUserAuth();
  const [items, setItems] = useState(null);

  useEffect(() => {
    getDrafts()
      .then(r => {
        if (r.data?.success && r.data.data.length) {
          setItems(r.data.data.map((d) => {
            const isPaid = d.accessType === 'paid';
            const price  = d.price || 0;
            const file   = d.contentDataJson?.file;
            return {
              img: `${import.meta.env.BASE_URL}placeholder-lawyer.svg`,
              title: d.title,
              description: d.contentDataJson?.description || '',
              priceBadge: isPaid ? `₹${price}` : 'Free',
              buttonText: isPaid ? `Buy Now — ₹${price}` : (file ? 'Download Free' : 'Not Available'),
              isButton: true,
              onClick: isPaid
                ? () => { navigate('/drafts'); }
                : () => {
                    if (!user) { navigate('/login', { state: { from: '/drafts' } }); return; }
                    doDownload(file ? mediaUrl(file) : null, d.title);
                  },
            };
          }));
        } else {
          setItems([]);
        }
      })
      .catch(() => setItems([]));
  }, [user]);

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
