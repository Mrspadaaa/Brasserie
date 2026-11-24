/**
 * C59-9 (R38) : les arômes d'un houblon se disent en français, à la lecture serveur et à l'affichage (donnée déjà stockée). Les boutiques de houblon
 * les écrivent en allemand ou en anglais (« Limette, Mango, tropische Früchte »). Problème d'école : un petit vocabulaire fermé (pas de traduction
 * automatique, pas d'appel IA) ; un mot inconnu reste tel quel, jamais deviné. Sans dépendance : partagé par le serveur et l'écran.
 */
const sansAccent = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ß/g, 'ss').replace(/\s+/g, ' ').trim();

/** Clé sans accent, minuscule → arôme en français. Les groupes « adjectif nom » viennent en entier (le genre et l'accord changent le mot). */
const TABLE: Record<string, string> = {
  /* agrumes */
  limette: 'citron vert', lime: 'citron vert', limetten: 'citron vert', zitrone: 'citron', lemon: 'citron', zitronen: 'citron', zitrus: 'agrumes', citrus: 'agrumes',
  'zitrusfruchte': 'agrumes', orange: 'orange', orangen: 'orange', grapefruit: 'pamplemousse', pampelmuse: 'pamplemousse', mandarine: 'mandarine', tangerine: 'mandarine',
  bergamotte: 'bergamote', bergamot: 'bergamote', 'zitronengras': 'citronnelle', lemongrass: 'citronnelle', 'orangenschale': 'zeste d\'orange', 'zitronenschale': 'zeste de citron',
  /* fruits */
  mango: 'mangue', mangue: 'mangue', ananas: 'ananas', pineapple: 'ananas', maracuja: 'fruit de la passion', 'passionsfrucht': 'fruit de la passion', 'passion fruit': 'fruit de la passion',
  papaya: 'papaye', guave: 'goyave', guava: 'goyave', litschi: 'litchi', lychee: 'litchi', melone: 'melon', melon: 'melon', wassermelone: 'pastèque', watermelon: 'pastèque',
  pfirsich: 'pêche', peach: 'pêche', aprikose: 'abricot', apricot: 'abricot', nektarine: 'nectarine', 'apfel': 'pomme', apple: 'pomme', birne: 'poire', pear: 'poire',
  kirsche: 'cerise', cherry: 'cerise', pflaume: 'prune', plum: 'prune', erdbeere: 'fraise', strawberry: 'fraise', himbeere: 'framboise', raspberry: 'framboise',
  brombeere: 'mûre', blackberry: 'mûre', heidelbeere: 'myrtille', blaubeere: 'myrtille', blueberry: 'myrtille', johannisbeere: 'groseille', 'schwarze johannisbeere': 'cassis',
  blackcurrant: 'cassis', cassis: 'cassis', stachelbeere: 'groseille à maquereau', gooseberry: 'groseille à maquereau', banane: 'banane', banana: 'banane',
  kokosnuss: 'noix de coco', kokos: 'noix de coco', coconut: 'noix de coco', feige: 'figue', fig: 'figue', traube: 'raisin', trauben: 'raisin', grape: 'raisin', weintraube: 'raisin',
  'weisse trauben': 'raisin blanc', 'weisser wein': 'vin blanc', weisswein: 'vin blanc', 'white wine': 'vin blanc', rhabarber: 'rhubarbe', rhubarb: 'rhubarbe', kiwi: 'kiwi',
  'tropische fruchte': 'fruits tropicaux', 'tropische frucht': 'fruits tropicaux', 'tropical fruit': 'fruits tropicaux', 'tropical fruits': 'fruits tropicaux', tropenfruchte: 'fruits tropicaux',
  fruchte: 'fruits', frucht: 'fruit', 'fruchtig': 'fruité', fruity: 'fruité', 'steinobst': 'fruits à noyau', 'stone fruit': 'fruits à noyau', 'rote fruchte': 'fruits rouges', 'rote beeren': 'fruits rouges',
  'rotes obst': 'fruits rouges', 'red fruit': 'fruits rouges', 'red fruits': 'fruits rouges', beeren: 'baies', beere: 'baie', berry: 'baies', berries: 'baies', obst: 'fruits', 'gelbe fruchte': 'fruits jaunes',
  'reife fruchte': 'fruits mûrs', 'dunkle fruchte': 'fruits noirs', 'getrocknete fruchte': 'fruits secs', trockenfruchte: 'fruits secs', 'dried fruit': 'fruits secs',
  /* herbes, épices, fleurs */
  harzig: 'résineux', resin: 'résine', resinous: 'résineux', harz: 'résine', kiefer: 'pin', pine: 'pin', tanne: 'sapin', fichte: 'épicéa', 'nadelholz': 'conifère',
  blumig: 'floral', floral: 'floral', blumen: 'fleurs', blute: 'fleur', blutenaromen: 'fleurs', flowery: 'floral', 'rosen': 'rose', rose: 'rose', veilchen: 'violette', holunder: 'sureau', 'holunderblute': 'fleur de sureau',
  'krautig': 'herbacé', herbal: 'herbacé', grasig: 'herbacé', grassy: 'herbacé', gras: 'herbe', grass: 'herbe', kraut: 'herbe', krauter: 'herbes', herbs: 'herbes', 'frisch geschnittenes gras': 'herbe coupée',
  wurzig: 'épicé', spicy: 'épicé', gewurz: 'épice', gewurze: 'épices', spice: 'épice', spices: 'épices', pfeffer: 'poivre', pepper: 'poivre', zimt: 'cannelle', cinnamon: 'cannelle',
  nelke: 'clou de girofle', clove: 'clou de girofle', ingwer: 'gingembre', ginger: 'gingembre', anis: 'anis', minze: 'menthe', mint: 'menthe', basilikum: 'basilic', basil: 'basilic', thymian: 'thym', thyme: 'thym',
  lavendel: 'lavande', lavender: 'lavande', salbei: 'sauge', sage: 'sauge', dill: 'aneth', 'eukalyptus': 'eucalyptus', eucalyptus: 'eucalyptus', tee: 'thé', tea: 'thé', 'earl grey': 'earl grey',
  /* autres */
  honig: 'miel', honey: 'miel', karamell: 'caramel', caramel: 'caramel', toffee: 'caramel', vanille: 'vanille', vanilla: 'vanille', schokolade: 'chocolat', chocolate: 'chocolat', kaffee: 'café', coffee: 'café',
  nuss: 'noix', nusse: 'noix', nutty: 'noisette', haselnuss: 'noisette', hazelnut: 'noisette', mandel: 'amande', almond: 'amande', tabak: 'tabac', tobacco: 'tabac', leder: 'cuir', leather: 'cuir',
  holzig: 'boisé', woody: 'boisé', holz: 'bois', wood: 'bois', erdig: 'terreux', earthy: 'terreux', erde: 'terre', erdiger: 'terreux', 'wurzige note': 'note épicée', 'fruchtige note': 'note fruitée',
  'zitrusnoten': 'notes d\'agrumes', 'zitrusnote': 'note d\'agrumes', 'citrus notes': 'notes d\'agrumes', 'citrus note': 'note d\'agrumes', 'fruchtnoten': 'notes fruitées', 'frucht noten': 'notes fruitées',
  'blumige noten': 'notes florales', 'florale noten': 'notes florales', 'krautige noten': 'notes herbacées', 'harzige noten': 'notes résineuses', 'tropische noten': 'notes tropicales', 'tropische': 'tropical',
  tropical: 'tropical', tropisch: 'tropical', 'tropische note': 'note tropicale', 'tropische aromen': 'arômes tropicaux', sussholz: 'réglisse', licorice: 'réglisse', lakritz: 'réglisse', rauch: 'fumé', smoke: 'fumé',
  seife: 'savon', 'cat pee': 'urine de chat', 'katzenpipi': 'urine de chat', sauer: 'acide', suss: 'sucré', sweet: 'sucré', sweetness: 'sucré', bitter: 'amer', 'weihrauch': 'encens',
  'passionsfruchte': 'fruit de la passion', 'stachelbeeren': 'groseille à maquereau', 'zitrusschale': 'zeste d\'agrumes', 'grapefruitschale': 'zeste de pamplemousse'
};

/** Un arôme en français ; l'inconnu reste tel quel (jamais deviné). */
export function aromeEnFrancais(arome: string): string {
  const brut = arome.trim();
  if (!brut) return brut;
  const k = sansAccent(brut);
  return TABLE[k] ?? brut;
}

/** « Limette, Mango, tropische Früchte » → « citron vert, mangue, fruits tropicaux » : chaque arôme, séparé par une virgule, un point-virgule ou « und / and / et ». Idempotent. */
export function aromesEnFrancais(texte: string): string {
  return texte.split(/\s*(?:,|;|\/|\bund\b|\band\b|\bet\b)\s*/i).map(aromeEnFrancais).filter(Boolean).join(', ');
}

/** Le nom d'une ligne d'arômes, sous ses écritures allemande, anglaise ou française. */
export const estLigneAromes = (nom: string): boolean => /^(?:aromen?|aromas?|aromes?|geschmack|flavou?rs?|aroma profile|aromaprofil)$/.test(sansAccent(nom.replace(/[‎‏]/g, '').replace(/\s*:\s*$/, '')));
