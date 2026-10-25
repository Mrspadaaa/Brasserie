import type { HopLot, HopVariety } from '../../../../functions/src/hopIndexSchema';
import type { HopEngineData } from '../../../../functions/src/hopPredictionCore';
import type { HopAxis, HopKnowledge, HopYeast } from '../../../../functions/src/hopPredictionSchema';
import type { HopExtrapolation } from '../../../../functions/src/hopExtrapolationSchema';
import type { HopSolverPolicy } from '../../../../functions/src/hopSolverSchema';
import knowledgeBootstrap from '../../../data/hopKnowledgeBootstrap.json';
import extrapolationBootstrap from '../../../data/hopExtrapolationBootstrap.json';
import yeastBootstrap from '../../../data/hopYeastBootstrap.json';
import solverBootstrap from '../../../data/hopSolverBootstrap.json';
import trialBootstrap from '../../../data/hopTrialBootstrap.json';
import protoData from '../../../data/hopV4/proto-data.json';

/** Données du prototype : produites par scripts/build-data.mjs depuis le dépôt et le fixture
 * de production (lecture seule). Connaissances V5.5 : importées telles quelles des bootstraps. */
export interface CatalogueHop {
  id: string; name: string; aliases: string[]; origin: string | null;
  alpha: [number, number] | null; beta: [number, number] | null; oil: [number, number] | null;
  tags: string[]; tagsFr: string[]; hopsteinerId: string | null; url: string | null;
  /** Hopsteiner : linalol (% de l'huile) et classe « Thiol impact » ; signaux, jamais des intensités. */
  hsLinalool: { range: [number, number]; unit: string; reference: string; year: number | null } | null;
  hsThiol: { class: string; reference: string | null } | null;
  /** Fiche Hopsteiner reliée : alpha, bêta, huile totale (plages), référence et année. */
  hs: { name: string; alpha: [number, number] | null; beta: [number, number] | null; totalOil: [number, number] | null; reference: string | null; year: number | null } | null;
  /** Composants de l'huile, % de l'huile (Beer Maverick). */
  oils: { myrcene: [number, number] | null; humulene: [number, number] | null; caryophyllene: [number, number] | null };
  bmYear: number | null;
  /** Usages attestés par un fournisseur (hopStyleUsageBootstrap), ou null. */
  usage: { styles: string[]; roles: string[]; source: string | null; url: string | null }[] | null;
  descriptions: HopVariety['descriptions'];
}
export interface StockHop {
  /** Clé du houblon dans le prototype : id de variété, suffixé « :cryo » pour un produit Cryo. */
  key: string; varietyId: string; form: 'cryo' | 'unknown'; grams: number;
  alpha: number | null; alphaFrom: string | null; items: string[];
}

/** Données injectées dans un moteur (B2, #164) : la connaissance des variétés (fiches, huiles, descripteurs) et le
 * stock du brasseur. Les connaissances V5.5 (axes, levures, modèle, solveur) restent des documents versionnés, communs. */
export interface DonneesMoteur { catalogue: CatalogueHop[]; stock: StockHop[] }
/** Données par défaut : celles du prototype (fixture). Seuls la fabrique et le moteur par défaut les lisent. */
export const DONNEES_FIXTURE: DonneesMoteur = { catalogue: protoData.varieties as unknown as CatalogueHop[], stock: protoData.stock as unknown as StockHop[] };
/** Les fixtures, pour les écrans qui les citent (cas du parcours) ; aucun module du moteur ne les lit. */
export const CATALOGUE = DONNEES_FIXTURE.catalogue;
export const STOCK = DONNEES_FIXTURE.stock;
export const STOCK_SOURCE = { fixture: protoData.fixture, note: protoData.fixtureSource, unlinked: protoData.unlinked as string[] };

// Levures du programme d'essais (LalBrew Pomona…) : seulement leurs fiches de souche, pas les essais.
const trialYeasts = (trialBootstrap.hopKnowledge as { kind: string }[]).filter((k) => k.kind === 'yeast');
const knowledge = [...knowledgeBootstrap, ...extrapolationBootstrap, ...yeastBootstrap, ...solverBootstrap, ...trialYeasts] as unknown as HopKnowledge[];
export const AXES = knowledge.filter((k): k is HopAxis => k.kind === 'axis');
export const YEASTS = knowledge.filter((k): k is HopYeast => k.kind === 'yeast');
export const EXTRAPOLATION = knowledge.find((k): k is HopExtrapolation => k.kind === 'extrapolation' && k.enabled)!;
export const POLICY = knowledge.find((k): k is HopSolverPolicy => k.kind === 'solver' && k.enabled)!;

