import { normalize } from './search';
import { Units } from './units';

/**
 * Identité d'un produit tirée d'un libellé de justificatif (voie s1-stock, mission 2026-10-31-ecran-depense).
 *
 * Une seule lecture du libellé : il est découpé en morceaux (mot, nombre, %, séparateur, parenthèse), chaque morceau reçoit un
 * rôle, et on en tire à la fois les jetons d'appariement et le nom propre — pour qu'ils ne divergent jamais. Le libellé brut n'est
 * jamais modifié. Fonction pure : aucun accès au stock, au réseau ni à l'écran.
 *
 * Règle de conduite : dans le doute, un morceau reste de l'IDENTITÉ (il empêche une proposition) ; il ne devient conditionnement,
 * α, récolte, poids de sachet ou annotation que sur une règle écrite ci-dessous. Une proposition perdue est permise, une fausse non.
 */

/** Mots retirés avant comparaison (liste fermée, ARB-M4) : catégorie, forme standard, unité seule, liaison, forme juridique. */
export const GENERIC = new Set([
  'malt', 'malts', 'malz', 'houblon', 'houblons', 'hopfen', 'hop', 'hops', 'levure', 'levures', 'hefe', 'yeast', 'sucre', 'sucres',
  'pellet', 'pellets', 't90', 'sachet', 'sachets', 'type',
  'kg', 'g', 'gr', 'mg', 'l', 'lt', 'ml', 'cl', 'dl', 'pce', 'pces', 'pcs', 'piece', 'pieces', 'stk', 'stuck', 'unite', 'unites',
  'de', 'du', 'des', 'd', 'la', 'le', 'les', 'l', 'et', 'en', 'a', 'au', 'aux', 'von', 'aus', 'of', 'and',
  'sa', 'ag', 'gmbh', 'sarl', 'ltd', 'co'
]);
/** Unités de mesure reconnues après un nombre (« 25 kg ») ; les unités « à la pièce » n'en font pas partie. */
export const MEASURE = new Set(['kg', 'g', 'mg', 'l', 'ml', 'cl', 'dl']);
/** Un nombre qui suit l'un de ces mots est de l'identité (« Typ 2 », « Nr 3 »), jamais un conditionnement. */
const MARKERS = new Set(['typ', 'type', 'nr', 'no', 'grade']);
/** Mots de liaison qui introduisent le nom d'un fournisseur (« Cascade du Banc »). */
export const LINKERS = new Set(['du', 'de', 'des', 'von', 'bei', 'chez', 'by', 'of', 'from', 'aus', 'la', 'le', 'les']);

/** Catégories de Stocks (mêmes valeurs que `STOCK_CATEGORIES` de stockLineMatching.ts, qui importe ce module). */
const CATEGORIES = ['Malt', 'Houblon', 'Levure', 'Sucre', 'Additif', 'Emballage', 'CIP alcalin', 'CIP acide', 'Désinfectant', 'Détergent', 'Sols', 'EPI', 'Consommable'];

