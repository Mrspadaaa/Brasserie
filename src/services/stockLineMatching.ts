import { normalize } from './search';
import { Units } from './units';
import type { StockItem } from '../types';
import { CEREALS, hasHopWord, hasYeastWord, inferNature, isReadableUnit, knownCategoriesOf, pieceUnitsEquivalent, PRODUCT_DESCRIPTORS, readProductLabel, weightKey, type ProductIdentity } from './ingredientIdentity';

/**
 * Lignes lues sur un justificatif → articles du stock.
 *
 * Remplace, pour la feuille d'achat, l'appariement de l'ancien scan (`QuickActionModal`, plus atteignable). Une
 * correspondance n'est qu'une proposition : la feuille la montre, le brasseur la garde ou la change, et rien n'entre
 * en stock avant « Confirmer et enregistrer ».
 *
 * Règle du pilote (31.10) : une proposition perdue est permise, une fausse ne l'est pas ; dans le doute, rien.
 */

/**
 * Levée le 31.10 (mission 2026-10-31-ecran-depense, voie s1-stock) : la chasse du 17.10 (27 cas, 18 fausses propositions, décision 117)
 * est rejouée en test (`tests/unit/depense/stock/chasse-17-10.test.ts`) à 0 fausse proposition. `false` les coupe de nouveau.
 */
export const STOCK_LINE_PROPOSALS_ENABLED = true;
export { isReadableUnit };
/** Natures de ligne à qui on propose un article ; jamais « service » (la mouture ne crée ni ne rejoint un article). */
export const STOCK_PROPOSAL_KINDS = ['ingredient', 'packaging', 'cleaning'] as const;
/** Clé ajoutée (id + clé) à l'ensemble des lignes proposées par la feuille : le poids du sachet de la ligne n'est pas confirmé par l'article. */
export const PROPOSAL_WEIGHT_MARK = '#poids';

/** Catégories de Stocks, dans l'ordre d'affichage : l'app les compare à l'identique (fiche, levure, brassage). */
export const STOCK_CATEGORIES = ['Malt', 'Houblon', 'Levure', 'Sucre', 'Additif', 'Emballage', 'CIP alcalin', 'CIP acide', 'Désinfectant', 'Détergent', 'Sols', 'EPI', 'Consommable'];
/** La lecture écrit souvent au pluriel, en minuscules ou en allemand (catalogues des malteries). */
const SYNONYMS = new Map(Object.entries({
  malts: 'Malt', malz: 'Malt', cereale: 'Malt', cereales: 'Malt',
  houblons: 'Houblon', hopfen: 'Houblon',
  levures: 'Levure', hefe: 'Levure',
  sucres: 'Sucre', additifs: 'Additif', emballages: 'Emballage', consommables: 'Consommable'
}));

/**
 * Catégorie de stock telle que l'app la compare : « malt » ➔ « Malt », « Hopfen » ➔ « Houblon ». Une catégorie
 * inconnue garde son texte, initiale en capitale. Sert à l'écriture et à la lecture des articles déjà écrits en
 * minuscules, sans les réécrire.
 */
export function canonicalStockCategory(value: string | undefined): string {
  const text = (value ?? '').trim();
  const key = normalize(text).replace(/\s+/g, ' ');
  if (!key) return text;
  return STOCK_CATEGORIES.find(category => normalize(category) === key) ?? SYNONYMS.get(key) ?? text.charAt(0).toUpperCase() + text.slice(1);
}

const sameSet = (a: string[], b: string[]) => { const A = new Set(a), B = new Set(b); return A.size === B.size && [...A].every(w => B.has(w)); };
/** Mêmes jetons dans un ordre libre, ou même nom collé (« Cara Munich » = « Caramunich »). */
const sameName = (a: string[], b: string[]) => a.length > 0 && (sameSet(a, b) || a.join('') === b.join(''));
const wordsOf = (text: string) => readProductLabel(text).tokens;

