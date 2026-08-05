// Single source of truth for password strength rules — used by register,
// self-service reset, change-password, and admin-generated temporary passwords,
// so the requirement can never drift out of sync between entry points.
const MIN_LENGTH = 6;
const MAX_LENGTH = 10;
// Deliberately simple: letters and numbers only, no special characters
// required or allowed — chosen for memorability over strength.
const ALPHANUMERIC_RE = /^[A-Za-z0-9]+$/;

const REQUIREMENT_MESSAGE =
  `Password must be ${MIN_LENGTH}-${MAX_LENGTH} alphanumeric characters (letters and numbers only).`;

function validatePasswordStrength(password) {
  if (typeof password !== 'string' || !password) {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < MIN_LENGTH || password.length > MAX_LENGTH) {
    return { valid: false, message: REQUIREMENT_MESSAGE };
  }
  if (!ALPHANUMERIC_RE.test(password)) {
    return { valid: false, message: REQUIREMENT_MESSAGE };
  }
  return { valid: true, message: '' };
}

// Generates a random temporary password that satisfies the policy above —
// used when an admin resets a user's password instead of the admin choosing one.
function generateTempPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const pick = chars => chars[Math.floor(Math.random() * chars.length)];
  const all = upper + lower + digits;

  // Guarantee one of each class, then fill to 8 chars, then shuffle.
  let chars = [pick(upper), pick(lower), pick(digits)];
  while (chars.length < 8) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

module.exports = { validatePasswordStrength, generateTempPassword, REQUIREMENT_MESSAGE, MIN_LENGTH, MAX_LENGTH };
