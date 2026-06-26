import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './auth-profile.css';
import api from './api/axios';

// Register service worker — intercepts navigation to always fetch fresh HTML
// and prevents GitHub Pages from serving stale cached index.html
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => {});
  });
}

// Ping the backend immediately so Render's free-tier server wakes up before
// any component starts its own data fetch (cold start takes 30-50 s).
api.get('/site-settings').catch(() => {});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
