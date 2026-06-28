import { createContext, useContext, useEffect, useState } from 'react';
import api, { safeStorage } from '../api/axios';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const s = safeStorage('get', 'superAdminUser');
    try { return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const token = safeStorage('get', 'superAdminToken');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(r => {
        const user = r.data.admin;
        if (user.role !== 'superadmin') {
          safeStorage('remove', 'superAdminToken');
          safeStorage('remove', 'superAdminUser');
          setAdmin(null);
          setAccessDenied(true);
        } else {
          setAdmin(user);
          safeStorage('set', 'superAdminUser', JSON.stringify(user));
        }
      })
      .catch(err => {
        if (err?.message?.includes('Too many requests')) return;
        safeStorage('remove', 'superAdminToken');
        safeStorage('remove', 'superAdminUser');
        setAdmin(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password });
    if (r.data.success) {
      const user = r.data.admin;
      if (user.role !== 'superadmin') {
        throw new Error('Access denied. Super Admin credentials required.');
      }
      safeStorage('set', 'superAdminToken', r.data.token);
      safeStorage('set', 'superAdminUser', JSON.stringify(user));
      setAdmin(user);
      setAccessDenied(false);
    }
    return r.data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    safeStorage('remove', 'superAdminToken');
    safeStorage('remove', 'superAdminUser');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, accessDenied, login, logout, setAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
