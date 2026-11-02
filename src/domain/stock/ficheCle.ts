import type { StockItem } from '../../types';
import { slugBeerAnalytics } from '../fermentables/noms';
import { jetonsLevure } from './ficheLevure';

/**
 * La clé de fiche (voie f4-enrichir, P3, PLAN § 3.3) : une seule fiche par produit (« Attention au mapping »).
 * `cle = famille|fabricant|mots`. Ni EBC, ni α, ni origine : ce sont des données de l'article (D215 en fait un « bis »), pas de la fiche ; un « bis »
 * partage la fiche de son produit. Le fabricant n'entre dans la clé que s'il est ÉCRIT dans le libellé ; une marque déposée (« Carahell ») dit
 * seulement que le nom n'est pas générique. Pur : aucun accès au stock (passé en argument), à l'écran ni au réseau.
 */
export type Famille = 'houblon' | 'malt' | 'levure';
export interface PartiesCle { famille: Famille; fabricant: string; mots: string }

/** Fabricants de malt et de sucre : le mot écrit → un seul nom. (Les levures : `ficheLevure.ts`.) */
const FABRICANT_MALT: Readonly<Record<string, string>> = {
  weyermann: 'weyermann', castle: 'castle', bestmalz: 'bestmalz', simpsons: 'simpsons', crisp: 'crisp', muntons: 'muntons',
  dingemans: 'dingemans', swaen: 'swaen', viking: 'viking', ireks: 'ireks', candico: 'candico',
};
/** Marques déposées d'un seul fabricant : elles font qu'un nom n'est pas générique (elles n'entrent pas dans la clé). */
const MARQUES: Readonly<Record<string, string>> = {
  carahell: 'weyermann', carapils: 'weyermann', caramunch: 'weyermann', carafa: 'weyermann', carared: 'weyermann', caraaroma: 'weyermann',
  carabohemian: 'weyermann', caraamber: 'weyermann', carabelge: 'weyermann', caragold: 'weyermann', carawheat: 'weyermann', carabrown: 'weyermann',
  sinamar: 'weyermann', chateau: 'castle',
};

/** Minuscules, sans accents, sans ™ ® © (retirés avant NFKD, qui écrirait « TM »), tirets Unicode ramenés à `-`. */
const plier = (texte: string) => (texte ?? '')
  .replace(/[™®©·()[\]]/g, ' ')
  .normalize('NFKD').replace(/\p{M}/gu, '')
  .toLowerCase()
  .replace(/[‐-―−]/g, '-')
  .replace(/[^a-z0-9\s-]/g, ' ');
const motsDe = (texte: string) => plier(texte).split(/\s+/).map(m => m.replace(/^-+|-+$/g, '')).filter(Boolean);

/** Le fabricant écrit dans un nom de malt ou de sucre, ou `''`. */
export function fabricantEcrit(nom: string): string {
  for (const m of motsDe(nom)) if (FABRICANT_MALT[m]) return FABRICANT_MALT[m];
  return '';
}
/** Le fabricant d'une marque déposée du nom (« Carahell » → weyermann), ou `''`. */
export function marqueDe(nom: string): string {
  const mots = motsDe(nom);
  for (const m of mots) if (MARQUES[m]) return MARQUES[m];
  if (mots.includes('special') && mots.includes('b')) return 'dingemans';
  return '';
}

