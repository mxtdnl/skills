// Pseudonymous identifiers (CLAUDE.md, Technical conventions 10).
//
// No names or email addresses are ever collected. A participant is identified by a random code
// that a student can write down and re-enter at the second sitting about a year later, so it is
// short, case-insensitive and avoids characters that are easily confused (Crockford base 32:
// no I, L, O or U). A check character catches every single-character substitution and most adjacent swaps.
//
// Identifiers come from crypto.getRandomValues, never from the seeded generator in rng.js.

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base 32
const PARTICIPANT_BODY = 8; // 40 random bits

function randomChars(n, random) {
  const bytes = new Uint8Array(n);
  random(bytes);
  // 256 is a multiple of 32, so masking to 5 bits is unbiased.
  return Array.from(bytes, (b) => ALPHABET[b & 31]).join('');
}

const defaultRandom = (bytes) => globalThis.crypto.getRandomValues(bytes);

// Weighted sum modulo 32 with odd weights 1, 3, 5, ... Odd weights are invertible modulo 32, so
// every single-character substitution in the body is detected. A swap of two adjacent
// characters is detected unless their values differ by exactly 16.
function checkChar(body) {
  let sum = 0;
  for (let i = 0; i < body.length; i++) sum += (2 * i + 1) * ALPHABET.indexOf(body[i]);
  return ALPHABET[sum % 32];
}

/**
 * New participant ID, formatted P-XXXX-XXXXC (C is the check character).
 * @param {(bytes: Uint8Array) => void} [random] fills bytes; injectable for tests
 * @returns {string}
 */
export function newParticipantId(random = defaultRandom) {
  const body = randomChars(PARTICIPANT_BODY, random);
  return `P-${body.slice(0, 4)}-${body.slice(4)}${checkChar(body)}`;
}

/**
 * Normalise a typed participant code: upper case, strip spaces, map Crockford look-alikes
 * (O to 0, I and L to 1). Returns null if it is not a well-formed, check-valid ID.
 * @param {string} input
 * @returns {string | null}
 */
export function normaliseParticipantId(input) {
  if (typeof input !== 'string') return null;
  const s = input.toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  if (!/^P[0-9A-HJKMNP-TV-Z]{9}$/.test(s)) return null;
  const body = s.slice(1, 9);
  if (checkChar(body) !== s[9]) return null;
  return `P-${body.slice(0, 4)}-${body.slice(4)}${s[9]}`;
}

/** @param {string} id */
export function isParticipantId(id) {
  return typeof id === 'string' && /^P-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{5}$/.test(id) && normaliseParticipantId(id) === id;
}

/**
 * New record ID with a type prefix: S- (sitting), A- (task attempt), R- (self-report).
 * 16 random characters (80 bits); not meant to be typed.
 * @param {'S' | 'A' | 'R'} prefix
 * @param {(bytes: Uint8Array) => void} [random]
 * @returns {string}
 */
export function newRecordId(prefix, random = defaultRandom) {
  if (!/^[SAR]$/.test(prefix)) throw new RangeError('newRecordId: prefix must be S, A or R');
  return `${prefix}-${randomChars(16, random)}`;
}

export const newSittingId = (random) => newRecordId('S', random);
export const newAttemptId = (random) => newRecordId('A', random);
export const newSelfReportId = (random) => newRecordId('R', random);
