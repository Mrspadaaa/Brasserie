// Voie g2b : le palier 60′ (D88 B, D165) et le vrai dry hop (D161, D166) de Suggérer. Constantes et comparaisons pures ; le calcul est dans voies.ts.
// Tout ce qui est ici est une CONVENTION écrite, nommée comme telle : aucune source du dépôt ne donne une dose de dry hop par style
// (Beer Analytics publie la part du poids de houblon de la recette par style, pas des g/L ; hopStyleUsageBootstrap, des rôles sans dose).

/** Usage d'un houblon selon Beer Maverick (CatalogueHop.purpose). */
export type Usage = 'bittering' | 'dual' | 'aroma';
/** D88 B : à 60′ l'usage passe avant l'α : « amérisant ou double usage avant arôme » (un seul palier pour les deux premiers : c'est l'α qui les classe) ;
 * un usage inconnu passe après le connu (jamais assimilé à un usage). */
export const USAGE_RANG: Record<Usage, number> = { bittering: 0, dual: 0, aroma: 1 };
export const rangUsage = (u: Usage | null | undefined): number => (u ? USAGE_RANG[u] : 2);
export const USAGE_FR: Record<Usage, string> = { bittering: 'amérisant', dual: 'double usage', aroma: 'arôme' };
/** D102 (A) : à 60′, un PRODUIT d'arôme (cryo, lupuline, poudre : substitution.ts, produitDArome) passe après les amérisants et doubles usages, comme dans Substituer
 * (« un brasseur n'amérise pas avec un produit d'arôme : usage et coût »), quel que soit l'usage de sa variété : il tombe dans le palier des arômes (1), jamais au-dessus.
 * Un usage inconnu (2) reste derrière. Le score et l'α affichés ne changent pas : seul le rang change. */
export const rangUsageDe = (u: Usage | null | undefined, produit: boolean): number => (produit ? Math.max(rangUsage(u), 1) : rangUsage(u));

/** Ce que Suggérer sait dire d'un ajout d'amertume (60′ et « remplacer à IBU égal »). */
export interface InfoPalier {
  usage: Usage | null;
  /** α retenu (lot ou plage variétale), en % ; null : inconnu. Celui qu'on pèse : pour un produit (cryo…), l'α du LOT ; le rang, lui, lit l'α de la variété (voir `rang`). */
  alpha: number | null;
  /** Clé de rang D88 B : [rang d'usage, grammes] (moins de grammes = α plus haut). D102 (A) : pour un produit d'arôme, le rang d'usage est au moins 1 (`rangUsageDe`)
   * et les grammes sont ceux de l'α de la VARIÉTÉ : l'α d'un lot de cryo (24,8 %) ne le fait plus passer devant tous les pellets. */
  rang: [number, number];
  /** D102 (A) : la forme de produit d'arôme lue dans le nom, les alias ou l'article (« cryo », « lupuline », « poudre »), seulement pour un produit ; absent sinon. */
  produit?: string;
  /** Bande d'IBU du style et position de l'IBU après : un drapeau, jamais une exclusion (D88 B). */
  bande: [number, number] | null;
  drapeau: 'sous la bande' | 'au-dessus de la bande' | null;
}

/** Le groupe 60′ : usage, puis grammes (les deux infos sont présentes). */
export function comparerPalier(a?: InfoPalier, b?: InfoPalier): number {
  const x = a?.rang ?? [0, 0], y = b?.rang ?? [0, 0];
  return x[0] - y[0] || x[1] - y[1];
}
/** Dans le classement général (compareRankKeys), PREMIÈRE clé de palier, juste après les conflits : l'usage. Une voie sans palier vaut le palier
 * des amérisants (0) : un remplacement par un houblon d'arôme à 60′ passe derrière toutes les autres voies, un amérisant garde sa place. Sans l'option : égalité partout. */
export const comparerUsagePalier = (a?: InfoPalier, b?: InfoPalier): number => (a?.rang[0] ?? 0) - (b?.rang[0] ?? 0);
/** Dans le classement général, DEUXIÈME clé, après la distance : moins de grammes (α plus haut). Une voie sans palier passe après celles qui en ont :
 * un préordre total (jamais « égal à tout »), et inerte sans l'option. */
export function comparerGrammesPalier(a?: InfoPalier, b?: InfoPalier): number {
  if (!a) return b ? 1 : 0;
  if (!b) return -1;
  return a.rang[1] - b.rang[1];
}

/** Drapeau d'une IBU finale face à la bande du style (0,5 IBU de tolérance, comme le conflit d'IBU du moteur). */
export function drapeauIbu(ibu: number, bande: [number, number] | null | undefined): InfoPalier['drapeau'] {
  if (!bande) return null;
  return ibu < bande[0] - 0.5 ? 'sous la bande' : ibu > bande[1] + 0.5 ? 'au-dessus de la bande' : null;
}

