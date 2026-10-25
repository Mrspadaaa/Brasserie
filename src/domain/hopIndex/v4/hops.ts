import { createHopExtrapolationCache, hopDescriptorEvidence } from '../../../../functions/src/hopExtrapolationCore';
import { suggestedHopVarieties } from '../styleSelection';
import type { HopVariety } from '../../../../functions/src/hopIndexSchema';
import { courant, engineData, EXTRAPOLATION, POLICY, local, stock as stockDuMoteur, varietyById, hopRef, type HopRef } from './data';
import { Lru, borneHoublons } from './lru';
import { nombreFr } from './nombres';
import { FAMILIES, type FamilyId } from './families';
import { MOMENTS, predictTriplet, profileOf, tripletOf, yeastInfo, type FamilyEstimate, type MomentId, type Recipe, type YeastInfo } from './recipe';
import type { StyleScale } from './style/scale';

// ---------- Descripteurs (preuve documentaire V5.5) ----------
// Preuves documentaires (t2, point 2). hopDescriptorEvidence garde son cache par l'IDENTITÉ de la variété et du tableau de
// termes : appelée 12 fois par variété et par lecture (24 avec les premiers mots), elle pesait 47 % d'un toucher.
// Corrigé ici, chez l'appelant (functions/ intact) : un cache par moteur, des tableaux de termes stables (`terms`), et une
// passe par fiche. Le texte des fiches et les termes sont normalisés PAR hopDescriptorEvidence (règle du serveur, lue
// dans son cache : descriptorTexts, descriptorTerms) ; la passe cherche ensuite chaque terme mot à mot, ce qui équivaut à
// ` ${mots} `.includes(` ${terme} `) (mots séparés d'une seule espace), avec la même négation (« no », « sans »…).
// Équivalence vérifiée sur tout le catalogue (tests/fabrique.test.ts, référence : hopDescriptorEvidence seul).
const cache = () => local('hops:preuves', createHopExtrapolationCache);
const NO_TERMS: string[] = [];
const terms = new Map(EXTRAPOLATION.axes.map((a) => [a.id, a.terms]));
const termsOf = (f: FamilyId) => terms.get(f) ?? NO_TERMS;
type Desc = HopVariety['descriptions'][number];
type Preuves = Record<FamilyId, Desc[]>;
interface Jeton { bit: number; suite: string; negations: string[] }
/** Termes normalisés de toutes les familles, rangés par premier mot. */
const jetons = () => local('hops:jetons', () => {
  const c = cache();
  const sonde: HopVariety = { id: '', name: '', aliases: [], form: 'unknown', descriptions: [], analysis: [] };
  const parMot = new Map<string, Jeton[]>();
  for (const f of FAMILIES) {
    hopDescriptorEvidence(sonde, termsOf(f), c);
    for (const t of c.descriptorTerms.get(termsOf(f)) ?? []) {
      const mots = t.token.trim().split(' ');
      const j = { bit: 1 << FAMILIES.indexOf(f), suite: mots.length > 1 ? ` ${mots.slice(1).join(' ')} ` : '', negations: t.negated };
      const l = parMot.get(mots[0]);
      if (l) l.push(j); else parMot.set(mots[0], [j]);
    }
  }
  return parMot;
});
/** Familles qu'une fiche normalisée (« mots » entre espaces) cite sans négation : un bit par famille (ordre de FAMILIES). */
function masqueDe(mots: string): number {
  // « mots » = ` w1 w2 … ` (une espace entre deux mots, une à chaque bout) : chaque mot est lu entre deux espaces ; un terme
  // de plusieurs mots continue par sa suite (` t2 … `) juste après le premier mot.
  const parMot = jetons();
  let out = 0, debut = 1;
  for (let fin = mots.indexOf(' ', debut); fin > 0; debut = fin + 1, fin = mots.indexOf(' ', debut)) {
    if (fin === debut) continue;
    const l = parMot.get(mots.slice(debut, fin));
    if (!l) continue;
    for (const j of l) {
      if (out & j.bit) continue;
      if ((!j.suite || mots.startsWith(j.suite, fin)) && !j.negations.some((n) => mots.includes(n))) out |= j.bit;
    }
  }
  return out;
}
/** Normalisation des textes de hopDescriptorEvidence (text, non exportée par functions/), recopiée pour le seul premier mot
 * d'une fiche (éviter une variété et une validation par fiche). Équivalence vérifiée contre hopDescriptorEvidence sur tout
 * le catalogue (tests/fabrique.test.ts) : un changement côté serveur fait échouer ce test. */
