// Les données de Substituer (u4, son choix du 19.10), lues en direct dans le moteur v4, sans grille précalculée.
// - Les remplaçants : substitutes() du moteur (substitution calculée v1), au moment et à la dose de l'ajout, au style
//   de la recette, poids du contexte (60′ : arôme 0,2, huiles 0,2, amertume 0,6). u4 en montre huit : les cinq
//   premiers du catalogue et les trois premiers du stock (le premier du stock qui suffit toujours compris).
// - La plage de u4 : une composante inconnue s'ouvre de 0 à 100 avec les poids du moteur (calcul de l'écran, écrit
//   dans « Lire ces scores ») ; une composante connue reste celle du moteur. Rangés par le pire cas (bas de plage).
// - Le face à face : α et β par source (Beer Maverick, Hopsteiner), huiles (Beer Maverick ; linalol Hopsteiner),
//   familles des fiches (niveau, N/M), mots et styles d'emploi des fiches : catalogue du moteur (hopRef).
import { DONNEES_POUVOIR, familyWords, hopRef, substitutes, type FamilyId } from '../../../../../../src/domain/hopIndex/v4';
import { houblon, style, type HoublonLu } from '../../moteur';
import { proposable } from '../../moteur/donnees';
import { memo } from '../../moteur/mesure';
import type { AjoutParcours, RecetteParcours } from '../../etat/types';

export type EtatStock = 'acheter' | 'suffisant' | 'insuffisant' | 'epuise';
export const TEXTE_STOCK: Record<EtatStock, string> = { acheter: 'À acheter', suffisant: 'En stock, suffisant', insuffisant: 'En stock, insuffisant', epuise: 'Épuisé' };

export interface Candidat {
  cle: string; nom: string; h: HoublonLu;
  /** Score du moteur (poids renormalisés sur les composantes connues). */
  moteur: number; palier: string;
  composantes: { arome: number | null; huiles: number | null; amertume: number | null };
  /** Plage de u4 : bas = inconnue à 0, haut = inconnue à 100 ; égaux si tout est connu. */
  min: number; max: number;
  stock: EtatStock; libre: number | null;
  dose: { grams: number; min: number; max: number; regle: string };
  perd: FamilyId[]; gagne: FamilyId[];
  /** D'où il vient dans u4 : premiers du catalogue, ou premiers du stock. */
  vient: 'catalogue' | 'stock';
  rangMoteur: number;
}
export interface Lecture {
  contexte: string; poids: { arome: number; huiles: number; amertume: number };
  candidats: Candidat[]; total: number; stockRangs: { nom: string; rang: number }[];
}

const etatDe = (s: { etat: string; suffisant: boolean | null }): EtatStock =>
  s.etat === 'à acheter' ? 'acheter' : s.etat === 'épuisé' ? 'epuise' : s.suffisant === false ? 'insuffisant' : 'suffisant';

const cleR = (r: RecetteParcours, a: AjoutParcours) => `${r.styleCode}|${r.volumeL}|${r.og}|${r.boilMin}|${a.hopKey}|${a.moment}|${a.grams}|${r.additions.map((x) => x.hopKey + ':' + x.grams).join(',')}`;

/** Les huit remplaçants de u4 et la règle du moteur, pour un ajout. */
export const lireRemplacants = memo<[RecetteParcours, AjoutParcours], Lecture>('substituer-u4', (r, a) => cleR(r, a), (recette, a) => {
  const res = substitutes(a.hopKey, { moment: a.moment, grams: a.grams, recipe: recette, style: style(recette.styleCode), stockFirst: false });
  const w = res.poids;
  const tous = res.remplacants.filter((s) => proposable(s.key));
  const versCandidat = (s: (typeof tous)[number], vient: Candidat['vient']): Candidat => {
    const c = s.composantes;
    const inconnues = (Object.keys(w) as (keyof typeof w)[]).filter((k) => c[k] === null);
    const base = (Object.keys(w) as (keyof typeof w)[]).reduce((t, k) => t + (c[k] ?? 0) * w[k], 0);
    const min = inconnues.length ? Math.round(base) : s.score;
    const max = inconnues.length ? Math.round(base + inconnues.reduce((t, k) => t + 100 * w[k], 0)) : s.score;
    return {
      cle: s.key, nom: s.name, h: houblon(s.key), moteur: s.score, palier: s.palier, composantes: c, min, max,
      stock: etatDe(s.stock), libre: s.stock.libre,
      dose: { grams: s.dose.grams, min: s.dose.min, max: s.dose.max, regle: s.dose.regle },
      perd: s.familles.perd.map((m) => m.family), gagne: s.familles.gagne.map((m) => m.family), vient, rangMoteur: s.rank,
    };
  };
  const catalogue = tous.filter((s) => s.stock.etat !== 'en stock').slice(0, 5).map((s) => versCandidat(s, 'catalogue'));
  const enStock = tous.filter((s) => s.stock.etat === 'en stock');
  let stock = enStock.slice(0, 3);
  const suffit = enStock.find((s) => s.stock.suffisant !== false);
  if (suffit && !stock.includes(suffit)) stock = [...stock.slice(0, 2), suffit];
  const candidats = [...catalogue, ...stock.map((s) => versCandidat(s, 'stock'))]
    .sort((x, y) => y.min - x.min || y.max - x.max || x.nom.localeCompare(y.nom, 'fr'));
  const stockRangs = stock.map((s) => ({ nom: s.name, rang: tous.indexOf(s) + 1 }));
  return { contexte: res.contexte, poids: w, candidats, total: res.candidats, stockRangs };
});

