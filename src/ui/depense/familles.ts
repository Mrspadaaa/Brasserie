// Les familles de la liste en bandes (p3c-3, D262c, D262d, D269, D271) : à quelle famille appartient une ligne d'achat.
// Pur : aucun React. Les mots de famille couvrent les quatre langues des factures (allemand, anglais, français ; italien par ses mots de base) ;
// la famille s'affiche toujours en français. La désignation imprimée, elle, ne se traduit jamais (D261a) : on lit le nom, on ne le réécrit pas.
// Aucun nom de pièce ici (L20) : des marques du métier, des termes du métier, des préfixes et suffixes de mots composés allemands.
//
// Source de la famille, dans l'ordre :
//   1. l'article de stock rattaché (sa catégorie est ce que le stock gardera), puis la catégorie lue sur la ligne (`stockCategory`, normalisée par
//      `canonicalStockCategory` : « Yeast », « Hefe » → « Levure ») ; une catégorie d'ingrédient ne capture jamais une ligne que la lecture dit
//      matériel, emballage, nettoyage, entretien ou service (un « Hop Filter Bag » n'est pas un houblon) ;
//   2. le `kind` de la lecture : equipment/maintenance → Matériel de brassage, packaging → Emballage, cleaning → Nettoyage, service → Services ;
//   3. les mots du nom : le matériel d'abord (« Hop Spider Bag » n'est pas du houblon), puis l'emballage et le nettoyage, puis le contexte que
//      `contexteDe` a lu (Malt, Houblon, Levure), puis les listes de ce fichier ;
//   4. « Autres » ne reçoit que l'inclassable (et le port ou la remise qui resteraient en ligne).
import { canonicalStockCategory, STOCK_CATEGORIES } from '../../services/stockLineMatching';
import { hasHopWord } from '../../services/ingredientIdentity';
import { NOMS_HOUBLONS_COMPOSES, NOMS_HOUBLONS_SIMPLES } from './nomsHoublons';

export type FamilleCle = 'malt' | 'houblon' | 'levure' | 'sucre' | 'additif' | 'materiel' | 'emballage' | 'nettoyage' | 'consommable' | 'service' | 'autres';

/** L'ordre d'affichage des bandes (D262c). */
export const ORDRE_FAMILLES: readonly FamilleCle[] = ['malt', 'houblon', 'levure', 'sucre', 'additif', 'materiel', 'emballage', 'nettoyage', 'consommable', 'service', 'autres'];
export const NOMS_FAMILLES: Record<FamilleCle, string> = {
  malt: 'Malts', houblon: 'Houblons', levure: 'Levures', sucre: 'Sucres', additif: 'Additifs', materiel: 'Matériel de brassage', emballage: 'Emballage',
  nettoyage: 'Nettoyage', consommable: 'Consommables', service: 'Services', autres: 'Autres',
};

/** Casse, accents et ß pliés : « Gärtank » → « gartank », « Château » → « chateau ». */
export const plier = (texte: string): string =>
  texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ß/g, 'ss').replace(/æ/g, 'ae').replace(/œ/g, 'oe');

/** La catégorie de stock (déjà canonique) → sa famille ; `undefined` pour une catégorie hors de la liste (« Divers »). */
const FAMILLE_DE_CATEGORIE: Record<string, FamilleCle> = {
  Malt: 'malt', Houblon: 'houblon', Levure: 'levure', Sucre: 'sucre', Additif: 'additif', Emballage: 'emballage',
  'CIP alcalin': 'nettoyage', 'CIP acide': 'nettoyage', Désinfectant: 'nettoyage', Détergent: 'nettoyage', Sols: 'nettoyage', EPI: 'consommable', Consommable: 'consommable',
};
export function familleDeCategorie(categorie: string | undefined): FamilleCle | undefined {
  if (!categorie || !categorie.trim()) return undefined;
  const canonique = canonicalStockCategory(categorie);
  return STOCK_CATEGORIES.includes(canonique) ? FAMILLE_DE_CATEGORIE[canonique] : undefined;
}

// ——— Les mots du métier. Jetons pliés, exacts, sauf les listes de suffixes (mots composés allemands) et de préfixes. ———
const liste = (mots: string): ReadonlySet<string> => new Set(mots.split(/\s+/).filter(Boolean));

