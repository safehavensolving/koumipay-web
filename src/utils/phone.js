/** Normalise un numéro vers E.164 Guinée (+224…) — aligné backend `normalize_guinea_phone`. */
export function normalizeGuineaPhone(value) {
  let s = (value || '').trim().replace(/\s/g, '');
  if (!s.startsWith('+')) {
    if (s.startsWith('224')) {
      s = `+${s}`;
    } else if (s.startsWith('0') && s.length >= 9) {
      s = `+224${s.replace(/^0+/, '')}`;
    } else if (/^\d{8,9}$/.test(s)) {
      s = `+224${s}`;
    }
  }
  return s;
}

/**
 * Formate une saisie de numéro guinéen au format local lisible : "620 00 00 00".
 * Accepte le collage d'un numéro avec indicatif (+224, 224, 0) qui est alors retiré.
 */
export function formatGuineaPhoneInput(raw) {
  let digits = (raw || '').replace(/\D/g, '');
  if (digits.startsWith('224') && digits.length > 9) {
    digits = digits.slice(3);
  } else if (digits.startsWith('0') && digits.length > 9) {
    digits = digits.replace(/^0+/, '');
  }
  digits = digits.slice(0, 9);
  const groups = [digits.slice(0, 3), digits.slice(3, 5), digits.slice(5, 7), digits.slice(7, 9)];
  return groups.filter(Boolean).join(' ');
}

const GN_PHONE = /^\+224\d{8,9}$/;

export function isValidGuineaE164(phone) {
  return GN_PHONE.test(phone);
}

/**
 * Valide un numéro de contact guinéen saisi librement.
 * Retourne un message d'erreur (string) ou '' si valide.
 */
export function validatePhone(raw) {
  const trimmed = (raw || '').trim();
  if (!trimmed) return 'Le numéro de téléphone est obligatoire.';
  if (!isValidGuineaE164(normalizeGuineaPhone(trimmed)))
    return 'Numéro invalide. Ex. : 623 58 58 55 ou +224623585855';
  return '';
}
