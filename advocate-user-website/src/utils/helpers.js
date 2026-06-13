export const API_BASE = import.meta.env.VITE_API_BASE?.replace('/api', '') || 'http://localhost:5000';

export const mediaUrl = (path) => {
  if (!path) return null;
  // Already an absolute URL — return as-is (with https upgrade if needed)
  if (/^https?:\/\//i.test(path)) {
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      return path.replace(/^http:\/\//, 'https://');
    }
    return path;
  }
  const url = `${API_BASE}${path}`;
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return url.replace(/^http:\/\//, 'https://');
  }
  return url;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const truncate = (str, n) => (str && str.length > n ? str.substring(0, n) + '...' : str);