/** Matériel de brassage : cuves, fermenteurs, soupapes, tuyaux, sondes, refroidisseurs, filtres à houblon. */
const MATERIEL = liste(`
  fermenteur fermenteurs fermenter fermenters fermentatore fermentatori fermzilla unitank cuve cuves cuvier marmite marmites pentola kessel kettle kettles brewkettle
  tank tanks serbatoio keg kegs fut futs fass fusto fusti fermentationsbehalter
  spundventil spunding ventil ventile valve valves valvola vanne vannes robinet robinets hahn rubinetto faucet
  schlauch schlauche tuyau tuyaux hose hoses tubo tubi pumpe pumpen pump pumps pompe pompes pompa
  thermometre thermometres thermometer thermometers termometro refractometre refraktometer refractometer rifrattometro densimetre hydrometre hydrometer spindel densimetro areometro
  plattenkuhler warmetauscher kuhler chiller refroidisseur serpentin scambiatore
  maischebottich brauanlage anlage spider hopfensack hopsack hopbag hopfenseiher
  gasspund garspund gaerspund airlock blowoff triclamp clamp dichtung joint joints guarnizione
  manometer manometre manometro regulateur regler druckminderer bonbonne demijohn
  trichter entonnoir funnel paddle muhle moulin mulino waage bilancia
`);
/** Suffixes de mots composés (allemand surtout) : « Plattenkühler », « Gärtank », « Hopfensack ». Le jeton doit être plus long que le suffixe. */
const MATERIEL_SUFFIXES = ['sack', 'tank', 'kessel', 'ventil', 'schlauch', 'kuhler', 'thermometer', 'refraktometer', 'spindel', 'pumpe', 'bottich', 'behalter', 'fass', 'anlage'];
/** « Hop Filter Bag » : un sac ou un filtre, avec un mot qui dit qu'il sert au houblon ou à la filtration ; un « Beutel » seul est un emballage de houblon. */
const SACS = liste('bag bags sack sacks sac sacs beutel sacco sacchi');
const FILTRES = liste('filter filtre filtres filtro filtri spider mesh nylon muslin mousseline voile');

const EMBALLAGE = liste(`
  kronkorken kronenkorken kapsel kapseln capsule capsules capsula kapselverschluss tappi tappo corona bouchon bouchons korken kork stopper
  flasche flaschen bouteille bouteilles bottle bottles bottiglia bottiglie verschluss bugelverschluss
  etikett etiketten etikette etiquette etiquettes label labels etichetta etichette
  karton kartons carton cartons cartone kasten kiste caisse caisses crate crates cassa cassetta canette canettes dosen
  emballage emballages verpackung verpackungen packaging imballaggio imballaggi
`);
const NETTOYAGE = liste(`
  chemipro starsan saniclean iodophor iodophore pbw oxi oxyclean percarbonate percarbonat perkarbonat soude natronlauge lauge caustique lessive lessives
  nettoyant nettoyants nettoyage reiniger reinigung reinigungsmittel cleaner cleaners cleaning detergent detergents detergente detergenti detersivo detersivi
  desinfectant desinfectants desinfektion desinfektionsmittel disinfectant disinfectants disinfettante disinfettanti sanitizer sanitizers sanitiser sanitising sanitizing
  sanificante igienizzante peracetic peressigsaure peracetique javel hypochlorite cip brewclean bleach caustic
`);
const NETTOYAGE_PREFIXES = ['sanitiz', 'sanitis', 'sanific', 'igieniz', 'desinfe', 'disinfe', 'reinig', 'nettoy', 'detergen', 'detersiv', 'percarbon', 'perkarbon', 'peressig', 'peracet'];

/** Additifs de brassage : clarifiants, sels de l'eau, acides, nutriments, enzymes. */
const ADDITIF_FORT = liste('nutriment nutriments nutrient nutrients nahrsalz hefenahrsalz fermaid servomyces');
const ADDITIF = liste(`
  whirlfloc whirfloc protafloc irischmoos moss moos cacl2 cacl caso4 mgso4 nahco3 nacl h3po4 caco3 chlorure chlorid chloride cloruro gypse gips gypsum gesso
  sulfate sulfat sulphate solfato bicarbonate bicarbonat bikarbonat bicarbonato epsom bittersalz
  finings clarifiant clarificant chiarificante klarungsmittel klarmittel isinglass gelatine gelatina polyclar pvpp kieselsol biofine brewtan
  enzyme enzymes enzym enzima amylase amyloglucosidase glucoamylase pectinase campden metabisulfite metabisulfit sulfit
  lactique lactic milchsaure lattico phosphorique phosphoric phosphorsaure fosforico calcium calcio sel salz salt
`);
const ADDITIF_SUFFIXES = ['salz'];

