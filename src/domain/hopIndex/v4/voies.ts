import { checkHopExclusions } from '../solver';
import { suggestedHopVarieties } from '../styleSelection';
import { AXES, catalogue as catalogueDuMoteur, local, stock as stockDuMoteur, varietyById, YEASTS, hopRef } from './data';
import { borneHoublons, Lru } from './lru';
import { FAMILIES, FAMILY_NAMES, type FamilyId } from './families';
import { citations, marquee } from './hops';
import {
  MOMENTS, additionIbu, gramsForIbu, ibuPerGram, matrixContext, recipeIbu, recipeProfile, searchDoses, tripletOf, yeastInfo,
  type Addition, type FamilyEstimate, type MatrixContext, type MomentId, type Profile, type Recipe, type RecipeProfile, type YeastInfo,
} from './recipe';
import { getStyleScale, type StyleScale } from './style/scale';
import { valueVerdict } from './style/verdict';
import type { Tasting } from './tasting';
import { goutsSets, type Gouts } from './gouts';
import { CHARACTERIZED_YEASTS, predictionDe, yeastChangeEffect } from './yeast';
import { cleDeVoie, comparerCles, type CleDepartage, type Departage } from './departage';
import {
  BORNES_DRYHOP_GL, GRILLE_DRYHOP_GL, RANKING_PALIER60, REGLE_DRYHOP, comparerGrammesPalier, comparerPalier, comparerUsagePalier, drapeauIbu, rangUsage,
  type DoseDryHop, type InfoPalier, type RegleDryHop,
} from './palier';

/** Direction relative à la recette : nombre de crans par famille (+1 « plus floral », −1 « moins résineux »). */
export type Direction = Partial<Record<FamilyId, number>>;

export interface Action {
  op: 'ajouter' | 'modifier' | 'retirer';
  additionId: string; hopKey: string; hopName: string; moment: MomentId; momentLabel: string;
  grams: number; gramsPerLitre: number; previousGrams?: number; previousHopKey?: string;
}
export type VoieType = 'ajouter' | 'augmenter' | 'diminuer' | 'retirer' | 'remplacer à IBU égal' | 'remplacer à masse égale' | 'assemblage' | 'levure';
export interface FamilyEffect {
  family: FamilyId;
  /** Variation prévue (points 0–100), somme signée des apports V5.5 des ajouts changés ; null si aucun apport établi. */
  central: number | null;
  /** Au moins un houblon changé cite cette famille dans une fiche. */
  established: boolean;
  /** Une partie des ajouts changés ne cite pas la famille : leur apport n'est pas compté. */
  partial: boolean;
}
export interface DirectedTarget {
  family: FamilyId; name: string; crans: number; status: string;
  /** Variation visée, en points : crans × cran du style. */
  delta: number; cran: number; width: number;
  current: FamilyEstimate; targetAbsolute: number | null;
  /** « dégustation » : retour dans la bande du style ; « modèle » : repère central ± crans ; null : inconnu. */
  targetFrom: 'dégustation' | 'modèle' | null;
  note: string | null;
}
export interface Voie {
  id: string; type: VoieType; label: string; domain: 'stock' | 'à acheter';
  actions: Action[]; estimated: boolean; estimatedWhy: string[];
  conflicts: string[];
  effect: Record<FamilyId, FamilyEffect>;
  /** Distance à la cible, en unités du style (largeurs de bande), par famille visée et au total. */
  distance: { total: number | null; byFamily: Partial<Record<FamilyId, number | null>> };
  stock: { status: 'suffisant' | 'manque' | 'à acheter'; missing: { hopKey: string; hopName: string; grams: number }[] };
  ibu: { before: number; after: number; drift: number; unknown: boolean };
  /** Débordement de style imputable à la voie : famille poussée au-dessus de la bande d'une famille
   * neutre ou indésirable, ou hors de la bande d'une famille attendue, en crans du style. */
  styleOverflow: StyleOverflow[]; overflowTotal: number;
  /** Effets de bord dans la bande : familles neutres ou indésirables non visées poussées vers le
   * haut par un apport établi, en crans du style (même sans sortir de la bande). */
  sideEffects: { family: FamilyId; status: string; crans: number }[]; sideTotal: number;
  after: Profile | null;
  /** Levier levure : changement de souche (de, vers), sinon absent. */
  yeastChange?: { from: string | null; to: string; toName: string };
  /** Rang partagé par les voies dont toutes les clés de classement sont égales. */
  rank: number; tieWith: string[];
  /** Clé de départage (g2a) : présente seulement si `options.departage` n'est pas 'aucun' et qu'une famille monte. Jamais un effet. */
  departage?: CleDepartage;
  /** g2b, option `palier60` : usage, α, bande d'IBU et drapeau d'un ajout d'amertume (60′ ajouté, ou « remplacer à IBU égal »). Rang D88 B : usage puis grammes. */
  palier?: InfoPalier;
  /** g2b, option `dryHop` : la dose du dry hop et ce qui la borne (null : elle s'approche au plus près de la visée). */
  dose?: DoseDryHop;
  /** g2b (options `palier60` et `dryHop`) : grammes libres du houblon ajouté dans le stock, null s'il n'y en a pas. Dit à part, jamais une dose. */
  enStock?: number | null;
  /** g2b : points à relire (dry hop cumulé au-dessus du repère de revue) ; jamais une exclusion. */
  drapeaux?: string[];
}
export interface StyleOverflow { family: FamilyId; status: string; band: [number, number]; crans: number; why: string }
export interface VoieResult {
  recipe: Recipe; style: StyleScale; yeast: YeastInfo; matrix: MatrixContext;
  before: RecipeProfile; ibu: number; direction: DirectedTarget[];
  voies: Voie[]; evaluated: number; skipped: { what: string; why: string }[]; notes: string[];
  ranking: string[];
  /** g2b, option `palier60` : les ajouts à 60′ pour +n IBU, rangés usage puis α (D88 B). Absent sans l'option. */
  palier60?: { ibuVise: number; ibuAvant: number; bande: [number, number] | null; voies: Voie[]; ranking: string[]; notes: string[] };
  /** g2b, option `dryHop` : les voies du dry hop actif et celles du dry hop après fermentation, chacune à la dose de la règle. Absent sans l'option. */
  dryHop?: { actif: Voie[]; apres: Voie[]; regle: RegleDryHop; notes: string[] };
}
export interface VoieOptions {
  /** Variétés « à acheter » examinées (défaut 6). */ maxBuy?: number;
  /** Voies du stock retenues (défaut 10). */ limit?: number;
  /** Voies à acheter retenues, classées avec celles du stock (défaut 4). */ buyLimit?: number;
  /** Voies au plus par houblon ou couple de houblons (défaut 2). */ perHop?: number;
  moments?: MomentId[]; assemblages?: boolean;
  /** Départage à distance égale (g2a, D88) : 'aucun' (défaut, comportement d'avant) ou une des clés mesurées k1, k2, k3 (departage.ts).
   * La clé passe après la distance et ne change jamais l'effet calculé. */
  departage?: Departage;
  /** Palier 60′ (g2b, D88 B, D165) : une visée d'IBU `{ ibu: +n }`. Ajoute `VoieResult.palier60` (un ajout à 60′ par houblon, à la dose exacte pour +n IBU) et range
   * « remplacer à IBU égal » par usage puis α. Absent : comportement d'avant, à l'octet près. */
  palier60?: { ibu: number };
  /** Vrai dry hop (g2b, D161, D166) : ajoute `VoieResult.dryHop` (groupes actif et après, dose cherchée par la règle de palier.ts, jamais trois crans ni le reste du stock).
   * Absent : comportement d'avant, à l'octet près. */
  dryHop?: boolean;
  /** Leviers levure (R43, R44) : changer de souche vers chaque souche caractérisée, houblonner à froid en fermentation active. */
  leviersLevure?: boolean;
  /** Dégustation du brasseur : situe la bière et fixe la cible d'une famille jugée « trop » ou « peu ». */
  tasting?: Tasting | null;
  /** Goûts du brasseur (vides par défaut) : voir GOUTS_RULE. */
  gouts?: Gouts;
}

