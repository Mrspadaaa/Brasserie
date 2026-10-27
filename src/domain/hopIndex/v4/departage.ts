// Départage des voies à distance égale (voie g2a, D88). Dans proposeVoies, l'effet d'une famille citée ne dépend pas de la variété :
// à distance égale (dry hop : 23 houblons ex æquo sur la 21C), la liste se range par ordre alphabétique. Une clé de plus,
// APRÈS la distance et JAMAIS dans l'effet calculé : les barres de q2b restent identiques, seul l'ordre à l'intérieur d'un groupe
// d'ex æquo change. Trois clés candidates, aucune n'est le défaut (`'aucun'` : comportement d'avant, à l'octet près).
//  - k1 : la cascade de g1 — fiche marquée, premier descripteur, part des fiches, puis le signal d'huile de la famille, à défaut l'huile totale.
//  - k2 : part des fiches qui citent la famille, puis le signal d'huile PROPRE à la famille (jamais l'huile totale).
//  - k3 : la valeur de la famille sur le radar Beer Maverick (181 variétés), lue pour l'ordre seulement, jamais affichée comme une intensité.
// Règles communes : l'inconnu passe après le connu, jamais à 0 ; une clé est un vecteur comparé dans l'ordre, du plus grand au plus petit.
import { hopRef, type CatalogueHop } from './data';
import { cites, describeFamilies } from './hops';
import type { FamilyId } from './families';
import { typiciteDe } from './typicite-acces';

/** `k3k1` (D118, f8) : DÉFAUT de Suggérer. Le radar Beer Maverick de la famille (k3) d'abord ; à radar égal, et pour une variété sans radar (l'inconnu passe après le connu), la cascade k1.
 * `aucun` : le comportement d'avant D118 (ordre alphabétique à distance égale), à l'octet près. */
export type Departage = 'aucun' | 'k1' | 'k2' | 'k3' | 'k3k1' | 'k3k1t';
/** Le départage quand l'option est absente (D118, le brasseur prend lui-même le radar Beer Maverick comme référence : Idaho 7, 27.10). */
export const DEPARTAGE_DEFAUT: Departage = 'k3k1';
/** Une valeur par étape ; null = inconnu (passe après le connu). */
export type Cle = (number | null)[];
/** Clé d'une voie, avec l'origine de chaque étape (la source de la valeur, null si inconnue). */
export interface CleDepartage { mode: Exclude<Departage, 'aucun'>; cle: Cle; origine: (string | null)[] }

/** Nom de chaque étape, par clé (même longueur que la clé). */
const ETAPES_K1 = ['fiche marquée', 'premier descripteur', 'part des fiches', 'niveau du signal (signal d’huile > huile totale)', 'valeur du signal ou de l’huile totale'];
export const ETAPES: Record<Exclude<Departage, 'aucun'>, string[]> = {
  k1: ETAPES_K1,
  k2: ['part des fiches', 'signal d’huile propre à la famille'],
  k3: ['radar Beer Maverick'],
  k3k1: ['famille citée par une fiche', 'radar Beer Maverick', ...ETAPES_K1],
  /** f9 (option `typicite`) : k3k1 avec la typicité du style (Beer Analytics) entre la famille citée et le radar. Jamais un filtre : une typicité inconnue passe après la connue. */
  k3k1t: ['famille citée par une fiche', 'typicité du style (Beer Analytics)', 'radar Beer Maverick', ...ETAPES_K1],
};

const mid = (r: [number, number] | null | undefined) => (r ? (r[0] + r[1]) / 2 : null);
const r4 = (x: number) => Math.round(x * 1e4) / 1e4;
const THIOL: Record<string, number> = { faible: 1, moyenne: 2, forte: 3 };
/** Axe du radar Beer Maverick (rang dans BM_AXES) qui correspond à une famille du moteur ; absent : pas d'axe (pomme/poire, melon, terreux). */
const AXE_RADAR: Partial<Record<FamilyId, number>> = { citrus: 0, tropical: 1, stoneFruit: 2, berries: 3, floral: 4, green: 5, herbal: 6, spice: 7, resin: 8 };

/** Signal d'huile propre à la famille : linalol (agrumes, floral), myrcène (résineux), classe de thiols (tropical). Les autres : aucun. */
export function signalDe(h: CatalogueHop, f: FamilyId): { valeur: number | null; origine: string | null } {
  if (f === 'citrus' || f === 'floral') { const v = mid(h.hsLinalool?.range); return v === null ? { valeur: null, origine: null } : { valeur: r4(v), origine: 'linalol Hopsteiner (% de l’huile)' }; }
  if (f === 'resin') { const v = mid(h.oils.myrcene); return v === null ? { valeur: null, origine: null } : { valeur: r4(v), origine: 'myrcène Beer Maverick (% de l’huile)' }; }
  if (f === 'tropical') { const c = h.hsThiol ? THIOL[h.hsThiol.class] : undefined; return c === undefined ? { valeur: null, origine: null } : { valeur: c, origine: `thiols Hopsteiner (classe ${h.hsThiol!.class})` }; }
  return { valeur: null, origine: null };
}
/** Huile totale (mL/100 g) : Hopsteiner, sinon Beer Maverick. */
export const huileTotaleDe = (h: CatalogueHop) => { const v = mid(h.hs?.totalOil) ?? mid(h.oil); return v === null ? null : r4(v); };
/** Valeur de la famille sur le radar Beer Maverick (0 à 5), null si la page n'en publie pas ou si la famille n'a pas d'axe. */
export function radarDe(h: CatalogueHop, f: FamilyId): number | null {
  const i = AXE_RADAR[f];
  const v = i === undefined ? undefined : h.bm?.arome?.[i];
  return v === undefined ? null : v;
}

