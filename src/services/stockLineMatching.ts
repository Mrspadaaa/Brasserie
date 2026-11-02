import { normalize } from './search';
import { Units } from './units';
import type { StockItem } from '../types';
import { porteDonneeLue, valeurLueDe } from '../domain/stock/ficheValeurs';
import { CEREALS, hasHopWord, hasYeastWord, inferNature, isReadableUnit, knownCategoriesOf, pieceUnitsEquivalent, PRODUCT_DESCRIPTORS, readProductLabel, weightKey, type Nature, type ProductIdentity } from './ingredientIdentity';
import { categorieDeFamille, familleDe } from '../ui/depense/familles';
import { connuesUnSeulCote, ecartsEntre, lireEbc, lireOrigine, nomPropre, sansBis, sansDonneesDeFiche, type Contexte, type DonneesProduit, type Ecart } from '../domain/stock/donnees';

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
/**
 * La lecture écrit souvent au pluriel, en minuscules, en allemand, en anglais ou en italien (D271 : les factures viennent en quatre langues).
 * Clés sans accent ni casse (`normalize`) ; la valeur est toujours le nom français de `STOCK_CATEGORIES`. Aucun nom de pièce ici : des mots de famille.
 * Absents exprès : « nettoyage / Reinigung / cleaning / pulizia » (trop large : détergent, désinfectant ou CIP ?) — la nature de la ligne tranche alors.
 */
