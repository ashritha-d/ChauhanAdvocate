import { useEffect, useState } from 'react';
import { getBooks } from '../api';
import { mediaUrl } from '../utils/helpers';
import SliderSection from './SliderSection';
import OrderModal from './OrderModal';
import AuthGateModal from './AuthGateModal';
import { useUserAuth } from '../context/UserAuthContext';
import { savePendingAction } from '../utils/pendingAction';
import { useNavigate } from 'react-router-dom';

const BASE = import.meta.env.BASE_URL;

const FALLBACK = [
  { img: `${BASE}placeholder-lawyer.svg`, title: 'Civil Law Handbook', author: 'by Advocate Chauhan', description: 'Comprehensive guide covering civil litigation, contract disputes, property matters.', price: '₹299', buttonText: 'Order Now', isButton: true },
  { img: `${BASE}placeholder-lawyer.svg`, title: 'Criminal Law Guide', author: 'by Advocate Chauhan', description: 'Essential resource for understanding criminal law principles, from investigation through trial.', price: '₹349', buttonText: 'Order Now', isButton: true },
  { img: `${BASE}placeholder-lawyer.svg`, title: 'Family Law Manual', author: 'by Advocate Chauhan', description: 'Compassionate guide to family law matters including divorce and child custody.', price: '₹249', buttonText: 'Order Now', isButton: true },
];

export default function Books() {
  const { user } = useUserAuth();
  const navigate = useNavigate();
  // null = still fetching; never show FALLBACK until the API call resolves
  const [books, setBooks] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [gateBook, setGateBook] = useState(null);

  useEffect(() => {
    getBooks()
      .then(r => {
        if (r.data?.success && r.data.data.length) {
          setBooks(r.data.data);
        } else {
          setBooks([]);
        }
      })
      .catch(() => setBooks([]));
  }, []);

  const handleOrderClick = (book) => {
    if (user) {
      setSelectedBook(book);
    } else {
      savePendingAction('order', book);
      navigate('/login');
    }
  };

  const items = books && books.length
    ? books.map(b => ({
        img: b.image ? mediaUrl(b.image) : `${BASE}advc.jpeg`,
        title: b.name,
        author: b.author ? `by ${b.author}` : '',
        description: b.description || '',
        price: b.price ? `₹${b.price}` : '',
        buttonText: b.stockStatus === 'out_of_stock' ? 'Out of Stock' : 'Order Now',
        isButton: true,
        disabled: b.stockStatus === 'out_of_stock',
        onClick: b.stockStatus === 'out_of_stock' ? undefined : () => handleOrderClick({ title: b.name, price: b.price ? `₹${b.price}` : '' }),
      }))
    : FALLBACK.map(f => ({ ...f, onClick: () => handleOrderClick({ title: f.title, price: f.price }) }));

  return (
    <>
      <SliderSection
        id="books"
        label="Legal Library"
        title={<>Books for <span className="text-gold">Sale</span></>}
        description="Purchase our legal books and guides"
        items={items}
        loading={books === null}
        bg="bg-white"
      />

      {/* Order form — only for logged-in users, opened directly here */}
      {selectedBook && (
        <OrderModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onSuccess={() => setSelectedBook(null)}
        />
      )}

      {/* Fallback auth gate (legacy — now handled by navigate to login) */}
      {gateBook && (
        <AuthGateModal
          action={`Order "${gateBook.title}"`}
          redirectTo={`${BASE}#books`}
          onClose={() => setGateBook(null)}
        />
      )}
    </>
  );
}
