import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { getPendingAction, getPendingActionData } from '../utils/pendingAction';
import { userLogout as callLogoutApi } from '../api';

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

  // Global modal trigger — 'appointment' | 'order' | 'jr_advocate' | null
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState(null);   // e.g. { title, price } for order

  const openModal = (type, data = null) => {
    setActiveModal(type);
    setModalData(data);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
  };

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
        if (r.data.success) {
          setUser(r.data.user);
          fetchUnreadCount();
          // Restore pending action after page refresh (user already logged in)
          // 'order' is handled by Books.jsx via pendingAction localStorage — skip it here
          const pending = getPendingAction();
          if (pending && pending !== 'order') openModal(pending, getPendingActionData());
        } else {
          safeStorage('remove', 'userToken');
        }
      })
      .catch(() => safeStorage('remove', 'userToken'))
      .finally(() => setLoading(false));
  }, [fetchUnreadCount]);

  const login = (token, userData) => {
    safeStorage('set', 'userToken', token);
    setUser(userData);
    fetchUnreadCount();
    // Fire any pending modal intent
    // 'order' is handled by Books.jsx via pendingAction localStorage — skip it here
    const pending = getPendingAction();
    if (pending && pending !== 'order') openModal(pending, getPendingActionData());
  };

  const logout = () => {
    safeStorage('remove', 'userToken');
    setUser(null);
    setUnreadCount(0);
    closeModal();
    // Best-effort: revoke the refresh cookie on the backend
    callLogoutApi().catch(() => {});
  };

  const updateUser = (userData) => setUser(userData);

  const authHeader = () => {
    const token = safeStorage('get', 'userToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <UserAuthContext.Provider value={{
      user, loading, unreadCount,
      login, logout, updateUser, fetchUnreadCount, authHeader,
      activeModal, modalData, openModal, closeModal,
    }}>
      {children}
    </UserAuthContext.Provider>
  );
}

export const useUserAuth = () => useContext(UserAuthContext);
