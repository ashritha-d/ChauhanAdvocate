// Mirrors backend/utils/passwordPolicy.js exactly — frontend validation is a UX
// convenience only; the backend re-validates independently and is the real gate.
export const PASSWORD_REQUIREMENT_MESSAGE = 'Password must be at least 4 characters long.';

const MIN_LENGTH = 4;

export function getPasswordChecks(password = '') {
  return {
    length: password.length >= MIN_LENGTH,
  };
}

export function isPasswordValid(password = '') {
  return getPasswordChecks(password).length;
}