const SUCRE = liste(`
  candi kandis kandi sirop sirops syrup syrups sirup sciroppo sucre sucres zucker sugar zucchero dextrose traubenzucker glucose glukose glucosio
  saccharose sucrose saccarosio miel honig honey miele lactose laktose lattosio maltodextrine maltodextrin maltodestrina melasse molasses melassa invertzucker agave
`);
const SUCRE_SUFFIXES = ['zucker', 'sirup', 'syrup', 'dicksaft'];

/** Marques et termes de levure (en plus de ce que `contexteDe` lit déjà : levure, hefe, yeast, catalogue de souches). */
const LEVURE = liste(`
  lievito lieviti levedura hefen brauhefe trockenhefe wyeast lallemand lalbrew fermentis safale saflager safbrew safcider safspirit mangrove
  nottingham windsor verdant voss kveik oyl omega whitelabs wlp
`);
/** Codes de souche imprimés (Fermentis, Mangrove Jack's, Imperial, Wyeast, White Labs). */
const CODES_LEVURE = [
  /\b(us|s|t|w|be|k|wb|bry)[ -]?\d{2,3}(\/\d{2})?\b/, /\bm(10|15|20|29|36|42|44|54|84)\b/, /\bwy ?\d{4}\b/, /\bwlp ?\d{3}\b/, /\boyl[ -]?\d{2,3}\b/, /\bimperial [a-z]\d{2}\b/,
  /\bwhite labs\b/, /\borganic yeast\b/,
];

/** Malts : marques de malteries, familles de malts, céréales (flocons compris), mots composés en -malz / -malt. */
const MALT = liste(`
  malt malts malz malze malto malti getreide cereale cereales cereal cereals cereali grain grains weyermann chateau dingemans bestmalz briess muntons simpsons crisp fawcett swaen gambrinus avangard
  pilsner pilsen pils munich munchner wiener vienna vienne melanoidin melanoidine aromatic biscuit sauermalz
  carafa carahell caramunich carapils carared carafoam carabelge carabrown caraamber caraaroma carabohemian caramel crystal dme lme
  flocons flocken flakes flaked flocchi fiocchi
`);
const MALT_SUFFIXES = ['malz', 'malt', 'flocken', 'flakes'];
// « malzextrakt » : l'extrait de malt (Malzextraktpulver, Malzextrakt flüssig) ; DME / LME : dry et liquid malt extract.
const MALT_PREFIXES = ['carahell', 'caramun', 'carapil', 'carared', 'carafoam', 'carabel', 'carabrown', 'caraamber', 'caraaroma', 'carafa', 'malzextrakt'];
const MALT_PHRASES = [' pale ale ', ' maris otter ', ' golden promise ', ' special b ', ' castle malting ', ' extrait de malt ', ' estratto di malto '];

const HOUBLON = liste('hop hops houblon houblons hopfen luppolo luppoli pellet pellets t90 t45 cryo lupomax dolden doldenhopfen');

/** EPI et consommables : gants, lunettes, tabliers, brosses, éponges, bandelettes de pH. */
const CONSOMMABLE = liste(`
  gant gants handschuh handschuhe gloves guanti lunettes schutzbrille brille goggles occhiali masque masques maske mask mascherina tablier schurze apron grembiule
  bottes stiefel boots stivali chiffon chiffons lappen tuch tucher teststreifen bandelette bandelettes klebeband adhesif tape nastro
  brosse burste brush spazzola eponge schwamm sponge spugna verbrauchsmaterial consommable consommables consumable consumables epi ppe dpi
`);
const SERVICE = liste('abonnement subscription dienstleistung servizio analyse analysis analisi miete location rental noleggio');

const finit = (t: string, suffixes: readonly string[]) => suffixes.some(s => t.length > s.length && t.endsWith(s));
const commence = (t: string, prefixes: readonly string[]) => prefixes.some(p => t.startsWith(p));