export const RANKING = [
  'conflits (exclusions V5.5 : famille « moins » marquée chez le houblon ajouté, c’est-à-dire citée par la moitié au moins de ses fiches (D90) ; famille indésirable du style marquée de même ; famille exclue par les goûts citée dans une fiche ; IBU sorti de la plage du style)',
  'débordement de style (somme des crans hors bande imputables à la voie ; base : repère central de la recette, ou aucune présence établie)',
  'distance à la cible en unités du style (somme sur les familles visées de |variation prévue − variation visée| / largeur de bande ; inconnue en dernier)',
  'effets de bord dans la bande (somme des crans des familles neutres ou indésirables non visées poussées vers le haut)',
  'stock : suffisant, puis manque, puis à acheter (une voie du stock qui sort du style ne passe pas devant une voie à acheter qui y reste)',
  'dérive d’IBU (valeur absolue) ; égalité de toutes les clés : même rang',
];

const round = (x: number, n = 1) => Math.round(x * 10 ** n) / 10 ** n;
const nameOf = (key: string) => hopRef(key)?.name ?? key;

// Familles citées par les fiches d’une variété (cites de hops.ts, une lecture de citations : un bit par famille, ordre de FAMILIES), lues une fois
// par moteur (#178) : le tri des houblons à acheter et les conflits de chaque voie les relisaient à chaque fois.
const citees = () => local('voies:citees', () => new Lru<number>(borneHoublons(catalogueDuMoteur().length + stockDuMoteur().length)));
function cites(varietyId: string, f: FamilyId): boolean {
  const m = citees().obtenir(varietyId, () => { const c = citations(varietyId); return FAMILIES.reduce((b, g, i) => (c[g].status === 'cité' ? b | (1 << i) : b), 0); });
  return (m & (1 << FAMILIES.indexOf(f))) !== 0;
}
// D90 (g2c) : familles MARQUÉES d'une variété (la moitié au moins de ses fiches, hops.ts marquee), lues une fois par moteur comme `citees`.
// Seules elles EXCLUENT (famille indésirable du style, famille « moins » de la visée) ; cites reste la règle de l'apport établi et des goûts du brasseur.
const marquees = () => local('voies:marquees', () => new Lru<number>(borneHoublons(catalogueDuMoteur().length + stockDuMoteur().length)));
function marque(varietyId: string, f: FamilyId): boolean {
  const m = marquees().obtenir(varietyId, () => FAMILIES.reduce((b, g, i) => (marquee(varietyId, g) ? b | (1 << i) : b), 0));
  return (m & (1 << FAMILIES.indexOf(f))) !== 0;
}

// Apport d'un ajout seul : repère central V5.5 à cette dose moins celui à dose nulle (fond de levure).
const apportCache = () => local('voies:apport', () => new Lru<Record<FamilyId, number | null> | null>(4096));
function apport(a: Addition, recipe: Recipe): Record<FamilyId, number | null> | null {
  const key = `${a.hopKey}|${a.moment}|${a.grams}|${recipe.volumeL}|${recipe.yeastId}|${recipe.boilMin}`;
  const cache = apportCache();
  if (cache.has(key)) return cache.get(key)!;
  const t = tripletOf(a, recipe);
  const on = predictionDe(t), off = predictionDe({ ...t, doseGL: 0 });
  const any = FAMILIES.some((f) => on.profile[f]?.range);
  const out = any ? Object.fromEntries(FAMILIES.map((f) => {
    const c1 = on.profile[f]?.central, c0 = off.profile[f]?.central;
    return [f, c1 !== undefined && c0 !== undefined ? c1 - c0 : null];
  })) as Record<FamilyId, number | null> : null;
  cache.set(key, out);
  return out;
}

/** Un ajout changé. `share` : part de la dose d'un assemblage ; l'apport est alors pris à la dose
 * totale du moment et pondéré par cette part (convention de cumul V5.5 : dose cumulée par phase,
 * descripteurs pondérés par les doses), jamais en additionnant deux courbes saturées. */
