export const API_BASE = import.meta.env.VITE_API_BASE?.replace('/api', '') || 'http://localhost:5000';
// Cloudinary-stored files already have a full URL — only relative /uploads/-style
// legacy paths need the API origin prefixed (matches the pattern already used
// consistently in advocate-user-website's helpers.js).
export const mediaUrl = (path) => (path ? (path.startsWith('http') ? path : `${API_BASE}${path}`) : null);
export const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '';
export const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '';
