/**
 * Typicité d'un fermentescible pour le style visé (voie a1-proposition, D222) : la part des recettes du style qui contiennent ce
 * fermentescible, lue chez Beer Analytics (www.beer-analytics.com, graphique « typical-styles-relative », CC BY-SA 4.0) dans
 * `src/data/fermentables/typicite-styles.json`, générée par `scripts/collecte-malt/typicite-malts.mjs`. Même démarche que les houblons
 * (`hopIndex/v4/typicite.ts`) : un terme de classement, jamais un filtre ; un fermentescible sans donnée reste proposé, après ceux dont
 * la typicité est connue ; l'inconnu n'est jamais 0.
 *
 * La table n'est pas dans le chunk de la page : `chargerTypicite()` l'importe à la demande et la pose ; tant qu'elle n'est pas là,
 * tout est inconnu et la règle retombe sur le stock, l'épinglé et le nom.
 */

/** La table dérivée (voir l'en-tête du fichier JSON : source, licence, lecture). */
export interface TableTypicite {
  source: { nom: string; licence: string; releve: string | null };
  /** Code BJCP 2021 du style → son nom chez Beer Analytics (seulement les styles rattachés sans ambiguïté). */
  styles: Record<string, string>;
  /** Styles voisins (les stouts se lisent entre elles) et leur poids : la part d'un voisin compte pour `poidsVoisin` fois sa valeur. Absents d'une table plus ancienne : aucun voisin. */
  voisins?: Record<string, string[]>; poidsVoisin?: number;
  /** Plus petite part publiée par fermentescible : ce que vaut AU PLUS un style absent de sa liste des 16 (inconnu, jamais 0). */
  p16: Record<string, number>;
  /** parts[code du style][identifiant] = part des recettes du style qui contiennent ce fermentescible, de 0 à 1. */
  parts: Record<string, Record<string, number>>;
}

/** Paliers de la part. Un malt de base est dans la plupart des recettes de son style (Pilsner : 91 % des German Pils) ; un caramel y est
 * dans une sur dix ou moins. Hypothèses du pilote [H], pas des seuils du site : des paliers, pas la part brute, pour que le stock et l'épinglé
 * départagent deux articles aussi courants l'un que l'autre. */
export const PALIERS_TYPICITE: { min: number; palier: 1 | 2 | 3 | 4; libelle: string }[] = [
  { min: 0.5, palier: 4, libelle: 'dans la plupart des recettes' },
  { min: 0.15, palier: 3, libelle: 'courant' },
  { min: 0.03, palier: 2, libelle: 'présent' },
  { min: 0, palier: 1, libelle: 'rare' },
];
export const palierDePart = (part: number): 1 | 2 | 3 | 4 => PALIERS_TYPICITE.find((p) => part >= p.min)!.palier;
export const libelleDuPalier = (p: number): string => PALIERS_TYPICITE.find((x) => x.palier === p)?.libelle ?? 'inconnue';

export interface Typicite {
  /** 4 dans la plupart des recettes, 3 courant, 2 présent, 1 rare ; `null` : inconnue. */
  palier: 1 | 2 | 3 | 4 | null;
  /** La part retenue (style visé, ou voisin × poids), `null` si inconnue. */
  part: number | null;
  /** D'où vient le palier : la part du style, ou la borne (le style est hors des 16 premiers et la plus petite part publiée est sous le seuil du « présent » : « rare » est connu par la borne). */
  origine: 'style' | 'voisin' | 'borne' | null;
  /** Inconnue mais bornée : le style n'est pas dans les 16 premiers du fermentescible, donc au plus cette part. */
  auPlus: number | null;
  /** Pourquoi elle est inconnue ; `null` si connue. */
  raison: string | null;
}

const INCONNUE = (raison: string, auPlus: number | null = null): Typicite => ({ palier: null, part: null, origine: null, auPlus, raison });

/** La place d'une typicité inconnue MAIS BORNÉE dans une clé de rang : entre « rare » (1) et « présent » (2). Un inconnu n'est pas une rareté (la part peut valoir n'importe quoi jusqu'à la borne), mais il ne passe pas devant un « présent » établi. Sans aucune borne : `null`, après tout le connu. */
export const PALIER_INCONNU_DANS_LA_CLE = 1.5;
export const palierDansLaCle = (t: Typicite): number | null => t.palier ?? (t.auPlus !== null ? PALIER_INCONNU_DANS_LA_CLE : null);

/** La typicité d'un fermentescible (identifiant Beer Analytics, `null` : nom hors de la table des noms) pour un code de style BJCP 2021. */
export function typiciteDe(slug: string | null, styleCode: string | null | undefined, t: TableTypicite | null): Typicite {
  if (!t) return INCONNUE('table de typicité non chargée');
  if (!styleCode) return INCONNUE('style non précisé');
  if (!slug) return INCONNUE('nom absent de la table des noms');
  if (!(styleCode in t.styles)) return INCONNUE('style sans correspondance chez Beer Analytics');
  const propre = t.parts[styleCode]?.[slug];
  if (propre !== undefined) return { palier: palierDePart(propre), part: propre, origine: 'style', auPlus: null, raison: null };
  // Un voisin parle à moitié : sa part × `poidsVoisin`. Le style visé, quand il est publié, prime toujours.
  const voisines = (t.voisins?.[styleCode] ?? []).map((v) => t.parts[v]?.[slug]).filter((p): p is number => p !== undefined);
  if (voisines.length) { const part = Math.max(...voisines) * (t.poidsVoisin ?? 0.5); return { palier: palierDePart(part), part, origine: 'voisin', auPlus: null, raison: null }; }
  const plafond = t.p16[slug];
  if (plafond === undefined) return INCONNUE('fermentescible absent de Beer Analytics');
  // Le style est hors des 16 premiers du fermentescible : sa part est AU PLUS `p16`. Sous le seuil du « présent », « rare » est connu par la borne ; sinon elle peut être n'importe où entre 0 et `p16` : inconnue, bornée. Jamais 0.
  if (palierDePart(plafond) === 1) return { palier: 1, part: null, origine: 'borne', auPlus: plafond, raison: null };
  return INCONNUE('style hors des 16 premiers du fermentescible', plafond);
}

let posee: TableTypicite | null = null;
/** Pose la table (tests, scripts, chargement). `null` l'oublie. */
export const poserTypicite = (t: TableTypicite | null): void => { posee = t; };
/** La table posée, ou `null` : sans elle la typicité de tout fermentescible est inconnue (neutre). */
export const typiciteChargee = (): TableTypicite | null => posee;

let enCours: Promise<TableTypicite> | null = null;
/** Charge la table à la demande (un morceau à part) et la pose. À appeler à l'ouverture de l'étape ; la règle la lit ensuite sans autre geste. */
export function chargerTypicite(): Promise<TableTypicite> {
  enCours ??= import('../../data/fermentables/typicite-styles.json')
    .then((j) => { const t = ((j as { default?: unknown }).default ?? j) as unknown as TableTypicite; poserTypicite(t); return t; })
    .catch((e) => { enCours = null; throw e; });
  return enCours;
}
