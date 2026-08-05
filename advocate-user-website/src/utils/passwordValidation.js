// Mirrors backend/utils/passwordPolicy.js exactly — frontend validation is a UX
// convenience only; the backend re-validates independently and is the real gate.
export const PASSWORD_REQUIREMENT_MESSAGE =
  'Password must be 6-10 alphanumeric characters (letters and numbers only).';

const ALPHANUMERIC_RE = /^[A-Za-z0-9]+$/;

export function getPasswordChecks(password = '') {
  return {
    length: password.length >= 6 && password.length <= 10,
    alphanumeric: password.length > 0 && ALPHANUMERIC_RE.test(password),
  };
}

export function isPasswordValid(password = '') {
  const c = getPasswordChecks(password);
  return c.length && c.alphanumeric;
}