/** `kind` d'une ligne lue ↔ catégorie d'un article : un ingrédient n'entre pas dans un produit d'entretien, ni l'inverse. Catégorie inconnue ou « Divers » : jamais un refus. */
const KIND_REFUSES: Record<string, string[]> = {
  ingredient: ['Emballage', 'CIP alcalin', 'CIP acide', 'Désinfectant', 'Détergent', 'Sols', 'EPI'],
  // Un produit d'entretien ou un emballage n'est jamais un additif (s1b n° 3) ; « Consommable » reste permis (colle, étiquettes, sel d'entretien).
  cleaning: ['Malt', 'Houblon', 'Levure', 'Sucre', 'Additif'],
  packaging: ['Malt', 'Houblon', 'Levure', 'Sucre', 'Additif']
};

/** Au-delà de ce poids imprimé, une ligne de levure n'est plus un sachet : face à un article en sachets sans poids, rien (s1b n° 4). */
export const SACHET_MAX_G = 50;
/** Écritures d'une unité que `Units` ne reconnaît pas, ramenées au kg ou au L pour l'appariement seulement (`Units` ne change pas). */
const UNIT_SPELLINGS: Record<string, string> = { kilo: 'kg', kilos: 'kg', kilogramm: 'kg', kilogramme: 'kg', kilogrammes: 'kg', liter: 'l', liters: 'l', litre: 'l', litres: 'l' };
/** Unité telle que l'appariement la compare : minuscules, sans point final (« Kg. » → « kg »), « Kilo » → « kg », « litres » → « l ». */
export const linkUnit = (unit: string) => {
  const key = (unit ?? '').trim().toLowerCase().replace(/[.\s]+$/, '');
  return UNIT_SPELLINGS[key] ?? key;
};

/** `vendor` : fournisseur du justificatif ; ses mots dans un nom d'article ne le rendent pas plus précis que la ligne. */
export interface StockLineInput {
  description: string; unit: string; quantity?: number; vendor?: string;
  /** Catégorie lue par le modèle (souvent vide : le prompt interdit de l'inventer). */
  stockCategory?: string;
  /** Code article imprimé (MA…, HO…, HE… chez Brau- und Rauchshop) : sert à REFUSER une catégorie, jamais à choisir. */
  reference?: string;
  /** Nature de la ligne de la feuille : `ingredient`, `packaging`, `cleaning`. */
  kind?: string;
}
export interface StockLineMatch {
  item: StockItem;
  /** Ce que le libellé de la ligne dit : nom propre, α, récolte, poids de sachet, conditionnement (chacun avec sa source « libellé »). */
  identity: ProductIdentity;
  /** L'unité de la ligne et celle de l'article sont équivalentes sans être convertibles (Stk ↔ sachet, levure) : la quantité ne change pas. */
  unitAlias?: { from: string; to: string };
  /** Le libellé donne un poids de sachet que l'article ne confirme pas. */
  weightUnconfirmed?: boolean;
  /** D214 : la ligne n'a pas d'unité lisible ; proposée quand même, unité à préciser (jamais devinée). */
  unitMissing?: boolean;
  /** Faits déduits du libellé, prêts pour l'extrait de la ligne. */
  deduced: string[];
  pass: 1 | 2;
}

/** Quantité lisible : six décimales au plus (jamais « 0 kg » pour 0,0004 kg), espace entre les milliers, virgule décimale (« 25 000 », « 0,25 »). */
const num = (n: number) => {
  const r = Math.round(n * 1e6) / 1e6;
  const [whole, decimals] = String(r).split('.');
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (decimals ? ',' + decimals : '');
};

/**
 * Ce que la feuille montre quand l'unité de la ligne n'est pas celle de l'article : « 25 kg → 25 000 g » (conversion) ou
 * « 2 Stk = 2 sachet » (même pièce, levure). Rien quand les unités sont les mêmes ou quand rien ne les relie : l'unité imprimée reste
 * celle de la ligne, la quantité n'est jamais réécrite en silence.
 */
