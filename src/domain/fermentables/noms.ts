/**
 * Les noms des fermentescibles (voie a1-proposition, D222) : relier le nom du stock (allemand, de malterie, ou français) au nom de
 * Beer Analytics (www.beer-analytics.com, CC BY-SA 4.0), et donner à la frappe le nom courant d'un malt (D220 : « Munich » →
 * Münchner Malz). Une table courte, écrite à la main, testée : un nom qui n'y est pas reste INCONNU (`null`), jamais deviné.
 *
 * `slug` : l'identifiant de la page chez Beer Analytics (`/fermentables/<catégorie>/<slug>/`), celui de la table de typicité
 * (`src/data/fermentables/typicite-styles.json`). `alias` : ce que le brasseur tape ; la forme exacte du nom canonique compte aussi.
 */
export interface EntreeNom {
  /** Le nom tel que le stock l'écrit (allemand ou de malterie), celui que la tuile affiche. */
  canonique: string;
  /** Identifiant chez Beer Analytics ; son nom anglais est dans `ba`. */
  slug: string;
  ba: string;
  /** Les noms courants et les écritures voisines que la frappe reconnaît. */
  alias: readonly string[];
}

const e = (canonique: string, slug: string, ba: string, ...alias: string[]): EntreeNom => ({ canonique, slug, ba, alias });

