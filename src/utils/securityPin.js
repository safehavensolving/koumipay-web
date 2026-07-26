export const SECURITY_PIN_LENGTH = 4;

const DEFAULT_PIN_META = {
  enabled: false,
  lastUpdatedAt: null,
};

/** Identifiant de l'utilisateur courant — défini après login, effacé au logout (cf. AuthContext). */
let _pinUserId = null;

export function setPinUserId(userId) {
  _pinUserId = userId ? String(userId).trim() : null;
}

function sanitizeKeySegment(raw) {
  return String(raw).replace(/[^a-zA-Z0-9._-]/g, '_');
}

function pinHashKey() {
  return _pinUserId ? `koumi_pin_hash_v1_${sanitizeKeySegment(_pinUserId)}` : 'koumi_security_pin_hash_v1';
}

function pinMetaKey() {
  return _pinUserId ? `koumi_pin_meta_v1_${sanitizeKeySegment(_pinUserId)}` : 'koumi_security_pin_meta_v1';
}

function safeString(value) {
  return String(value ?? '').trim();
}

function normalizePinMeta(raw = {}) {
  return {
    ...DEFAULT_PIN_META,
    enabled: Boolean(raw?.enabled),
    lastUpdatedAt: safeString(raw?.lastUpdatedAt) || null,
  };
}

function normalizePin(pin) {
  return String(pin || '').replace(/\D/g, '').slice(0, SECURITY_PIN_LENGTH);
}

async function hashPin(pin) {
  const normalized = normalizePin(pin);
  const data = new TextEncoder().encode(`koumi-partner-pin::${normalized}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function loadSecurityPinMeta() {
  try {
    const raw = localStorage.getItem(pinMetaKey());
    return normalizePinMeta(raw ? JSON.parse(raw) : {});
  } catch {
    return normalizePinMeta();
  }
}

export function hasSecurityPin() {
  const meta = loadSecurityPinMeta();
  const hash = localStorage.getItem(pinHashKey());
  return Boolean(meta.enabled && safeString(hash));
}

export async function saveSecurityPin(pin) {
  const normalized = normalizePin(pin);
  if (normalized.length !== SECURITY_PIN_LENGTH) {
    throw new Error(`Le code PIN doit contenir ${SECURITY_PIN_LENGTH} chiffres.`);
  }
  const hash = await hashPin(normalized);
  const meta = {
    enabled: true,
    lastUpdatedAt: new Date().toISOString(),
  };
  localStorage.setItem(pinHashKey(), hash);
  localStorage.setItem(pinMetaKey(), JSON.stringify(meta));
  return meta;
}

export async function verifySecurityPin(pin) {
  const storedHash = localStorage.getItem(pinHashKey());
  if (!storedHash) return false;
  const currentHash = await hashPin(pin);
  return storedHash === currentHash;
}

export function clearSecurityPin() {
  localStorage.removeItem(pinHashKey());
  localStorage.removeItem(pinMetaKey());
}
