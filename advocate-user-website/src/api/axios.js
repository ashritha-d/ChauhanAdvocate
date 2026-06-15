import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:5000/api',
  // 90 s to survive Render free-tier cold starts (can take up to 80-90 s)
  timeout: 90000,
});

export default api;