/** Les jetons d'un nom : pliés, séparés sur tout ce qui n'est ni lettre ni chiffre. */
export const jetons = (nom: string): string[] => plier(nom).split(/[^a-z0-9]+/).filter(Boolean);

export function estMateriel(nom: string): boolean {
  const t = jetons(nom);
  if (t.some(j => MATERIEL.has(j) || finit(j, MATERIEL_SUFFIXES))) return true;
  if (t.some(j => SACS.has(j)) && t.some(j => FILTRES.has(j))) return true;
  return ` ${t.join(' ')} `.includes(' uni tank ');
}
const estEmballage = (t: string[]) => t.some(j => EMBALLAGE.has(j));
const estNettoyage = (t: string[], joint: string) => t.some(j => NETTOYAGE.has(j) || commence(j, NETTOYAGE_PREFIXES)) || joint.includes(' star san ');
const estLevure = (t: string[], joint: string) => t.some(j => LEVURE.has(j) || finit(j, ['hefe'])) || CODES_LEVURE.some(re => re.test(joint.trim()));
const estMalt = (t: string[], joint: string) =>
  t.some(j => MALT.has(j) || CEREALS_PLIES.has(j) || finit(j, MALT_SUFFIXES) || commence(j, MALT_PREFIXES)) || MALT_PHRASES.some(p => joint.includes(p));
const estSucre = (t: string[]) => t.some(j => SUCRE.has(j) || finit(j, SUCRE_SUFFIXES));
const estAdditif = (t: string[]) => t.some(j => ADDITIF.has(j) || finit(j, ADDITIF_SUFFIXES));
const CEREALS_PLIES: ReadonlySet<string> = liste('avoine hafer oat oats froment ble wheat weizen orge gerste barley seigle roggen rye epeautre dinkel spelt sarrasin buchweizen buckwheat millet hirse sorgho sorghum triticale mais riz reis rice kamut corn');

/**
 * Un nom complet de houblon du catalogue de l'app, lu comme suite de jetons (« El Dorado® 11.7% », « Barbe Rouge 8.6% ») : `hasHopWord` ne voit que le
 * premier mot d'un nom (4 lettres au moins), qui ne dit rien de « El » ni de « Barbe ». Un nom de plusieurs mots se reconnaît seul ; un nom d'un seul mot
 * (« Bergamot ») demande son α imprimé en plus. Un « % » seul ne fait jamais un houblon (Milchsäure 80 %).
 */
const ALPHA_IMPRIME = /\d(?:[.,]\d+)?\s*%/;
export function estNomHoublon(nom: string, t: string[] = jetons(nom)): boolean {
  for (let n = 2; n <= 4; n++) for (let i = 0; i + n <= t.length; i++) if (NOMS_HOUBLONS_COMPOSES.has(t.slice(i, i + n).join(' '))) return true;
  return ALPHA_IMPRIME.test(plier(nom)) && t.some(j => NOMS_HOUBLONS_SIMPLES.has(j));
}

export interface EntreeFamille {
  /** Le nom imprimé de la ligne (jamais traduit). */
  nom?: string;
  /** Le `kind` du brouillon (`ingredient`, `packaging`, `cleaning`, `equipment`, `maintenance`, `service`, `shipping`, `discount`, `other`) ou celui de la lecture (`stock`, `unknown`). */
  kind?: string;
  /** Ce que `contexteDe` a lu : `Malt`, `Houblon`, `Levure` ou `autre`. */
  contexte?: string;
  /** La catégorie de stock lue sur la ligne, telle que la lecture l'a écrite. */
  stockCategory?: string;
  /** La catégorie de l'article de stock rattaché à la ligne. */
  categorieArticle?: string;
}

const KIND_FAMILLE: Record<string, FamilleCle> = { equipment: 'materiel', maintenance: 'materiel', packaging: 'emballage', cleaning: 'nettoyage', service: 'service', shipping: 'autres', discount: 'autres' };
/** Les familles d'ingrédient ne capturent pas une ligne dont la lecture dit qu'elle n'en est pas un. */
const FAMILLES_INGREDIENT: ReadonlySet<FamilleCle> = new Set<FamilleCle>(['malt', 'houblon', 'levure', 'sucre', 'additif']);
const KINDS_HORS_INGREDIENT: ReadonlySet<string> = new Set(['equipment', 'maintenance', 'service', 'packaging', 'cleaning', 'shipping', 'discount']);

