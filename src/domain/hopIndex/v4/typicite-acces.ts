// Accès à la typicité (voie f9, D120) : les types, et un registre minuscule que le moteur lit (voies.ts, departage.ts).
// Le code de la typicité (typicite.ts : lecture de la table, paliers) et la table (src/data/hopV4/typicite-styles.json) ne sont PAS dans le chunk du moteur :
// budget B5 (164 ko, il était à 163,5). Ils arrivent par `chargerTypicite()` (un morceau à part, comme le catalogue des ajouts) et s'enregistrent ici.
// Tant qu'ils ne sont pas là, la typicité de chaque houblon est INCONNUE (dite : « non chargée »), jamais 0 : l'option `typicite` ne classe alors rien de plus.

/** La table dérivée (voir l'en-tête du fichier JSON : source, licence, lecture). */
export interface TableTypicite {
  source: { nom: string; licence: string; releve: string | null };
  voisins: Record<string, string[]>; poidsVoisin: number;
  styles: Record<string, string>;
  /** Plus petite part publiée par houblon : ce que vaut au plus un style absent de sa liste (inconnu, jamais 0). */
  p16: Record<string, number>;
  parts: Record<string, Record<string, number>>;
  /** Familles de styles (le parent de Beer Analytics) et leurs codes BJCP ; `concentration[famille][houblon]` : la part des recettes DU HOUBLON qui sont de cette famille ; `recettes[houblon]` : taille de l'échantillon. */
  familles: Record<string, { nom: string; codes: string[] }>;
  concentration: Record<string, Record<string, number>>;
  recettes: Record<string, number>;
}
export interface Typicite {
  /** 3 typé, 2 courant, 1 rare ; null : inconnue (la table ne dit rien de ce houblon pour ce style). */
  palier: 1 | 2 | 3 | null;
  /** Part retenue (style visé, ou voisin × poids), null si inconnue. */
  part: number | null;
  /** D'où vient la part : le style visé ou un voisin (`code`) ; `borne` : a4 (D125), le style n'est pas dans les 16 premiers du houblon et la plus petite part publiée (`auPlus`) est sous le seuil du rare : « rare » est connu par la borne. */
  origine: 'style' | 'voisin' | 'borne' | null; code: string | null;
  /** Concentration : part des recettes du houblon qui sont de la famille du style (IPA…), null si inconnue ou si l'échantillon est mince. */
  concentration: number | null;
  /** Inconnue mais bornée : le style n'est pas dans les 16 premiers du houblon, donc au plus cette part. Renseignée aussi pour un « rare » connu par cette borne (`origine: 'borne'`). */
  auPlus: number | null;
  /** Pourquoi elle est inconnue ; null si connue. */
  raison: string | null;
}
export interface MoteurTypicite {
  typiciteDe(varietyId: string, styleCode: string): Typicite;
  typiciteDeVoie(positifs: { varietyId: string; poids: number }[], styleCode: string): Typicite | null;
  /** La table posée (null : aucune). */
  table(): TableTypicite | null;
}
/** a4 (D125), biais 3 : la place, dans une clé de rang, d'une typicité INCONNUE MAIS BORNÉE (le style est hors des 16 premiers du houblon : sa part est au plus `p16`, qui n'est pas sous le seuil du rare), entre « courant » (2)
 * et « rare » (1). Un inconnu n'est pas une rareté : celui dont une borne dit « pas plus de p16 » ne passe jamais derrière un rare connu ; il ne passe pas non plus devant un courant ou un typé, dont la part est établie.
 * Un houblon SANS AUCUNE donnée (absent de Beer Analytics, ou table non chargée) garde la clé `null` : il passe après tout le connu, rare compris (aucune preuve, pas même une borne). Une valeur de clé, jamais une part
 * ni un palier affiché (le palier reste `null`, dit). */
export const PALIER_INCONNU_DANS_LA_CLE = 1.5;
/** La valeur d'une typicité dans une clé de rang : son palier ; 1,5 si elle est inconnue mais bornée ; `null` si elle est inconnue sans aucune borne. */
export const palierDansLaCle = (t: Typicite): number | null => t.palier ?? (t.auPlus !== null ? PALIER_INCONNU_DANS_LA_CLE : null);
let impl: MoteurTypicite | null = null;
/** Enregistre le code de la typicité (typicite.ts le fait à chaque `poserTypicite`, jamais à son évaluation : ainsi un module qui l'importe sans l'appeler ne l'embarque pas, D120). */
export const enregistrerTypicite = (m: MoteurTypicite | null): void => { impl = m; };
/** La table de typicité si elle est posée, sinon null (D120, t2) : la page l'envoie au worker, qui ne la charge pas lui-même (ordre des messages : la table arrive avant les requêtes qui la lisent). */
export const tableTypicitePosee = (): TableTypicite | null => (impl ? impl.table() : null);
const NON_CHARGEE: Typicite = { palier: null, part: null, origine: null, code: null, concentration: null, auPlus: null, raison: 'table de typicité non chargée' };
export const typiciteDe = (varietyId: string, styleCode: string): Typicite => (impl ? impl.typiciteDe(varietyId, styleCode) : NON_CHARGEE);
export const typiciteDeVoie = (positifs: { varietyId: string; poids: number }[], styleCode: string): Typicite | null => (positifs.length ? (impl ? impl.typiciteDeVoie(positifs, styleCode) : NON_CHARGEE) : null);

let enCours: Promise<TableTypicite> | null = null;
/** Charge le code et la table, à la demande (un morceau à part, partagé), puis les pose. Hors page (scripts, tests) : importer typicite.ts et appeler `poserTypicite` avec le JSON lu. */
export function chargerTypicite(): Promise<TableTypicite> {
  enCours ??= Promise.all([import('./typicite'), import('../../../data/hopV4/typicite-styles.json')])
    .then(([m, j]) => { const t = ((j as { default?: unknown }).default ?? j) as unknown as TableTypicite; m.poserTypicite(t); return t; })
    .catch((e) => { enCours = null; throw e; });
  return enCours;
}
