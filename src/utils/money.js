/** Affichage montants en GNF (sans conversion devise). */
export function formatGnf(amount) {
  const n = Math.round(Number(amount) || 0);
  return `${n.toLocaleString('fr-GN')} GNF`;
}
