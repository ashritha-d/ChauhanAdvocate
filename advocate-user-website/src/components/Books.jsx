import { useEffect, useState } from 'react';
import { getBooks } from '../api';
import { mediaUrl } from '../utils/helpers';
import SliderSection from './SliderSection';

const FALLBACK = [
  {
    img: '/adv-photos/p1.webp',
    title: 'Civil Law Handbook',
    author: 'by Robert Smith, J.D.',
    description: 'Comprehensive guide covering all aspects of civil litigation, including contract disputes, property matters, and personal injury cases.',
    price: '₹299',
    buttonText: 'Order Now',
    href: '#',
  },
  {
    img: '/adv-photos/p2.webp',
    title: 'Criminal Law Guide',
    author: 'by Sarah Johnson, Esq.',
    description: 'Essential resource for understanding criminal law principles, from investigation through trial.',
    price: '₹349',
    buttonText: 'Order Now',
    href: '#',
  },
  {
    img: '/adv-photos/p3.webp',
    title: 'Family Law Manual',
    author: 'by Michael Davis, LL.M.',
    description: 'Compassionate and thorough guide to family law matters including divorce and child custody.',
    price: '₹249',
    buttonText: 'Order Now',
    href: '#',
  },
];

export default function Books() {
  const [items, setItems] = useState(FALLBACK);

  useEffect(() => {
    getBooks()
      .then(r => {
        if (r.data?.success && r.data.data.length) {
          setItems(r.data.data.map(b => ({
            img: b.image ? mediaUrl(b.image) : '/adv-photos/p1.webp',
            title: b.name,
            author: b.author ? `by ${b.author}` : '',
            description: b.description || '',
            price: `₹${b.price}`,
            buttonText: b.stockStatus === 'out_of_stock' ? 'Out of Stock' : 'Order Now',
            isButton: true,
            onClick: () => {
              const wa = b.contactNumber
                ? `https://wa.me/${b.contactNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`I'm interested in buying: ${b.name}`)}`
                : '#';
              if (wa !== '#') window.open(wa, '_blank');
            },
          })));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <SliderSection
      id="books"
      label="Legal Library"
      title={<>Books for <span className="text-gold">Sale</span></>}
      description="Purchase our legal books and guides"
      items={items}
      bg="bg-white"
    />
  );
}