/** Clé d'une variété pour une famille. */
export function cleHoublon(mode: Exclude<Departage, 'aucun'>, varietyId: string, f: FamilyId, styleCode = ''): { cle: Cle; origine: (string | null)[] } {
  if (mode === 'k3k1t') {
    const base = cleHoublon('k3k1', varietyId, f), t = typiciteDe(varietyId, styleCode);
    const lib = t.palier === null ? null : `${t.origine === 'voisin' ? 'voisin ' + t.code : 'style'}${t.part !== null ? ` ${Math.round(t.part * 1000) / 10} % des recettes` : ''}${t.concentration !== null ? `, ${Math.round(t.concentration * 100)} % de ses recettes dans la famille` : ''}`;
    return { cle: [base.cle[0], t.palier, ...base.cle.slice(1)], origine: [base.origine[0], lib, ...base.origine.slice(1)] };
  }
  if (mode === 'k3k1') {
    // Première étape : la famille est citée par une fiche au moins (sans elle, le moteur ne lui prête aucun effet : une voie qui n'atteint pas la visée ne passe pas devant celles qui l'atteignent).
    const citee = hopRef(varietyId) ? (cites(varietyId, f) ? 1 : 0) : null;
    const a = cleHoublon('k3', varietyId, f), b = cleHoublon('k1', varietyId, f);
    return { cle: [citee, ...a.cle, ...b.cle], origine: [citee === null ? null : citee ? 'citée par une fiche' : 'aucune fiche ne la cite', ...a.origine, ...b.origine] };
  }
  const h = hopRef(varietyId)?.catalogue;
  if (!h) return { cle: ETAPES[mode].map(() => null), origine: ETAPES[mode].map(() => null) };
  if (mode === 'k3') { const v = radarDe(h, f); return { cle: [v], origine: [v === null ? null : 'radar Beer Maverick (échelle de la source, ordre seulement)'] }; }
  const d = describeFamilies(varietyId)[f];
  const lues = d.of > 0; // aucune fiche lue : tout reste inconnu (jamais 0)
  const part = lues ? r4(d.sources / d.of) : null;
  const fiches = `${d.sources} fiche${d.sources > 1 ? 's' : ''} sur ${d.of}`;
  const sig = signalDe(h, f);
  if (mode === 'k2') return { cle: [part, sig.valeur], origine: [lues ? fiches : null, sig.origine] };
  const huile = huileTotaleDe(h);
  const niveau = sig.valeur !== null ? 2 : huile !== null ? 1 : null;
  const valeur = sig.valeur !== null ? sig.valeur : huile;
  return {
    cle: [lues ? (d.level === 'marqué' ? 1 : 0) : null, lues ? (d.first ? 1 : 0) : null, part, niveau, valeur],
    origine: [lues ? d.level : null, lues ? (d.first ? 'nommée en premier' : 'pas en premier') : null, lues ? fiches : null,
      sig.valeur !== null ? 'signal d’huile' : huile !== null ? 'huile totale' : null,
      sig.valeur !== null ? sig.origine : huile !== null ? 'huile totale (mL/100 g)' : null],
  };
}

/** Clé d'une voie : moyenne, sur les ajouts qui montent (poids = part de dose) et sur les familles visées à la hausse, de la clé
 * de chaque variété ; une étape inconnue pour l'un rend l'étape inconnue (jamais 0). Une voie sans ajout qui monte
 * (diminuer, retirer, levure) est neutre : tout est inconnu, elle passe après les voies connues à distance égale. */
export function cleDeVoie(mode: Exclude<Departage, 'aucun'>, positifs: { varietyId: string; poids: number }[], plus: FamilyId[], styleCode = ''): CleDepartage {
  const n = ETAPES[mode].length;
  const lignes = positifs.flatMap((p) => plus.map((f) => ({ w: p.poids, ...cleHoublon(mode, p.varietyId, f, styleCode) })));
  if (!lignes.length) return { mode, cle: Array.from({ length: n }, () => null), origine: Array.from({ length: n }, () => null) };
  const total = lignes.reduce((s, l) => s + l.w, 0);
  const cle: Cle = [], origine: (string | null)[] = [];
  for (let i = 0; i < n; i++) {
    if (lignes.some((l) => l.cle[i] === null)) { cle.push(null); origine.push(null); continue; }
    cle.push(r4(lignes.reduce((s, l) => s + l.w * (l.cle[i] as number), 0) / total));
    origine.push([...new Set(lignes.map((l) => l.origine[i]).filter((o): o is string => !!o))].join(' · '));
  }
  return { mode, cle, origine };
}

/** Compare deux clés : le plus grand d'abord, l'inconnu après le connu, 0 si égales (ou si l'une manque : mode 'aucun'). */
export function comparerCles(a?: Cle, b?: Cle): number {
  if (!a || !b) return 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i];
    if (x === y) continue;
    if (x === null) return 1;
    if (y === null) return -1;
    return y - x;
  }
  return 0;
}
