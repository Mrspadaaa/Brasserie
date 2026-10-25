// La matrice de flb5b (« La matrice nettoyée », son choix du 24.10, soir, D130) sous le radar de g1 : ses mots en lignes,
// lui puis ses quatre premiers remplaçants en colonnes, et en tête « Lui seul : … », les mots que ses remplaçants ne
// disent pas. Ses mots : « Les type spéciaux des houblons hors 16d ! C'est très important surtout dans la comparaison !!!! ».
// Tout est lu en direct, rien n'est écrit à la main :
// - ses mots : familyWords du moteur (chaque descripteur de chaque fiche, rangé dans sa famille ou hors des 12), traduits
//   (D97) ; un mot et sa traduction ne font qu'un. « n/N » : les fiches qui le disent, sur ses fiches. « classé » : un mot
//   que seule la ligne « Familles déclarées » de Hopsteiner porte (une catégorie, pas un descripteur) ;
// - l'ordre des lignes, celui de flb5b : ce que plusieurs fiches disent, ce qu'elles nomment tôt, ce que peu de houblons du
//   catalogue disent ; le mot générique (« fruité ») et le nom d'une famille (« agrumes ») après ; sept lignes, puis les
//   « classé » ;
// - les colonnes : les quatre premiers remplaçants du calcul de u4 (lireRemplacants, D35 : la fiche et Substituer ne
//   classent jamais autrement les mêmes houblons), au moment de son ajout s'il est dans la recette, sinon sans moment
//   (le contexte « défaut » du moteur, comme la fiche du pack que montrait flb5b), hors de sa propre variété ; leurs mots,
//   de leurs fiches, sans leurs catégories.
import type { FamilyId } from '../../../domain/hopIndex/v4';
import { describeFamilies, familyWords, fiches, hopRef } from '../parcours/v4';
import { memo } from '../parcours/mesure';
import type { AjoutParcours, RecetteParcours } from '../parcours/types';
import { lireRemplacants } from '../substituer/donnees';

