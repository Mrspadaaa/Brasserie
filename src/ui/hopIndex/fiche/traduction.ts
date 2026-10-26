// Les mots des fiches, traduits en français (D97, D160) : les mots anglais qui n'ont pas d'étiquette française dans le catalogue
// (Hopsteiner, citations, les 12 sources de d4), puis les étiquettes de Beer Maverick (tags → tagsFr) de tout le catalogue. Lu par la
// matrice (donnees-matrice.ts), « Ses mots » de Comparer (comparer/calcul.ts), « lui seul » de Substituer et de Suggérer, la feuille
// Sources et l'explication de « autres » (autres.ts) : une seule table, un seul tri. Module léger (aucun calcul de remplaçants),
// pour que la carte de Ma bière puisse l'importer sans tirer Substituer.
//
// Le moteur lit le texte anglais d'origine (familles, scores) : rien ici ne change un calcul, seulement le mot montré.
// Trois sortes de mots, triées par `motAffiche` :
//   · un descripteur d'arôme : traduit (COMPLEMENT), en minuscules, court, comme le dirait un brasseur ;
//   · un mot générique (GENERIQUES : « fruité », « doux », « agréable »…) : traduit aussi, mais il ne signe aucun houblon ;
//   · une phrase qui n'est pas un arôme (NON_AROMES : « clean bitterness », « no distinct aroma characteristics »…) : elle reste
//     dans la donnée, avec sa source, mais ne se montre pas parmi les mots (motAffiche rend null).
// Laissés tels quels : les noms propres (cépages, bonbons), les mots écrits pareil dans les deux langues (« orange », « rose »,
// « caramel »…) et « dank », terme de brasseur sans équivalent court (18 houblons chez Beer Maverick, cerveau/metier/descripteurs-hors-familles).
import { fiches } from '../parcours/v4';

