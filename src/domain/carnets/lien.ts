/**
 * L'adresse canonique d'un lien (T25-5, tour 25 : le même lien collé deux fois créait deux articles, puis « 2 offres » du même vendeur).
 *
 * Deux adresses désignent la même page quand elles ne diffèrent que par ce qui ne change pas la page : le schéma (http ou https), « www »,
 * la casse de l'hôte, le « # », le « / » final, l'ordre des paramètres et les paramètres de suivi (utm_*, gclid, fbclid…). Un paramètre qui
 * choisit une variante (`?groesse=50-g`) reste : deux variantes sont deux articles. Méthode standard « URL normalization » (RFC 3986 §6),
 * sans bibliothèque : `URL` et `URLSearchParams` suffisent ; aucune adresse n'est devinée (illisible → `null`).
 */
const SUIVI = /^(?:utm_.+|gclid|gclsrc|gad_.+|gbraid|wbraid|fbclid|msclkid|dclid|yclid|mc_(?:cid|eid)|_ga|_gl|srsltid|igshid|campaignid|adgroupid|ref|ref_)$/i;

export function lienCanonique(brut: string): string | null {
  try {
    const u = new URL(brut.trim());
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    const hote = u.hostname.toLowerCase().replace(/^www\./, '');
    if (!hote.includes('.')) return null;
    const params = [...u.searchParams.entries()].filter(([k]) => !SUIVI.test(k)).sort(([a, x], [b, y]) => a.localeCompare(b) || x.localeCompare(y));
    const q = new URLSearchParams(params).toString();
    return `${hote}${u.pathname.replace(/\/+$/, '')}${q ? `?${q}` : ''}`;
  } catch { return null; }
}
