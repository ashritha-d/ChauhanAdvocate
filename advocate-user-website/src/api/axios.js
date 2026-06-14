import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:5000/api',
  // 60 s to survive Render free-tier cold starts (~30–50 s wake-up time)
  timeout: 60000,
});

export default api;
