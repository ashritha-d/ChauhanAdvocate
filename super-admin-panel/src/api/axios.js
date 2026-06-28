import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
});

function safeStorage(action, key, value) {
  try {
    if (action === 'get')    return localStorage.getItem(key);
    if (action === 'set')    return localStorage.setItem(key, value);
    if (action === 'remove') return localStorage.removeItem(key);
  } catch { /* localStorage blocked */ }
  return null;
}

api.interceptors.request.use(cfg => {
  const token = safeStorage('get', 'superAdminToken');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  if (cfg.method === 'get') cfg.params = { ...cfg.params, _t: Date.now() };
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    const status = err.response?.status;
    if (status === 429) return Promise.reject(new Error('Too many requests — please wait a moment.'));
    if (status === 401) {
      safeStorage('remove', 'superAdminToken');
      safeStorage('remove', 'superAdminUser');
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

export default api;
export { safeStorage };
