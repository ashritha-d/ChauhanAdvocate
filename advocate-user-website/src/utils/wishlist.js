const KEY = 'courseWishlist';

function safeRead() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export const isWishlisted = id => safeRead().includes(id);

export const toggleWishlist = id => {
  const list = safeRead();
  const idx = list.indexOf(id);
  if (idx === -1) list.push(id); else list.splice(idx, 1);
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* storage unavailable */ }
  return idx === -1; // true if now wishlisted
};
