// Les mots des fiches, traduits en français (D97) : les mots anglais qui n'ont pas d'étiquette française dans le catalogue
// (Hopsteiner, citations), puis les étiquettes de Beer Maverick (tags → tagsFr) de tout le catalogue. Lu par la matrice
// (donnees-matrice.ts) et par l'explication de « autres » (autres.ts) : une seule table. Module léger (aucun calcul de
// remplaçants), pour que la carte de Ma bière puisse l'importer sans tirer Substituer.
import { fiches } from '../parcours/v4';

const COMPLEMENT: Record<string, string> = {
  'white wine': 'vin blanc', fruity: 'fruité', gooseberry: 'groseille à maquereau', gooseberries: 'groseille à maquereau', grape: 'raisin', grapes: 'raisin',
  pineapple: 'ananas', woody: 'boisé', resinous: 'résineux', resiny: 'résineux', 'fresh lime': 'citron vert', lime: 'citron vert', 'lemon zest': 'zeste de citron',
  lemon: 'citron', mojito: 'mojito', citrus: 'agrumes', 'black currant': 'cassis', blackcurrant: 'cassis', herbal: 'herbacé', spicy: 'épicé', pine: 'pin',
  grapefruit: 'pamplemousse', 'passion fruit': 'fruit de la passion', peach: 'pêche', lychee: 'litchi', coconut: 'noix de coco', geranium: 'géranium',
  ginger: 'gingembre', earthy: 'terreux', 'tropical fruit': 'fruits tropicaux', 'tropical fruits': 'fruits tropicaux', floral: 'floral',
};
export const bas = (s: string) => s.trim().toLowerCase().replace(/[_#-]+/g, ' ').replace(/\s+/g, ' ');
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
    VERS_FR = new Map(Object.entries(COMPLEMENT));
    for (const v of fiches()) (v.tags ?? []).forEach((t, i) => { const k = bas(t); const f = v.tagsFr?.[i]; if (f && !VERS_FR!.has(k)) VERS_FR!.set(k, bas(f)); });
  }
  return VERS_FR;
}
export function versFr(mot: string): string {
  const k = bas(mot).replace(/^étiquette\s+/, '');
  return tableFr().get(k) ?? k;
}
