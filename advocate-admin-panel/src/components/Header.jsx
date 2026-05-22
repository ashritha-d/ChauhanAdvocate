import { useAuth } from '../context/AuthContext';

const PAGE_TITLES = {
  dashboard:'Dashboard', settings:'Site Settings', banners:'Hero Banners',
  services:'Services', blogs:'Blogs', testimonials:'Testimonials',
  faqs:'FAQs', appointments:'Appointments', contacts:'Contacts', profile:'My Profile',
};

export default function Header({ page, onMenuClick }) {
  const { admin } = useAuth();
  return (
    <header className="admin-header">
      <div className="d-flex align-items-center gap-3">
        <button className="btn btn-sm btn-light d-lg-none" onClick={onMenuClick}>
          <i className="fas fa-bars"></i>
        </button>
        <h5 className="mb-0 fw-bold">{PAGE_TITLES[page] || page}</h5>
      </div>
      <div className="d-flex align-items-center gap-3">
        <span className="badge bg-success">Live</span>
        <div className="admin-avatar">{(admin?.name || 'A').charAt(0).toUpperCase()}</div>
      </div>
    </header>
  );
}