export const NOMS: readonly EntreeNom[] = [
  // Malts de base
  e('Pilsner Malz', 'pilsner-malt', 'Pilsner Malt', 'pils', 'pilsner', 'pilsener', 'pilsner malt', 'pilsnermalz'),
  e('Pale Ale Malz', 'pale-ale-malt', 'Pale Ale Malt', 'pale', 'pale ale', 'pale malt', 'pale ale malt'),
  e('Münchner Malz', 'munich-malt', 'Munich Malt', 'munich', 'munich malt', 'münchner', 'muenchner malz'),
  e('Münchner Malz hell', 'munich-light-malt', 'Munich Light Malt', 'munich hell', 'munich light', 'münchner malz typ i'),
  e('Münchner Malz dunkel', 'munich-dark-malt', 'Munich Dark Malt', 'munich dunkel', 'munich dark', 'münchner malz typ ii'),
  e('Wiener Malz', 'vienna-malt', 'Vienna Malt', 'vienna', 'vienne', 'viennois', 'vienna malt'),
  e('Weizenmalz hell', 'wheat-malt', 'Wheat Malt', 'weizen', 'wheat', 'blé', 'ble', 'froment', 'wheat malt', 'weizenmalz'),
  e('Weizenmalz dunkel', 'dark-wheat-malt', 'Dark Wheat Malt', 'dark wheat', 'blé foncé', 'weizen dunkel'),
  e('Roggenmalz', 'rye-malt', 'Rye Malt', 'seigle', 'rye', 'rye malt'),
  e('Hafermalz', 'oat-malt', 'Oat Malt', 'oat malt', 'malt d\'avoine'),
  e('Dinkelmalz', 'spelt-malt', 'Spelt Malt', 'épeautre', 'epeautre', 'spelt'),
  e('Maris Otter', 'maris-otter-malt', 'Maris Otter Malt', 'maris', 'otter'),
  e('Golden Promise', 'golden-promise-malt', 'Golden Promise Malt', 'golden', 'promise'),
  // Flocons et céréales non maltées
  e('Haferflocken', 'flaked-oats', 'Flaked Oats', 'avoine', 'oats', 'oat', 'flocons d\'avoine', 'flaked oats'),
  e('Weizenflocken', 'flaked-wheat', 'Flaked Wheat', 'flocons de blé', 'flaked wheat'),
  e('Gerstenflocken', 'flaked-barley', 'Flaked Barley', 'flocons d\'orge', 'flaked barley'),
  e('Maisflocken', 'flaked-corn', 'Flaked Corn', 'maïs', 'mais', 'corn', 'flaked corn', 'flocons de maïs'),
  e('Reisflocken', 'flaked-rice', 'Flaked Rice', 'riz', 'rice', 'flaked rice', 'flocons de riz'),
  e('Roggenflocken', 'flaked-rye', 'Flaked Rye', 'flocons de seigle', 'flaked rye'),
  e('Dinkelflocken', 'flaked-spelt', 'Flaked Spelt', 'flocons d\'épeautre', 'flaked spelt'),
  // Caramels et spéciaux
  e('Carapils', 'carapils-carafoam', 'Carapils / Carafoam', 'cara', 'carafoam', 'dextrine', 'dextrin malt'),
  e('Carahell', 'carahell', 'CaraHell', 'cara hell'),
  e('Caramünch I', 'caramunich-i', 'CaraMunich I', 'caramunich i', 'cara munich i', 'caramünch 1'),
  e('Caramünch II', 'caramunich-ii', 'CaraMunich II', 'caramunich ii', 'cara munich ii', 'caramünch 2'),
  e('Caramünch III', 'caramunich-iii', 'CaraMunich III', 'caramunich iii', 'cara munich iii', 'caramünch 3'),
  e('Carared', 'carared', 'CaraRed', 'cara red'),
  e('Caraaroma', 'caraaroma', 'CaraAroma', 'cara aroma'),
  e('Caraamber', 'caraamber', 'CaraAmber', 'cara amber'),
  e('Caragold', 'caragold', 'CaraGold', 'cara gold'),
  e('Caravienne', 'caravienne', 'CaraVienne', 'cara vienne', 'cara vienna'),
  e('Carawheat', 'carawheat', 'CaraWheat', 'cara wheat'),
  e('Cararye', 'cararye', 'CaraRye', 'cara rye'),
  e('Melanoidinmalz', 'melanoidin-malt', 'Melanoidin Malt', 'melanoidin', 'mélanoïdine', 'melanoidine'),
  e('Aromatic Malz', 'aromatic-malt', 'Aromatic Malt', 'aromatic', 'aromatique', 'aromamalz'),
  e('Gebäckmalz', 'biscuit-malt', 'Biscuit Malt', 'biscuit', 'gebäck', 'gebackmalz', 'biscuit malt'),
  e('Honigmalz', 'honey-malt', 'Honey Malt', 'honey malt'),
  e('Amber Malz', 'amber-malt', 'Amber Malt', 'amber', 'ambré'),
  e('Brown Malz', 'brown-malt', 'Brown Malt', 'brown', 'brun'),
  e('Abbey Malt', 'abbey-malt', 'Abbey Malt', 'abbey', 'abbaye'),
  e('Sauermalz', 'acidulated-malt', 'Acidulated Malt', 'acidulated', 'acide', 'malt acide', 'acid malt'),
  e('Rauchmalz', 'smoke-malt', 'Smoke Malt', 'smoke', 'fumé', 'fume', 'smoked malt'),
  // Torréfiés
  e('Carafa I', 'carafa-i', 'Carafa I', 'carafa 1'),
  e('Carafa II', 'carafa-ii', 'Carafa II', 'carafa 2'),
  e('Carafa III', 'carafa-iii', 'Carafa III', 'carafa 3'),
  e('Carafa Special I', 'carafa-special-i', 'Carafa Special I', 'carafa spécial i', 'carafa spezial i', 'carafa special 1'),
  e('Carafa Special II', 'carafa-special-ii', 'Carafa Special II', 'carafa spécial ii', 'carafa spezial ii', 'carafa special 2'),
  e('Carafa Special III', 'carafa-special-iii', 'Carafa Special III', 'carafa spécial iii', 'carafa spezial iii', 'carafa special 3'),
  e('Röstgerste', 'roasted-barley-malt', 'Roasted Barley', 'roasted barley', 'orge torréfiée', 'orge torrefiee', 'roastgerste', 'roest gerste'),
  e('Schokoladenmalz', 'chocolate-malt', 'Chocolate Malt', 'chocolat', 'chocolate', 'chocolate malt', 'schoko'),
  e('Schwarzmalz', 'black-malt', 'Black Malt', 'black', 'noir', 'black malt', 'black patent'),
  // Sucres et extrait
  e('Dextrose', 'corn-sugar', 'Corn Sugar', 'corn sugar', 'sucre de maïs'),
  e('Sirop de glucose', 'corn-syrup', 'Corn Syrup', 'glucose', 'sirop de maïs', 'corn syrup', 'glucose syrup'),
  e('Sucre candi', 'candi-sugar', 'Candi Sugar', 'candi', 'candi sugar', 'sucre candy', 'rock candy'),
  e('Sirop candi', 'candi-syrup', 'Candi Syrup', 'candi syrup', 'sirop de candi'),
  e('Lactose', 'lactose-milk-sugar', 'Lactose (Milk Sugar)', 'milk sugar', 'sucre de lait'),
  e('Miel', 'honey', 'Honey', 'honey'),
  e('Sucre', 'sugar', 'Sugar', 'saccharose', 'sucre blanc', 'table sugar'),
  e('Sucre de canne', 'cane-sugar', 'Cane Sugar', 'cane sugar', 'canne'),
  e('Sucre roux', 'brown-sugar', 'Brown Sugar', 'cassonade', 'brown sugar', 'sucre brun'),
  e('Turbinado', 'turbinado', 'Turbinado', 'sucre turbinado'),
  e('Mélasse', 'molasses', 'Molasses', 'melasse', 'molasses'),
  e('Sirop d\'érable', 'maple-syrup', 'Maple Syrup', 'erable', 'érable', 'maple', 'sirop d\'erable'),
  e('Maltodextrine', 'maltodextrin', 'Maltodextrin', 'maltodextrin'),
  e('Extrait sec clair', 'malt-extract', 'Malt Extract', 'extrait', 'extrait de malt', 'dme', 'lme', 'malt extract', 'extrait sec'),
  // Fruits
  e('Orange', 'orange', 'Orange', 'oranges'),
  e('Citron', 'lemon', 'Lemon', 'lemon'),
  e('Citron vert', 'lime', 'Lime', 'lime'),
  e('Pamplemousse', 'grapefruit', 'Grapefruit', 'grapefruit'),
  e('Mangue', 'mango', 'Mango', 'mango'),
  e('Framboise', 'raspberry', 'Raspberry', 'raspberry', 'framboises'),
  e('Fraise', 'strawberry', 'Strawberry', 'strawberry', 'fraises'),
  e('Cerise', 'cherry', 'Cherry', 'cherry', 'cerises'),
  e('Pêche', 'peach', 'Peach', 'peche', 'peach'),
  e('Abricot', 'apricot', 'Apricot', 'apricot'),
  e('Pomme', 'apple', 'Apple', 'apple'),
  e('Poire', 'pear', 'Pear', 'pear'),
  e('Myrtille', 'blueberry', 'Blueberry', 'blueberry'),
  e('Mûre', 'blackberry', 'Blackberry', 'mure', 'blackberry'),
  e('Cassis', 'currant', 'Currant', 'currant'),
  e('Ananas', 'pineapple', 'Pineapple', 'pineapple'),
  e('Fruit de la passion', 'passionfruit', 'Passionfruit', 'passion', 'maracuja', 'passionfruit'),
  e('Raisin', 'grape', 'Grape', 'grape', 'raisins frais'),
  e('Prune', 'plum', 'Plum', 'plum', 'prunes fraîches'),
  e('Figue', 'fig', 'Fig', 'fig'),
  e('Datte', 'date', 'Date', 'date'),
  e('Rhubarbe', 'rhubarb', 'Rhubarb', 'rhubarb'),
  e('Citrouille', 'pumpkin', 'Pumpkin', 'potiron', 'courge', 'pumpkin'),
];