/** Le stock de l'original (son lot au stock moins ce que la recette en prend). */
export function stockOriginal(h: HoublonLu, recette: RecetteParcours): EtatStock {
  if (h.stock == null) return 'acheter';
  const pris = recette.additions.filter((x) => x.hopKey === h.cle).reduce((t, x) => t + x.grams, 0);
  return h.stock <= 0 || h.stock - pris < 0 ? 'epuise' : 'suffisant';
}

// ---------- Les mesures du face à face, par source ----------
export type Intervalle = [number, number];
export interface Mesures {
  alpha: { src: { qui: string; r: Intervalle }[]; lot: { v: number; origine: 'lot' | 'article' } | null };
  beta: { src: { qui: string; r: Intervalle }[] };
  huiles: Record<'myrcene' | 'humulene' | 'caryophyllene' | 'linalool', Intervalle | null>;
  /** Mots des fiches (Beer Maverick d'abord) et styles d'emploi attestés par un fournisseur. */
  mots: string[]; motsSource: string; styles: string[]; stylesSource: string | null;
}
export function mesures(h: HoublonLu): Mesures {
  const ref = hopRef(h.cle);
  const c = ref?.catalogue;
  const src = (bm: Intervalle | null | undefined, hs: Intervalle | null | undefined) =>
    [...(bm ? [{ qui: 'Beer Maverick', r: bm }] : []), ...(hs ? [{ qui: 'Hopsteiner', r: hs }] : [])];
  const lotA = h.alpha && !/^plage/.test(h.alpha.source) ? { v: h.alpha.valeur, origine: /article/.test(h.alpha.source) ? 'article' as const : 'lot' as const } : null;
  const w = ref ? familyWords(ref.varietyId, ref.catalogue) : null;
  const tous = w ? [...new Set([...(c?.tagsFr ?? []), ...Object.values(w.mots).flatMap((l) => l.flatMap((x) => x.mots)), ...w.sansFamille.map((x) => x.mot)].map((m) => m.toLowerCase()))] : [];
  const usage = c?.usage?.find((u) => u.styles.length) ?? null;
  return {
    alpha: { src: src(c?.alpha, c?.hs?.alpha), lot: lotA },
    beta: { src: src(c?.beta, c?.hs?.beta) },
    huiles: { myrcene: c?.oils.myrcene ?? null, humulene: c?.oils.humulene ?? null, caryophyllene: c?.oils.caryophyllene ?? null, linalool: c?.hsLinalool?.range ?? null },
    mots: (c?.tagsFr?.length ? c.tagsFr.map((m) => m.toLowerCase()) : tous).slice(0, 6), motsSource: c?.tagsFr?.length ? 'Beer Maverick' : 'fiches',
    styles: usage?.styles.slice(0, 3) ?? [], stylesSource: usage?.source ? usage.source.split(/[,—]/)[0].trim() : null,
  };
}

// ---------- D130 : ses mots hors des familles (« Les type spéciaux des houblons hors 16d ! ») ----------
/** Mots génériques ou noms de famille, qui ne disent rien de propre au houblon (flb5b : « fruité », « fruits tropicaux »). */
const GENERIQUE = /^(fruit(é|ée|y|s|ée?s)?|fruits? tropicaux|tropical|aromatique|arôme|houblon|doux|léger|intense|complexe|agréable)$/i;
/** Un mot qui n'est que le nom d'une famille, écrit autrement (« resiny ») : la famille le dit déjà, il n'est pas propre au houblon. */
const NOM_DE_FAMILLE = /^(r[ée]sin|citr|agrum|flor|fleur|herb|terr|earth|[ée]pic|spic|tropic|berr|bai|melon|noyau|stone|p[ée]pin|v[ée]g[ée]tal|green|pine|pin)/i;
/** Traductions sûres de mots de fiches restés en anglais ou en italien. */
const FR: Record<string, string> = { tabacco: 'tabac', tobacco: 'tabac', marmalade: 'marmelade', ginger: 'gingembre', licorice: 'réglisse', onion: 'oignon', garlic: 'ail', catty: 'urine de chat', lilac: 'lilas', chamomile: 'camomille', gooseberry: 'groseille à maquereau', 'white wine': 'vin blanc', grape: 'raisin' };
/** Les mots de ses fiches qu'aucune famille ne range (sansFamille du moteur), sans doublon ni mot générique, et le nombre de
 * fiches qui les citent ; plus tous ses mots (rangés ou non), pour dire ce qu'il est seul à avoir face aux autres. */