const COMPLEMENT: Record<string, string> = {
  // c6 (26.10) : les mots des fiches que la table d'alias rattache à une variété (Hallertauer Mittelfrüh, Mt. Rainier, Northern Brewer…).
  celery: 'céleri', 'classic herbs': 'herbes classiques', 'mixed berry': 'baies variées', 'peach tea': 'thé à la pêche', 'sugar like': 'sucré', 'morello cherry': 'griotte',
  'orange syrup': "sirop d'orange", 'excellent floral': 'floral', 'noble aromas': 'arômes nobles', 'with citrus': 'agrumes', 'licorice tones': 'réglisse', 'wild fruit': 'fruits sauvages',
  'herbal/earthy': 'herbacé, terreux', 'woody/tobacco': 'boisé, tabac', 'oak barrel': 'fût de chêne', 'ripe banana': 'banane mûre', 'soft spice': 'épices douces',
  'white wine': 'vin blanc', fruity: 'fruité', gooseberry: 'groseille à maquereau', gooseberries: 'groseille à maquereau', grape: 'raisin', grapes: 'raisin',
  pineapple: 'ananas', woody: 'boisé', resinous: 'résineux', resiny: 'résineux', 'fresh lime': 'citron vert', lime: 'citron vert', 'lemon zest': 'zeste de citron',
  lemon: 'citron', mojito: 'mojito', citrus: 'agrumes', 'black currant': 'cassis', blackcurrant: 'cassis', herbal: 'herbacé', spicy: 'épicé', pine: 'pin',
  grapefruit: 'pamplemousse', 'passion fruit': 'fruit de la passion', peach: 'pêche', lychee: 'litchi', coconut: 'noix de coco', geranium: 'géranium',
  ginger: 'gingembre', earthy: 'terreux', 'tropical fruit': 'fruits tropicaux', 'tropical fruits': 'fruits tropicaux', floral: 'floral',
  // D160 : les mots des 12 sources de d4 (Beer Maverick garde ses étiquettes françaises, plus bas dans tableFr).
  tropical: 'fruits tropicaux', passionfruit: 'fruit de la passion', 'troical fruit': 'fruits tropicaux', 'tropical/fruit': 'fruits tropicaux', 'tropical mango': 'mangue',
  'green tea': 'thé vert', 'lemon grass': 'citronnelle', lemongrass: 'citronnelle', bergamot: 'bergamote', 'green pepper': 'poivron vert', marjoram: 'marjolaine',
  citrusy: 'agrumes', 'slight citrusy': 'agrumes légers', 'light citrus': 'agrumes légers', 'citrus fruit': 'agrumes', 'citrus tones': 'agrumes', citus: 'agrumes',
  'classic citrus fruit': 'agrumes', 'with hints of citrus': 'agrumes', 'delicate citrus fruit': 'agrumes délicats', 'mild citrus': 'agrumes doux', 'strong citrus fruit': 'agrumes marqués',
  'spicy citrus fruit': 'agrumes épicés', 'citrus zest': "zeste d'agrumes", 'zesty citrus peel': "zeste d'agrumes", 'citrus blossom': "fleur d'agrumes", 'orange citrus': 'orange',
  liquorice: 'réglisse', piney: 'pin', 'pine notes': 'pin', 'pine needle': 'aiguilles de pin', 'pine needles': 'aiguilles de pin', 'fresh pine needles': 'aiguilles de pin fraîches',
  'strong pine': 'pin marqué', 'piney/resinous': 'pin, résineux', 'pine resin': 'résine de pin', 'resinous notes': 'résineux', spruce: 'épicéa', 'tea tree': 'arbre à thé',
  yoghurt: 'yaourt', yogurt: 'yaourt', 'camomile blossom': 'camomille', 'chamomile blossoms': 'camomille', 'lemon balm': 'mélisse', 'slightly spicy': 'légèrement épicé',
  'apple blossom': 'fleur de pommier', 'bubble gum': 'chewing-gum', gingerbread: "pain d'épices", 'ginger bread': "pain d'épices", herbs: 'herbes',
  'honeydew melon': 'melon miel', incense: 'encens', aniseed: 'anis', 'dried fruits': 'fruits secs', 'dried fruit': 'fruits secs', 'dried fruit characters': 'fruits secs',
  'green fruit': 'fruits verts', 'green fruits': 'fruits verts', 'herbal notes': 'herbacé', 'strong herbal notes': 'herbacé marqué', 'herbal aroma': 'herbacé',
  'slightly herbal': 'légèrement herbacé', 'herbal alfalfa': 'luzerne', jammy: 'confituré', 'mate tea': 'maté', myrrh: 'myrrhe', nettle: 'ortie',
  'orange zest': "zeste d'orange", 'pink grapefruit': 'pamplemousse rose', oregano: 'origan', redberry: 'fruits rouges', 'red berries': 'fruits rouges', 'red fruits': 'fruits rouges',
  tarragon: 'estragon', terragon: 'estragon', artichoke: 'artichaut', basil: 'basilic', 'sweet basil': 'basilic', leek: 'poireau', lilac: 'lilas', 'lily of the valley': 'muguet',
  lily: 'lys', 'lime zest': 'zeste de citron vert', 'lime peel': 'zeste de citron vert', 'lemon lime zest': 'zeste de citron et de citron vert', 'lemon/lime': 'citron, citron vert',
  'lime aroma': 'citron vert', 'zesty lime': 'citron vert', 'candied lime': 'citron vert confit', 'candied lemon': 'citron confit', 'bright lemon': 'citron vif',
  'flavors of lemon': 'citron', 'pleasant lemon': 'citron', 'lemon pepper': 'poivre citronné', lovage: 'livèche', minty: 'menthe', 'mint overtones': 'menthe', peppermint: 'menthe poivrée',
  spearmint: 'menthe verte', 'tonka bean': 'fève tonka', alfalfa: 'luzerne', berries: 'baies', celeriac: 'céleri-rave', currant: 'groseille', 'dark fruit': 'fruits noirs',
  'dark fruits': 'fruits noirs', 'green onion': 'oignon vert', honeysuckle: 'chèvrefeuille', loganberry: 'mûre-framboise', 'orange blossom': "fleur d'oranger",
  rockmelon: 'melon cantaloup', cataloupe: 'melon cantaloup', 'slightly melon': 'melon léger', 'ripe melon': 'melon mûr', 'spicy notes': 'épicé', 'spicy tones': 'épicé',
  'spice aroma': 'épicé', 'generic spicy': 'épicé', 'strong spicy': 'épicé marqué', 'tomato leaves': 'feuille de tomate', 'tomato leaf': 'feuille de tomate',
  'white wine grapes': 'raisin blanc', 'white wine grape': 'raisin blanc', 'white grapes': 'raisin blanc', 'wild garlic': 'ail des ours', wildflowers: 'fleurs sauvages',
  'wild flowers': 'fleurs sauvages', woodruff: 'aspérule', 'woody aromatic': 'boisé', wood: 'boisé', 'all spice': 'piment de la Jamaïque', allspice: 'piment de la Jamaïque',
  'red currant': 'groseille', redcurrant: 'groseille', allium: 'alliacé', almond: 'amande', 'apple skin': 'peau de pomme', 'green apple': 'pomme verte', apple: 'pomme', balsamic: 'balsamique',
  'berry crème savers': 'bonbon berry crème savers', 'black berries': 'mûre', blackberry: 'mûre', 'delicate balackberry': 'mûre', 'black cherry': 'cerise noire', 'black current': 'cassis',
  blueberries: 'myrtille', blueberry: 'myrtille', butter: 'beurre', butterscotch: 'caramel au beurre', 'candied berry': 'baies confites', 'candied fruit': 'fruits confits',
  cardamom: 'cardamome', carnation: 'œillet', cedarwood: 'bois de cèdre', 'cherry candy': 'bonbon à la cerise', chilies: 'piment', clover: 'trèfle', coffee: 'café',
  coriander: 'coriandre', 'cracked pepper': 'poivre concassé', cranberry: 'canneberge', 'cream caramel': 'crème caramel', diesel: 'gasoil', earth: 'terreux', 'earthy tones': 'terreux',
  'strong with earthy': 'terreux marqué', 'fennel frond': 'fanes de fenouil', 'fennel seeds': 'graines de fenouil', 'floral honey': 'miel floral', 'floral notes': 'floral',
  'floral oak': 'chêne floral', 'generic floral': 'floral', 'mild with distinct floral': 'floral', 'pleasant with flowery': 'floral', 'slightly flowery': 'légèrement floral',
  'classic noble aromas. floral': 'floral', 'delicate floral': 'floral délicat', 'light floral': 'floral léger', 'fresh crushed herbs': 'herbes fraîches écrasées',
  'heavy spicy herbal. fresh crushed herbs': 'épicé herbacé, herbes fraîches écrasées', 'fresh cut grass': 'herbe fraîchement coupée', 'fresh grass': 'herbe fraîche', 'grassy notes': 'herbe coupée',
  'fresh rubbed sage': 'sauge fraîche froissée', sage: 'sauge', 'fruit punch': 'punch aux fruits', 'fruity pebbles™': 'céréales fruity pebbles', 'grapefruit flesh': 'chair de pamplemousse',
  'grapefruit zest': 'zeste de pamplemousse', icewine: 'vin de glace', 'jolly rancher': 'bonbon jolly rancher', jollyrancher: 'bonbon jolly rancher', 'light pear': 'poire légère',
  'pear skin': 'peau de poire', pears: 'poire', molasses: 'mélasse', 'orange marmalade': "marmelade d'orange", 'orange pith': "albédo d'orange", orangey: 'orange',
  'over ripe orange': 'orange trop mûre', 'strong orange': 'orange marquée', 'valencia orange': 'orange valencia', peaches: 'pêche', 'white peach': 'pêche blanche', 'spicy apricot': 'abricot épicé',
  'potting soil': 'terreau', 'ripe fruit': 'fruit mûr', 'ripe mango': 'mangue mûre', 'spice cabinet': 'épices', spices: 'épices', 'subtle spice': 'épices discrètes',
  'sweet fruit': 'fruit sucré', 'sweet mandarin': 'mandarine', 'sweet tangerine': 'mandarine', tangerines: 'mandarine', 'sweet pea': 'pois de senteur',
  'sweet stone fruit': 'fruits à noyau', stonefruit: 'fruits à noyau', strawberries: 'fraise', sugar: 'sucre', tabacco: 'tabac', tobacco: 'tabac', 'tangy coconut': 'noix de coco',
  whiskey: 'whisky', 'wine y': 'vineux', wintergreen: 'gaulthérie', 'strong zesty aroma': 'zesté', 'hoppy tang': 'houblonné',
  licorice: 'réglisse', marmalade: 'marmelade', onion: 'oignon', garlic: 'ail', catty: 'urine de chat', chamomile: 'camomille', cinnamon: 'cannelle', clove: 'clou de girofle',
  elderflower: 'fleur de sureau', fennel: 'fenouil', jasmine: 'jasmin', juniper: 'genièvre', mint: 'menthe', nutmeg: 'muscade', oak: 'chêne', rosemary: 'romarin', thyme: 'thym',
  mandarin: 'mandarine', tangerine: 'mandarine', mango: 'mangue', pear: 'poire', apricot: 'abricot', cherry: 'cerise', plum: 'prune', raspberry: 'framboise', strawberry: 'fraise',
  guava: 'goyave', papaya: 'papaye', watermelon: 'pastèque', banana: 'banane', vanilla: 'vanille', chocolate: 'chocolat', honey: 'miel', leather: 'cuir', hay: 'foin',
  lavender: 'lavande', 'black pepper': 'poivre noir', pepper: 'poivre', cedar: 'cèdre', berry: 'baies', 'stone fruit': 'fruits à noyau', 'black tea': 'thé noir', tea: 'thé',
  'cut grass': 'herbe coupée', grassy: 'herbe coupée', grass: 'herbe', resin: 'résine', cream: 'crème', 'sweet': 'doux', mild: 'doux',
  // Les qualités sans arôme : traduites, mais génériques (GENERIQUES).
  pleasant: 'agréable', delicate: 'délicat', smooth: 'rond', mellow: 'moelleux', subtle: 'discret', fresh: 'frais', crisp: 'vif', tangy: 'vif', tart: 'acidulé', savory: 'savoureux',
  light: 'léger', aromatic: 'aromatique', 'sweet aromatic': 'aromatique', perfumey: 'parfumé', hoppy: 'houblonné', wild: 'sauvage',
};