/** Bornes de la dose de dry hop PROPOSÉE : GÉNÉRIQUES (aucune source par style dans le dépôt, vérifié le 26.10).
 *  - plancher 0,5 g/L : la plus petite dose de recherche du solveur (hopSolverBootstrap, searchDosesGL de l'ébullition et du premier moût, hypothèse L'Affinée) ;
 *  - plafond 8 g/L : le repère de revue du dry hop cumulé (`dryHopReviewGL`, docs/hop-solver.md), « ni seuil de défaut ni plafond » : ici une borne de proposition ;
 *  - pas 0,5 g/L : la dose se dit au demi-gramme par litre (10 g sur 20 L).
 * Au-delà de 8 g/L CUMULÉS avec les dry hops déjà dans la recette, la voie reste proposée avec un drapeau de revue, pas exclue. */
export const BORNES_DRYHOP_GL = {
  min: 0.5, max: 8, pas: 0.5, revueCumuleGL: 8,
  source: 'générique : plancher 0,5 g/L = plus petite dose de recherche du solveur ; plafond 8 g/L = repère de revue du dry hop cumulé (hopSolverBootstrap, docs/hop-solver.md) ; aucune source de dose de dry hop par style dans le dépôt',
} as const;

/** Les doses de la grille de recherche, en g/L (0,5 à 8 par 0,5). */
export const GRILLE_DRYHOP_GL: number[] = (() => {
  const g: number[] = [];
  for (let x = BORNES_DRYHOP_GL.min; x <= BORNES_DRYHOP_GL.max + 1e-9; x += BORNES_DRYHOP_GL.pas) g.push(Math.round(x * 100) / 100);
  return g;
})();

export interface DoseDryHop {
  /** Dose proposée, g/L, multiple de 0,5. */
  gPerL: number;
  /** null : la dose est celle qui s'approche le plus de la visée dans les bornes ; 'min' ou 'max' : la visée est hors des bornes, la dose est bornée. */
  borne: 'min' | 'max' | null;
  /** Présent quand la dose est imposée par l'appelant (`dryHop: { doseGL }`) : une dose générique, sans source de style, jamais celle de la règle. */
  imposee?: 'dose générique, sans source de style';
}
export interface RegleDryHop {
  bornes: { min: number; max: number; pas: number };
  /** « générique » tant qu'aucune source du dépôt ne donne l'usage du dry hop pour le style. */
  source: 'générique' | 'style';
  explication: string;
  revueCumuleGL: number;
  /** Ce qui a été cherché et n'existe pas : la trace de L14 et de l'honnêteté des données. */
  sourcesStyleCherchees: string;
}
export const REGLE_DRYHOP: RegleDryHop = {
  bornes: { min: BORNES_DRYHOP_GL.min, max: BORNES_DRYHOP_GL.max, pas: BORNES_DRYHOP_GL.pas },
  source: 'générique',
  explication: `Dose = celle des multiples de 0,5 g/L, entre ${BORNES_DRYHOP_GL.min} et ${BORNES_DRYHOP_GL.max} g/L, dont l'effet sur la famille visée s'approche le plus de la visée (la plus petite en cas d'égalité). ${BORNES_DRYHOP_GL.source}.`,
  revueCumuleGL: BORNES_DRYHOP_GL.revueCumuleGL,
  sourcesStyleCherchees: 'src/data/hopSolverBootstrap.json (searchDosesGL 2·4·6 g/L par timing, pas par style ; dryHopReviewGL 8) ; docs/hop-solver.md et docs/hop-extrapolation.md ; hopDoseStudyBootstrap (Cascade 0 à 16 g/L, un lot) ; Beer Analytics amount-used-per-style (part du poids de houblon, pas des g/L) ; hopStyleUsageBootstrap (rôles par style, sans dose).',
};

export const RANKING_PALIER60 = [
  'conflits : une famille « moins » ou indésirable du style marquée chez le houblon, ou une famille exclue par les goûts, EXCLUT la voie (D90) ; l’IBU hors de la bande du style n’exclut pas : drapeau',
  'usage : amérisant ou double usage, puis arôme ou produit d’arôme (cryo, lupuline, poudre : un brasseur n’amérise pas avec) ; inconnu en dernier (D88 B, D102)',
  'α : moins de grammes pour l’IBU visée (cohumulone et β hors du rang) ; pour un produit, l’α de la variété, pas celui du lot (D102)',
  'stock : suffisant, puis manque, puis à acheter',
];