const SYNONYMS = new Map(Object.entries({
  malts: 'Malt', malz: 'Malt', malze: 'Malt', cereale: 'Malt', cereales: 'Malt', cereal: 'Malt', cereals: 'Malt',
  grain: 'Malt', grains: 'Malt', getreide: 'Malt', malto: 'Malt', malti: 'Malt', cereali: 'Malt',
  malzextrakt: 'Malt', malzextrakte: 'Malt', 'malt extract': 'Malt', 'extrait de malt': 'Malt', 'estratto di malto': 'Malt',
  houblons: 'Houblon', hopfen: 'Houblon', hop: 'Houblon', hops: 'Houblon', pellet: 'Houblon', pellets: 'Houblon', hopfenpellets: 'Houblon',
  luppolo: 'Houblon', luppoli: 'Houblon',
  levures: 'Levure', hefe: 'Levure', hefen: 'Levure', brauhefe: 'Levure', trockenhefe: 'Levure', yeast: 'Levure', yeasts: 'Levure', lievito: 'Levure', lieviti: 'Levure',
  sucres: 'Sucre', zucker: 'Sucre', sugar: 'Sucre', sugars: 'Sucre', zucchero: 'Sucre', zuccheri: 'Sucre',
  additifs: 'Additif', additive: 'Additif', additives: 'Additif', additivo: 'Additif', additivi: 'Additif', zusatz: 'Additif', zusatze: 'Additif', zusatzstoff: 'Additif', zusatzstoffe: 'Additif',
  emballages: 'Emballage', packaging: 'Emballage', verpackung: 'Emballage', verpackungen: 'Emballage', imballaggio: 'Emballage', imballaggi: 'Emballage',
  consommables: 'Consommable', consumable: 'Consommable', consumables: 'Consommable', verbrauchsmaterial: 'Consommable', 'materiale di consumo': 'Consommable', 'materiali di consumo': 'Consommable',
  detergents: 'Détergent', detergent: 'Détergent', reinigungsmittel: 'Détergent', detersivo: 'Détergent', detersivi: 'Détergent',
  desinfectants: 'Désinfectant', disinfectant: 'Désinfectant', disinfectants: 'Désinfectant', desinfektionsmittel: 'Désinfectant', disinfettante: 'Désinfectant', disinfettanti: 'Désinfectant'
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

/**
 * Catégorie d'un article NEUF (k7, D271, D273d) : la catégorie lue quand c'est une de `STOCK_CATEGORIES` (après synonymes), jamais un mot étranger
 * ou inconnu (« yeast », « other_stock », « Grain »). Sinon la famille que l'écran donne à la ligne (`familleDe`, la MÊME décision que la bande
 * affichée) : un sirop candi lu « other_stock » est un Sucre, un emballage au libellé de houblon un Emballage. « Divers » seulement quand la famille est « Autres ».
 */
export function categorieArticleNeuf(l: Pick<StockLineInput, 'description' | 'stockCategory' | 'reference' | 'kind'> & { categorie?: string }): string {
  const lue = canonicalStockCategory(l.stockCategory);
  if (STOCK_CATEGORIES.includes(lue)) return lue;
  const contexte = contexteDe({ ...l, stockCategory: undefined });
  // D306 : `categorie` (la catégorie de la dépense) est facultative ; les appelants d'aujourd'hui ne la passent pas (une ligne de Rénovation n'a pas d'article neuf).
  return categorieDeFamille(familleDe({ nom: l.description, kind: l.kind, contexte, categorie: l.categorie }), l.description);
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
/**
 * Écritures d'une unité que `Units` ne reconnaît pas, en quatre langues (D271, D273f), ramenées au g, au kg ou au L pour la Dépense seulement
 * (`Units` ne change pas, s1b n° 2).
 */
const UNIT_SPELLINGS: Record<string, string> = {
  gramm: 'g', gramme: 'g', grammes: 'g', gram: 'g', grams: 'g', grammo: 'g', grammi: 'g', gr: 'g',
  kilo: 'kg', kilos: 'kg', kilogramm: 'kg', kilogramme: 'kg', kilogrammes: 'kg', kilogram: 'kg', kilograms: 'kg', chilo: 'kg', chilogrammo: 'kg', chilogrammi: 'kg',
  liter: 'l', liters: 'l', litre: 'l', litres: 'l', litro: 'l', litri: 'l',
};
const unitSpelling = (unit: string) => (unit ?? '').trim().toLowerCase().replace(/[.\s]+$/, '');
/** Unité telle que l'appariement la compare : minuscules, sans point final (« Kg. » → « kg »), « Kilo » → « kg », « litres » → « l ». */
export const linkUnit = (unit: string) => {
  const key = unitSpelling(unit);
  return UNIT_SPELLINGS[key] ?? key;
};
/** L'unité à l'écran : une écriture longue (« Gramm », « Kilogramm », « Liter ») devient son symbole ; toute autre reste telle qu'imprimée (« Kg », « Stk »). */
export const shortUnit = (unit: string) => UNIT_SPELLINGS[unitSpelling(unit)] ?? (unit ?? '').trim();

/** `vendor` : fournisseur du justificatif ; ses mots dans un nom d'article ne le rendent pas plus précis que la ligne. */
export interface StockLineInput {
  description: string; unit: string; quantity?: number; vendor?: string;
  /** Catégorie lue par le modèle (souvent vide : le prompt interdit de l'inventer). */
  stockCategory?: string;
  /** Code article imprimé (MA…, HO…, HE… chez Brau- und Rauchshop) : sert à REFUSER une catégorie, jamais à choisir. */
  reference?: string;
  /** Nature de la ligne de la feuille : `ingredient`, `packaging`, `cleaning`. */
  kind?: string;
  /**
   * Voie n1-nom-fr (choix B) : le nom FRANÇAIS propre de la ligne (traduction de la base imprimée, `nomFrPropre`). Il ne prête que ses mots au nom : α, récolte, poids, unité
   * et nature restent lus sur `description` (le libellé imprimé). Absent : rien ne change.
   */
  nomFr?: string;
  /** Le nom IMPRIMÉ lu (base, sans options), gardé à la lecture : il se compare aux `nomsFacture` des articles (lien sûr). Absent : aucun nom gardé n'est consulté. */
  nomLu?: string;
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

/** Le nom de la ligne est celui de l'article : 1 = libellés complets, 2 = après retrait des mots du fournisseur (voir `matchStockLine`) ; 0 = autre produit. */
function nameKinship(L: Pick<ProductIdentity, 'tokens' | 'detail'>, I: Pick<ProductIdentity, 'tokens'>, item: StockItem, vendorWords: Set<string>): 0 | 1 | 2 {
  if (sameName(L.tokens, I.tokens)) return 1;
  const supplierWords = new Set(wordsOf(item.supplier ?? ''));
  // s1b n° 1 : un mot qui décrit le produit (bio, cryo, dunkel, rauch…) n'est jamais retiré, même s'il est aussi dans le nom d'un fournisseur.
  const lineWords = L.detail.filter(d => !(d.afterLinker && vendorWords.has(d.t) && !PRODUCT_DESCRIPTORS.has(d.t))).map(d => d.t);
  // s1c n° 2 : un mot du nom de l'article n'est retiré que si le fournisseur de l'ARTICLE le porte ; le fournisseur du justificatif seul ne suffit pas
  // (« Pilsner » chez « Rye Mühle AG » ≠ « Pilsner Rye » : le mot décrit peut-être le produit, pas son vendeur).
  const itemWords = I.tokens.filter(w => PRODUCT_DESCRIPTORS.has(w) || !supplierWords.has(w));
  return sameName(lineWords, itemWords) ? 2 : 0;
}

/** La nature de la ligne n'écarte pas la catégorie de l'article (même refus que s1 : `KIND_REFUSES`, nature forte, nature faible). */
function categorieCompatible(line: Pick<StockLineInput, 'kind'>, nature: Nature, item: StockItem): boolean {
  const category = canonicalStockCategory(item.category);
  if (!STOCK_CATEGORIES.includes(category)) return true;
  if (line.kind && KIND_REFUSES[line.kind]?.includes(category)) return false;
  if (nature.strong && nature.strong !== category) return false;
  if (nature.weak && nature.weak !== category) return false;
  return true;
}

/** Un article qui porte une donnée écrite par S6 : seul celui-là perd son « bis » dans les jetons (T5). Un « Target bis » nu, créé à la main, garde les siens. */
const porteDonneeS6 = porteDonneeLue;
/**
 * L'identité d'un article du stock pour l'appariement : celle de son nom ; pour un article écrit par S6, sans son « bis » ou « bis N » final et avec
 * son origine quand le nom ne l'écrit pas (« Cascade » + origin CH ≡ « Cascade CH »). Aucun autre article ne change.
 */
function identiteArticle(item: StockItem, hop: boolean, yeast: boolean): ProductIdentity {
  const I = readProductLabel(item.name, { unit: linkUnit(item.unit), hop, yeast, side: 'item' });
  if (!porteDonneeS6(item)) return I;
  let { tokens, detail } = I;
  const n = tokens.length;
  const coupe = tokens[n - 1] === 'bis' ? 1 : n >= 2 && tokens[n - 2] === 'bis' && /^\d+$/.test(tokens[n - 1]) ? 2 : 0;
  if (coupe && n - coupe >= 1) { tokens = tokens.slice(0, n - coupe); detail = detail.slice(0, n - coupe); }
  const code = item.origin?.toLowerCase();
  if (code && !tokens.includes(code)) { tokens = [...tokens, code]; detail = [...detail, { t: code, afterLinker: false }]; }
  return tokens === I.tokens ? I : { ...I, tokens, detail };
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
  // Voie n1-nom-fr : le nom imprimé (mots du libellé et noms gardés des articles), puis, si la ligne a son nom français, le nom français (ses MOTS seulement).
  // Un seul article distinct au total → lien ; deux (ou une ambiguïté dans l'une des lectures) → rien, le brasseur choisit (jamais un lien d'office).
  const imprime = matchSurNom(line, items);
  const nomFr = line.nomFr?.trim();
  const francais = nomFr ? matchSurNom(line, items, nomFr) : undefined;
  if (imprime.ambigu || francais?.ambigu) return undefined;
  if (imprime.chosen && francais?.chosen && imprime.chosen.item !== francais.chosen.item) return undefined;
  return imprime.chosen ?? francais?.chosen;
}

/** Ce qu'une lecture du nom a trouvé : l'article, ou une ambiguïté (les articles qui correspondent tous), ou rien. */
interface Trouve { chosen?: StockLineMatch; ambigu: boolean; candidats: StockItem[] }
const RIEN: Trouve = { ambigu: false, candidats: [] };

/**
 * Le corps de `matchStockLine` sur UN nom : le libellé imprimé (`nom` absent) ou le nom français (`nom`, mots seulement : α, récolte, poids du sachet,
 * malté, unité et `deduced` restent lus sur `line.description`, D215). Dans les deux lectures, un nom gardé de l'article (`nomsFacture`) égal au nom lu
 * (`line.nomLu`) donne le lien sûr (`pass` 1), toutes les autres portes tenues.
 */
function matchSurNom(line: StockLineInput, items: StockItem[], nom?: string): Trouve {
  if (!(Number(line.quantity) > 0)) return RIEN;
  // D214 : une unité illisible ('', '-', '?', un nombre seul) n'empêche pas la proposition et n'assouplit aucune autre règle ;
  // elle n'est jamais devinée ni recopiée depuis l'article (la feuille laisse « Unité » vide et dit « unité à préciser »).
  const unitReadable = isReadableUnit(line.unit);
  const lineUnit = unitReadable ? linkUnit(line.unit) : undefined;
  const lineCategory = line.stockCategory ? canonicalStockCategory(line.stockCategory) : undefined;
  const nature = inferNature(line.description, line.reference, lineCategory && STOCK_CATEGORIES.includes(lineCategory) ? lineCategory : undefined);
  const lineHop = nature.strong === 'Houblon' || hasHopWord(line.description);
  const lineYeast = nature.strong === 'Levure' || hasYeastWord(line.description);
  const vendorWords = new Set(wordsOf(line.vendor ?? ''));
  if (!readProductLabel(line.description, { unit: lineUnit, quantity: line.quantity }).tokens.length) return RIEN;

  const identityOf = identiteArticle;
  /** Le nom lu égal à l'un des noms gardés de l'article (mots du libellé, `side: 'line'` des deux côtés) : seulement pour un article de catégorie connue (jamais un fourre-tout). */
  const nomGardeLie = (item: StockItem, hop: boolean, yeast: boolean): boolean => {
    const lu = line.nomLu?.trim();
    if (!lu || !item.nomsFacture?.length || !STOCK_CATEGORIES.includes(canonicalStockCategory(item.category))) return false;
    const options = { unit: lineUnit, quantity: line.quantity, hop, yeast, side: 'line' as const };
    const mots = readProductLabel(lu, options).tokens;
    return mots.length > 0 && item.nomsFacture.some(gardé => sameName(mots, readProductLabel(gardé, options).tokens));
  };
  const contextOf = (item: StockItem) => { const category = canonicalStockCategory(item.category); return { hop: category === 'Houblon' || hasHopWord(item.name), yeast: category === 'Levure' || hasYeastWord(item.name) }; };

  const examine = (item: StockItem): StockLineMatch | undefined => {
    const category = canonicalStockCategory(item.category);
    const known = STOCK_CATEGORIES.includes(category);
    if (!categorieCompatible(line, nature, item)) return undefined;
    const link = unitReadable ? linkUnits(line.unit, item.unit, category) : isReadableUnit(item.unit) ? { alias: false } : undefined;
    if (!link) return undefined;
    const hop = lineHop || category === 'Houblon' || hasHopWord(item.name), yeast = lineYeast || category === 'Levure' || hasYeastWord(item.name);
    const L = readProductLabel(line.description, { unit: lineUnit, quantity: line.quantity, hop, yeast, side: 'line' });
    const I = identityOf(item, hop, yeast);
    if (!L.tokens.length) return undefined;
    // Le nom français ne prête que ses mots : jetons du nom, tout le reste (α, récolte, poids, malté) de L, le libellé imprimé.
    const Lnom = nom ? readProductLabel(nom, { unit: lineUnit, quantity: line.quantity, hop, yeast, side: 'line' }) : L;
    if (!Lnom.tokens.length) return undefined;

    const pass = nameKinship(Lnom, I, item, vendorWords) || (nomGardeLie(item, hop, yeast) ? 1 : 0);
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
      item, identity: nom ? { ...L, tokens: Lnom.tokens, detail: Lnom.detail } : L, pass: pass as 1 | 2, deduced: L.deduced,
      ...(link.alias ? { unitAlias: { from: line.unit.trim(), to: item.unit.trim() } } : {}),
      ...(unitReadable ? {} : { unitMissing: true }),
      ...(weightUnconfirmed ? { weightUnconfirmed: true } : {})
    };
  };

  const first: StockLineMatch[] = [], second: StockLineMatch[] = [];
  for (const item of items) { const match = examine(item); if (match) (match.pass === 1 ? first : second).push(match); }
  const pool = first.length ? first : second;
  if (pool.length > 1) return { ambigu: true, candidats: pool.map(match => match.item) };
  if (pool.length !== 1) return RIEN;
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
    if (sibling) return RIEN;
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
    if (numbered) return RIEN;
  }
  return { chosen, ambigu: false, candidats: [] };
}

/** Article proposé pour une ligne lue, ou rien (voir `matchStockLine`). */
export function proposeStockItem(line: StockLineInput, items: StockItem[]): StockItem | undefined {
  return matchStockLine(line, items)?.item;
}

/* ───────────────────────────── La règle unique « même produit, donnée qui diffère » (voie s6-fiche, D215, D216) ───────────────────────────── */

export type { Contexte, DonneesProduit, Ecart };
export type LigneProduit = StockLineInput;
/** Une ligne `new` déjà décidée du même brouillon : son nom compte pour le suffixe (« bis », « bis 2 »), jamais pour « même article ». */
export interface MembreVirtuel { nom: string }
export type RegleProduit =
  | { cas: 'inconnu'; nom: string }
  | { cas: 'meme'; article: StockItem }
  | { cas: 'incertain'; voisin: StockItem; nom: string; connuUnSeulCote: Ecart[] }
  | { cas: 'ambigu'; candidats: StockItem[]; nom: string }
  | { cas: 'neuf'; nom: string; ecarts: Ecart[]; voisin: StockItem; motif: 'origine' | 'bis' };

const CONTEXTE_DE_CATEGORIE: Record<string, Contexte> = { Houblon: 'Houblon', Malt: 'Malt', Levure: 'Levure' };
const NATURES_HORS_STOCK = new Set(['packaging', 'cleaning', 'equipment', 'maintenance', 'service', 'shipping', 'discount']);
function contexteDeTexte(texte: string, categorie?: string, reference?: string): Contexte {
  const canonique = categorie ? canonicalStockCategory(categorie) : undefined;
  const nature = inferNature(texte, reference, canonique && STOCK_CATEGORIES.includes(canonique) ? canonique : undefined);
  if (nature.strong === 'Houblon' || hasHopWord(texte)) return 'Houblon';
  if (nature.strong === 'Malt') return 'Malt';
  if (nature.strong === 'Levure' || hasYeastWord(texte)) return 'Levure';
  const connus = knownCategoriesOf(readProductLabel(texte).tokens.join(' '));
  return connus.length === 1 ? CONTEXTE_DE_CATEGORIE[connus[0]] ?? 'autre' : 'autre';
}
/** Ce qu'une ligne est : houblon, malt, levure, ou autre chose (emballage, entretien, inconnu). Même lecture que s1. */
export function contexteDe(l: Pick<StockLineInput, 'description' | 'stockCategory' | 'reference' | 'kind'>): Contexte {
  // D262c : une ligne que la lecture dit emballage, nettoyage, matériel, entretien, service, port ou remise n'est jamais un ingrédient : un « Hop Filter Bag » n'est pas un houblon.
  if (NATURES_HORS_STOCK.has(l.kind ?? '')) return 'autre';
  const contexte = contexteDeTexte(l.description, l.stockCategory, l.reference);
  // Un ingrédient sans mot de famille (un malt sous un nom de marque) : le préfixe de la référence imprimée (MA, HO, HE) départage, à défaut de mieux.
  // Il ne remplace jamais un mot de famille ni la catégorie lue (déjà passés ci-dessus), et seulement pour un ingrédient.
  if (contexte === 'autre' && l.kind === 'ingredient') return CONTEXTE_DE_CATEGORIE[inferNature(l.description, l.reference).weak ?? ''] ?? 'autre';
  return contexte;
}
/** Ce qu'un article est : sa catégorie d'abord, sinon les mots de son nom. */
export function contexteDeArticle(item: Pick<StockItem, 'name' | 'category'>): Contexte {
  const categorie = canonicalStockCategory(item.category);
  return CONTEXTE_DE_CATEGORIE[categorie] ?? (STOCK_CATEGORIES.includes(categorie) ? 'autre' : contexteDeTexte(item.name));
}

const pesee = (w: ProductIdentity['pieceWeight']) => (w ? weightKey(w) : undefined);
function donneesDe(lu: ProductIdentity, brut: string, contexte: Contexte, fixe: { alpha?: number; origine?: string; ebc?: number }): DonneesProduit {
  const out: DonneesProduit = {};
  const alpha = fixe.alpha ?? lu.alpha?.value; if (alpha !== undefined) out.alpha = alpha;
  const origine = fixe.origine ?? lireOrigine(brut, contexte)?.value ?? lu.origin?.value; if (origine !== undefined) out.origine = origine;
  if (lu.harvestYear) out.recolte = lu.harvestYear.value;
  const ebc = fixe.ebc ?? lireEbc(brut)?.value; if (ebc !== undefined) out.ebc = ebc;
  const poids = pesee(lu.pieceWeight); if (poids !== undefined) out.poids = poids;
  return out;
}
const positif = (n: number | undefined) => (typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : undefined);

/** Ce que le libellé d'une ligne dit : contexte, jetons de la famille (sans EBC, origine, « bis »), données comparables. */
export function donneesDeLigne(l: StockLineInput, hop?: boolean, yeast?: boolean, nomFr?: string) {
  const contexte = contexteDe(l);
  const lineUnit = isReadableUnit(l.unit) ? linkUnit(l.unit) : undefined;
  const h = hop ?? contexte === 'Houblon', y = yeast ?? contexte === 'Levure';
  const lecture = h ? 'Houblon' as Contexte : contexte;
  const net = sansDonneesDeFiche(l.description, lecture);
  const lu = readProductLabel(net, { unit: lineUnit, quantity: l.quantity, hop: h, yeast: y, side: 'line' });
  // Voie n1-nom-fr : le nom français ne prête que ses mots (jetons, détail) ; les données (α, EBC, origine, récolte, poids) restent celles du libellé imprimé.
  const mots = nomFr ? readProductLabel(sansDonneesDeFiche(nomFr, lecture), { unit: lineUnit, quantity: l.quantity, hop: h, yeast: y, side: 'line' }) : lu;
  return { contexte, lu: nomFr ? { ...lu, tokens: mots.tokens, detail: mots.detail } : lu, jetons: mots.tokens, donnees: donneesDe(lu, l.description, lecture, {}) };
}
/** Ce que le nom et les champs d'un article disent : contexte, jetons de la famille, données comparables (champs de l'article d'abord, sinon son nom). */
export function donneesDArticle(item: StockItem, hop?: boolean, yeast?: boolean) {
  const contexte = contexteDeArticle(item);
  const h = hop ?? (contexte === 'Houblon' || hasHopWord(item.name)), y = yeast ?? (contexte === 'Levure' || hasYeastWord(item.name));
  const lecture = h ? 'Houblon' as Contexte : contexte;
  const net = sansDonneesDeFiche(item.name, lecture);
  const lu = readProductLabel(net, { unit: linkUnit(item.unit), hop: h, yeast: y, side: 'item' });
  return { contexte, lu, jetons: lu.tokens, donnees: donneesDe(lu, item.name, lecture, { alpha: positif(valeurLueDe(item, 'alphaPct')), origine: item.origin, ebc: positif(valeurLueDe(item, 'colorEbc')) }) };
}

export const pliee = (nom: string) => normalize(nom ?? '').replace(/\s+/g, ' ').trim();
/** Deux noms sont le même nom : pliés, et sans les marques ® ™ © (« CARABELGE® » est « CARABELGE », comme la rangée et le nom de l'article les nettoient). Sert au nom imprimé gardé (N2, N4, N5). */
export const memeNom = (a: string, b: string) => pliee((a ?? '').replace(/[®™©]/gu, '')) === pliee((b ?? '').replace(/[®™©]/gu, ''));
/** Les noms pris : celui de chaque article, et « nom + origine » pour un article écrit par S6 dont le nom ne dit pas son origine. */
export function nomsPris(stock: readonly StockItem[], brouillon: readonly MembreVirtuel[]): Set<string> {
  const pris = new Set<string>();
  for (const item of stock) {
    pris.add(pliee(item.name));
    if (item.origin) pris.add(pliee(`${sansBis(item.name)} ${item.origin}`));
  }
  for (const membre of brouillon) pris.add(pliee(membre.nom));
  return pris;
}
/** Le premier nom libre : le candidat, puis « … bis », « … bis 2 », « … bis 3 »… */
function nomLibre(candidat: string, pris: Set<string>): string {
  let nom = candidat.trim(), tour = 0;
  while (pris.has(pliee(nom)) && tour++ < 500) {
    const m = /^(.*?) bis(?: (\d+))?$/.exec(nom);
    nom = m ? `${m[1]} bis ${(m[2] ? Number(m[2]) : 1) + 1}` : `${nom} bis`;
  }
  return nom;
}

/**
 * LA règle « même produit, donnée qui diffère » (D215, D216) ; `voisinDe` et `memeProduit` de l'écran n'en sont que des enveloppes.
 *
 * - **famille** : les articles du même produit, sur les jetons comme s1 (génériques, fournisseurs, passes 1 et 2), sans le code d'origine, l'EBC ni « bis N » ;
 * - **écarts** : seulement les données connues des deux côtés (α, origine, récolte, EBC, poids de pièce) ;
 * - `meme` : s1 relie CE MÊME article (inclusion) ; `neuf` : tous les membres diffèrent par au moins un écart ; `incertain` : un seul membre sans écart que s1 ne relie pas
 *   (une donnée connue d'un seul côté) ; `ambigu` : plusieurs ; `inconnu` : famille vide. Jamais de lien automatique hors `meme`.
 * - **nom** : houblon et malt, le nom propre ; « origine » d'abord quand un membre diffère par l'origine connue de la ligne, sinon « bis » ; le premier nom libre
 *   (stock et lignes `new` du brouillon). Autre produit : le libellé comme avant.
 */
/** Ce que la lecture d'un nom rend en plus de sa règle : les articles d'une ambiguïté du lien (nom gardé compris), et le nom proposé quand rien ne relie. */
interface SortieSurNom { pool: StockItem[]; nomDefaut: string }
function regleSurNom(line: StockLineInput, stock: readonly StockItem[], brouillon: readonly MembreVirtuel[], opts: { jetons?: string; nom?: string }, sortie: SortieSurNom): RegleProduit {
  const contexte = contexteDe(line);
  const lineCategory = line.stockCategory ? canonicalStockCategory(line.stockCategory) : undefined;
  const nature = inferNature(line.description, line.reference, lineCategory && STOCK_CATEGORIES.includes(lineCategory) ? lineCategory : undefined);
  const items = [...stock];
  const pris = nomsPris(items, brouillon);
  const base = contexte === 'Houblon' || contexte === 'Malt'
    ? nomPropre(opts.nom ?? line.description, contexte, { unit: isReadableUnit(line.unit) ? linkUnit(line.unit) : undefined, quantity: line.quantity })
    : (opts.nom ?? line.description).trim();
  const sansNom = (candidat: string) => nomLibre(candidat || (opts.nom ?? line.description).trim(), pris);
  sortie.nomDefaut = sansNom(base);
  const s1 = matchSurNom(line, items, opts.jetons);
  if (s1.ambigu && (line.nomLu || line.nomFr)) sortie.pool = s1.candidats;
  const vendorWords = new Set(wordsOf(line.vendor ?? ''));
  const propre = donneesDeLigne(line, undefined, undefined, opts.jetons);
  const code = propre.donnees.origine;

  const membres: Array<{ item: StockItem; ecarts: Ecart[]; seul: Ecart[] }> = [];
  for (const item of items) {
    if (!categorieCompatible(line, nature, item)) continue;
    const category = canonicalStockCategory(item.category);
    const hop = propre.contexte === 'Houblon' || category === 'Houblon' || hasHopWord(item.name);
    const yeast = propre.contexte === 'Levure' || category === 'Levure' || hasYeastWord(item.name);
    const L = donneesDeLigne(line, hop, yeast, opts.jetons), I = donneesDArticle(item, hop, yeast);
    if (!L.jetons.length || !I.jetons.length) continue;
    if (!nameKinship({ tokens: L.jetons, detail: L.lu.detail }, { tokens: I.jetons }, item, vendorWords)) continue;
    // Nature inconnue : l'identité de l'article est aussi un nom connu d'une autre catégorie (« Crystal ») → pas le même produit (comme s1).
    if (!nature.strong && !nature.weak && STOCK_CATEGORIES.includes(category) && knownCategoriesOf(I.jetons.join(' ')).some(autre => autre !== category)) continue;
    // Malté ≠ non malté pour une céréale qui existe crue (comme s1).
    if (L.lu.malted !== I.lu.malted && L.jetons.some(t => CEREALS.has(t))) continue;
    membres.push({ item, ecarts: ecartsEntre(L.donnees, I.donnees), seul: connuesUnSeulCote(L.donnees, I.donnees) });
  }
  if (s1.chosen) return { cas: 'meme', article: s1.chosen.item };
  if (!membres.length) return { cas: 'inconnu', nom: sansNom(base) };
  const nomHoublonMalt = contexte === 'Houblon' || contexte === 'Malt';
  const sansEcart = membres.filter(m => !m.ecarts.length);
  if (sansEcart.length >= 2) return { cas: 'ambigu', candidats: sansEcart.map(m => m.item), nom: sansNom(nomHoublonMalt && code ? `${base} ${code}` : base) };
  if (sansEcart.length === 1) return { cas: 'incertain', voisin: sansEcart[0].item, connuUnSeulCote: sansEcart[0].seul, nom: sansNom(nomHoublonMalt && code ? `${base} ${code}` : base) };
  const voisin = membres.reduce((meilleur, m) => (m.ecarts.length < meilleur.ecarts.length ? m : meilleur));
  const motif: 'origine' | 'bis' = nomHoublonMalt && code && membres.some(m => m.ecarts.includes('origine')) ? 'origine' : 'bis';
  const candidat = !nomHoublonMalt ? base : motif === 'origine' ? `${base} ${code}` : `${base} bis`;
  return { cas: 'neuf', nom: sansNom(candidat), ecarts: voisin.ecarts, voisin: voisin.item, motif };
}

const GRAVITE = { incertain: 3, neuf: 2, inconnu: 1 } as const;
/**
 * Voie n1-nom-fr : la combinaison de la lecture du nom imprimé (`imprime`) et de celle du nom français (`francais`), plus les articles d'une ambiguïté du lien (`supplementaires`).
 * R1 : candidats distincts (`meme` ou `ambigu` des lectures, supplémentaires) ≥ 2 → `ambigu` (jamais un lien d'office) ; R2 : exactement 1 → `meme` ;
 * R3 : sinon la plus sévère de `incertain > neuf > inconnu`, à égalité la lecture imprimée. Sans nom français ni supplémentaire : la règle imprimée, telle quelle.
 */
export function combinerRegles(imprime: RegleProduit, francais: RegleProduit | undefined, supplementaires: readonly StockItem[], nomParDefaut: string): RegleProduit {
  if (!francais && !supplementaires.length) return imprime;
  const candidats: StockItem[] = [];
  const ajouter = (article: StockItem) => { if (!candidats.some(c => c === article || c.ref === article.ref)) candidats.push(article); };
  for (const r of [imprime, francais]) { if (r?.cas === 'meme') ajouter(r.article); else if (r?.cas === 'ambigu') r.candidats.forEach(ajouter); }
  supplementaires.forEach(ajouter);
  const nomDe = (r: RegleProduit | undefined) => (r && 'nom' in r ? r.nom : undefined);
  if (candidats.length >= 2) return { cas: 'ambigu', candidats, nom: nomDe(francais) ?? nomDe(imprime) ?? nomParDefaut };
  if (candidats.length === 1) return { cas: 'meme', article: candidats[0] };
  const severe = (r: RegleProduit) => GRAVITE[r.cas as keyof typeof GRAVITE] ?? 0;
  return francais && severe(francais) > severe(imprime) ? francais : imprime;
}

/**
 * LA règle publique : le nom imprimé (ses mots lus sur `description`, nommé en français quand la ligne a `nomFr`) et, si la ligne a son nom français, le nom français (ses mots seulement :
 * α, EBC, origine, récolte, poids restent ceux du libellé imprimé, D215), combinés par `combinerRegles`. Sans `nomFr` ni `nomLu` : exactement la règle d'avant.
 */
export function regleProduit(line: StockLineInput, stock: readonly StockItem[], brouillon: readonly MembreVirtuel[] = []): RegleProduit {
  const nomFr = line.nomFr?.trim() || undefined;
  const sortieI: SortieSurNom = { pool: [], nomDefaut: '' }, sortieF: SortieSurNom = { pool: [], nomDefaut: '' };
  const imprime = regleSurNom(line, stock, brouillon, { nom: nomFr }, sortieI);
  const francais = nomFr ? regleSurNom(line, stock, brouillon, { jetons: nomFr, nom: nomFr }, sortieF) : undefined;
  return combinerRegles(imprime, francais, [...sortieI.pool, ...sortieF.pool], sortieI.nomDefaut);
}