const normaliser = (s: string) => s.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
/** Les fiches lisibles de v (hors contexte « bière », provenance valide), normalisées par hopDescriptorEvidence. */
function textesDe(v: HopVariety): { description: Desc; words: string }[] {
  const c = cache();
  hopDescriptorEvidence(v, termsOf(FAMILIES[0]), c);
  return c.descriptorTexts.get(v) ?? [];
}
/** Par famille, les fiches de la variété qui la citent, dans l'ordre des fiches : hopDescriptorEvidence(v, termes de f). */
function preuvesDe(v: HopVariety): Preuves {
  const p = Object.fromEntries(FAMILIES.map((f) => [f, [] as Desc[]])) as Preuves;
  for (const t of textesDe(v)) { const m = masqueDe(t.words); FAMILIES.forEach((f, i) => { if (m & (1 << i)) p[f].push(t.description); }); }
  return p;
}
export type Citation = 'cité' | 'non cité' | 'sans descripteur';
/** Famille citée dans une fiche du houblon, selon les termes du modèle V5.5 (hopDescriptorEvidence). */
export function citations(varietyId: string): Record<FamilyId, { status: Citation; sources: string[] }> {
  const v = varietyById().get(varietyId);
  const p = v ? preuvesDe(v) : null;
  const any = !!p && FAMILIES.some((f) => p[f].length > 0);
  return Object.fromEntries(FAMILIES.map((f) => {
    const ev = p ? p[f] : [];
    return [f, { status: ev.length ? 'cité' : any ? 'non cité' : 'sans descripteur', sources: [...new Set(ev.map((d) => d.source.author))] }];
  })) as Record<FamilyId, { status: Citation; sources: string[] }>;
}
export const cites = (varietyId: string, f: FamilyId) => citations(varietyId)[f].status === 'cité';

// ---------- Niveaux de citation (D25) ----------
export type DescriptionLevel = 'non décrit' | 'cité' | 'marqué';
export interface FamilyDescription {
  level: DescriptionLevel;
  /** « N fiches sur M » : fiches (sources distinctes) qui citent la famille, sur les fiches lues pour ce houblon. */
  sources: number; of: number;
  /** La famille est le premier descripteur d'au moins une fiche. */
  first: boolean;
  authors: string[];
}
const sourceKey = (d: { source: { author: string; reference: string } }) => `${d.source.author}|${d.source.reference}`;
/** Premier descripteur d'une description « … : a, b, c » (sans dièse ni point final). */
const firstItem = (text: string) => {
  // Même découpe que (text.split(':').slice(1).join(':') || text).split(/,|;| and /)[0].replace(/^[\s#]+|[\s.]+$/g, '') :
  // après le premier « : », avant le premier « , », « ; » ou « and », sans la regex de fin (lente sur une longue fin).
  const deux = text.indexOf(':');
  const reste = (deux >= 0 ? text.slice(deux + 1) : '') || text;
  let fin = reste.length;
  for (const sep of [',', ';', ' and ']) { const i = reste.indexOf(sep); if (i >= 0 && i < fin) fin = i; }
  let a = 0, b = fin;
  while (a < b && (reste[a] === '#' || ESPACE.test(reste[a]))) a++;
  while (b > a && (reste[b - 1] === '.' || ESPACE.test(reste[b - 1]))) b--;
  return reste.slice(a, b).replace(/[_-]+/g, ' ');
};
const ESPACE = /\s/;
/** Non décrit (aucune fiche), cité (une fiche), marqué (au moins deux fiches, ou premier descripteur d'une fiche).
 * Un « non décrit » reste « non décrit » : jamais une intensité nulle. */
/** Résultat partagé par moteur (cache borné, une entrée par variété) : à lire, jamais à modifier. */
export function describeFamilies(varietyId: string): Record<FamilyId, FamilyDescription> {
  const familles = local('hops:familles', () => new Lru<Record<FamilyId, FamilyDescription>>(borneHoublons(courant().catalogue.length)));
  return familles.obtenir(varietyId, () => decrireFamilles(varietyId));
}
function decrireFamilles(varietyId: string): Record<FamilyId, FamilyDescription> {
  const v = varietyById().get(varietyId);
  const descriptions = v?.descriptions ?? [];
  const all = new Set(descriptions.map(sourceKey));
  const textes = v ? textesDe(v) : [];
  const n = textes.length, masques: number[] = [], cles: string[] = [], auteurs: string[] = [];
  // Le premier descripteur de chaque fiche (firstItem) : « une fiche cite f en premier » = un bit de premier.
  let premier = 0;
  for (const t of textes) {
    masques.push(masqueDe(t.words)); cles.push(sourceKey(t.description)); auteurs.push(t.description.source.author);
    premier |= masqueDe(` ${normaliser(firstItem(t.description.text))} `);
  }
  const out = {} as Record<FamilyId, FamilyDescription>;
  for (let i = 0; i < FAMILIES.length; i++) {
    const bit = 1 << i, sources: string[] = [], authors: string[] = [];
    for (let k = 0; k < n; k++) {
      if (!(masques[k] & bit)) continue;
      if (!sources.includes(cles[k])) sources.push(cles[k]);
      if (!authors.includes(auteurs[k])) authors.push(auteurs[k]);
    }
    const first = (premier & bit) !== 0;
    const level: DescriptionLevel = sources.length === 0 ? 'non décrit' : sources.length >= 2 || first ? 'marqué' : 'cité';
    out[FAMILIES[i]] = { level, sources: sources.length, of: all.size, first, authors };
  }
  return out;
}