/** Noms de houblons du catalogue du dépôt (src/data/hopDatabaseBootstrap.json, noms et alias, 219) : voies/s1-stock/extraire-noms-houblons.mjs. */
const HOP_LIST = 'adeena|admiral|aged hops blend|agnus|ahtanum|akoya|ales for als blend|alora|altus|amarillo|apollo|aramis|ariana|aurora|azacca|belma|bitter gold|blend|boadicea|bobek|bor|bramling cross|bravo|brewers gold|bru 1|callista|calypso|cascade|cashmere|celeia|centennial|challenger|chelan|chinook|citra|cluster|cluster fugget|columbia|columbus|columbus tomahawk|comet|comet estate grown|contessa|cryo poporiginal blend|crystal|ctz|delta|diamant|east kent golding|east kent goldings|eclipse|ekuanot|el dorado|elani|ella|endeavour|enigma|erebus|ernest|eureka|extra styrian dana|falconers flight|falconers flight 7cs|first gold|fuggle|galaxy|galena|glacier|golding|hallertau blanc|hallertauer magnum|hallertauer merkur|hallertauer mittelfruh|hallertauer taurus|hallertauer tradition|harmonie|hbc 1019 c v|hbc 472|hbc 630|hbc 638|hbc 682|hbc 682 c v|helga|helios|herkules|hersbrucker|hersbrucker spat|horizon|hqg3|hs09326|huell classic|huell melon|hull melon|idaho 7|idaho gem|jarrylo|kazbek|kohatu|krush|lemondrop|liberty|loral|lotus|lubelski|lublin|magnat|magnum|mandarina bavaria|marynka|melba|meridian|millennium|monroe|mosaic|motueka|motueka machops|mount hood|moutere|mt hood|mt rainier|nectaron|nelson sauvin|nelson sauvin machops|newport|northdown|northern brewer|nugget|olympic|opal|pacific crest|pacific gem|pacific jade|pacific sunrise|pacifica|pacifica machops|palisade|pekko|perle|phoenix|pilgrim|pilot|pink boots blend|polaris|premiant|pride of ringwood|progress|rakau|rakau machops|relax|riwaka|saaz|saaz late|saazer|sabro|santiam|saphir|savinjski golding|simcoe|sladek|smaragd|solero|sorachi ace|southern cross|sovereign|spalt spalter|spalter|spalter select|sterling|sticklebract|strata|strisselspalt|strisselspalter|styrian gold|styrian golding|styrian savinjski golding|sultana|summer|summit|super galena|super pride|superdelic hops|sussex hop|sybilla|sylva|tahoma|talus|tango|target|tettnang tettnanger|tettnanger|titan|topaz|tradition|trident|triskel|triumph|tsingdao flower|turkeys pick|us saaz|usda 008|vanguard|veterans blend|vic secret|vista|vital|wai|wai iti|waimea|wakatu|wakatu machops|warrior|whitbread golding|whitbread goldings variety|willamette|yakima gold|ycr 1|zappa|zeus|zythos';
/**
 * Les noms du catalogue sous la forme que la comparaison leur donne : `readProductLabel(nom).tokens.join(' ')` (s1b n° 7 de la relecture :
 * « Pride Of Ringwood » devient « pride ringwood », « Falconers Flight 7cs » « falconers flight 7 cs »). Construit à la première utilisation,
 * car `readProductLabel` dépend de constantes définies plus bas dans le module.
 */
let hopNames: Set<string> | undefined;
const HOP_NAMES = () => hopNames ??= new Set(HOP_LIST.split('|').map(name => readProductLabel(name, { hop: true, side: 'item' }).tokens.join(' ')).filter(Boolean));
const HOP_NOT_A_CONTEXT = new Set(['blend', 'aged', 'ales', 'extra', 'first', 'super', 'summer', 'pilot', 'relax', 'progress', 'vital', 'east', 'pink', 'mount', 'new', 'bitter', 'falconers', 'turkeys']);
/** Premiers mots des noms de houblons : « Hallertauer », « Goldings » (au pluriel près) disent « houblon » pour l'α et la récolte. */
const HOP_WORDS = new Set(HOP_LIST.split('|').map(name => name.split(' ')[0]).filter(word => word.length >= 4 && !GENERIC.has(word) && !HOP_NOT_A_CONTEXT.has(word)));
/** Malts connus par leur seul nom (liste fermée, sert à reconnaître un homonyme d'une autre catégorie quand la nature de la ligne est inconnue). */
const MALT_NAMES = new Set(['pilsner', 'pils', 'pilsen', 'pale ale', 'pale', 'maris otter', 'golden promise', 'munich', 'vienna', 'wiener', 'caramunich', 'carapils', 'carahell', 'carared', 'caramel', 'cara', 'carafa', 'carafa special',
  'crystal', 'chocolate', 'black', 'roasted barley', 'rostgerste', 'biscuit', 'victory', 'melanoidin', 'special b', 'aromatic', 'amber', 'brown', 'honey', 'acidulated', 'sauer', 'smoked', 'rauch', 'dunkel', 'hell', 'blond', 'abbaye', 'abbey',
  'kolsch', 'weizen', 'wheat', 'rye', 'roggen', 'oat', 'oats', 'hafer', 'avoine', 'froment', 'orge', 'gerste', 'barley', 'seigle', 'peated', 'tourbe', 'cara munich']);
/** Levures connues par leur nom ou leur code (liste fermée). */
const YEAST_NAMES = new Set(['us05', 's04', 's33', 't58', 'be256', 'be134', 'k97', 'wb06', 'm44', 'bry97', 'windsor', 'nottingham', 'verdant ipa', 'verdant', 'voss', 'belle saison', 'kveik', 'abbaye', 'abbey', 'kolsch', 'weizen', 'lager', 'safale us05', 'safale s04',
  'safale be256', 'saflager', 'wlp001', '1056', '1968', 'american ale', 'london ale', 'hornindal', 'lutra', 'ipa']);
