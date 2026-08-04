// Mirrors backend/utils/passwordPolicy.js exactly — frontend validation is a UX
// convenience only; the backend re-validates independently and is the real gate.
export const PASSWORD_REQUIREMENT_MESSAGE =
  'Password must be 6-10 characters and contain uppercase, lowercase, number, and special character.';

const SPECIAL_RE = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

export function getPasswordChecks(password = '') {
  return {
    length: password.length >= 6 && password.length <= 10,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: SPECIAL_RE.test(password),
  };
}

export function isPasswordValid(password = '') {
  const c = getPasswordChecks(password);
  return c.length && c.uppercase && c.lowercase && c.number && c.special;
}
