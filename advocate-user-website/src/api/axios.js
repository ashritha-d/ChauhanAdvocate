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
  // Required on every request (not just /refresh and /logout, which had it as a
  // one-off override) so the browser actually stores and re-sends the HttpOnly
  // refresh-token cookie across the frontend/backend's separate Azure domains.
  // Without this on login/register specifically, the cookie is silently never
  // stored at all — logout then has nothing to send back, so the server-side
  // session is never released (the exact "already logged in on another device"
  // bug after an explicit logout).
  withCredentials: true,
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
});

// Endpoints the backend explicitly allows short-lived caching on (see server.js) —
// skip the cache-buster for these so the browser can actually reuse a response.
const SHORT_CACHE_GET_PATHS = new Set(['/services', '/testimonials', '/faqs']);

// Attach cache-buster to GETs and auto-attach user token if not already present
api.interceptors.request.use(config => {
  if (config.method === 'get' && !SHORT_CACHE_GET_PATHS.has(config.url)) {
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
      // The access token is unrecoverable (expired, revoked, or the session was
      // claimed by another device/logged out) — tell UserAuthContext to drop its
      // `user` state too, so the UI reacts immediately instead of looking "logged
      // in" until the next full page load.
      window.dispatchEvent(new Event('auth:sessionExpired'));
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