interface Change { addition: Addition; sign: 1 | -1; share?: number }
function effectOf(changes: Change[], recipe: Recipe): Record<FamilyId, FamilyEffect> | null {
  const rows = changes.map((c) => {
    const pooled = c.share === undefined ? c.addition : { ...c.addition, grams: round(c.addition.grams / c.share) };
    return { ...c, weight: c.share ?? 1, apport: apport(pooled, recipe), varietyId: hopRef(c.addition.hopKey)?.varietyId ?? '' };
  });
  if (rows.some((r) => !r.apport)) return null;
  return Object.fromEntries(FAMILIES.map((f) => {
    const est = rows.filter((r) => cites(r.varietyId, f) && r.apport![f] !== null);
    const central = est.length ? round(est.reduce((s, r) => s + r.sign * r.weight * r.apport![f]!, 0)) : null;
    return [f, { family: f, central, established: est.length > 0, partial: est.length > 0 && est.length < rows.length }];
  })) as Record<FamilyId, FamilyEffect>;
}

/** Effet d'un ajout seul sur la recette (apports V5.5 des familles citées). */
export function additionEffect(addition: Addition, recipe: Recipe) { return effectOf([{ addition, sign: 1 }], recipe); }

/** Voies pour pousser la recette dans la direction voulue : stock d'abord, puis à acheter. */
export function proposeVoies(recipe: Recipe, direction: Direction, options: VoieOptions = {}): VoieResult {
  const { maxBuy = 6, limit = 10, buyLimit = 4, perHop = 2, moments = ['b10', 'wp', 'dryActive', 'dryPost'], assemblages = true } = options;
  const style = getStyleScale(recipe.styleCode);
  const before = recipeProfile(recipe);
  const ibu0 = recipeIbu(recipe);
  const plus = FAMILIES.filter((f) => (direction[f] ?? 0) > 0), minus = FAMILIES.filter((f) => (direction[f] ?? 0) < 0);
  const directed = [...plus, ...minus];
  const departageMode: Departage = options.departage ?? 'aucun';
  const skipped: VoieResult['skipped'] = [];
  const notes: string[] = [];

  const targets: DirectedTarget[] = directed.map((f) => {
    const fs = style.families[f], crans = direction[f]!;
    const delta = round(crans * fs.cran);
    const current = before.profile[f];
    const citedNow = recipe.additions.some((a) => cites(hopRef(a.hopKey)?.varietyId ?? '', f));
    const note = crans < 0 && !citedNow ? `${FAMILY_NAMES[f]} : aucun ajout actuel n’est cité pour cette famille dans les fiches (Beer Maverick, Hopsteiner) ; aucune voie ne peut établir une baisse. La cause perçue peut venir d’ailleurs (malt torréfié, levure, oxydation) : non modélisé.` : null;
    if (note) notes.push(note);
    // Décision du pilote : si la dégustation juge la famille « trop » (ou « peu ») face au style, la
    // cible est le retour dans la bande (bord le plus proche) ; sinon repère du modèle ± crans.
    const perceived = options.tasting?.axes.find((a) => a.family === f)?.perceivedRange;
    const tasted = perceived && fs.band ? valueVerdict({ range: perceived }, fs).verdict : null;
    const byTasting = tasted === 'trop' || tasted === 'hors style' ? fs.band![1] : tasted === 'peu' ? fs.band![0] : null;
    const targetAbsolute = byTasting !== null ? byTasting : current.central !== undefined ? round(Math.max(0, Math.min(100, current.central + delta))) : null;
    const targetFrom: DirectedTarget['targetFrom'] = byTasting !== null ? 'dégustation' : targetAbsolute !== null ? 'modèle' : null;
    return { family: f, name: FAMILY_NAMES[f], crans, status: fs.status, delta, cran: round(fs.cran), width: fs.width, current, targetAbsolute, targetFrom, note };
  });

  // Stock libre = stock − ajouts de la recette (hors ajout remplacé ou modifié).
  const used = (key: string, except?: string) => recipe.additions.filter((a) => a.hopKey === key && a.id !== except).reduce((s, a) => s + a.grams, 0);
  const free = (key: string, except?: string) => { const s = stockDuMoteur().find((x) => x.key === key); return s ? s.grams - used(key, except) : null; };

  // Goûts du brasseur : variétés exclues hors du domaine ; familles exclues ajoutées aux exclusions V5.5.
  const { excludedVarieties, excludedFamilies } = goutsSets(options.gouts);
  const allowed = (key: string) => !excludedVarieties.has(hopRef(key)?.varietyId ?? key);
  const avoid = [...new Set([...minus, ...excludedFamilies])];
  const stockHops = stockDuMoteur().filter((s) => (free(s.key) ?? 0) > 0 && allowed(s.key)).map((s) => s.key);
  // À acheter : variétés sans stock libre (épuisées comprises), classées par familles visées citées,
  // puis familles attendues par le style citées, puis usage attesté, puis nom.
  const available = new Set(stockDuMoteur().filter((s) => (free(s.key) ?? 0) > 0).map((s) => s.varietyId));
  const suggested = new Set(suggestedHopVarieties(catalogueDuMoteur().map((c) => varietyById().get(c.id)!), style.name).map((v) => v.id));
  const expected = style.documented ? FAMILIES.filter((f) => style.families[f].status === 'attendue') : [];
  // Calculé une fois par appel et par variante (le même pour chaque ajout remplacé).
  const pools = new Map<boolean, string[]>();
  const buyPool = (requirePlus: boolean) => pools.get(requirePlus) ?? pools.set(requirePlus, buyPoolDe(requirePlus)).get(requirePlus)!;
  const buyPoolDe = (requirePlus: boolean, max = maxBuy) => catalogueDuMoteur().filter((c) => !available.has(c.id) && allowed(c.id))
    .map((c) => ({ c, plus: plus.filter((f) => cites(c.id, f)).length, fit: expected.filter((f) => cites(c.id, f)).length,
      // D90 : une famille « moins » ou indésirable du style exclut si elle est marquée ; une famille exclue par les goûts du brasseur, dès qu'une fiche la cite.
      bad: minus.some((f) => marque(c.id, f)) || excludedFamilies.some((f) => cites(c.id, f)) || FAMILIES.some((f) => style.families[f].status === 'indésirable' && marque(c.id, f)),
      // Une fiche isolée n'exclut plus, mais le houblon passe après ceux dont aucune fiche ne cite une famille à éviter, à nombre égal de familles visées :
      // sans cela, les houblons re-admis prennent les `maxBuy` places du pool sur leur seule couverture et laissent moins de bonnes voies (mesuré en stout S1).
      mineure: [...minus, ...FAMILIES.filter((f) => style.families[f].status === 'indésirable')].some((f) => cites(c.id, f)) }))
    .filter((r) => !r.bad && (!requirePlus || r.plus > 0))
    .sort((a, b) => b.plus - a.plus || Number(a.mineure) - Number(b.mineure) || b.fit - a.fit || Number(suggested.has(b.c.id)) - Number(suggested.has(a.c.id)) || a.c.name.localeCompare(b.c.name, 'fr'))
    .slice(0, max).map((r) => stockDuMoteur().find((s) => s.varietyId === r.c.id && s.form !== 'cryo')?.key ?? r.c.id);

  let n = 0;
  const evaluate = (type: VoieType, label: string, actions: Action[], changes: Change[], next: Recipe, extraEstimated: string[] = [], effectOverride?: Record<FamilyId, FamilyEffect> | null, ibuEnDrapeau = false): Voie => {
    n++;
    const effect = effectOverride !== undefined ? effectOverride : effectOf(changes, recipe);
    const byFamily: Voie['distance']['byFamily'] = {};
    let total: number | null = effect ? 0 : null;
    for (const t of targets) {
      const d = effect ? Math.abs((effect[t.family].central ?? 0) - t.delta) / t.width : null;
      byFamily[t.family] = d === null ? null : round(d, 3);
      if (total !== null && d !== null) total += d;
    }
    const conflicts: string[] = [];
    for (const c of changes.filter((x) => x.sign > 0)) {
      const h = hopRef(c.addition.hopKey)!;
      const replaced = changes.find((x) => x.sign < 0 && x.addition.hopKey === c.addition.hopKey);
      if (replaced && replaced.addition.grams >= c.addition.grams) continue; // diminution du même houblon
      for (const f of minus) if (marque(h.varietyId, f)) conflicts.push(`${h.name} : ${FAMILY_NAMES[f].toLowerCase()} cité dans une fiche, exclu par ta direction.`);
      for (const f of FAMILIES) if (style.families[f].status === 'indésirable' && marque(h.varietyId, f)) conflicts.push(`${h.name} : ${FAMILY_NAMES[f].toLowerCase()} exclu par le style, cité dans une fiche.`);
      for (const f of excludedFamilies) if (!minus.includes(f) && cites(h.varietyId, f)) conflicts.push(`${h.name} : ${FAMILY_NAMES[f].toLowerCase()} cité dans une fiche, exclu par tes goûts.`);
      for (const k of checkHopExclusions(predictionDe(tripletOf(c.addition, next)), avoid, AXES)) if (k.status === 'conflict') conflicts.push(`${h.name} : ${k.message}`);
      if (!(c.addition.grams > 0)) conflicts.push('Dose invalide.');
    }
    const ibu1 = recipeIbu(next);
    // Palier 60′ (D88 B) : l'IBU hors de la bande du style est un drapeau (InfoPalier), pas un conflit.
    if (style.ibu && !ibuEnDrapeau) {
      const inside = (x: number) => x >= style.ibu![0] - 0.5 && x <= style.ibu![1] + 0.5;
      const dist = (x: number) => Math.max(0, style.ibu![0] - x, x - style.ibu![1]);
      if (!inside(ibu1.value) && dist(ibu1.value) > dist(ibu0.value) + 0.5) conflicts.push(`IBU ${round(ibu1.value)} hors de la plage du style (${style.ibu[0]}–${style.ibu[1]}).`);
    }
    const missing: Voie['stock']['missing'] = [];
    let status: Voie['stock']['status'] = 'suffisant';
    const needed = [...new Set(actions.filter((a) => a.op !== 'retirer' && (a.previousGrams === undefined || a.grams > a.previousGrams || a.previousHopKey)).map((a) => a.hopKey))];
    for (const key of needed) {
      const s = stockDuMoteur().find((x) => x.key === key);
      const total = next.additions.filter((a) => a.hopKey === key).reduce((t, a) => t + a.grams, 0);
      if (!s || s.grams <= 0) { status = 'à acheter'; missing.push({ hopKey: key, hopName: nameOf(key), grams: round(total) }); continue; }
      if (s.grams < total - 1e-9) { if (status === 'suffisant') status = 'manque'; missing.push({ hopKey: key, hopName: nameOf(key), grams: round(total - Math.max(0, s.grams)) }); }
    }
    const estimatedWhy = [...extraEstimated, ...new Set(actions.filter((a) => a.op !== 'retirer').map((a) => MOMENTS[a.moment].estimated).filter((x): x is string => !!x))];
    // Débordement de style et effets de bord : seulement les apports établis (fiche qui cite la famille).
    const styleOverflow: StyleOverflow[] = [];
    const sideEffects: Voie['sideEffects'] = [];
    if (effect && style.documented) for (const f of FAMILIES) {
      const e = effect[f], fs = style.families[f];
      if (!e.established || e.central === null || !fs.band) continue;
      const base = before.profile[f].central;
      const ref = base ?? 0, after = ref + e.central;
      const [lo, hi] = fs.band;
      const excess = (x: number) => Math.max(0, x - hi), deficit = (x: number) => Math.max(0, lo - x);
      const up = Math.max(0, excess(after) - excess(ref));
      const down = fs.status === 'attendue' ? Math.max(0, deficit(after) - deficit(ref)) : 0;
      const baseText = base === undefined ? 'aucune présence établie avant' : `repère ${round(base)} avant`;
      if (up > 0) styleOverflow.push({ family: f, status: fs.status, band: fs.band, crans: round(up / fs.cran, 2),
        why: `${FAMILY_NAMES[f]} : ${baseText}, ${round(after)} après (+${round(e.central)}), au-dessus de la bande ${lo}–${hi} (${fs.status}).` });
      if (down > 0) styleOverflow.push({ family: f, status: fs.status, band: fs.band, crans: round(down / fs.cran, 2),
        why: `${FAMILY_NAMES[f]} : ${baseText}, ${round(after)} après (${round(e.central)}), sous la bande attendue ${lo}–${hi}.` });
      if (fs.status !== 'attendue' && !directed.includes(f) && e.central > 0) sideEffects.push({ family: f, status: fs.status, crans: round(e.central / fs.cran, 2) });
    }
    const overflowTotal = round(styleOverflow.reduce((s, o) => s + o.crans, 0), 2);
    const sideTotal = round(sideEffects.reduce((s, o) => s + o.crans, 0), 2);
    // Départage (g2a) : un ajout qui monte, sauf une diminution du même houblon (la voie « diminuer » est neutre).
    const reduction = actions.length === 1 && actions[0].op === 'modifier' && actions[0].previousHopKey === undefined && actions[0].grams < (actions[0].previousGrams ?? Infinity);
    const departage = departageMode !== 'aucun' && plus.length
      ? cleDeVoie(departageMode, reduction ? [] : changes.filter((c) => c.sign > 0).map((c) => ({ varietyId: hopRef(c.addition.hopKey)?.varietyId ?? '', poids: c.share ?? 1 })), plus)
      : null;
    return {
      id: `${type}|${actions.map((a) => `${a.hopKey}@${a.moment}:${round(a.grams)}`).join('+')}`, type, label,
      domain: needed.every((k) => stockDuMoteur().some((s) => s.key === k && s.grams > 0)) ? 'stock' : 'à acheter',
      actions, estimated: estimatedWhy.length > 0, estimatedWhy, conflicts,
      effect: effect ?? (Object.fromEntries(FAMILIES.map((f) => [f, { family: f, central: null, established: false, partial: false }])) as Record<FamilyId, FamilyEffect>),
      distance: { total: total === null ? null : round(total, 3), byFamily },
      stock: { status, missing }, ibu: { before: round(ibu0.value), after: round(ibu1.value), drift: round(ibu1.value - ibu0.value), unknown: ibu1.unknown.length > 0 },
      styleOverflow, overflowTotal, sideEffects, sideTotal,
      after: null, rank: 0, tieWith: [],
      ...(departage ? { departage } : {}),
    };
  };
  const act = (op: Action['op'], a: Addition, extra: Partial<Action> = {}): Action => ({ op, additionId: a.id, hopKey: a.hopKey, hopName: nameOf(a.hopKey), moment: a.moment, momentLabel: MOMENTS[a.moment].label, grams: round(a.grams), gramsPerLitre: round(a.grams / recipe.volumeL, 2), ...extra });

  const infoPalierDe = (key: string, grams: number, ibuApres: number): InfoPalier => {
    const ref = hopRef(key)!;
    return { usage: ref.catalogue.purpose ?? null, alpha: ref.alpha ? round(ref.alpha.value) : null, rang: [rangUsage(ref.catalogue.purpose), round(grams, 3)],
      bande: style.ibu, drapeau: drapeauIbu(ibuApres, style.ibu) };
  };

  const all: Voie[] = [];
  // 1. Ajouter (seulement si une famille doit monter).
  if (plus.length) {
    const pool = [...stockHops, ...buyPool(true)];
    for (const key of pool) for (const m of moments) {
      const doses = searchDoses(m).map((g) => g * recipe.volumeL);
      const f = free(key);
      if (f !== null && f > 0 && f < Math.max(...doses) && !doses.some((d) => Math.abs(d - f) < 0.5)) doses.push(f);
      let best: Voie | null = null;
      for (const grams of doses) {
        const a: Addition = { id: `v-${key}-${m}`, hopKey: key, moment: m, grams: round(grams) };
        const next = { ...recipe, additions: [...recipe.additions, a] };
        const v = evaluate('ajouter', `Ajouter ${nameOf(key)} · ${MOMENTS[m].label} · ${round(a.grams, 0)} g`, [act('ajouter', a)], [{ addition: a, sign: 1 }], next);
        if (!best || compareVoies(v, best) < 0) best = v;
      }
      if (best) all.push(best);
    }
  }
  // 2. Augmenter, diminuer, retirer un ajout existant.
  for (const a of recipe.additions) {
    for (const [type, k] of [['augmenter', 1.5], ['augmenter', 2], ['diminuer', 0.5], ['retirer', 0]] as const) {
      if (type === 'augmenter' && !allowed(a.hopKey)) continue;
      const grams = round(a.grams * k);
      const b: Addition = { ...a, grams };
      const next = { ...recipe, additions: recipe.additions.map((x) => (x.id === a.id ? b : x)).filter((x) => x.grams > 0) };
      const changes: Change[] = k === 0 ? [{ addition: a, sign: -1 }] : [{ addition: b, sign: 1 }, { addition: a, sign: -1 }];
      const label = k === 0 ? `Retirer ${nameOf(a.hopKey)} · ${MOMENTS[a.moment].label}` : `${type === 'augmenter' ? 'Augmenter' : 'Diminuer'} ${nameOf(a.hopKey)} · ${MOMENTS[a.moment].label} · ${round(a.grams, 0)} → ${round(grams, 0)} g`;
      all.push(evaluate(type, label, [k === 0 ? act('retirer', a) : act('modifier', b, { previousGrams: round(a.grams) })], changes, next));
    }
    // 3. Remplacer : à IBU égal (amertume, à 0,5 IBU près) ou à masse égale (arôme).
    const bitter = MOMENTS[a.moment].kind === 'amertume';
    const target = additionIbu(a, recipe);
    // 2 bis. Amertume : diminuer jusqu'au bas de la bande d'IBU du style, sans en sortir.
    if (bitter && style.ibu && !target.unknown.length && target.value > 0 && ibu0.value > style.ibu[0] + 0.5) {
      const grams = round(a.grams * (target.value - (ibu0.value - style.ibu[0])) / target.value);
      if (grams > 0 && grams < a.grams) {
        const b: Addition = { ...a, grams };
        const next = { ...recipe, additions: recipe.additions.map((x) => (x.id === a.id ? b : x)) };
        all.push(evaluate('diminuer', `Diminuer ${nameOf(a.hopKey)} · ${MOMENTS[a.moment].label} · ${round(a.grams, 0)} → ${round(grams, 1)} g (bas de la bande d’IBU)`,
          [act('modifier', b, { previousGrams: round(a.grams) })], [{ addition: b, sign: 1 }, { addition: a, sign: -1 }], next));
      }
    }
    for (const key of [...stockHops, ...buyPool(false)].filter((k) => k !== a.hopKey && allowed(k))) {
      const ref = hopRef(key)!;
      let grams = a.grams;
      if (bitter) {
        if (target.unknown.length || !ref.alpha) { skipped.push({ what: `Remplacer ${nameOf(a.hopKey)} par ${ref.name}`, why: 'alpha inconnu : IBU égal incalculable' }); continue; }
        const exact = gramsForIbu(target.value, ref, a.moment, recipe)!;
        const k = ibuPerGram(ref.alpha.value, a.moment, recipe);
        grams = [1, 0.5, 0.1].map((step) => Math.round(exact / step) * step).find((g) => Math.abs(g * k - target.value) <= 0.5) ?? exact;
      }
      const b: Addition = { id: a.id, hopKey: key, moment: a.moment, grams: round(grams) };
      const next = { ...recipe, additions: recipe.additions.map((x) => (x.id === a.id ? b : x)) };
      const type: VoieType = bitter ? 'remplacer à IBU égal' : 'remplacer à masse égale';
      const remplacement = evaluate(type, `Remplacer ${nameOf(a.hopKey)} par ${ref.name} · ${MOMENTS[a.moment].label} · ${round(b.grams, 1)} g`,
        [act('modifier', b, { previousGrams: round(a.grams), previousHopKey: a.hopKey })], [{ addition: b, sign: 1 }, { addition: a, sign: -1 }], next);
      // g2b : « remplacer à IBU égal » suit la règle d'usage du palier 60′ (un houblon d'arôme à 60′ perd son arôme : il passe après les amérisants).
      if (options.palier60 && bitter) remplacement.palier = infoPalierDe(key, b.grams, remplacement.ibu.after);
      all.push(remplacement);
    }
  }
  // 4. Assemblage de deux houblons du stock, à moitié de dose chacun : toujours estimé.
  if (assemblages && plus.length) {
    const singles = all.filter((v) => v.type === 'ajouter' && v.domain === 'stock' && !v.conflicts.length).sort(compareVoies);
    const tops: Voie[] = [];
    for (const v of singles) if (!tops.some((t) => t.actions[0].hopKey === v.actions[0].hopKey)) tops.push(v);
    const heads = tops.slice(0, 4);
    for (let i = 0; i < heads.length; i++) for (let j = i + 1; j < heads.length; j++) {
      const lead = heads[i].actions[0], other = heads[j].actions[0];
      const half = lead.grams / 2;
      const a1: Addition = { id: `v-${lead.hopKey}-${lead.moment}`, hopKey: lead.hopKey, moment: lead.moment, grams: round(half) };
      const a2: Addition = { id: `v-${other.hopKey}-${lead.moment}`, hopKey: other.hopKey, moment: lead.moment, grams: round(half) };
      const next = { ...recipe, additions: [...recipe.additions, a1, a2] };
      all.push(evaluate('assemblage', `Assembler ${lead.hopName} + ${other.hopName} · ${lead.momentLabel} · ${round(half, 0)} g + ${round(half, 0)} g`,
        [act('ajouter', a1), act('ajouter', a2)], [{ addition: a1, sign: 1, share: 0.5 }, { addition: a2, sign: 1, share: 0.5 }], next,
        ['Assemblage : apports des deux houblons additionnés, interactions du mélange non quantifiées (hypothèse).']));
    }
  }

  // Les deux groupes restent visibles (jusqu'à `limit` voies du stock et `buyLimit` à acheter),
  // classés ensemble : le stock n'est qu'un critère de rang, après le style et la distance.
  const kept: Voie[] = [];
  const perHopCount = new Map<string, number>();
  const perDomain = { stock: 0, 'à acheter': 0 };
  let blends = 0;
  // Une voie doit rapprocher au moins une famille visée par un apport établi (fiche qui la cite).
  const progress = (v: Voie) => targets.some((t) => v.effect[t.family].established && Math.sign(v.effect[t.family].central ?? 0) === Math.sign(t.delta));
  const withoutProgress = all.filter((v) => !progress(v)).length;
  if (withoutProgress) notes.push(`${withoutProgress} voies examinées n’apportent aucun mouvement établi vers la cible ; elles ne sont pas proposées.`);
  for (const v of all.filter(progress).sort(compareVoies)) {
    if (perDomain[v.domain] >= (v.domain === 'stock' ? limit : buyLimit)) continue;
    const key = v.actions.map((a) => a.hopKey).sort().join('+');
    if ((perHopCount.get(key) ?? 0) >= perHop) continue;
    // Deux assemblages au plus : ils restent estimés et ne doivent pas masquer les voies simples.
    if (v.type === 'assemblage' && blends >= 2) continue;
    if (v.type === 'assemblage') blends++;
    perHopCount.set(key, (perHopCount.get(key) ?? 0) + 1);
    perDomain[v.domain]++;
    kept.push(v);
  }
  // Leviers levure, évalués par le moteur et montrés même sans progrès établi (classés avec les autres).
  if (options.leviersLevure) {
    for (const to of CHARACTERIZED_YEASTS.filter((y) => y !== recipe.yeastId)) {
      const effect = yeastChangeEffect(recipe, to);
      const name = YEASTS.find((y) => y.id === to)?.name ?? to;
      const v = evaluate('levure', `Changer de levure : ${name}`, [], [], { ...recipe, yeastId: to },
        ['Changement de souche pour toute la bière : quantité de levure et programme de fermentation à revoir ; seul l’arôme propre de la souche change dans le modèle.', 'Stock de levure non suivi par le prototype.'], effect);
      v.yeastChange = { from: recipe.yeastId, to, toName: name };
      v.id = `levure|${to}`;
      if (!effect) v.estimatedWhy.push('Levure actuelle sans profil V5.5 : effet non évaluable.');
      kept.push(v);
    }
    const dry = all.filter((v) => v.type === 'ajouter' && v.actions[0].moment === 'dryActive' && v.domain === 'stock' && !v.conflicts.length && progress(v)).sort(compareVoies)[0];
    if (dry) kept.push({ ...dry, type: 'levure', id: `levure|${dry.id}`, label: `Houblonner à froid en fermentation active : ${dry.actions[0].hopName}, ${Math.round(dry.actions[0].grams)} g` });
    else notes.push('Houblonner à froid en fermentation active : aucun houblon du stock ne donne un progrès établi sans conflit.');
    kept.sort(compareVoies);
  }
  // g2b. Groupes à part (options `palier60`, `dryHop`) : même évaluation que les autres voies, rangs et plafonds propres. Absents sans l'option.
  const garder = (vs: Voie[], ordre: (a: Voie, b: Voie) => number, egal: (a: Voie, b: Voie) => number): Voie[] => {
    const parDomaine = { stock: 0, 'à acheter': 0 };
    const out: Voie[] = [];
    for (const v of [...vs].sort(ordre)) {
      if (parDomaine[v.domain] >= (v.domain === 'stock' ? limit : buyLimit)) continue;
      parDomaine[v.domain]++; out.push(v);
    }
    out.forEach((v, i) => { v.rank = i > 0 && egal(out[i - 1], v) === 0 ? out[i - 1].rank : i + 1; v.after = recipeProfile(applyVoie(recipe, v)).profile; });
    for (const v of out) v.tieWith = out.filter((w) => w !== v && egal(v, w) === 0).map((w) => w.label);
    return out;
  };
  const enStockDe = (key: string): number | null => { const f = free(key); return f === null ? null : Math.max(0, round(f)); };

  // Palier 60′ : un ajout à 60′ par houblon, à la dose exacte pour +n IBU (au gramme, sinon au demi-gramme, sinon au dixième : à ± 0,5 IBU), rang D88 B.
  let palier60: VoieResult['palier60'];
  if (options.palier60) {
    const ibuVise = options.palier60.ibu;
    const notesP: string[] = [];
    let voiesP: Voie[] = [];
    if (!(ibuVise > 0)) notesP.push('Palier 60′ : la visée d’IBU doit être positive ; aucun ajout proposé.');
    else {
      const achetables = catalogueDuMoteur().filter((c) => !available.has(c.id) && allowed(c.id))
        .map((c) => stockDuMoteur().find((s) => s.varietyId === c.id && s.form !== 'cryo')?.key ?? c.id);
      let sansAlpha = 0, exclus = 0;
      const candidates: Voie[] = [];
      for (const key of [...stockHops, ...achetables]) {
        const ref = hopRef(key);
        if (!ref) continue;
        if (!ref.alpha) { sansAlpha++; continue; }
        const k = ibuPerGram(ref.alpha.value, 'b60', recipe);
        if (!(k > 0)) { sansAlpha++; continue; }
        const exact = ibuVise / k;
        const grams = [1, 0.5, 0.1].map((step) => Math.round(exact / step) * step).find((g) => Math.abs(g * k - ibuVise) <= 0.5) ?? exact;
        const a: Addition = { id: `v-${key}-b60`, hopKey: key, moment: 'b60', grams: round(grams) };
        const next = { ...recipe, additions: [...recipe.additions, a] };
        const v = evaluate('ajouter', `Ajouter ${nameOf(key)} · ${MOMENTS.b60.label} · ${round(a.grams, 1)} g (+${round(ibuVise, 1)} IBU)`, [act('ajouter', a)], [{ addition: a, sign: 1 }], next, [], undefined, true);
        if (v.conflicts.length) { exclus++; continue; } // le conflit de famille reste une exclusion (D88 B, D90)
        v.palier = infoPalierDe(key, exact, v.ibu.after); // le rang lit les grammes EXACTS : deux α voisins ne sont pas ex æquo parce que le gramme les arrondit pareil
        v.enStock = enStockDe(key);
        candidates.push(v);
      }
      if (sansAlpha) notesP.push(`${sansAlpha} houblons sans α connu : IBU incalculable à 60′, non proposés.`);
      if (exclus) notesP.push(`${exclus} houblons exclus à 60′ par un conflit de famille (direction, style ou goûts).`);
      const egal = (x: Voie, y: Voie) => comparerPalier(x.palier, y.palier) || STOCK_RANK[x.stock.status] - STOCK_RANK[y.stock.status];
      voiesP = garder(candidates, (x, y) => egal(x, y) || x.label.localeCompare(y.label, 'fr') || x.id.localeCompare(y.id), egal);
    }
    palier60 = { ibuVise, ibuAvant: round(ibu0.value), bande: style.ibu, voies: voiesP, ranking: RANKING_PALIER60, notes: notesP };
  }

  // Vrai dry hop : actif et après fermentation, chacun à la dose de la règle (palier.ts) ; le stock restant se dit à part (`enStock`), il ne fixe aucune dose.
  let dryHop: VoieResult['dryHop'];
  if (options.dryHop) {
    const notesD: string[] = [];
    const dejaDry = recipe.additions.filter((x) => x.moment === 'dryActive' || x.moment === 'dryPost').reduce((s, x) => s + x.grams, 0);
    const doseDe = (key: string, m: MomentId): DoseDryHop | null => {
      let best: { gl: number; d: number; ecart: number } | null = null;
      for (const gl of GRILLE_DRYHOP_GL) {
        const effect = effectOf([{ addition: { id: 'dose', hopKey: key, moment: m, grams: round(gl * recipe.volumeL) }, sign: 1 }], recipe);
        if (!effect) return null;
        const d = targets.reduce((s, t) => s + Math.abs((effect[t.family].central ?? 0) - t.delta) / t.width, 0);
        // Écart signé sur les familles qui montent : > 0 la visée est dépassée, < 0 elle n'est pas atteinte.
        const ecart = targets.filter((t) => t.delta > 0).reduce((s, t) => s + ((effect[t.family].central ?? 0) - t.delta) / t.width, 0);
        if (!best || d < best.d - 1e-9) best = { gl, d, ecart };
      }
      const borne = best!.gl === BORNES_DRYHOP_GL.min && best!.ecart > 0 ? 'min' : best!.gl === BORNES_DRYHOP_GL.max && best!.ecart < 0 ? 'max' : null;
      return { gPerL: best!.gl, borne };
    };
    const groupe = (m: 'dryActive' | 'dryPost'): Voie[] => {
      const vs: Voie[] = [];
      const pool = [...stockHops, ...buyPoolDe(true, Infinity)].filter((key) => plus.some((f) => cites(hopRef(key)?.varietyId ?? '', f)));
      for (const key of pool) {
        const dose = doseDe(key, m);
        if (!dose) continue;
        const a: Addition = { id: `v-${key}-${m}`, hopKey: key, moment: m, grams: round(dose.gPerL * recipe.volumeL) };
        const next = { ...recipe, additions: [...recipe.additions, a] };
        const v = evaluate('ajouter', `Ajouter ${nameOf(key)} · ${MOMENTS[m].label} · ${round(a.grams, 0)} g (${round(dose.gPerL, 1)} g/L)`, [act('ajouter', a)], [{ addition: a, sign: 1 }], next);
        if (!progress(v)) continue;
        v.dose = dose;
        v.enStock = enStockDe(key);
        const cumul = (dejaDry + a.grams) / recipe.volumeL;
        if (cumul > BORNES_DRYHOP_GL.revueCumuleGL + 1e-9) v.drapeaux = [`dry hop cumulé ${round(cumul, 1)} g/L : au-dessus du repère de revue de ${BORNES_DRYHOP_GL.revueCumuleGL} g/L (un repère, pas un plafond).`];
        vs.push(v);
      }
      return garder(vs, compareVoies, compareRankKeys);
    };
    if (!plus.length) notesD.push('Dry hop : proposé pour une famille qui monte ; aucune visée à la hausse, aucune voie.');
    dryHop = { actif: plus.length ? groupe('dryActive') : [], apres: plus.length ? groupe('dryPost') : [], regle: REGLE_DRYHOP, notes: notesD };
  }

  // Profil de la recette entière après chaque voie retenue (cumul V5.5).
  for (const v of kept) {
    const next = applyVoie(recipe, v);
    v.after = recipeProfile(next).profile;
  }
  // Rang partagé quand toutes les clés sont égales (aucun ordre arbitraire présenté comme un rang).
  kept.forEach((v, i) => { v.rank = i > 0 && compareRankKeys(kept[i - 1], v) === 0 ? kept[i - 1].rank : i + 1; });
  for (const v of kept) v.tieWith = kept.filter((w) => w !== v && compareRankKeys(v, w) === 0).map((w) => w.label);
  const complete = FAMILIES.filter((f) => before.profile[f].completeDomain).length;
  if (complete) notes.push(`${complete} familles sur 12 ont une plage 0–100 dans la recette actuelle : le cumul V5.5 ne les situe pas.`);
  if (kept.some((v) => v.after && FAMILIES.every((f) => v.after![f].completeDomain || v.after![f].status === 'inconnu'))) notes.push('Après un ajout d’arôme, le cumul V5.5 rend souvent des plages 0–100 : la variation prévue s’appuie alors sur les repères centraux de l’ajout seul et sur les fiches qui citent la famille.');
  return { recipe, style, yeast: yeastInfo(recipe.yeastId), matrix: matrixContext(recipe), before, ibu: round(ibu0.value), direction: targets, voies: kept, evaluated: n, skipped, notes, ranking: RANKING,
    ...(palier60 ? { palier60 } : {}), ...(dryHop ? { dryHop } : {}) };
}