/** Les mots génériques, traduits : ils ne disent rien de propre au houblon, ils ne signent aucun « lui seul ». */
export const GENERIQUES = new Set(['fruité', 'fruit', 'doux', 'léger', 'agréable', 'délicat', 'rond', 'moelleux', 'discret', 'frais', 'vif', 'acidulé', 'savoureux', 'aromatique', 'parfumé', 'houblonné']);
export const estGenerique = (mot: string) => GENERIQUES.has(bas(mot));

/** Ce qui n'est pas un arôme (D160) : amertume, intensité, absence d'arôme, nature de l'arôme sans le nommer. Le mot brut ou son
 * français, repliés par `bas`. Reste dans la donnée et sa source ; ne se montre pas parmi les mots. */
const NON_AROMES = new Set([
  'clean', 'net', 'bitter', 'amer', 'neutral', 'neutre', 'hop', 'very strong', 'very mild', 'medium intensity', 'medium intensity with evergeen',
  'clean bitterness', 'coarse bittering', 'smooth bitterness', 'no distinct aroma characteristics', 'delicate hop aroma', 'pleasant hoppy aroma', 'pleasant saaz like aroma',
]);
const NON_AROME_MOTIF = /bitter|intensity|characteristics|good for|hop(py)? aroma|saaz like|\bno (distinct )?aroma\b/;