export function formatUnitLink(quantity: number, from: string, to: string, category?: string): string | undefined {
  if (!isReadableUnit(from) || !isReadableUnit(to) || !Number.isFinite(quantity)) return undefined;
  const a = linkUnit(from), b = linkUnit(to);
  if (a === b) return undefined;
  if (Units.areCompatible(a, b)) {
    const converted = Units.convert(quantity, a, b);
    return converted === null ? undefined : `${num(quantity)} ${from.trim()} → ${num(converted)} ${to.trim()}`;
  }
  if (pieceUnitsEquivalent(from, to, canonicalStockCategory(category))) return `${num(quantity)} ${from.trim()} = ${num(quantity)} ${to.trim()}`;
  return undefined;
}

type Link = { alias: boolean };
const linkUnits = (lineUnit: string, itemUnit: string, category: string): Link | undefined => {
  if (!isReadableUnit(lineUnit) || !isReadableUnit(itemUnit)) return undefined;
  if (Units.areCompatible(linkUnit(lineUnit), linkUnit(itemUnit))) return { alias: false };
  if (pieceUnitsEquivalent(lineUnit, itemUnit, category)) return { alias: true };
  return undefined;
};

/**
 * Article du stock proposé pour une ligne lue, avec ce que le libellé a appris, ou rien : seulement sur une correspondance sûre.
 *
 * - mêmes jetons d'identité (ordre libre, ou même nom collé) : une précision de la ligne absente de l'article, ou l'inverse,
 *   empêche la proposition (« Cascade Cryo » ≠ « Houblon Cascade ») ;
 * - **deux passes** : (1) libellés complets ; (2) seulement si (1) ne trouve rien, les mots du fournisseur de l'article sont
 *   retirés de son nom, et ceux du fournisseur du justificatif de la ligne s'ils suivent un mot de liaison (« Cascade du Banc ») ;
 * - la catégorie tranche (jamais l'unité) : nature de la ligne (catégorie lue, mots du libellé, code article) contre catégorie de
 *   l'article ; nature inconnue et identité connue d'une autre catégorie (houblon du catalogue, malt, levure) → rien ;
 * - un nombre qui suit « Typ », « Type », « Nr » est de l'identité ; un conditionnement n'est lu que séparé du nom par une virgule
 *   ou un point médian et diviseur de la quantité ; α et récolte (houblon) comparées quand elles sont connues des deux côtés ;
 * - unité de la ligne convertible dans celle de l'article, ou même pièce (Stk ↔ sachet pour une levure) ; sans unité lisible, rien ;
 * - un seul article doit correspondre ; sinon rien, et le brasseur choisit ou crée l'article.
 */
