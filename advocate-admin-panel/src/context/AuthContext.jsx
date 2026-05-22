import { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin, getMe } from '../api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const s = localStorage.getItem('adminUser');
    return s ? JSON.parse(s) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { setLoading(false); return; }
    getMe()
      .then(r => { setAdmin(r.data.admin); localStorage.setItem('adminUser', JSON.stringify(r.data.admin)); })
      .catch(() => { localStorage.removeItem('adminToken'); localStorage.removeItem('adminUser'); setAdmin(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const r = await apiLogin({ email, password });
    if (r.data.success) {
      localStorage.setItem('adminToken', r.data.token);
      localStorage.setItem('adminUser', JSON.stringify(r.data.admin));
      setAdmin(r.data.admin);
    }
    return r.data;
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, setAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
