import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
});

function safeStorage(action, key, value) {
  try {
    if (action === 'get')    return localStorage.getItem(key);
    if (action === 'set')    return localStorage.setItem(key, value);
    if (action === 'remove') return localStorage.removeItem(key);
  } catch {
    // localStorage blocked by browser tracking prevention — fail silently
  }
  return null;
}

api.interceptors.request.use(cfg => {
  const token = safeStorage('get', 'adminToken');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  // Bust browser GET cache with a timestamp param
  if (cfg.method === 'get') {
    cfg.params = { ...cfg.params, _t: Date.now() };
  }
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    const status = err.response?.status;
    if (status === 429) {
      return Promise.reject(new Error('Too many requests — please wait a moment and try again.'));
    }
    if (status === 401) {
      safeStorage('remove', 'adminToken');
      safeStorage('remove', 'adminUser');
      window.location.href = window.location.pathname.includes('/admin') ? '/ChauhanAdvocate/admin/' : '/';
    }
    return Promise.reject(err);
  }
);

export default api;
export { safeStorage };
