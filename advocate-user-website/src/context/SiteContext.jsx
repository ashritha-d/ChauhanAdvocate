import { createContext, useContext, useEffect, useState } from 'react';
import { getSiteSettings } from '../api';

const SiteContext = createContext({});

export function SiteProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // After 8 s, stop blocking renders even if Render is still cold-starting
    const fallbackTimer = setTimeout(() => setLoading(false), 8000);
    getSiteSettings()
      .then(r => { if (r.data.success) setSettings(r.data.data); })
      .catch(() => {})
      .finally(() => { clearTimeout(fallbackTimer); setLoading(false); });
    return () => clearTimeout(fallbackTimer);
  }, []);

  return <SiteContext.Provider value={{ settings, loading }}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);
