// s1-sources-lignes (26.10) : un trait par plage qui diffère, jamais deux traits pour la même valeur.
// Ses mots : « Bien montré les différents source, comme ici pour lotus, c'est déjà bien fait normalement mais pas oublier.
// Après si plusieurs sources disent la même chose pas besoin de toutes les montrer ».
//
// La règle (exigence transversale, L05), pour toute barre de valeur qui montre ses sources en traits fins :
//  - chaque source dont la plage diffère a son trait ;
//  - les sources qui donnent la même plage n'ont qu'un trait ; leurs noms vont au survol (`noms`) ;
//  - « la même plage » : mêmes bornes une fois arrondies à la précision affichée (5–6 et 5,0–6,0 : la même) ;
//  - toutes les sources comptent, celles du catalogue comme celles de complements.json ; rien n'est caché, aucun « +n ».
// Fonction pure : aucune lecture de données ici (la lecture est dans sourcesMesures.ts).

export type Plage = [number, number];
/** Une source et la plage qu'elle donne : `nom` pour le survol, `ref` pour la référence courte (BM, HS, BH…). */
export interface SourcePlage { nom: string; ref: string; r: Plage }
/** Un trait : une plage, et les noms de toutes les sources qui la donnent (au moins un). */
export interface TraitSource { r: Plage; noms: string[]; refs: string[] }

/** Précision de l'écran : les barres α et β de Substituer écrivent deux décimales au plus (`plage(lo, hi, 2)`). */
export const PRECISION_AFFICHEE = 2;

/** Une borne arrondie à la précision affichée (`Number(toFixed)` : 5 et 5,0 donnent la même clé ; pas de 0,1 + 0,2 en cache). */
const arrondi = (x: number, decimales: number) => Number(x.toFixed(decimales));
/** La clé de comparaison d'une plage : ses deux bornes, arrondies. */
export const clePlage = (r: Plage, decimales = PRECISION_AFFICHEE): string => `${arrondi(r[0], decimales)}|${arrondi(r[1], decimales)}`;

/** Les traits à dessiner : un par plage distincte (après arrondi), dans l'ordre de première apparition, avec les noms de leurs
 * sources (sans doublon). Une plage non finie ou renversée est écartée : un trait ne se dessine pas avec une borne inconnue. */
export function dedoublonnerPlages(sources: SourcePlage[], decimales = PRECISION_AFFICHEE): TraitSource[] {
  const traits = new Map<string, TraitSource>();
  for (const s of sources) {
    const [lo, hi] = s.r;
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo > hi) continue;
    const k = clePlage(s.r, decimales);
    const t = traits.get(k);
    if (!t) { traits.set(k, { r: [lo, hi], noms: [s.nom], refs: [s.ref] }); continue; }
    if (!t.noms.includes(s.nom)) t.noms.push(s.nom);
    if (!t.refs.includes(s.ref)) t.refs.push(s.ref);
  }
  return [...traits.values()];
}

/** L'enveloppe de toutes les sources (du plus bas au plus haut), ou null sans source : l'inconnu n'est jamais 0. */
export function enveloppeDesPlages(sources: { r: Plage }[]): Plage | null {
  const bonnes = sources.filter((s) => Number.isFinite(s.r[0]) && Number.isFinite(s.r[1]) && s.r[0] <= s.r[1]);
  return bonnes.length ? [Math.min(...bonnes.map((s) => s.r[0])), Math.max(...bonnes.map((s) => s.r[1]))] : null;
}

/** Le milieu moyen des sources : chaque source compte une fois, même quand plusieurs partagent un trait (leur accord pèse). */
export function milieuMoyen(traits: TraitSource[]): number | null {
  const n = traits.reduce((t, x) => t + x.noms.length, 0);
  return n ? traits.reduce((t, x) => t + ((x.r[0] + x.r[1]) / 2) * x.noms.length, 0) / n : null;
}

/** La légende d'un trait au survol : « 5,5–6 » ou « 5,5–6 · 2 sources d'accord ». D168 (26.10) : aucun nom de source ici (« un endroit
 * qui renvoie la source suffit » : la section Sources de la fiche) ; les noms restent dans `noms` pour la donnée (data-sources). */
export function titreTrait(t: TraitSource, ecrire: (lo: number, hi: number) => string): string {
  const texte = ecrire(t.r[0], t.r[1]);
  return t.noms.length > 1 ? `${texte} · ${t.noms.length} sources d’accord` : texte;
}
