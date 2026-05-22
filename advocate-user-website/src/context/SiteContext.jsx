import { createContext, useContext, useEffect, useState } from 'react';
import { getSiteSettings } from '../api';

const SiteContext = createContext({});

export function SiteProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSiteSettings()
      .then(r => { if (r.data.success) setSettings(r.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return <SiteContext.Provider value={{ settings, loading }}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);