/** Mots qui disent « levure » : le contexte où un poids de sachet, une parenthèse ou un fabricant n'ajoute pas d'identité. */
const YEAST_WORDS = new Set(['safale', 'saflager', 'safbrew', 'us05', 's04', 's33', 't58', 'be256', 'be134', 'windsor', 'nottingham', 'verdant', 'voss', 'kveik', 'wyeast', 'lalbrew', 'fermentis', 'lallemand', 'danstar', 'levure', 'levures', 'hefe', 'yeast']);
/** Souches nommées (liste fermée) : un fabricant n'est ignoré que devant un code de souche ou l'une de ces souches. */
const STRAINS = new Set(['windsor', 'nottingham', 'verdant ipa', 'voss', 'belle saison', 'kveik', 'london ale iii', 'london ale', 'american ale', 'abbaye ale', 'munich classic']);
const BRANDS = new Set(['fermentis', 'lallemand', 'lalbrew', 'danstar']);
export const ORIGINS = new Set(['CH', 'DE', 'US', 'NZ', 'AU', 'UK', 'GB', 'CZ', 'SI', 'FR', 'PL', 'AT', 'BE']);
/** Céréales qui existent crues et maltées : « Malt d'avoine » n'est pas « Avoine ». Tout grain hors liste reste une fausse proposition possible. */
export const CEREALS = new Set(['avoine', 'hafer', 'oat', 'oats', 'froment', 'ble', 'wheat', 'weizen', 'orge', 'gerste', 'barley', 'seigle', 'roggen', 'rye', 'epeautre', 'dinkel', 'spelt', 'sarrasin', 'buchweizen', 'buckwheat',
  'millet', 'hirse', 'sorgho', 'sorghum', 'triticale', 'mais', 'riz', 'reis', 'rice', 'kamut', 'corn']);

export interface Sourced<T> { value: T; source: 'libellé' }
export interface PieceWeight { value: number; unit: 'g' | 'mg' | 'ml'; source: 'libellé' }
export interface ProductIdentity {
  /** Le libellé tel qu'imprimé, intact. */
  rawLabel: string;
  /** Nom propre : casse imprimée, sans ®™, unité, conditionnement sûr, α, récolte, poids de pièce, code pays. */
  name: string;
  /** Jetons d'appariement (minuscules, sans accent, génériques retirés). */
  tokens: string[];
  /** Mêmes jetons, avec le mot de liaison qui introduisait chacun (« du Banc ») : sert à ignorer un fournisseur. */
  detail: Array<{ t: string; afterLinker: boolean }>;
  alpha?: Sourced<number>;
  harvestYear?: Sourced<number>;
  packSize?: { value: number; unit: string; source: 'libellé' };
  pieceWeight?: PieceWeight;
  origin?: Sourced<string>;
  /** Le libellé dit « malt » ou « malz » (mot ou suffixe). */
  malted: boolean;
  /** Faits déduits du libellé, prêts pour l'extrait de la ligne : « α 11,3 % (libellé) ». */
  deduced: string[];
  /** Morceaux douteux laissés dans l'identité (un « 25 kg » collé au nom). */
  uncertain: string[];
}

export interface ReadOptions {
  /** Unité de la ligne (ou de l'article) : donne la famille (masse, volume, pièce). */
  unit?: string;
  /** Quantité de la ligne : un nombre n'est conditionnement que s'il la divise. */
  quantity?: number;
  /** Contexte houblon : α et récolte sortent de l'identité. */
  hop?: boolean;
  /** Contexte levure : poids de sachet, parenthèse et fabricant n'ajoutent pas d'identité. */
  yeast?: boolean;
  /** `item` : un article du stock n'a pas de quantité ; un conditionnement séparé suffit. */
  side?: 'line' | 'item';
}

type Kind = 'word' | 'num' | 'sep' | 'pct' | 'open' | 'close';
interface Tok { t: string; kind: Kind; s: number; e: number }

/** Minuscules sans accent, sans changer la longueur (les positions du texte d'origine restent valables). */
function fold(raw: string): string {
  let out = '';
  for (const ch of raw) {
    const n = normalize(ch);
    out += n.length === ch.length ? n : ' '.repeat(ch.length);
  }
  return out;
}