/** Les mots des fiches qui font chaque famille (#140, 19.10 : « sa fiche est plus fourni avec les
 * labels »). Chaque description est coupée comme firstItem (après « : », aux virgules, points-virgules
 * et « and ») ; chaque mot est rattaché par hopDescriptorEvidence, la règle des niveaux. Beer Maverick :
 * le mot français de son étiquette (tagsFr), sinon le mot de la fiche. Un mot qui ne fait aucune
 * famille est rendu à part, jamais rangé de force. premier : les fiches qui nomment la famille en
 * premier (le « nommé en premier » de describeFamilies). */
export interface FamilyWords {
  mots: Record<FamilyId, { source: string; mots: string[] }[]>;
  premier: Record<FamilyId, string[]>;
  sansFamille: { source: string; mot: string }[];
}
const itemsOf = (text: string) => (text.split(':').slice(1).join(':') || text).split(/,|;| and /)
  .map((s) => s.replace(/^[\s#]+|[\s.]+$/g, '').replace(/[_-]+/g, ' ')).filter(Boolean);
export function familyWords(varietyId: string, tags?: { tags: string[]; tagsFr: string[] }): FamilyWords {
  const v = varietyById().get(varietyId);
  const mots = Object.fromEntries(FAMILIES.map((f) => [f, [] as { source: string; mots: string[] }[]])) as FamilyWords['mots'];
  const premier = Object.fromEntries(FAMILIES.map((f) => [f, [] as string[]])) as FamilyWords['premier'];
  const sansFamille: FamilyWords['sansFamille'] = [];
  if (!v) return { mots, premier, sansFamille };
  const fr = (w: string) => {
    const i = tags ? tags.tags.findIndex((t) => t.toLowerCase().replace(/[_-]+/g, ' ') === w.toLowerCase()) : -1;
    return i >= 0 && tags!.tagsFr[i] ? tags!.tagsFr[i] : w;
  };
  for (const d of v.descriptions ?? []) {
    if (d.context === 'beer') continue;
    itemsOf(d.text).forEach((item, n) => {
      const seul = preuvesDe({ ...v, descriptions: [{ ...d, text: item }] });
      const fams = FAMILIES.filter((f) => seul[f].length > 0);
      // Le mot montré : sans le mot d'appel « étiquette » ; un même mot à la casse près n'est écrit qu'une fois.
      const mot = (d.source.author === 'Beer Maverick' ? fr(item) : item).replace(/^étiquette\s+/i, '');
      const deja = (l: string[]) => l.some((x) => x.toLowerCase() === mot.toLowerCase());
      if (!fams.length) { if (!sansFamille.some((x) => x.source === d.source.author && x.mot.toLowerCase() === mot.toLowerCase())) sansFamille.push({ source: d.source.author, mot }); return; }
      for (const f of fams) {
        let row = mots[f].find((r) => r.source === d.source.author);
        if (!row) mots[f].push((row = { source: d.source.author, mots: [] }));
        if (!deja(row.mots)) row.mots.push(mot);
        if (n === 0 && !premier[f].includes(d.source.author)) premier[f].push(d.source.author);
      }
    });
  }
  return { mots, premier, sansFamille };
}

// ---------- Profil d'un houblon à une dose de référence ----------
export interface Reference { moment: MomentId; doseGL: number; yeastId: string | null; volumeL: number; og: number; boilMin: number }
/** Référence commune à tous les houblons (échelles communes, R47) : préréglage whirlpool du solveur V5.5. */
export const REFERENCE: Reference = { moment: 'wp', doseGL: POLICY.defaults.whirlpool.doseGL!.central, yeastId: 'fermentis-us05', volumeL: 20, og: 1.05, boilMin: 60 };

export interface HopProfile {
  key: string; name: string; origin: string | null;
  inStock: number | null; alpha: HopRef['alpha'];
  reference: Reference & { label: string }; yeast: YeastInfo;
  families: Record<FamilyId, FamilyEstimate & { citation: Citation; description: FamilyDescription }>;
  descriptors: { beerMaverick: string[]; hopsteiner: string[]; cited: { text: string; author: string; reference: string }[] };
}
export function hopProfile(key: string, ref: Partial<Reference> = {}): HopProfile {
  const r = { ...REFERENCE, ...ref };
  const h = hopRef(key);
  if (!h) throw Error(`Houblon inconnu : ${key}`);
  const recipe: Recipe = { name: 'référence', styleCode: '', volumeL: r.volumeL, og: r.og, boilMin: r.boilMin, yeastId: r.yeastId, additions: [] };
  const p = predictTriplet(tripletOf({ id: 'ref', hopKey: key, moment: r.moment, grams: r.doseGL * r.volumeL }, recipe, h), {});
  const prof = profileOf(p);
  const cit = citations(h.varietyId), desc = describeFamilies(h.varietyId);
  return {
    key, name: h.name, origin: h.catalogue.origin, inStock: h.stock ? h.stock.grams : null, alpha: h.alpha,
    reference: { ...r, label: `${MOMENTS[r.moment].label}, ${nombreFr(r.doseGL)} g/L` }, yeast: yeastInfo(r.yeastId),
    families: Object.fromEntries(FAMILIES.map((f) => [f, { ...prof[f], citation: cit[f].status, description: desc[f] }])) as HopProfile['families'],
    descriptors: { beerMaverick: h.catalogue.tagsFr, hopsteiner: h.catalogue.descriptions.filter((d) => d.source.author === 'Hopsteiner').map((d) => d.text),
      cited: h.catalogue.descriptions.filter((d) => d.source.author !== 'Hopsteiner' && d.source.author !== 'Beer Maverick').map((d) => ({ text: d.text, author: d.source.author, reference: d.source.reference })) },
  };
}

// ---------- Adéquation au style (liste « Mes houblons ») ----------
export type FitClass = 'usage attesté' | 'cohérent' | 'peu documenté' | 'hors style' | 'non documenté';
export interface StyleFit { key: string; name: string; grams: number; fit: FitClass; conflicts: string[]; supports: FamilyId[]; usage: boolean; reasons: string[] }
/** Adéquation documentaire : familles indésirables citées (conflit), usage attesté pour ce style,
 * familles attendues citées. Aucun score chiffré (un rang chiffré ne serait pas crédible). */
export function styleFit(keys: string[], scale: StyleScale): StyleFit[] {
  const suggested = new Set(suggestedHopVarieties(keys.map((k) => varietyById().get(hopRef(k)!.varietyId)!), scale.name).map((v) => v.id));
  const rows = keys.map((key) => {
    const h = hopRef(key)!;
    const cit = citations(h.varietyId);
    const documented = FAMILIES.some((f) => cit[f].status !== 'sans descripteur');
    const conflicts = scale.documented ? FAMILIES.filter((f) => scale.families[f].status === 'indésirable' && cit[f].status === 'cité').map((f) => `${f} exclu par le style, cité dans la fiche`) : [];
    const supports = scale.documented ? scale.order.filter((f) => scale.families[f].status === 'attendue' && cit[f].status === 'cité') : [];
    const usage = suggested.has(h.varietyId);
    const fit: FitClass = conflicts.length ? 'hors style' : usage ? 'usage attesté' : !documented ? 'non documenté' : supports.length ? 'cohérent' : 'peu documenté';
    const reasons = [...(usage ? ['usage attesté par un fournisseur pour ce style (hopStyleUsageBootstrap)'] : []), ...(supports.length ? [`familles attendues citées : ${supports.join(', ')}`] : []), ...conflicts];
    return { key, name: h.name, grams: h.stock?.grams ?? 0, fit, conflicts, supports, usage, reasons };
  });
  const order: Record<FitClass, number> = { 'usage attesté': 0, cohérent: 1, 'peu documenté': 2, 'non documenté': 3, 'hors style': 4 };
  return rows.sort((a, b) => order[a.fit] - order[b.fit] || Number(b.grams > 0) - Number(a.grams > 0) || b.supports.length - a.supports.length || b.grams - a.grams || a.name.localeCompare(b.name, 'fr'));
}
export const stockKeys = (inStockOnly = false) => stockDuMoteur().filter((s) => !inStockOnly || s.grams > 0).map((s) => s.key);
export const engineVarieties = () => engineData().varieties;