// Les mots anglais des fiches qui n'ont pas d'étiquette française dans le catalogue (Hopsteiner, citations), comme flb5b ;
// les autres se traduisent par les étiquettes de Beer Maverick (tags → tagsFr) de tout le catalogue.
const COMPLEMENT: Record<string, string> = {
  'white wine': 'vin blanc', fruity: 'fruité', gooseberry: 'groseille à maquereau', gooseberries: 'groseille à maquereau', grape: 'raisin', grapes: 'raisin',
  pineapple: 'ananas', woody: 'boisé', resinous: 'résineux', resiny: 'résineux', 'fresh lime': 'citron vert', lime: 'citron vert', 'lemon zest': 'zeste de citron',
  lemon: 'citron', mojito: 'mojito', citrus: 'agrumes', 'black currant': 'cassis', blackcurrant: 'cassis', herbal: 'herbacé', spicy: 'épicé', pine: 'pin',
  grapefruit: 'pamplemousse', 'passion fruit': 'fruit de la passion', peach: 'pêche', lychee: 'litchi', coconut: 'noix de coco', geranium: 'géranium',
  ginger: 'gingembre', earthy: 'terreux', 'tropical fruit': 'fruits tropicaux', floral: 'floral',
};
const bas = (s: string) => s.trim().toLowerCase().replace(/[_#-]+/g, ' ').replace(/\s+/g, ' ');
let VERS_FR: Map<string, string> | null = null;
// Les caches suivent les fiches du moteur courant (données injectées) : d'autres fiches, caches à refaire.
let FICHES_LUES: unknown = null;
function aJour(): void {
  if (FICHES_LUES === fiches()) return;
  FICHES_LUES = fiches(); VERS_FR = null; TEXTES = null; CHEZ.clear();
}
function versFr(mot: string): string {
  aJour();
  if (!VERS_FR) {
    VERS_FR = new Map(Object.entries(COMPLEMENT));
    for (const v of fiches()) (v.tags ?? []).forEach((t, i) => { const k = bas(t); const f = v.tagsFr?.[i]; if (f && !VERS_FR!.has(k)) VERS_FR!.set(k, bas(f)); });
  }
  const k = bas(mot).replace(/^étiquette\s+/, '');
  return VERS_FR.get(k) ?? k;
}

// Le mot générique ne signe personne (« fruité » : 77 houblons, cerveau/metier/descripteurs-hors-familles.md) ; le nom d'une
// famille redit le radar. Rare : 12 houblons du catalogue au plus le disent (la groseille à maquereau de Nelson Sauvin).
const GENERIQUES = new Set(['fruité']);
const NOMS_FAMILLE = new Set(['agrumes', 'floral', 'épicé', 'herbacé', 'terreux', 'résineux', 'fruits tropicaux', 'végétal', 'baies', 'melon', 'noyau', 'pépins']);
const RARE = 12;
const LIGNES = 7;
const COLONNES = 4;

const estCategories = (t: string) => /^Familles déclarées/i.test(t);
const elements = (t: string) => (t.split(':').slice(1).join(':') || t).split(/,|;| and /).map((s) => s.replace(/^[\s#]+|[\s.]+$/g, '')).filter(Boolean);

// Chez combien de houblons du catalogue un mot revient (texte de leurs fiches, sans les catégories), sous toutes ses formes.
let TEXTES: { id: string; t: string }[] | null = null;
const CHEZ = new Map<string, Set<string>>();
function chez(mot: string): Set<string> {
  aJour();
  const vu = CHEZ.get(mot);
  if (vu) return vu;
  if (!TEXTES) TEXTES = fiches().map((v) => ({ id: v.id, t: ` ${bas([...(v.tags ?? []), ...(v.tagsFr ?? []), ...(v.descriptions ?? []).filter((d) => !estCategories(d.text)).map((d) => d.text)].join(' , '))} ` }));
  versFr('');
  const formes = [mot, ...[...VERS_FR!].filter(([, f]) => f === mot).map(([k]) => k)];
  const re = formes.map((f) => new RegExp(`(^|[^a-zà-ÿ])${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-zà-ÿ]|$)`));
  const s = new Set(TEXTES.filter((x) => re.some((r) => r.test(x.t))).map((x) => x.id));
  CHEZ.set(mot, s);
  return s;
}

export interface MotFiche {
  mot: string; famille: FamilyId | null;
  /** Les fiches qui le disent (hors catégories) ; « classé » quand aucune, seule la ligne « Familles déclarées ». */
  fiches: string[]; classe: boolean;
  /** Score d'ordre de flb5b ; « signe » : il compte pour « Lui seul » (ni générique, ni nom de famille, ni catégorie). */
  score: number; signe: boolean;
}

/** Les mots des fiches d'un houblon, un par concept traduit, rangés comme flb5b. */
export const motsFiche = memo('fiche-mots', (cle: string) => cle, (cle: string): MotFiche[] => {
  const h = hopRef(cle);
  if (!h) return [];
  const c = h.catalogue;
  const descr = (c.descriptions ?? []).filter((d) => d.context !== 'beer');
  const hs = descr.filter((d) => d.source.author === 'Hopsteiner');
  const categories = new Set(hs.filter((d) => estCategories(d.text)).flatMap((d) => elements(d.text)).map(versFr));
  // L'ordre de chaque fiche (le premier nommé) : Beer Maverick par ses étiquettes françaises, les autres par leur texte.
  const ordres: string[][] = [(c.tagsFr ?? []).map(versFr), ...descr.filter((d) => d.source.author !== 'Beer Maverick' && !estCategories(d.text)).map((d) => elements(d.text).map(versFr))];
  const descripteursHs = new Set(hs.filter((d) => !estCategories(d.text)).flatMap((d) => elements(d.text)).map(versFr));
  const w = familyWords(h.varietyId, c);
  const vus = new Map<string, { famille: FamilyId | null; fiches: string[]; categorie: boolean }>();
  const ajoute = (brut: string, source: string, famille: FamilyId | null) => {
    const mot = versFr(brut);
    if (!mot) return;
    const x = vus.get(mot) ?? { famille: null, fiches: [], categorie: false };
    if (famille && !x.famille) x.famille = famille;
    if (source === 'Hopsteiner' && categories.has(mot) && !descripteursHs.has(mot)) x.categorie = true;
    else if (!x.fiches.includes(source)) x.fiches.push(source);
    vus.set(mot, x);
  };
  for (const f of Object.keys(w.mots) as FamilyId[]) for (const r of w.mots[f]) for (const m of r.mots) ajoute(m, r.source, f);
  for (const x of w.sansFamille) ajoute(x.mot, x.source, null);
  const mots = [...vus].map(([mot, x]): MotFiche & { pos: number } => {
    const n = x.fiches.length;
    const classe = n === 0;
    const premier = ordres.some((o) => o[0] === mot);
    const pos = Math.min(99, ...ordres.map((o) => (o.indexOf(mot) < 0 ? 99 : o.indexOf(mot))));
    const nb = chez(mot).size + (chez(mot).has(h.varietyId) ? 0 : 1);
    const signe = !classe && !GENERIQUES.has(mot) && !NOMS_FAMILLE.has(mot);
    const score = signe ? n * 100 + (premier ? 40 : 0) + Math.max(0, 10 - pos) * 4 + (nb <= RARE ? 15 : 0) - nb * 0.1 : -1000 + n;
    return { mot, famille: x.famille, fiches: x.fiches, classe, score, signe, pos };
  });
  // À score égal (deux noms de famille), l'ordre des fiches : le premier nommé d'abord.
  return mots.sort((a, b) => b.score - a.score || a.pos - b.pos || a.mot.localeCompare(b.mot, 'fr')).map(({ pos: _pos, ...m }) => m);
});

/** Ses fiches : leur nombre (le N de « 2/2 ») et, s'il n'y en a qu'une, son auteur. */
export function fichesDe(cle: string): number {
  const h = hopRef(cle);
  if (!h) return 0;
  const d = describeFamilies(h.varietyId);
  return Object.values(d).map((x) => x.of).find((n) => n > 0) ?? 0;
}

export interface ColonneMatrice { cle: string; nom: string; min: number; max: number; mots: Set<string> }
export interface LigneMatrice extends MotFiche { chez: string[]; seul: boolean }
export interface Matrice { N: number; colonnes: ColonneMatrice[]; lignes: LigneMatrice[]; seul: string[]; contexte: string }

/** La matrice d'un houblon dans la recette : lui, puis les quatre premiers remplaçants de u4. */
export function matrice(recette: RecetteParcours, cle: string): Matrice {
  const ajout = recette.additions.find((a) => a.hopKey === cle)
    // Hors de la recette, aucun moment : le moteur prend son contexte « défaut » (substitutes sans moment).
    ?? ({ id: `fiche-${cle}`, hopKey: cle } as unknown as AjoutParcours);
  const lu = lireRemplacants(recette, ajout);
  // Sa propre variété sous une autre forme (Citra pour Citra cryo) a les mêmes fiches, donc les mêmes mots : elle ne
  // contraste rien et ne prend pas de colonne ; les suivants de u4 la remplacent, dans le même ordre.
  const variete = hopRef(cle)?.varietyId;
  const colonnes = lu.candidats.filter((r) => hopRef(r.cle)?.varietyId !== variete).slice(0, COLONNES).map((r) => ({
    cle: r.cle, nom: r.nom, min: r.min, max: r.max,
    mots: new Set(motsFiche(r.cle).filter((m) => !m.classe).map((m) => m.mot)),
  }));
  const siens = motsFiche(cle);
  const lire = (m: MotFiche): LigneMatrice => {
    const ch = colonnes.filter((r) => r.mots.has(m.mot)).map((r) => r.cle);
    return { ...m, chez: ch, seul: m.signe && ch.length === 0 };
  };
  const lignes = [...siens.filter((m) => !m.classe).slice(0, LIGNES), ...siens.filter((m) => m.classe)].map(lire);
  return { N: fichesDe(cle), colonnes, lignes, seul: lignes.filter((l) => l.seul).map((l) => l.mot), contexte: lu.contexte };
}
