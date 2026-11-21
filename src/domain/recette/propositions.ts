/**
 * N1 (D393, v04 : « l'ajout du malt suggère ajoute une quantité qui fait sens ») : la masse proposée d'un malt ajouté d'un toucher.
 *
 * Méthode standard (Palmer, How to Brew, « Designing Recipes ») : une facture se pense en parts du grain ; les malts de spécialité
 * ont des parts usuelles (caramel 5 %, torréfié 3 %, Munich ou Vienne 15 %, froment ou avoine 10 %), le malt de base porte le reste.
 * La masse totale vient du grain déjà posé ; sans grain, de la densité visée : kg = points × L ÷ (rendement × 300 points·L/kg,
 * ≈ 36 PPG). Proposée, jamais imposée : la case de masse reste au doigt du brasseur. Jamais 0 (un malt à 0 kg bloque le lancement, WFR-3).
 */
import type { Fermentable } from '../../types';

/** Points de densité par kg et par litre d'un malt de base courant (≈ 36 PPG × 8,345). */
export const POINTS_L_PAR_KG = 300;
/** Densité visée sans style connu : le milieu d'une ale courante. */
export const OG_PAR_DEFAUT = 1.055;

export const PARTS_USUELLES: readonly { motif: RegExp; part: number; role: string }[] = [
  { motif: /cara|crystal|cristal|caramel|special ?b/i, part: 0.05, role: 'caramel' },
  { motif: /chocolat|chocolate|roast|torr[ée]fi|black|noir|carafa|brown/i, part: 0.03, role: 'torréfié' },
  { motif: /acidul|sauer/i, part: 0.03, role: 'acide' },
  { motif: /munich|vienn|wien|melano|biscuit|aromati|amber|ambr/i, part: 0.15, role: 'Munich' },
  { motif: /froment|wheat|weizen|avoine|oat|seigle|rye|flocon|flak/i, part: 0.1, role: 'céréale' }
];

export interface ContexteMasse {
  volumeL: number;
  /** Rendement de brassage, en % (72 pour 72 %). */
  rendementPct: number;
  /** OG visée (milieu de la plage du style), sinon `null`. */
  ogVisee: number | null;
}

const arrondir = (kg: number) => Math.max(0.05, Math.round(kg * 20) / 20);

/** La part usuelle d'un malt de spécialité, ou `null` pour un malt de base (il porte le reste). */
export function partUsuelle(nom: string): number | null {
  return PARTS_USUELLES.find((p) => p.motif.test(nom))?.part ?? null;
}

/** La masse de grain d'une facture entière à la densité visée. */
export function grainTotalVise({ volumeL, rendementPct, ogVisee }: ContexteMasse): number {
  const og = ogVisee && ogVisee > 1 ? ogVisee : OG_PAR_DEFAUT;
  const rendement = rendementPct > 0 ? rendementPct / 100 : 0.72;
  const litres = volumeL > 0 ? volumeL : 20;
  return ((og - 1) * 1000 * litres) / (rendement * POINTS_L_PAR_KG);
}

/** La masse proposée pour `nom`, face aux grains déjà posés (masses > 0). */
export function masseProposee(nom: string, grains: readonly Fermentable[], ctx: ContexteMasse): number {
  const poses = grains.filter((f) => f.kind === 'grain' && f.weightKg > 0);
  const dejaKg = poses.reduce((s, f) => s + f.weightKg, 0);
  const total = Math.max(grainTotalVise(ctx), dejaKg);
  const part = partUsuelle(nom);
  if (part !== null) return arrondir(total * part);
  // Un malt de base : le reste de la facture, sinon (facture déjà pleine) un quart de plus, jamais 0.
  return arrondir(total - dejaKg > 0.05 * total ? total - dejaKg : total * 0.25);
}

/**
 * Une ligne de grain vient d'entrer à 0 kg (toucher sur une puce, un nom du stock) : elle reçoit sa masse proposée. Les autres
 * changements passent tels quels (une masse effacée à la main reste effacée : seule la ligne ajoutée, en dernier, est complétée).
 */
export function completerMasseAjoutee(avant: readonly Fermentable[], apres: Fermentable[], ctx: ContexteMasse): Fermentable[] {
  if (apres.length !== avant.length + 1) return apres;
  const neuve = apres[apres.length - 1];
  if (!neuve || neuve.kind !== 'grain' || neuve.weightKg > 0) return apres;
  return [...apres.slice(0, -1), { ...neuve, weightKg: masseProposee(neuve.name, avant, ctx) }];
}