/** Les parties de la clé d'un nom propre (houblon, malt) ou d'un libellé (levure). */
export function partiesDe(famille: Famille, nom: string): PartiesCle {
  if (famille === 'levure') {
    const lu = jetonsLevure(nom);
    return { famille, fabricant: lu.fabricant ?? '', mots: lu.jetons.join(' ') };
  }
  const fabricant = famille === 'malt' ? fabricantEcrit(nom) : '';
  const mots = [...new Set(motsDe(nom).filter(m => !FABRICANT_MALT[m] || famille !== 'malt'))].sort().join(' ');
  return { famille, fabricant, mots };
}
export const cleDe = (p: PartiesCle) => `${p.famille}|${p.fabricant}|${p.mots}`;
export const cleFiche = (famille: Famille, nom: string) => cleDe(partiesDe(famille, nom));
/** Les parties d'une clé écrite (`famille|fabricant|mots`) ; `undefined` si elle n'a pas cette forme. */
export function lireCle(cle: string | undefined): PartiesCle | undefined {
  const p = (cle ?? '').split('|');
  if (p.length !== 3 || !['houblon', 'malt', 'levure'].includes(p[0]) || !p[2]) return undefined;
  return { famille: p[0] as Famille, fabricant: p[1], mots: p[2] };
}

/** Un nom générique : malt sans fabricant écrit ni marque, et que la table des fermentescibles connaît (« Pilsner Malz », « Maris Otter »). */
export function generique(famille: Famille, nom: string): boolean {
  if (famille !== 'malt') return false;
  if (fabricantEcrit(nom) || marqueDe(nom)) return false;
  return slugBeerAnalytics(nom) !== null;
}

export type Parente = 'meme' | 'proche' | 'autre';
/**
 * Deux produits, composante par composante : mots différents (ni même ensemble, ni même nom collé) → `autre` ; fabricants connus des deux côtés
 * et différents → `autre` ; connus et égaux, ou inconnus des deux côtés → `meme` ; inconnu d'un seul côté → `proche` (jaune, à contrôler).
 */
export function memeProduitDeFiche(a: PartiesCle, b: PartiesCle): Parente {
  if (a.famille !== b.famille) return 'autre';
  const memesMots = a.mots === b.mots || a.mots.replace(/[\s-]/g, '') === b.mots.replace(/[\s-]/g, '');
  if (!memesMots) return 'autre';
  if (a.fabricant && b.fabricant) return a.fabricant === b.fabricant ? 'meme' : 'autre';
  if (!a.fabricant && !b.fabricant) return 'meme';
  return 'proche';
}

/** M2 (REVUE-code) : Malt et Levure seulement. Un houblon n'est jamais retenu : une valeur typique n'est pas l'α du lot. */
const FAMILLE_DE_CATEGORIE: Readonly<Record<string, Famille>> = { malt: 'malt', levure: 'levure' };
/** La clé écrite sur un article par f4 (`fiche.cle`), s'il en porte une. */
export const cleDeLArticle = (item: StockItem): string | undefined => {
  const cle = (item.fiche as { cle?: unknown } | undefined)?.cle;
  return typeof cle === 'string' ? cle : undefined;
};

/**
 * Pour `learnIngredient` (PLAN § 4.4) : l'article du stock qui porte déjà la fiche de ce produit. `meme` (un seul article) → c'est lui qui reçoit
 * les valeurs, jamais un `FICHE-…` de plus ; `proche` (ou plusieurs `meme`) → rien n'est écrit ; `undefined` → comportement d'avant.
 * Catégorie hors Malt, Houblon, Levure (ou absente) → `undefined`.
 */
export function ficheRetenueDe(nom: string, categorie: string | undefined, stock: readonly StockItem[]): { cas: 'meme'; article: StockItem } | { cas: 'proche' } | undefined {
  const famille = categorie ? FAMILLE_DE_CATEGORIE[categorie.trim().toLocaleLowerCase('fr')] : undefined;
  if (!famille || !(nom ?? '').trim()) return undefined;
  const voulu = partiesDe(famille, nom);
  if (!voulu.mots) return undefined;
  const memes: StockItem[] = [];
  let proche = false;
  for (const item of stock) {
    const p = lireCle(cleDeLArticle(item));
    if (!p) continue;
    const parente = memeProduitDeFiche(voulu, p);
    if (parente === 'meme') memes.push(item);
    else if (parente === 'proche') proche = true;
  }
  if (memes.length === 1 && !proche) return { cas: 'meme', article: memes[0] };
  if (memes.length || proche) return { cas: 'proche' };
  return undefined;
}
