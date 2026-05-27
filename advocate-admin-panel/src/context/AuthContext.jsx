import { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin, getMe } from '../api';
import { safeStorage } from '../api/axios';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const s = safeStorage('get', 'adminUser');
    try { return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = safeStorage('get', 'adminToken');
    if (!token) { setLoading(false); return; }
    getMe()
      .then(r => {
        setAdmin(r.data.admin);
        safeStorage('set', 'adminUser', JSON.stringify(r.data.admin));
      })
      .catch(err => {
        // Don't clear session on 429 — just keep existing state
        if (err?.message?.includes('Too many requests')) { return; }
        safeStorage('remove', 'adminToken');
        safeStorage('remove', 'adminUser');
        setAdmin(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const r = await apiLogin({ email, password });
    if (r.data.success) {
      safeStorage('set', 'adminToken', r.data.token);
      safeStorage('set', 'adminUser', JSON.stringify(r.data.admin));
      setAdmin(r.data.admin);
    }
    return r.data;
  };

  const logout = () => {
    safeStorage('remove', 'adminToken');
    safeStorage('remove', 'adminUser');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, setAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