const variety = (h: CatalogueHop): HopVariety => ({ id: h.id, name: h.name, aliases: h.aliases, ...(h.origin ? { origin: h.origin } : {}), form: 'unknown', descriptions: h.descriptions, analysis: [] });
/** Lot de stock : seule la forme compte pour le moteur (marge de forme inconnue). Un article
 * « Cryo Hops » est un produit cryo ; les autres articles ne disent pas leur forme. */
const lot = (s: StockHop): HopLot => ({ id: `stock:${s.key}`, varietyId: s.varietyId, name: s.items.join(' + '), form: s.form === 'cryo' ? 'cryo' : 'unknown', analysis: [] });

/** Contexte d'un moteur : ses données, leurs index et ses caches. Un par moteur, jamais partagé entre deux jeux de données. */
export interface Contexte {
  donnees: DonneesMoteur;
  catalogue: CatalogueHop[]; stock: StockHop[];
  engineData: HopEngineData;
  varietyById: Map<string, HopVariety>; catalogueById: Map<string, CatalogueHop>; stockByKey: Map<string, StockHop>;
  /** Clés des articles du stock qui ne sont pas une variété du catalogue (Citra cryo…), dans l'ordre du stock. */
  stockHorsCatalogue: string[];
  /** Valeurs dérivées et caches bornés du moteur, par nom (local). */
  locaux: Map<string, unknown>;
}
export function contexte(donnees: DonneesMoteur): Contexte {
  const { catalogue, stock } = donnees;
  const engineData: HopEngineData = { varieties: catalogue.map(variety), lots: stock.map(lot), knowledge };
  const catalogueById = new Map(catalogue.map((h) => [h.id, h]));
  return {
    donnees, catalogue, stock, engineData, catalogueById,
    varietyById: new Map(engineData.varieties.map((v) => [v.id, v])),
    stockByKey: new Map(stock.map((s) => [s.key, s])),
    stockHorsCatalogue: stock.map((s) => s.key).filter((k) => !catalogueById.has(k)),
    locaux: new Map(),
  };
}

// Contexte actif : celui du moteur dont une fonction est en cours (dansContexte), sinon le moteur par défaut (fixtures).
// Le moteur est synchrone : un appel ne rend la main qu'une fois fini ; le contexte ne passe donc jamais d'un moteur à l'autre.
let actif: Contexte | null = null;
let parDefaut: Contexte | null = null;
export const contexteParDefaut = (): Contexte => (parDefaut ??= contexte(DONNEES_FIXTURE));
export const courant = (): Contexte => actif ?? contexteParDefaut();
/** Exécute f dans le contexte c, puis rétablit le précédent (même en cas d'erreur). */
export function dansContexte<T>(c: Contexte, f: () => T): T {
  const avant = actif;
  actif = c;
  try { return f(); } finally { actif = avant; }
}
/** Valeur dérivée des données du moteur actif, construite une fois par moteur (index, cache borné, prédicteur). */
export function local<T>(nom: string, init: () => T): T {
  const c = courant();
  let v = c.locaux.get(nom) as T | undefined;
  if (v === undefined) { v = init(); c.locaux.set(nom, v); }
  return v;
}
export const catalogue = (): CatalogueHop[] => courant().catalogue;
export const stock = (): StockHop[] => courant().stock;
export const engineData = (): HopEngineData => courant().engineData;
export const varietyById = (): Map<string, HopVariety> => courant().varietyById;
export const stockByKey = (): Map<string, StockHop> => courant().stockByKey;

export interface HopRef {
  key: string; varietyId: string; name: string; stock: StockHop | null; catalogue: CatalogueHop; lotId: string | null;
  /** Alpha retenu : celui du lot (fiche de stock ou article) sinon la plage variétale. */
  alpha: { value: number; min: number; max: number; from: string } | null;
}
/** Un houblon du stock (clé « id » ou « id:cryo ») ou du catalogue (« id »). */
export function hopRef(key: string): HopRef | null {
  const c = courant();
  const stock = c.stockByKey.get(key) ?? null;
  const varietyId = stock?.varietyId ?? key.replace(/:cryo$/, '');
  const catalogue = c.catalogueById.get(varietyId);
  if (!catalogue) return null;
  const alpha = stock?.alpha != null ? { value: stock.alpha, min: stock.alpha, max: stock.alpha, from: stock.alphaFrom ?? 'stock' }
    : catalogue.alpha ? { value: (catalogue.alpha[0] + catalogue.alpha[1]) / 2, min: catalogue.alpha[0], max: catalogue.alpha[1], from: 'plage variétale (Beer Maverick)' } : null;
  return { key, varietyId, name: catalogue.name + (stock?.form === 'cryo' ? ' cryo' : ''), stock, catalogue, lotId: stock ? `stock:${stock.key}` : null, alpha };
}
