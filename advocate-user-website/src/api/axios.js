import axios from 'axios';

function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, val) {
  try { localStorage.setItem(key, val); } catch { }
}
function safeRemove(key) {
  try { localStorage.removeItem(key); } catch { }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:5000/api',
  timeout: 90000,
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
});

// Attach cache-buster to GETs and auto-attach user token if not already present
api.interceptors.request.use(config => {
  if (config.method === 'get') {
    config.params = { ...config.params, _t: Date.now() };
  }
  const token = safeGet('userToken');
  if (token && !config.headers?.['Authorization']) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  }
  return config;
});

// On 401, attempt one silent token refresh before propagating the error
let isRefreshing = false;
let pendingQueue = [];

function flushQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
}

api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config;

    // Only intercept 401s once per request; skip the refresh endpoint itself
    if (
      error.response?.status !== 401 ||
      original._retry ||
      original.url?.includes('/users/refresh') ||
      original.url?.includes('/users/login')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the in-flight refresh resolves
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then(token => {
        original.headers['Authorization'] = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await api.post('/users/refresh', {}, { withCredentials: true });
      if (data.success && data.token) {
        safeSet('userToken', data.token);
        flushQueue(null, data.token);
        original.headers['Authorization'] = `Bearer ${data.token}`;
        return api(original);
      }
      throw new Error('Refresh failed');
    } catch (refreshErr) {
      safeRemove('userToken');
      flushQueue(refreshErr);
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
