import { useEffect, useState } from 'react';
import { getBooks } from '../api';
import { mediaUrl } from '../utils/helpers';
import SliderSection from './SliderSection';
import OrderModal from './OrderModal';

const FALLBACK = [
  { img: `${import.meta.env.BASE_URL}advc.jpeg`, title: 'Civil Law Handbook', author: 'by Advocate Chauhan', description: 'Comprehensive guide covering all aspects of civil litigation, contract disputes, property matters.', price: '₹299', buttonText: 'Order Now', isButton: true },
  { img: `${import.meta.env.BASE_URL}advc.jpeg`, title: 'Criminal Law Guide', author: 'by Advocate Chauhan', description: 'Essential resource for understanding criminal law principles, from investigation through trial.', price: '₹349', buttonText: 'Order Now', isButton: true },
  { img: `${import.meta.env.BASE_URL}advc.jpeg`, title: 'Family Law Manual', author: 'by Advocate Chauhan', description: 'Compassionate and thorough guide to family law matters including divorce and child custody.', price: '₹249', buttonText: 'Order Now', isButton: true },
];

export default function Books() {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    getBooks()
      .then(r => { if (r.data?.success && r.data.data.length) setBooks(r.data.data); })
      .catch(() => {});
  }, []);

  const openOrder = (book) => setSelectedBook(book);

  const items = books.length
    ? books.map(b => ({
        img: b.image ? mediaUrl(b.image) : `${import.meta.env.BASE_URL}advc.jpeg`,
        title: b.name,
        author: b.author ? `by ${b.author}` : '',
        description: b.description || '',
        price: b.price ? `₹${b.price}` : '',
        buttonText: b.stockStatus === 'out_of_stock' ? 'Out of Stock' : 'Order Now',
        isButton: true,
        disabled: b.stockStatus === 'out_of_stock',
        onClick: b.stockStatus === 'out_of_stock' ? undefined : () => openOrder({ title: b.name, price: b.price ? `₹${b.price}` : '' }),
      }))
    : FALLBACK.map(f => ({ ...f, onClick: () => openOrder({ title: f.title, price: f.price }) }));

  return (
    <>
      <SliderSection
        id="books"
        label="Legal Library"
        title={<>Books for <span className="text-gold">Sale</span></>}
        description="Purchase our legal books and guides"
        items={items}
        bg="bg-white"
      />
      {selectedBook && <OrderModal book={selectedBook} onClose={() => setSelectedBook(null)} />}
    </>
  );
}
