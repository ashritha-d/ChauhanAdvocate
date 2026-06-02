const KEY = 'pendingAction';
const DATA_KEY = 'pendingActionData';

function safe(fn) { try { return fn(); } catch { return null; } }

export const savePendingAction = (type, data = null) => {
  safe(() => {
    localStorage.setItem(KEY, type);
    if (data) localStorage.setItem(DATA_KEY, JSON.stringify(data));
    else localStorage.removeItem(DATA_KEY);
  });
};

export const getPendingAction = () => safe(() => localStorage.getItem(KEY));

export const getPendingActionData = () => safe(() => {
  const raw = localStorage.getItem(DATA_KEY);
  return raw ? JSON.parse(raw) : null;
});

export const clearPendingAction = () => safe(() => {
  localStorage.removeItem(KEY);
  localStorage.removeItem(DATA_KEY);
});