const RX = /([a-zß]{1,3}-\d+)|([a-zß]+\d*)|(\d+(?:[.,]\d+)?)|(%)|([,·;])|(\()|(\))/g;
function scan(folded: string): Tok[] {
  const out: Tok[] = [];
  for (const m of folded.matchAll(RX)) {
    const s = m.index ?? 0, e = s + m[0].length;
    if (m[1] || m[2]) out.push({ t: m[0].replace(/ß/g, 'ss').replace('-', ''), kind: 'word', s, e });
    else if (m[3]) out.push({ t: m[0].replace(',', '.'), kind: 'num', s, e });
    else if (m[4]) out.push({ t: '%', kind: 'pct', s, e });
    else if (m[5]) out.push({ t: m[0], kind: 'sep', s, e });
    else if (m[6]) out.push({ t: '(', kind: 'open', s, e });
    else out.push({ t: ')', kind: 'close', s, e });
  }
  return out;
}

const fmt = (n: number) => String(n).replace('.', ',');
const isCode = (t: string) => /^[a-z]{1,4}\d{2,4}$/.test(t) && !GENERIC.has(t);
const detachMalt = (w: string) => w.replace(/^(.{4,}?)(malz|malt)$/, '$1');

/**
 * SM (08.11, « SI je mets suivre au stock, ça devrait faire le mapping automatique... ») : UNE règle de nom pour la lecture et pour « Suivre au stock ».
 * Un nom de houblon à plusieurs mots du catalogue (`HOP_LIST`, alias compris), écrit collé ou avec des tirets (« Idaho7 », « ElDorado », « Bru-1 »), se réécrit
 * avec ses espaces (« Idaho 7 », « El Dorado ») avant toute lecture : le contexte, les jetons d'appariement et le nom propre en dépendent, jamais le libellé imprimé.
 * Exact seulement : les mots du libellé, joints, égaux au nom joint du catalogue (casse et accents ignorés). Aucun rapprochement flou : « Citra » et « Citra Cryo »
 * restent deux noms ; une clé jointe commune à deux écritures différentes du catalogue n'est pas retenue.
 */
const MOTS_DE_NOM = /[\p{L}\p{N}]+/gu;
const ECART_DE_NOM = /^[\s\-–‑]+$/u;
const MOTS_PETITS = new Set(['of', 'for', 'de']);
const sansAccent = (mot: string) => mot.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/ß/g, 'ss');
let nomsCollesDuCatalogue: Map<string, string> | undefined;
const NOMS_COLLES = (): Map<string, string> => {
  if (nomsCollesDuCatalogue) return nomsCollesDuCatalogue;
  const table = new Map<string, string | null>();
  const simples = new Set(HOP_LIST.split('|').filter(nom => !nom.includes(' ')));
  for (const nom of HOP_LIST.split('|')) {
    const mots = nom.split(' ');
    if (mots.length < 2) continue;
    const cle = mots.join(''), ecrit = mots.map(mot => (MOTS_PETITS.has(mot) ? mot : mot.charAt(0).toUpperCase() + mot.slice(1))).join(' ');
    table.set(cle, simples.has(cle) || (table.has(cle) && table.get(cle) !== ecrit) ? null : ecrit);
  }
  nomsCollesDuCatalogue = new Map([...table].filter((entree): entree is [string, string] => entree[1] !== null));
  return nomsCollesDuCatalogue;
};
const MEMO_ESPACES = new Map<string, string>();
export function espacerNomsHoublons(texte: string): string {
  const memo = MEMO_ESPACES.get(texte);
  if (memo !== undefined) return memo;
  const mots = [...texte.matchAll(MOTS_DE_NOM)];
  let sortie = texte;
  if (mots.length) {
    const table = NOMS_COLLES();
    let rendu = '', curseur = 0;
    for (let i = 0; i < mots.length;) {
      let retenu = 0;
      for (let n = Math.min(5, mots.length - i); n >= 1 && !retenu; n--) {
        let suite = true;
        for (let k = i; k < i + n - 1 && suite; k++) suite = ECART_DE_NOM.test(texte.slice(mots[k].index! + mots[k][0].length, mots[k + 1].index));
        if (!suite) continue;
        const ecrit = table.get(mots.slice(i, i + n).map(m => sansAccent(m[0])).join(''));
        if (!ecrit) continue;
        retenu = n;
        const debut = mots[i].index!, fin = mots[i + n - 1].index! + mots[i + n - 1][0].length;
        if (sansAccent(texte.slice(debut, fin)) !== sansAccent(ecrit)) { rendu += texte.slice(curseur, debut) + ecrit; curseur = fin; }
      }
      i += retenu || 1;
    }
    sortie = rendu + texte.slice(curseur);
  }
  if (MEMO_ESPACES.size > 4000) MEMO_ESPACES.clear();
  MEMO_ESPACES.set(texte, sortie);
  return sortie;
}

