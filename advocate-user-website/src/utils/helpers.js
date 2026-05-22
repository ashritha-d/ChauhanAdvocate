export const API_BASE = import.meta.env.VITE_API_BASE?.replace('/api', '') || 'http://localhost:5000';

export const mediaUrl = (path) => (path ? `${API_BASE}${path}` : null);

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const truncate = (str, n) => (str && str.length > n ? str.substring(0, n) + '...' : str);