export function familleDe(e: EntreeFamille): FamilleCle {
  const kind = typeof e.kind === 'string' ? e.kind : '';
  const horsIngredient = KINDS_HORS_INGREDIENT.has(kind);
  // 1. La catégorie de stock : celle de l'article rattaché, sinon celle que la lecture a écrite.
  const parCategorie = familleDeCategorie(e.categorieArticle) ?? familleDeCategorie(e.stockCategory);
  if (parCategorie && !(horsIngredient && FAMILLES_INGREDIENT.has(parCategorie))) return parCategorie;
  // 2. Le kind de la lecture. Un nettoyage peut être un consommable (gants) : les mots tranchent.
  const nom = typeof e.nom === 'string' ? e.nom : '';
  const t = jetons(nom), joint = ` ${t.join(' ')} `;
  if (kind === 'cleaning') return t.some(j => CONSOMMABLE.has(j)) ? 'consommable' : 'nettoyage';
  if (kind && KIND_FAMILLE[kind]) return KIND_FAMILLE[kind];
  // 3. Les mots. Le matériel d'abord : « Hop Spider Bag » n'est pas du houblon.
  if (estMateriel(nom)) return 'materiel';
  if (estEmballage(t)) return 'emballage';
  if (estNettoyage(t, joint)) return 'nettoyage';
  if (t.some(j => ADDITIF_FORT.has(j))) return 'additif';
  if (e.contexte === 'Malt') return 'malt';
  if (e.contexte === 'Houblon') return 'houblon';
  if (e.contexte === 'Levure') return 'levure';
  if (estAdditif(t) && !estMalt(t, joint)) return 'additif';
  if (estSucre(t) && !estMalt(t, joint)) return 'sucre';
  if (estLevure(t, joint)) return 'levure';
  if (estMalt(t, joint)) return 'malt';
  // Une variété du catalogue de l'app (« Nelson Sauvin™ 9.6% » sans catégorie lue) : jamais un « % » seul (Milchsäure 80 %, Phosphorsäure 75 % sont des additifs, déjà passés).
  if (hasHopWord(nom) || estNomHoublon(nom, t) || t.some(j => HOUBLON.has(j) || commence(j, ['hopfen']))) return 'houblon';
  if (t.some(j => CONSOMMABLE.has(j))) return 'consommable';
  if (t.some(j => SERVICE.has(j))) return 'service';
  return 'autres';
}

/**
 * La catégorie de STOCK d'un article neuf de cette famille (D273d : une seule décision pour la bande à l'écran et pour l'article créé).
 * Toujours une catégorie de `STOCK_CATEGORIES`, sauf « Divers » quand la famille est « Autres ». Pour le nettoyage, la sous-famille se lit
 * dans le nom (désinfectant, soude/CIP, détergent) ; sans mot, « Consommable ». Le matériel et les services n'entrent pas en stock
 * (la validation les refuse) : s'ils arrivaient ici, « Consommable » vaut mieux que « Divers ».
 */
export function categorieDeFamille(famille: FamilleCle, nom = ''): string {
  switch (famille) {
    case 'malt': return 'Malt';
    case 'houblon': return 'Houblon';
    case 'levure': return 'Levure';
    case 'sucre': return 'Sucre';
    case 'additif': return 'Additif';
    case 'emballage': return 'Emballage';
    case 'nettoyage': {
      const joint = ` ${jetons(nom).join(' ')} `;
      const t = jetons(nom);
      if (t.some(j => commence(j, ['desinfe', 'disinfe', 'sanitiz', 'sanitis', 'sanific', 'igieniz', 'iodophor', 'javel', 'hypochlorite'])) || joint.includes(' star san ') || t.includes('starsan') || t.includes('saniclean')) return 'Désinfectant';
      if (t.some(j => ['soude', 'natronlauge', 'lauge', 'caustique', 'caustic', 'cip'].includes(j))) return 'CIP alcalin';
      if (t.some(j => commence(j, ['detergen', 'detersiv', 'reinig', 'nettoy', 'percarbon', 'perkarbon']) || ['chemipro', 'pbw', 'oxi', 'oxyclean', 'lessive', 'cleaner'].includes(j))) return 'Détergent';
      return 'Consommable';
    }
    case 'materiel': case 'consommable': case 'service': return 'Consommable';
    default: return 'Divers';
  }
}