export const bas = (s: string) => s.trim().toLowerCase().replace(/[_#-]+/g, ' ').replace(/\s+/g, ' ');
export const estNonArome = (mot: string) => { const k = bas(mot); return NON_AROMES.has(k) || NON_AROME_MOTIF.test(k); };
let VERS_FR: Map<string, string> | null = null;
// La table suit les fiches du moteur courant (données injectées) : d'autres fiches, table à refaire.
let FICHES_LUES: unknown = null;
let VERSION = 0;
/** Un numéro qui change quand les fiches du moteur changent : les caches dérivés (donnees-matrice.ts) le comparent au leur. */
export function versionFiches(): number {
  if (FICHES_LUES !== fiches()) { FICHES_LUES = fiches(); VERS_FR = null; VERSION += 1; }
  return VERSION;
}
/** La table mot source → mot français (clés repliées par `bas`). */
export function tableFr(): Map<string, string> {
  versionFiches();
  if (!VERS_FR) {
    VERS_FR = new Map(Object.entries(COMPLEMENT).map(([k, v]) => [bas(k), v]));
    for (const v of fiches()) (v.tags ?? []).forEach((t, i) => { const k = bas(t); const f = v.tagsFr?.[i]; if (f && !VERS_FR!.has(k)) VERS_FR!.set(k, bas(f)); });
  }
  return VERS_FR;
}
export function versFr(mot: string): string {
  const k = bas(mot).replace(/^étiquette\s+/, '');
  return tableFr().get(k) ?? k;
}
/** Le mot à montrer pour un descripteur de fiche : son français, ou null quand ce n'est pas un arôme (D160). Les écrans qui
 * forment des mots (matrice, « Ses mots », « lui seul », feuille Sources) passent tous par ici. */
export function motAffiche(mot: string): string | null {
  const f = versFr(mot);
  if (!f || estNonArome(mot) || estNonArome(f)) return null;
  return f;
}