/** Mots du libellé (au pluriel près) qui disent « houblon » : un nom du catalogue, ou son premier mot. */
export function hasHopWord(label: string): boolean {
  return scan(fold(espacerNomsHoublons(label))).some(tok => tok.kind === 'word' && (HOP_WORDS.has(tok.t) || HOP_WORDS.has(tok.t.replace(/s$/, ''))));
}
/** Mots du libellé qui disent « levure » (liste fermée de marques de souche, de codes et de souches nommées). */
export function hasYeastWord(label: string): boolean {
  return scan(fold(label)).some(tok => tok.kind === 'word' && YEAST_WORDS.has(tok.t));
}

/** Quantité de la ligne = multiple entier du nombre lu (converti dans l'unité de la ligne). Sans quantité lisible : faux. */
function divides(value: number, from: string, lineUnit: string, quantity: number | undefined): boolean {
  if (!(Number(quantity) > 0) || !(value > 0)) return false;
  const n = Units.convert(value, from, lineUnit);
  if (n === null || !(n > 0)) return false;
  const ratio = Number(quantity) / n;
  return ratio >= 1 - 1e-9 && Math.abs(ratio - Math.round(ratio)) < 1e-9;
}

export function readProductLabel(label: string, o: ReadOptions = {}): ProductIdentity {
  const raw = label ?? '';
  // SM : un nom de houblon collé (« Idaho7 ») se lit avec ses espaces ; `rawLabel` garde l'imprimé.
  const nfc = espacerNomsHoublons(raw.normalize('NFC'));
  const folded = fold(nfc);
  const toks = scan(folded);
  const family = o.unit ? Units.familyOf(o.unit) : 'piece';
  const keepUnits = !!o.unit && family === 'piece';
  const role: string[] = new Array(toks.length).fill('');
  const identity: Pick<ProductIdentity, 'alpha' | 'harvestYear' | 'packSize' | 'pieceWeight' | 'origin'> = {};
  const uncertain: string[] = [];
  const trailing = (from: number) => toks.slice(from).every(tok => tok.kind === 'sep' || tok.kind === 'close' || (tok.kind === 'word' && /^[A-Z]{2}$/.test(nfc.slice(tok.s, tok.e)) && ORIGINS.has(nfc.slice(tok.s, tok.e))));
  const sepBefore = (i: number) => toks[i - 1]?.kind === 'sep' && (toks[i - 1].t === ',' || toks[i - 1].t === '·');

  for (let i = 0; i < toks.length; i++) {
    const tok = toks[i], next = toks[i + 1];
    if (role[i]) continue;
    if (tok.kind === 'word') {
      if (GENERIC.has(tok.t) && !(keepUnits && MEASURE.has(tok.t))) role[i] = MEASURE.has(tok.t) && (toks[i - 1]?.kind === 'sep' || i === toks.length - 1 || toks[i + 1]?.kind === 'sep') && toks[i - 1]?.kind !== 'num' ? 'looseunit' : 'generic';
      else role[i] = 'word';
      continue;
    }
    if (tok.kind !== 'num') continue;
    const value = Number(tok.t);
    const afterMarker = toks[i - 1]?.kind === 'word' && MARKERS.has(toks[i - 1].t);
    // α : un nombre suivi de % entre 1 et 30, dans le contexte houblon seulement (« Acide phosphorique 75% » reste identité).
    if (next?.kind === 'pct' && o.hop && value >= 1 && value <= 30 && !afterMarker) {
      role[i] = 'alpha'; role[i + 1] = 'alpha';
      identity.alpha = { value, source: 'libellé' };
      continue;
    }
    // Récolte : une année isolée de 2000 à 2039, dans le contexte houblon seulement (un code Wyeast 20xx garde son code).
    if (o.hop && /^20[0-3]\d$/.test(tok.t) && !(next?.kind === 'word' && MEASURE.has(next.t)) && next?.kind !== 'pct' && !afterMarker) {
      role[i] = 'year';
      identity.harvestYear = { value, source: 'libellé' };
      continue;
    }
    const unitTok = next?.kind === 'word' && MEASURE.has(next.t) ? next : undefined;
    if (!unitTok) { role[i] = 'num'; continue; }
    const ufam = Units.familyOf(unitTok.t);
    if (afterMarker) { role[i] = 'num'; role[i + 1] = 'unitafter'; continue; }
    // Poids d'un sachet (levure) : « 11 g », « 11,5 g » en fin de libellé.
    if (o.yeast && trailing(i + 2) && (unitTok.t === 'g' || unitTok.t === 'mg' || unitTok.t === 'ml')) {
      role[i] = 'weight'; role[i + 1] = 'weight';
      identity.pieceWeight = { value, unit: unitTok.t as 'g' | 'mg' | 'ml', source: 'libellé' };
      continue;
    }
    // s1c n° 1 : ligne sans unité lisible (colonne vide, « - », « n/a », « x », « k.A. ») — le « 2 Kg » du libellé est une taille d'emballage possible,
    // jamais un numéro d'identité : même lecture que pour une unité lisible de la même famille (nombre gardé, mais marqué incertain).
    if (!o.unit && o.side !== 'item' && ufam !== 'piece') {
      role[i] = 'num'; role[i + 1] = 'unituncertain';
      uncertain.push(`${tok.t} ${unitTok.t}`);
      continue;
    }
    if (family !== 'piece') {
      if (ufam === family) {
        // Conditionnement : séparé du nom par une virgule ou un point médian ET diviseur de la quantité (côté ligne).
        if (sepBefore(i) && (o.side === 'item' || divides(value, unitTok.t, o.unit as string, o.quantity))) {
          role[i] = 'pack'; role[i + 1] = 'pack'; role[i - 1] = 'packsep';
          identity.packSize = { value, unit: unitTok.t, source: 'libellé' };
        } else {
          // Collé au nom, ou qui ne divise pas la quantité : de l'identité incertaine, le nombre est gardé.
          role[i] = 'num'; role[i + 1] = 'unituncertain';
          uncertain.push(`${tok.t} ${unitTok.t}`);
        }
      } else {
        role[i] = 'numunit'; role[i + 1] = 'numunitskip'; // « 60L » (Lovibond) ≠ « 60 »
      }
      continue;
    }
    role[i] = 'num';
  }

  // Origine : code pays en capitales juste après l'α ou la récolte (« 9.5% CH »).
  for (let i = 1; i < toks.length; i++) {
    const text = nfc.slice(toks[i].s, toks[i].e);
    if (toks[i].kind === 'word' && /^[A-Z]{2}$/.test(text) && ORIGINS.has(text) && (role[i - 1] === 'alpha' || role[i - 1] === 'year')) { role[i] = 'origin'; identity.origin = { value: text, source: 'libellé' }; }
  }

  // Parenthèse = annotation quand un code produit la précède, dans une levure seulement (« Safale BE-256 (Abbaye) »).
  if (o.yeast) {
    let depth = 0, hasCodeOutside = false;
    toks.forEach((tok, i) => { if (tok.kind === 'open') depth++; else if (tok.kind === 'close') depth = Math.max(0, depth - 1); else if (depth === 0 && role[i] === 'word' && isCode(tok.t)) hasCodeOutside = true; });
    if (hasCodeOutside) {
      depth = 0;
      toks.forEach((tok, i) => { if (tok.kind === 'open') { depth++; role[i] = 'annot'; } else if (tok.kind === 'close') { role[i] = 'annot'; depth = Math.max(0, depth - 1); } else if (depth > 0 && (role[i] === 'word' || role[i] === 'num')) role[i] = 'annot'; });
    }
  }

  // Fabricant de levure : ignoré seulement si le reste du nom porte un code de souche ou une souche nommée.
  if (o.yeast) {
    const rest = toks.map((tok, i) => ({ tok, i })).filter(({ tok, i }) => role[i] === 'word' && !BRANDS.has(tok.t));
    const joined = rest.map(({ tok }) => tok.t).join(' ');
    if (rest.some(({ tok }) => isCode(tok.t)) || STRAINS.has(joined)) toks.forEach((tok, i) => { if (role[i] === 'word' && BRANDS.has(tok.t)) role[i] = 'brand'; });
  }

  // Jetons d'appariement.
  const detail: Array<{ t: string; afterLinker: boolean }> = [];
  let malted = false;
  toks.forEach((tok, i) => {
    const r = role[i];
    if (tok.kind === 'word' && (tok.t === 'malt' || tok.t === 'malts' || tok.t === 'malz' || detachMalt(tok.t) !== tok.t)) malted = true;
    if (r === 'word' || r === 'origin') {
      // le mot de liaison qui précède (hors séparateurs) : « Cascade du Banc »
      let j = i - 1; while (j >= 0 && toks[j].kind === 'sep') j--;
      detail.push({ t: detachMalt(tok.t), afterLinker: j >= 0 && toks[j].kind === 'word' && LINKERS.has(toks[j].t) });
    } else if (r === 'num') detail.push({ t: tok.t, afterLinker: false });
    else if (r === 'numunit') detail.push({ t: tok.t + toks[i + 1].t, afterLinker: false });
    else if (r === 'generic' && keepUnits && MEASURE.has(tok.t)) detail.push({ t: tok.t, afterLinker: false });
  });
  // Cas d'une unité de la ligne à la pièce : les mots de MEASURE restent des jetons (« Bouteilles 50 cl » ≠ « Bouteilles 33 cl »).
  // (la boucle ci-dessus les a déjà mis en 'word' car `GENERIC.has && !(keepUnits && MEASURE.has)` est faux pour eux)

  // Nom propre : casse imprimée, sans les morceaux dont le rôle est dit.
  const cut: Array<[number, number]> = [];
  toks.forEach((tok, i) => { if (['alpha', 'year', 'weight', 'pack', 'packsep', 'origin', 'unitafter', 'looseunit'].includes(role[i])) cut.push([tok.s, tok.e]); });
  let name = nfc;
  for (const [s, e] of cut.sort((a, b) => b[0] - a[0])) name = name.slice(0, s) + ' ' + name.slice(e);
  name = name.replace(/[®™©]/g, ' ').replace(/\(\s*\)/g, ' ').replace(/\s+([,;·])/g, '$1').replace(/\s+/g, ' ').replace(/^[\s,;·\-–]+|[\s,;·\-–]+$/g, '').replace(/([,;·])\s*(?=[,;·])/g, '').replace(/[,;·\-–]+$/g, '').trim();

  const deduced: string[] = [];
  if (identity.alpha) deduced.push(`α ${fmt(identity.alpha.value)} % (libellé)`);
  if (identity.harvestYear) deduced.push(`récolte ${identity.harvestYear.value} (libellé)`);
  if (identity.pieceWeight) deduced.push(`poids du sachet ${fmt(identity.pieceWeight.value)} ${identity.pieceWeight.unit} (libellé)`);
  if (identity.packSize) deduced.push(`conditionnement ${fmt(identity.packSize.value)} ${identity.packSize.unit} (libellé)`);
  if (identity.origin) deduced.push(`origine ${identity.origin.value} (libellé)`);

  return { rawLabel: raw, name, tokens: detail.map(d => d.t), detail, malted, deduced, uncertain, ...identity };
}

