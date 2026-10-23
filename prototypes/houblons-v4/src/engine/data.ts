import type { HopLot, HopVariety } from '../../../../functions/src/hopIndexSchema';
import type { HopEngineData } from '../../../../functions/src/hopPredictionCore';
import type { HopAxis, HopKnowledge, HopYeast } from '../../../../functions/src/hopPredictionSchema';
import type { HopExtrapolation } from '../../../../functions/src/hopExtrapolationSchema';
import type { HopSolverPolicy } from '../../../../functions/src/hopSolverSchema';
import knowledgeBootstrap from '../../../../src/data/hopKnowledgeBootstrap.json';
import extrapolationBootstrap from '../../../../src/data/hopExtrapolationBootstrap.json';
import yeastBootstrap from '../../../../src/data/hopYeastBootstrap.json';
import solverBootstrap from '../../../../src/data/hopSolverBootstrap.json';
import trialBootstrap from '../../../../src/data/hopTrialBootstrap.json';
import protoData from '../../data/proto-data.json';

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

export const CATALOGUE = protoData.varieties as unknown as CatalogueHop[];
export const STOCK = protoData.stock as unknown as StockHop[];
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

export const ENGINE_DATA: HopEngineData = { varieties: CATALOGUE.map(variety), lots: STOCK.map(lot), knowledge };
export const VARIETY_BY_ID = new Map(ENGINE_DATA.varieties.map((v) => [v.id, v]));
export const CATALOGUE_BY_ID = new Map(CATALOGUE.map((h) => [h.id, h]));
export const STOCK_BY_KEY = new Map(STOCK.map((s) => [s.key, s]));

export interface HopRef {
  key: string; varietyId: string; name: string; stock: StockHop | null; catalogue: CatalogueHop; lotId: string | null;
  /** Alpha retenu : celui du lot (fiche de stock ou article) sinon la plage variétale. */
  alpha: { value: number; min: number; max: number; from: string } | null;
}
/** Un houblon du stock (clé « id » ou « id:cryo ») ou du catalogue (« id »). */
export function hopRef(key: string): HopRef | null {
  const stock = STOCK_BY_KEY.get(key) ?? null;
  const varietyId = stock?.varietyId ?? key.replace(/:cryo$/, '');
  const catalogue = CATALOGUE_BY_ID.get(varietyId);
  if (!catalogue) return null;
  const alpha = stock?.alpha != null ? { value: stock.alpha, min: stock.alpha, max: stock.alpha, from: stock.alphaFrom ?? 'stock' }
    : catalogue.alpha ? { value: (catalogue.alpha[0] + catalogue.alpha[1]) / 2, min: catalogue.alpha[0], max: catalogue.alpha[1], from: 'plage variétale (Beer Maverick)' } : null;
  return { key, varietyId, name: catalogue.name + (stock?.form === 'cryo' ? ' cryo' : ''), stock, catalogue, lotId: stock ? `stock:${stock.key}` : null, alpha };
}
