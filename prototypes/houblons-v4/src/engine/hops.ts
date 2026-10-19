import { createHopExtrapolationCache, hopDescriptorEvidence } from '@functions/hopExtrapolationCore';
import { suggestedHopVarieties } from '@app/domain/hopIndex/styleSelection';
import { ENGINE_DATA, EXTRAPOLATION, POLICY, STOCK, VARIETY_BY_ID, hopRef, type HopRef } from './data';
import { FAMILIES, type FamilyId } from './families';
import { MOMENTS, predictTriplet, profileOf, tripletOf, yeastInfo, type FamilyEstimate, type MomentId, type Recipe, type YeastInfo } from './recipe';
import type { StyleScale } from '../style/scale';

// ---------- Descripteurs (preuve documentaire V5.5) ----------
const cache = createHopExtrapolationCache();
const terms = new Map(EXTRAPOLATION.axes.map((a) => [a.id, a.terms]));
export type Citation = 'cité' | 'non cité' | 'sans descripteur';
/** Famille citée dans une fiche du houblon, selon les termes du modèle V5.5 (hopDescriptorEvidence). */
export function citations(varietyId: string): Record<FamilyId, { status: Citation; sources: string[] }> {
  const v = VARIETY_BY_ID.get(varietyId);
  const any = !!v && FAMILIES.some((f) => hopDescriptorEvidence(v, terms.get(f) ?? [], cache).length > 0);
  return Object.fromEntries(FAMILIES.map((f) => {
    const ev = v ? hopDescriptorEvidence(v, terms.get(f) ?? [], cache) : [];
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
const firstItem = (text: string) => (text.split(':').slice(1).join(':') || text).split(/,|;| and /)[0].replace(/^[\s#]+|[\s.]+$/g, '').replace(/[_-]+/g, ' ');
/** Non décrit (aucune fiche), cité (une fiche), marqué (au moins deux fiches, ou premier descripteur d'une fiche).
 * Un « non décrit » reste « non décrit » : jamais une intensité nulle. */
export function describeFamilies(varietyId: string): Record<FamilyId, FamilyDescription> {
  const v = VARIETY_BY_ID.get(varietyId);
  const descriptions = v?.descriptions ?? [];
  const all = new Set(descriptions.map(sourceKey));
  return Object.fromEntries(FAMILIES.map((f) => {
    const ev = v ? hopDescriptorEvidence(v, terms.get(f) ?? [], cache) : [];
    const keys = new Set(ev.map(sourceKey));
    const first = descriptions.some((d) => hopDescriptorEvidence({ ...v!, descriptions: [{ ...d, text: firstItem(d.text) }] }, terms.get(f) ?? []).length > 0);
    const level: DescriptionLevel = keys.size === 0 ? 'non décrit' : keys.size >= 2 || first ? 'marqué' : 'cité';
    return [f, { level, sources: keys.size, of: all.size, first, authors: [...new Set(ev.map((d) => d.source.author))] }];
  })) as Record<FamilyId, FamilyDescription>;
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
  const v = VARIETY_BY_ID.get(varietyId);
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
      const fams = FAMILIES.filter((f) => hopDescriptorEvidence({ ...v, descriptions: [{ ...d, text: item }] }, terms.get(f) ?? []).length > 0);
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
    reference: { ...r, label: `${MOMENTS[r.moment].label}, ${r.doseGL.toLocaleString('fr-CH')} g/L` }, yeast: yeastInfo(r.yeastId),
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
  const suggested = new Set(suggestedHopVarieties(keys.map((k) => VARIETY_BY_ID.get(hopRef(k)!.varietyId)!), scale.name).map((v) => v.id));
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
export const stockKeys = (inStockOnly = false) => STOCK.filter((s) => !inStockOnly || s.grams > 0).map((s) => s.key);
export const engineVarieties = () => ENGINE_DATA.varieties;