/** Poids de pièce en grammes (ou ml) pour comparer « 11,5 g » et « 11500 mg ». */
export function weightKey(w: PieceWeight): string {
  const v = w.unit === 'mg' ? w.value / 1000 : w.value;
  return `${w.unit === 'ml' ? 'ml' : 'g'}:${Math.round(v * 1e6) / 1e6}`;
}

export type Nature = { strong?: string; weak?: string };
const NATURE_WORDS: Record<string, string> = { malt: 'Malt', malts: 'Malt', malz: 'Malt', houblon: 'Houblon', houblons: 'Houblon', hopfen: 'Houblon', hop: 'Houblon', hops: 'Houblon', pellet: 'Houblon', pellets: 'Houblon', t90: 'Houblon', levure: 'Levure', levures: 'Levure', hefe: 'Levure', yeast: 'Levure', sucre: 'Sucre', sucres: 'Sucre', zucker: 'Sucre' };
const CODE_PREFIX: Record<string, string> = { MA: 'Malt', HO: 'Houblon', HE: 'Levure' };

/**
 * Nature d'une ligne (Malt, Houblon, Levure, Sucre…). `strong` : catégorie lue (déjà canonique) ou mots du libellé — peut départager.
 * `weak` : préfixe du code article (MA, HO, HE : convention du fournisseur de la facture 372765) — ne sert qu'à REFUSER, jamais à choisir.
 */