export function matchStockLine(line: StockLineInput, items: StockItem[]): StockLineMatch | undefined {
  if (!(Number(line.quantity) > 0)) return undefined;
  // D214 : une unité illisible ('', '-', '?', un nombre seul) n'empêche pas la proposition et n'assouplit aucune autre règle ;
  // elle n'est jamais devinée ni recopiée depuis l'article (la feuille laisse « Unité » vide et dit « unité à préciser »).
  const unitReadable = isReadableUnit(line.unit);
  const lineUnit = unitReadable ? linkUnit(line.unit) : undefined;
  const lineCategory = line.stockCategory ? canonicalStockCategory(line.stockCategory) : undefined;
  const nature = inferNature(line.description, line.reference, lineCategory && STOCK_CATEGORIES.includes(lineCategory) ? lineCategory : undefined);
  const lineHop = nature.strong === 'Houblon' || hasHopWord(line.description);
  const lineYeast = nature.strong === 'Levure' || hasYeastWord(line.description);
  const vendorWords = new Set(wordsOf(line.vendor ?? ''));
  if (!readProductLabel(line.description, { unit: lineUnit, quantity: line.quantity }).tokens.length) return undefined;

  const identityOf = (item: StockItem, hop: boolean, yeast: boolean) => readProductLabel(item.name, { unit: linkUnit(item.unit), hop, yeast, side: 'item' });
  const contextOf = (item: StockItem) => { const category = canonicalStockCategory(item.category); return { hop: category === 'Houblon' || hasHopWord(item.name), yeast: category === 'Levure' || hasYeastWord(item.name) }; };

  const examine = (item: StockItem): StockLineMatch | undefined => {
    const category = canonicalStockCategory(item.category);
    const known = STOCK_CATEGORIES.includes(category);
    if (known) {
      if (line.kind && KIND_REFUSES[line.kind]?.includes(category)) return undefined;
      if (nature.strong && nature.strong !== category) return undefined;
      if (nature.weak && nature.weak !== category) return undefined;
    }
    const link = unitReadable ? linkUnits(line.unit, item.unit, category) : isReadableUnit(item.unit) ? { alias: false } : undefined;
    if (!link) return undefined;
    const hop = lineHop || category === 'Houblon' || hasHopWord(item.name), yeast = lineYeast || category === 'Levure' || hasYeastWord(item.name);
    const L = readProductLabel(line.description, { unit: lineUnit, quantity: line.quantity, hop, yeast, side: 'line' });
    const I = identityOf(item, hop, yeast);
    if (!L.tokens.length) return undefined;

    let pass: 1 | 2 | 0 = 0;
    if (sameName(L.tokens, I.tokens)) pass = 1;
    else {
      const supplierWords = new Set(wordsOf(item.supplier ?? ''));
      // s1b n° 1 : un mot qui décrit le produit (bio, cryo, dunkel, rauch…) n'est jamais retiré, même s'il est aussi dans le nom d'un fournisseur.
      const lineWords = L.detail.filter(d => !(d.afterLinker && vendorWords.has(d.t) && !PRODUCT_DESCRIPTORS.has(d.t))).map(d => d.t);
      // s1c n° 2 : un mot du nom de l'article n'est retiré que si le fournisseur de l'ARTICLE le porte ; le fournisseur du justificatif seul ne suffit pas
      // (« Pilsner » chez « Rye Mühle AG » ≠ « Pilsner Rye » : le mot décrit peut-être le produit, pas son vendeur).
      const itemWords = I.tokens.filter(w => PRODUCT_DESCRIPTORS.has(w) || !supplierWords.has(w));
      if (sameName(lineWords, itemWords)) pass = 2;
    }
    if (!pass) return undefined;

    // α et récolte : connues des deux côtés et différentes → rien (le brasseur choisit l'article lui-même).
    const itemAlpha = item.alphaPct ?? I.alpha?.value;
    if (L.alpha && itemAlpha !== undefined && Math.abs(L.alpha.value - itemAlpha) >= 0.05) return undefined;
    if (L.harvestYear && I.harvestYear && L.harvestYear.value !== I.harvestYear.value) return undefined;
    // Poids du sachet (articles à la pièce) : le même ou rien ; la ligne sans poids face à un article avec poids : rien.
    let weightUnconfirmed = false;
    if (Units.familyOf(lineUnit ?? '') === 'piece' && Units.familyOf(linkUnit(item.unit)) === 'piece') {
      if (L.pieceWeight && I.pieceWeight) { if (weightKey(L.pieceWeight) !== weightKey(I.pieceWeight)) return undefined; }
      else if (!L.pieceWeight && I.pieceWeight) return undefined;
      else if (L.pieceWeight && !I.pieceWeight) {
        // s1b n° 4 : « Safale US-05 500 g » est une brique, pas un sachet : face à un article sans poids, rien.
        const grams = L.pieceWeight.unit === 'mg' ? L.pieceWeight.value / 1000 : L.pieceWeight.value;
        if (grams > SACHET_MAX_G) return undefined;
        weightUnconfirmed = true;
      }
    }
    // Malté ≠ non malté pour une céréale qui existe crue.
    if (L.malted !== I.malted && L.tokens.some(token => CEREALS.has(token))) return undefined;
    // Nature inconnue : l'identité de l'article est aussi un nom connu d'une autre catégorie (« Crystal »), ou un autre article du stock → rien.
    if (!nature.strong && !nature.weak && known) {
      const key = I.tokens.join(' ');
      if (knownCategoriesOf(key).some(other => other !== category)) return undefined;
      const homonym = items.some(other => {
        if (other === item) return false;
        const otherCategory = canonicalStockCategory(other.category);
        if (!STOCK_CATEGORIES.includes(otherCategory) || otherCategory === category) return false;
        const ctx = contextOf(other);
        return identityOf(other, ctx.hop, ctx.yeast).tokens.join(' ') === key;
      });
      if (homonym) return undefined;
    }
    return {
      item, identity: L, pass, deduced: L.deduced,
      ...(link.alias ? { unitAlias: { from: line.unit.trim(), to: item.unit.trim() } } : {}),
      ...(unitReadable ? {} : { unitMissing: true }),
      ...(weightUnconfirmed ? { weightUnconfirmed: true } : {})
    };
  };

  const first: StockLineMatch[] = [], second: StockLineMatch[] = [];
  for (const item of items) { const match = examine(item); if (match) (match.pass === 1 ? first : second).push(match); }
  const pool = first.length ? first : second;
  if (pool.length !== 1) return undefined;
  const chosen = pool[0];
  // Un conditionnement lu (« Carafa, 2 Kg ») alors que le stock décline le même nom en numéros (« Carafa 1 ») : le nombre était peut-être un numéro.
  if (chosen.identity.packSize) {
    const base = chosen.identity.tokens;
    const sibling = items.some(other => {
      if (other === chosen.item || !(unitReadable ? linkUnits(line.unit, other.unit, canonicalStockCategory(other.category)) : isReadableUnit(other.unit))) return false;
      const ctx = contextOf(other);
      const tokens = identityOf(other, ctx.hop, ctx.yeast).tokens;
      const extra = tokens.filter(token => !base.includes(token));
      return tokens.length === base.length + 1 && extra.length === 1 && /^\d+(\.\d+)?$/.test(extra[0]) && base.every(token => tokens.includes(token));
    });
    if (sibling) return undefined;
  }
  // s1b n° 9 : un nombre collé à l'unité de la ligne (« Carafa Special 2 Kg ») est une taille d'emballage, jamais un numéro d'identité.
  // Il reste comparé (doute → rien), mais il ne choisit pas entre des articles qui ne diffèrent que par leur numéro.
  if (chosen.identity.uncertain.length) {
    const isNumber = (token: string) => /^\d+(\.\d+)?$/.test(token);
    const stem = (tokens: string[]) => tokens.filter(token => !isNumber(token));
    const chosenCtx = contextOf(chosen.item);
    const chosenTokens = identityOf(chosen.item, chosenCtx.hop, chosenCtx.yeast).tokens;
    const chosenCategory = canonicalStockCategory(chosen.item.category);
    const numbered = items.some(other => {
      if (other === chosen.item || canonicalStockCategory(other.category) !== chosenCategory) return false;
      if (!(unitReadable ? linkUnits(line.unit, other.unit, chosenCategory) : isReadableUnit(other.unit))) return false;
      const ctx = contextOf(other);
      const tokens = identityOf(other, ctx.hop, ctx.yeast).tokens;
      return sameName(stem(tokens), stem(chosenTokens)) && !sameSet(tokens, chosenTokens);
    });
    if (numbered) return undefined;
  }
  return chosen;
}

/** Article proposé pour une ligne lue, ou rien (voir `matchStockLine`). */
export function proposeStockItem(line: StockLineInput, items: StockItem[]): StockItem | undefined {
  return matchStockLine(line, items)?.item;
}