export function motsHors(cle: string): { hors: { mot: string; fiches: number }[]; tous: Set<string> } {
  const ref = hopRef(cle);
  if (!ref) return { hors: [], tous: new Set() };
  const w = familyWords(ref.varietyId, ref.catalogue);
  const compte = new Map<string, { mot: string; fiches: Set<string> }>();
  for (const x of w.sansFamille) {
    const brut = x.mot.toLowerCase().trim();
    const k = FR[brut] ?? brut;
    if (!k || GENERIQUE.test(k) || NOM_DE_FAMILLE.test(brut)) continue;
    const e = compte.get(k) ?? { mot: k, fiches: new Set<string>() };
    e.fiches.add(x.source); compte.set(k, e);
  }
  const tous = new Set([...compte.keys(), ...Object.values(w.mots).flatMap((l) => l.flatMap((r) => r.mots.map((m) => m.toLowerCase().trim()))), ...(ref.catalogue.tagsFr ?? []).map((m) => m.toLowerCase())]);
  const hors = [...compte.values()].map((e) => ({ mot: e.mot, fiches: e.fiches.size })).sort((a, b) => b.fiches - a.fiches);
  return { hors, tous };
}

// ---------- D130 bis : la matrice des huiles (grammaire de flb5b) ----------
export type LigneHuile = 'totale' | 'myrcene' | 'humulene' | 'caryophyllene' | 'farnesene' | 'linalol' | 'geraniol';
export const LIGNES_HUILE: { id: LigneHuile; nom: string; unite: string }[] = [
  { id: 'totale', nom: 'huile totale', unite: 'mL/100 g' }, { id: 'myrcene', nom: 'myrcène', unite: '%' }, { id: 'humulene', nom: 'humulène', unite: '%' },
  { id: 'caryophyllene', nom: 'caryophyllène', unite: '%' }, { id: 'farnesene', nom: 'farnésène', unite: '%' }, { id: 'linalol', nom: 'linalol', unite: '%' },
  { id: 'geraniol', nom: 'géraniol', unite: '%' },
];
/** Les valeurs des fiches d'un houblon, en plage (enveloppe des sources), ou null quand aucune fiche ne la donne (jamais 0) :
 * src/data/hopV4/composes-houblon.json d'abord (8 variétés, toutes ses sources), sinon le catalogue (Beer Maverick ; linalol Hopsteiner). */
export function huilesDe(cle: string): Record<LigneHuile, Intervalle | null> {
  const ref = hopRef(cle);
  const c = ref?.catalogue;
  const v = (DONNEES_POUVOIR.varietes as Record<string, { huile?: { valeurs: { plage: Intervalle }[] | null }; composes?: Record<string, { valeurs: { plage: Intervalle }[] | null }> }>)[cle];
  const env = (vs: { plage: Intervalle }[] | null | undefined): Intervalle | null => (vs?.length ? [Math.min(...vs.map((x) => x.plage[0])), Math.max(...vs.map((x) => x.plage[1]))] : null);
  const env2 = (...rs: (Intervalle | null | undefined)[]): Intervalle | null => { const l = rs.filter((r): r is Intervalle => !!r); return l.length ? [Math.min(...l.map((r) => r[0])), Math.max(...l.map((r) => r[1]))] : null; };
  const de = (k: string) => env(v?.composes?.[k]?.valeurs);
  return {
    totale: env(v?.huile?.valeurs) ?? env2(c?.oil, c?.hs?.totalOil),
    myrcene: de('myrcene') ?? c?.oils.myrcene ?? null,
    humulene: de('humulene') ?? c?.oils.humulene ?? null,
    caryophyllene: de('caryophyllene') ?? c?.oils.caryophyllene ?? null,
    farnesene: de('farnesene'),
    linalol: de('linalol') ?? c?.hsLinalool?.range ?? null,
    geraniol: de('geraniol'),
  };
}