/** Un nom comparé sans accents, sans casse, sans ponctuation : « Münchner Malz » = « munchner malz » = « MUNCHNER-MALZ ». */
export const normaliser = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const parNom: Map<string, EntreeNom> = new Map();
const parAlias: Map<string, EntreeNom> = new Map();
for (const n of NOMS) {
  parNom.set(normaliser(n.canonique), n);
  parNom.set(normaliser(n.ba), n);
  for (const a of n.alias) if (!parAlias.has(normaliser(a))) parAlias.set(normaliser(a), n);
}
const entree = (saisie: string): EntreeNom | null => {
  const k = normaliser(saisie ?? '');
  return k ? parNom.get(k) ?? parAlias.get(k) ?? null : null;
};

/**
 * Le nom canonique (celui du stock) de ce que le brasseur a tapé : « Munich » → « Münchner Malz », « Pils » → « Pilsner Malz »,
 * « Avoine » → « Haferflocken », « Cara » → « Carapils » (D220). Le nom canonique, ou le nom anglais de Beer Analytics, se rend
 * lui-même. Un nom inconnu rend `null` : il reste inconnu.
 */
export const nomCanonique = (saisie: string): string | null => entree(saisie)?.canonique ?? null;

/** L'identifiant Beer Analytics (clé de la table de typicité) d'un nom de stock ou d'un alias ; `null` si le nom n'est pas dans la table. */
export const slugBeerAnalytics = (nom: string): string | null => entree(nom)?.slug ?? null;

/**
 * La frappe en cours : les noms canoniques dont un alias COMMENCE par ce qui est tapé (deux lettres au moins), comme la maquette
 * (`v7/s1/commun-p7.mjs`, rang 0). « mu » → Münchner Malz (alias « munich »). Sert à la recherche, pas à l'ouverture.
 */
export function nomsParAlias(saisie: string): string[] {
  const t = normaliser(saisie ?? '');
  if (t.length < 2) return [];
  const trouves: string[] = [];
  for (const [alias, n] of parAlias) if (alias.startsWith(t) && !trouves.includes(n.canonique)) trouves.push(n.canonique);
  return trouves;
}
