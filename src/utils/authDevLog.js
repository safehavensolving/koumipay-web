/**
 * Logs auth flow en DEV uniquement (jamais le jeton complet).
 * @param {string} step
 * @param {Record<string, unknown>} [meta]
 */
export function authDevLog(step, meta = {}) {
  if (!import.meta.env.DEV) {
    return;
  }
  console.log(`[KoumiAuth] ${step}`, meta);
}