export function inferNature(label: string, reference?: string, stockCategory?: string): Nature {
  const out: Nature = {};
  if (stockCategory && CATEGORIES.includes(stockCategory)) out.strong = stockCategory;
  if (!out.strong) {
    const found = new Set<string>();
    for (const tok of scan(fold(label))) {
      if (tok.kind !== 'word') continue;
      if (NATURE_WORDS[tok.t]) found.add(NATURE_WORDS[tok.t]);
      else if (detachMalt(tok.t) !== tok.t) found.add('Malt');
    }
    if (found.size === 1) out.strong = [...found][0];
  }
  const code = /^\s*([A-Za-z]{2})\d/.exec(reference ?? '');
  if (code && CODE_PREFIX[code[1].toUpperCase()]) out.weak = CODE_PREFIX[code[1].toUpperCase()];
  return out;
}

/** Catégories où l'identité (jetons joints) est un nom connu : houblons du catalogue, malts et levures de la liste fermée. */
export function knownCategoriesOf(key: string): string[] {
  const out: string[] = [];
  if (HOP_NAMES().has(key)) out.push('Houblon');
  if (MALT_NAMES.has(key)) out.push('Malt');
  if (YEAST_NAMES.has(key)) out.push('Levure');
  return out;
}

const PIECE_UNITS = new Set(['stk', 'stuck', 'pce', 'pces', 'pcs', 'pc', 'piece', 'pieces', 'unite', 'unites']);
const SACHET_UNITS = new Set(['sachet', 'sachets']);
const unitKey = (unit: string) => normalize(unit).replace(/\./g, '').trim();
/** Valeurs imprimées à la place d'une unité (« n/a », « k.A. » = keine Angabe, « n.d. », « x »), lettres seules après retrait de la ponctuation. */
const UNIT_PLACEHOLDERS = new Set(['na', 'ka', 'nd', 'x']);
/** Une unité lisible contient au moins une lettre et n'est pas un « non applicable » (« ? », « 12 », « — », « n/a », « k.A. », « x » ne sont pas des unités). */
export const isReadableUnit = (unit: string | undefined) => {
  const key = normalize(unit ?? '');
  return /[a-z]/.test(key) && !UNIT_PLACEHOLDERS.has(key.replace(/[^a-z]/g, ''));
};

