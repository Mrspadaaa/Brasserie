/**
 * Le prix ramené à l'unité de quantité (T28-6, test en ligne du tour 28 : « Mosaic 7,25 CHF (100 g) classé 1er devant Citra 72,50 CHF (1 kg),
 * le même prix au kilo »). Deux offres ne se classent au prix que sur la même quantité : un houblon se compare en CHF/kg, un liquide en CHF/L.
 *
 * Problème d'école : normalisation d'unités (prix unitaire, « unit pricing » du commerce de détail). Pas de bibliothèque : trois facteurs
 * décimaux (g, kg ; ml, cl, dl, L). La quantité se lit dans le NOM de l'article, tel que la page le donne (« Citra 1 kg ») ; aucune quantité
 * n'est devinée : sans quantité lisible, ou ambiguë (« 5 x 100 g », deux quantités différentes), le prix unitaire est inconnu (jamais 0).
 */
import type { Article } from './modele';

export type Dimension = 'masse' | 'volume';
type PrixArticle = Pick<Article, 'nom' | 'prixCentimes'> & Partial<Pick<Article, 'devise' | 'change'>>;

/**
 * T30-4 : le prix en centimes de franc ; un prix en euros passe au cours que la lecture a posé (`change`, BCE) ; sans cours, il reste
 * inconnu en francs (`null`, jamais 0, jamais un cours deviné). C'est ce prix-là qui classe, quelle que soit la devise de la page.
 */
export function prixEnChf(a: Pick<Article, 'prixCentimes'> & Partial<Pick<Article, 'devise' | 'change'>>): number | null {
  if (a.prixCentimes === undefined || !Number.isFinite(a.prixCentimes)) return null;
  if ((a.devise ?? 'CHF').toUpperCase() === 'CHF') return a.prixCentimes;
  return a.change && a.change.taux > 0 ? a.prixCentimes * a.change.taux : null;
}
/** `base` : la quantité en kg (masse) ou en L (volume) ; `texte` : « 100 g », « 1 kg », « 2,5 L », comme on l'écrit à côté du prix. */
export interface QuantiteArticle { dim: Dimension; base: number; texte: string }

const FACTEUR: Record<string, { dim: Dimension; f: number; affiche: string }> = {
  kg: { dim: 'masse', f: 1, affiche: 'kg' }, g: { dim: 'masse', f: 0.001, affiche: 'g' },
  l: { dim: 'volume', f: 1, affiche: 'L' }, dl: { dim: 'volume', f: 0.1, affiche: 'dl' }, cl: { dim: 'volume', f: 0.01, affiche: 'cl' }, ml: { dim: 'volume', f: 0.001, affiche: 'ml' }
};

/* un nombre, l'unité, puis ni lettre, ni chiffre, ni « / » (« 20 g/L » est un dosage, pas une quantité) ; jamais collé à un autre nombre */
const MOTIF = /(?<![\d.,'’a-zA-Zà-ÿ/])(\d+(?:[.,]\d+)?)\s?(kg|g|ml|cl|dl|l)(?![a-zA-Zà-ÿ0-9²³/])/gi;
/* « 5 x 100 g », « 5 × 100 g » : la quantité est celle d'un lot, pas celle du prix */
const LOT = /\d\s?[x×]\s?$/i;

/** La quantité que le nom de l'article dit ; `null` : aucune, ou ambiguë. */
export function quantiteArticle(a: Pick<Article, 'nom'>): QuantiteArticle | null {
  const nom = a.nom ?? '';
  const trouvees: QuantiteArticle[] = [];
  for (const m of nom.matchAll(MOTIF)) {
    const u = FACTEUR[m[2].toLowerCase()];
    const n = Number(m[1].replace(',', '.'));
    if (!u || !Number.isFinite(n) || n <= 0) continue;
    if (LOT.test(nom.slice(0, m.index))) return null;
    trouvees.push({ dim: u.dim, base: n * u.f, texte: `${m[1].replace('.', ',')} ${u.affiche}` }); /* C53 (R17) : « 50 L » ne se coupe pas entre le nombre et l'unité */
  }
  if (!trouvees.length) return null;
  const premiere = trouvees[0];
  return trouvees.every(t => t.dim === premiere.dim && Math.abs(t.base - premiere.base) < 1e-9) ? premiere : null;
}

/** Le prix (centimes de sa devise) pour 1 kg ou 1 L ; `null` : prix ou quantité inconnus. */
export function prixParUnite(a: PrixArticle): { centimes: number; dim: Dimension } | null {
  const q = quantiteArticle(a);
  const chf = prixEnChf(a);
  if (!q || chf === null) return null;
  return { centimes: chf / q.base, dim: q.dim };
}

/**
 * Le classement au prix se fait par unité quand au moins deux offres en lice portent une quantité de même dimension (la plus fréquente ;
 * masse en cas d'égalité) ; sinon, le prix tel quel, comme avant. `null` : classement au prix affiché.
 */
export function dimensionDuClassement(articles: readonly PrixArticle[]): Dimension | null {
  const n: Record<Dimension, number> = { masse: 0, volume: 0 };
  for (const a of articles) { const p = prixParUnite(a); if (p) n[p.dim] += 1; }
  if (n.masse < 2 && n.volume < 2) return null;
  return n.masse >= n.volume ? 'masse' : 'volume';
}

/** La valeur qui classe un article : son prix par unité (dimension du classement), sinon son prix ; `null` : inconnu (classé après les connus). */
export function prixDeClassement(a: PrixArticle, dim: Dimension | null): number | null {
  if (!dim) return prixEnChf(a);
  const p = prixParUnite(a);
  return p && p.dim === dim ? p.centimes : null;
}

/**
 * Deux offres se comparent au prix : même devise (vérifiée ailleurs) et, si l'une des deux dit sa quantité, les deux la disent dans la même
 * dimension. Rend l'écart `b - a` (> 0 : `a` moins cher), au prix par unité quand il y a des quantités ; `null` : non comparables.
 */
export function ecartDePrix(a: PrixArticle, b: PrixArticle): number | null {
  const ca = prixEnChf(a), cb = prixEnChf(b);
  if (ca === null || cb === null) return null;
  const pa = prixParUnite(a), pb = prixParUnite(b);
  if (pa || pb) return pa && pb && pa.dim === pb.dim ? pb.centimes - pa.centimes : null;
  return cb - ca;
}

/** « 72,50 CHF/kg » : le prix par unité d'un article (`centimes` dans la devise donnée) ; `null` sans quantité lisible. */
export function texteParUnite(a: Pick<Article, 'nom' | 'prixCentimes'>, centimesAffiches: number | undefined, devise: string): string | null {
  const p = prixParUnite(a);
  const q = quantiteArticle(a);
  if (!p || !q || centimesAffiches === undefined) return null;
  const parUnite = centimesAffiches / q.base / 100;
  const nombre = parUnite.toLocaleString('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/ | /g, ' ');
  /* C53 (R17, C53-4) : espace insécable entre le nombre et l'unité : « 10,40 CHF/L » ne se coupe jamais sur deux lignes */
  return `${nombre} ${devise}/${p.dim === 'masse' ? 'kg' : 'L'}`;
}
