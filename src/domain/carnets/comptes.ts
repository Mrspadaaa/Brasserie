/**
 * Les comptes d'un carnet, lus partout par une seule fonction (critique 6, n° 15 : la liste disait « 3 façons · 6 articles », le carnet
 * « 2 façons · 5 lus, 1 sans aperçu », la suppression « 3 façons »). Une règle, trois écrans : la liste (g05-1), le carnet ouvert (h05-3)
 * et la suppression (g4:v02-18) lisent `comptesCarnet` ; leurs chiffres sont donc égaux.
 * - façons : ouvertes et retenues, celles qu'on compare ; l'écartée est comptée à part (`ecartees`) et se dit à part ;
 * - articles : tous les articles du carnet, lus et sans aperçu dans un même total (un lien non lu est un article, pas encore classé) ;
 *   `lus` et `sansApercu` en sont le détail, jamais un second total.
 * Accords (n° 28) : `pluriel` (« 1 façon », « 2 façons » ; 0 et 1 au singulier, comme en français).
 */
import type { Article, Facon } from './modele';

export interface ComptesCarnet {
  /** Façons ouvertes ou retenues (en lice). */
  facons: number;
  /** Façons écartées, à part. */
  ecartees: number;
  /** Tous les articles : lus + sans aperçu. */
  articles: number;
  /** Page lue. */
  lus: number;
  /** Page pas (encore) lue : à lire, en cours, illisible. */
  sansApercu: number;
  /** Veille demandée. */
  veilles: number;
  photos: number;
  notes: number;
}

type ContenuCompte = {
  facons: readonly Pick<Facon, 'etat'>[];
  articles: readonly (Pick<Article, 'lecture'> & { veille?: { active: boolean } })[];
  photos?: readonly unknown[];
  notes?: readonly unknown[];
};

/** Les comptes d'un carnet (voir l'en-tête). */
export function comptesCarnet(k: ContenuCompte): ComptesCarnet {
  const ecartees = k.facons.filter(f => f.etat === 'ecartee').length;
  const lus = k.articles.filter(a => a.lecture === 'lue').length;
  return {
    facons: k.facons.length - ecartees,
    ecartees,
    articles: k.articles.length,
    lus,
    sansApercu: k.articles.length - lus,
    veilles: k.articles.filter(a => a.veille?.active).length,
    photos: k.photos?.length ?? 0,
    notes: k.notes?.length ?? 0,
  };
}

/** « 1 façon », « 2 façons », « 0 façon » : le pluriel français (2 et plus). `plusieurs` vaut `un` + « s » par défaut. */
export function pluriel(n: number, un: string, plusieurs = `${un}s`): string {
  return `${n} ${Math.abs(n) >= 2 ? plusieurs : un}`;
}

/** L'accord seul, sans le nombre (« le » / « les », « article » / « articles »). */
export function accord(n: number, un: string, plusieurs = `${un}s`): string {
  return Math.abs(n) >= 2 ? plusieurs : un;
}

/** « 2 façons · 6 articles » : la ligne de compte de la liste (g05-1) ; rien de ce qui vaut 0 n'est écrit. */
export function texteComptes(c: ComptesCarnet): string[] {
  const parts: string[] = [];
  if (c.facons) parts.push(pluriel(c.facons, 'façon'));
  if (c.articles) parts.push(pluriel(c.articles, 'article'));
  return parts;
}