const STOCK_RANK = { suffisant: 0, manque: 1, 'à acheter': 2 } as const;
/** Clés du classement lexicographique (voir RANKING). 0 = égalité réelle de toutes les clés. */
export function compareRankKeys(a: Voie, b: Voie): number {
  const da = a.distance.total, db = b.distance.total;
  return a.conflicts.length - b.conflicts.length
    || comparerUsagePalier(a.palier, b.palier) // g2b (D88 B) : à 60′ l'usage passe d'abord ; sans l'option `palier60`, aucune voie n'a de palier : égalité
    || a.overflowTotal - b.overflowTotal
    || (da === null ? (db === null ? 0 : 1) : db === null ? -1 : da - db)
    || comparerGrammesPalier(a.palier, b.palier) // g2b : puis moins de grammes (α) ; inerte sans l'option
    || comparerCles(a.departage?.cle, b.departage?.cle)
    || a.sideTotal - b.sideTotal
    || STOCK_RANK[a.stock.status] - STOCK_RANK[b.stock.status]
    || Math.abs(a.ibu.drift) - Math.abs(b.ibu.drift);
}
/** Ordre d'affichage : clés de classement, puis libellé pour une liste stable (sans changer le rang). */
export function compareVoies(a: Voie, b: Voie): number {
  return compareRankKeys(a, b) || a.label.localeCompare(b.label, 'fr') || a.id.localeCompare(b.id);
}

/** Recette après la voie (pour « poser la voie » ; l'annulation garde la recette d'avant). */
export function applyVoie(recipe: Recipe, v: Voie): Recipe {
  let additions = [...recipe.additions];
  for (const a of v.actions) {
    if (a.op === 'retirer') additions = additions.filter((x) => x.id !== a.additionId);
    else if (a.op === 'modifier') additions = additions.map((x) => (x.id === a.additionId ? { ...x, hopKey: a.hopKey, grams: a.grams } : x));
    else additions.push({ id: a.additionId, hopKey: a.hopKey, moment: a.moment, grams: a.grams });
  }
  return { ...recipe, ...(v.yeastChange ? { yeastId: v.yeastChange.to } : {}), additions };
}
