import { nombreFr } from '../nombreAffiche';

/**
 * Parts entières d'une liste de masses, qui font toujours 100 % (TL-17 : « 63 + 19 + 19 = 101 % » à la fiche, chaque part arrondie seule).
 * Méthode standard des parts entières (plus forts restes) : chaque part prend son entier, puis les points restants vont aux plus grands restes
 * (à égalité, à la masse la plus forte). Sans masse totale, aucune part n'est inventée : 0 partout.
 */
export function partsEntieres(masses: readonly number[]): number[] {
  const m = masses.map((x) => (Number.isFinite(x) && x > 0 ? x : 0));
  const total = m.reduce((s, x) => s + x, 0);
  if (total <= 0) return m.map(() => 0);
  const exactes = m.map((x) => (x / total) * 100);
  const bases = exactes.map(Math.floor);
  let reste = 100 - bases.reduce((s, x) => s + x, 0);
  const ordre = exactes
    .map((e, i) => ({ i, r: e - bases[i], masse: m[i] }))
    .sort((a, b) => b.r - a.r || b.masse - a.masse || a.i - b.i);
  for (const { i } of ordre) {
    if (reste <= 0) break;
    if (m[i] > 0) { bases[i] += 1; reste -= 1; }
  }
  return bases;
}

/** « 1 sachet », « 2 sachets » : seules les unités de comptage prennent un « s » ; g, kg, mL, L ne varient jamais (TL-24). */
const COMPTAGE = new Set(['sachet', 'pastille', 'gousse', 'pièce', 'piece', 'tube', 'flacon', 'pack', 'cube']);
export function uniteAccordee(unite: string | undefined, quantite: number): string {
  const u = (unite ?? '').trim();
  if (!u) return '';
  return quantite > 1 && COMPTAGE.has(u.toLowerCase()) && !/s$/i.test(u) ? `${u}s` : u;
}

/** TL-25 : le résumé d'une liste d'ajouts (« 2 ajouts · 1,3 kg »). Sans masse connue, le nombre seul : l'inconnu n'est jamais 0 kg. */
export function resumeAjouts(lignes: ReadonlyArray<{ weightKg: number }>): string {
  if (!lignes.length) return '';
  const kg = lignes.reduce((s, l) => s + (Number.isFinite(l.weightKg) && l.weightKg > 0 ? l.weightKg : 0), 0);
  const nb = `${lignes.length} ajout${lignes.length > 1 ? 's' : ''}`;
  return kg > 0 ? `${nb} · ${nombreFr(kg, 2)} kg` : nb;
}
