/**
 * Store de session PIN par module (en mémoire uniquement).
 *
 * Un module reste déverrouillé tant que l'utilisateur navigue à l'intérieur
 * de cet onglet/module. Dès qu'il change d'onglet le module se reverrouille.
 *
 * Clés de module recommandées : 'stock', 'expenses', 'finance'
 */

const _unlocked = new Set();

export function unlockModule(key) {
  if (key) _unlocked.add(key);
}

export function lockModule(key) {
  if (key) _unlocked.delete(key);
}

export function isModuleUnlocked(key) {
  return key ? _unlocked.has(key) : false;
}

export function lockAll() {
  _unlocked.clear();
}
