import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/axios';

const UserAuthContext = createContext({});

function safeStorage(action, key, value) {
  try {
    if (action === 'get')    return localStorage.getItem(key);
    if (action === 'set')    return localStorage.setItem(key, value);
    if (action === 'remove') return localStorage.removeItem(key);
  } catch { /* blocked by tracking prevention — fail silently */ }
  return null;
}

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    const token = safeStorage('get', 'userToken');
    if (!token) return;
    try {
      const r = await api.get('/users/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.data.success) setUnreadCount(r.data.unreadCount || 0);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    const token = safeStorage('get', 'userToken');
    if (!token) { setLoading(false); return; }
    api.get('/users/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (r.data.success) { setUser(r.data.user); fetchUnreadCount(); }
        else { safeStorage('remove', 'userToken'); }
      })
      .catch(() => safeStorage('remove', 'userToken'))
      .finally(() => setLoading(false));
  }, [fetchUnreadCount]);

  const login = (token, userData) => {
    safeStorage('set', 'userToken', token);
    setUser(userData);
    fetchUnreadCount();
  };

  const logout = () => {
    safeStorage('remove', 'userToken');
    setUser(null);
    setUnreadCount(0);
  };

  const updateUser = (userData) => setUser(userData);

  const authHeader = () => {
    const token = safeStorage('get', 'userToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <UserAuthContext.Provider value={{ user, loading, unreadCount, login, logout, updateUser, fetchUnreadCount, authHeader }}>
      {children}
    </UserAuthContext.Provider>
  );
}

export const useUserAuth = () => useContext(UserAuthContext);