/**
 * Mots qui décrivent le produit (s1b n° 1) : jamais retirés du nom d'un article au motif qu'ils figurent aussi dans le nom d'un fournisseur
 * (« Bio Malz AG » ≠ un Pilsner conventionnel, « Cryo Hops » ≠ T90, « Rauch » = fumé). Liste fermée, sans accent ni tréma (« öko » → « oko »).
 */
export const PRODUCT_DESCRIPTORS = new Set([
  'bio', 'organic', 'organique', 'biologique', 'oko', 'oeko', 'cryo', 'lupomax', 't45', 't90',
  'dunkel', 'hell', 'light', 'smoked', 'smoke', 'rauch', 'fume', 'extra', 'pale', 'dark', 'crystal', 'caramel', 'wheat', 'weizen',
  'blond', 'amber', 'black', 'noir', 'brown', 'roasted', 'peated', 'tourbe', 'lager', 'pils', 'pilsner'
]);
export const isPieceUnit = (unit: string) => PIECE_UNITS.has(unitKey(unit));
export const isSachetUnit = (unit: string) => SACHET_UNITS.has(unitKey(unit));

/**
 * Deux unités à la pièce désignent la même chose : Stk = Stück = pce ; sachet = sachets. Stk ↔ sachet seulement pour une levure
 * (un sachet est la pièce d'une levure). `units.ts` ne bouge pas : Stk ne se convertit en rien, ici on n'apparie que.
 */
export function pieceUnitsEquivalent(lineUnit: string, itemUnit: string, itemCategory: string): boolean {
  const a = unitKey(lineUnit), b = unitKey(itemUnit);
  if (!a || !b) return false;
  if (PIECE_UNITS.has(a) && PIECE_UNITS.has(b)) return true;
  if (SACHET_UNITS.has(a) && SACHET_UNITS.has(b)) return true;
  return itemCategory === 'Levure' && ((PIECE_UNITS.has(a) && SACHET_UNITS.has(b)) || (SACHET_UNITS.has(a) && PIECE_UNITS.has(b)));
}
