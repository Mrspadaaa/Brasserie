/**
 * Génération des références d'articles (MP-001, NT-004, LOT-012…).
 *
 * ⚠️ Pourquoi ce module existe : les références étaient tirées au hasard entre
 * 100 et 999 (`Math.floor(Math.random() * 900 + 100)`). Tant que le stock vivait
 * dans un tableau, une collision créait au pire un doublon gênant. Depuis la
 * bascule sur Firestore, la référence EST l'identifiant du document : une
 * collision écrase purement et simplement l'article existant, sans le moindre
 * avertissement.
 *
 * Avec 900 valeurs possibles et une trentaine d'articles déjà en stock, le
 * paradoxe des anniversaires rend l'accident probable bien avant la centième
 * saisie. On numérote donc séquentiellement à partir de l'existant.
 */

/** Extrait le numéro d'une référence du type `MP-014` ➔ 14. */
function numberOf(ref: string, prefix: string): number | null {
  const m = new RegExp(`^${prefix}-(\\d+)$`, 'i').exec((ref || '').trim());
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Renvoie la prochaine référence libre pour ce préfixe.
 *
 * On repart du plus grand numéro existant plutôt que du nombre d'articles :
 * supprimer un article ne doit pas faire réattribuer sa référence à un autre,
 * sinon l'historique des mouvements pointerait sur le mauvais produit.
 */
export function nextRef(prefix: string, existingRefs: string[], pad = 3): string {
  let max = 0;
  existingRefs.forEach((r) => {
    const n = numberOf(r, prefix);
    if (n !== null && n > max) max = n;
  });
  return `${prefix}-${String(max + 1).padStart(pad, '0')}`;
}

/**
 * Variante défensive : garantit l'unicité même si le préfixe est déjà utilisé
 * avec un format différent (références importées à la main, par exemple).
 */
export function nextUniqueRef(prefix: string, existingRefs: string[], pad = 3): string {
  const taken = new Set(existingRefs.map((r) => (r || '').trim().toUpperCase()));
  let candidate = nextRef(prefix, existingRefs, pad);
  let guard = 0;
  while (taken.has(candidate.toUpperCase()) && guard < 10000) {
    const n = (numberOf(candidate, prefix) ?? 0) + 1;
    candidate = `${prefix}-${String(n).padStart(pad, '0')}`;
    guard += 1;
  }
  return candidate;
}

/** Identifiant de brassin : LOT-001, LOT-002… */
export function nextBatchId(existingIds: string[]): string {
  return nextUniqueRef('LOT', existingIds);
}

/** Identifiant de client : CL-001, CL-002… */
export function nextClientId(existingIds: string[]): string {
  return nextUniqueRef('CL', existingIds);
}
