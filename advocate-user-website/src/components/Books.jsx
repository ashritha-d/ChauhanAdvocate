import SliderSection from './SliderSection';

const books = [
  {
    img: '/adv-photos/p1.webp',
    title: 'Civil Law Handbook',
    author: 'by Robert Smith, J.D.',
    rating: '★★★★★',
    reviews: 128,
    description: 'Comprehensive guide covering all aspects of civil litigation, including contract disputes, property matters, and personal injury cases.',
    price: '₹29.99',
    buttonText: 'Order Now',
    href: '#',
  },
  {
    img: '/adv-photos/p2.webp',
    title: 'Criminal Law Guide',
    author: 'by Sarah Johnson, Esq.',
    rating: '★★★★☆',
    reviews: 95,
    description: 'Essential resource for understanding criminal law principles, from investigation through trial. Covers constitutional rights and defense strategies.',
    price: '₹34.99',
    buttonText: 'Order Now',
    href: '#',
  },
  {
    img: '/adv-photos/p3.webp',
    title: 'Family Law Manual',
    author: 'by Michael Davis, LL.M.',
    rating: '★★★★★',
    reviews: 156,
    description: 'Compassionate and thorough guide to family law matters including divorce, child custody, adoption, and domestic relations.',
    price: '₹24.99',
    buttonText: 'Order Now',
    href: '#',
  },
  {
    img: '/adv-photos/p4.webp',
    title: 'Corporate Law Reference',
    author: 'by Emily Chen, Ph.D.',
    rating: '★★★★☆',
    reviews: 87,
    description: 'Comprehensive reference for business law including corporate formation, mergers & acquisitions, regulatory compliance, and governance.',
    price: '₹39.99',
    buttonText: 'Order Now',
    href: '#',
  },
  {
    img: '/adv-photos/p5.webp',
    title: 'Constitutional Law Essentials',
    author: 'by James Wilson, J.D.',
    rating: '★★★★★',
    reviews: 203,
    description: 'In-depth analysis of constitutional principles and landmark Supreme Court decisions with expert commentary on modern applications.',
    price: '₹32.99',
    buttonText: 'Order Now',
    href: '#',
  },
  {
    img: '/adv-photos/p2.webp',
    title: 'Intellectual Property Law',
    author: 'by Lisa Park, Esq.',
    rating: '★★★★☆',
    reviews: 112,
    description: 'Complete guide to patents, trademarks, copyrights, and trade secrets with step-by-step filing procedures and enforcement strategies.',
    price: '₹27.99',
    buttonText: 'Order Now',
    href: '#',
  },
];

export default function Books() {
  return (
    <SliderSection
      id="books"
      label="Legal Library"
      title={<>Books for <span className="text-gold">Sale</span></>}
      description="Purchase our legal books and guides"
      items={books}
      bg="bg-white"
    />
  );
}
