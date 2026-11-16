import type { FinancialPlan } from './types';
import type { ForecastItem, ForecastMonth } from './forecast';
import { isoDate } from './ledger';
import { isUpgradePlan, UPGRADE_TIMINGS, upgradeDetails, upgradeReadiness } from './upgrades';

/**
 * Atelier › Matériel › À venir (maquette kh1r) : de quoi dire quel achat vient d'abord, ce qu'il fait à la caisse de fin de mois et où
 * poser les autres. Fonctions pures : elles lisent les projets et la prévision déjà calculée (`buildForecast`), n'inventent aucun chiffre ;
 * une caisse inconnue reste `null`, un prix absent reste absent (jamais 0).
 */

/** Le bandeau « Caisse fin de mois » montre le mois courant et les sept suivants (nov. à juin dans la maquette). */
export const MOIS_BANDEAU = 8;

/** Le repère d'état du besoin : un picto, trois lectures, tirées des étapes existantes (aucun état neuf stocké). */
export type Repere = 'chercher' | 'devis' | 'prix';
export const REPERES: Record<Repere, string> = { chercher: 'À chercher', devis: 'Devis demandé', prix: 'Prix trouvé' };
/**
 * Idée et À étudier → loupe « à chercher » ; Devis en cours → enveloppe « devis demandé » ; Prêt à acheter → étiquette « prix trouvé ».
 * Une étape « prêt » sans prix connu ne peut pas dire « prix trouvé » : elle retombe sur « à chercher ».
 */
export function repereDe(plan: FinancialPlan): Repere {
  const detail = upgradeDetails(plan);
  if (detail.stage === 'quote') return 'devis';
  if (detail.stage === 'ready') return detail.budgetKnown ? 'prix' : 'chercher';
  return 'chercher';
}

/** Combien des trois prix (achat, livraison, installation) manquent : un frais laissé vide n'est pas chiffré, il n'est pas 0. */
export function partsInconnues(plan: FinancialPlan): number {
  const detail = upgradeDetails(plan);
  return [detail.purchaseCents, detail.deliveryCents, detail.installationCents].filter(v => v == null).length;
}
/** Le mois posé (AAAA-MM), ou null : sans date, rien n'est posé. */
export const moisDePlan = (plan: FinancialPlan): string | null => isoDate(plan.date)?.slice(0, 7) ?? null;
/** Posé = dans les prévisions : projet inclus, daté et budgété (la même règle que `forecast.ts`). */
export const estPose = (plan: FinancialPlan): boolean => isUpgradePlan(plan) && plan.status === 'active' && upgradeReadiness(plan).length === 0;

const ORDRE_HORIZON = Object.keys(UPGRADE_TIMINGS);
/** L'ordre de la liste : horizon, date, puis l'ordre où le brasseur les a notés (sa maquette), enfin le nom. */
const parHorizon = (a: FinancialPlan, b: FinancialPlan) => ORDRE_HORIZON.indexOf(upgradeDetails(a).timing) - ORDRE_HORIZON.indexOf(upgradeDetails(b).timing)
  || (a.date || '9999').localeCompare(b.date || '9999') || (a.createdAt || '').localeCompare(b.createdAt || '') || a.title.localeCompare(b.title, 'fr');
/** Les projets à venir (idées et inclus), dans l'ordre de la liste : horizon, date, ordre de saisie, nom. */
export const avenir = (plans: FinancialPlan[]): FinancialPlan[] => plans.filter(p => isUpgradePlan(p) && ['draft', 'active'].includes(p.status)).sort(parHorizon);

/** Le prochain achat : le projet posé dont le mois vient en premier (à mois égal, l'horizon puis le nom). Aucun posé : repli ci-dessous ; aucun projet à venir, aucun prochain achat. */
export function prochainAchat(plans: FinancialPlan[]): FinancialPlan | null {
  const poses = avenir(plans).filter(estPose).sort((a, b) => (a.date).localeCompare(b.date) || parHorizon(a, b));
  if (poses[0]) return poses[0];
  /* Constat 7 (jeu en ligne 16.11) : tant qu'un projet existe, un prochain achat est mis en avant. Aucun n'est posé : celui qui a un mois et un prix (le plus proche),
   * puis un mois sans prix, puis un prix sans mois, enfin le premier dans l'ordre de la liste (horizon, date, saisie, nom). Sans prix, la carte dit « à estimer » : aucun chiffre n'est inventé. */
  const reste = avenir(plans), rang = (p: FinancialPlan) => (moisDePlan(p) ? 0 : 2) + (upgradeDetails(p).budgetKnown ? 0 : 1);
  return reste.map((p, i) => ({ p, i })).sort((a, b) => rang(a.p) - rang(b.p) || (rang(a.p) < 2 ? a.p.date.localeCompare(b.p.date) : 0) || a.i - b.i)[0]?.p ?? null;
}

export interface Suivants { lignes: FinancialPlan[]; connuCents: number; inconnus: number }
/** La liste « Les suivants » : tout l'à venir sauf le prochain achat. Le total est « au moins » dès qu'un prix manque (`inconnus` > 0). */
export function suivants(plans: FinancialPlan[], prochain: FinancialPlan | null): Suivants {
  const lignes = avenir(plans).filter(p => p.id !== prochain?.id);
  const chiffres = lignes.filter(p => upgradeDetails(p).budgetKnown);
  return { lignes, connuCents: chiffres.reduce((somme, p) => somme + p.amountCents, 0), inconnus: lignes.length - chiffres.length };
}

export interface MarcheMois { mois: string; sortiesCents: number; cumulCents: number }
/** Les marches des projets de matériel, mois par mois, avec leur cumul : ce que les projets retirent de la caisse jusqu'à ce mois. */
export function marchesParMois(items: ForecastItem[], mois: string[]): MarcheMois[] {
  let cumul = 0;
  return mois.map(m => {
    const sorties = items.filter(i => i.source === 'equipment' && i.direction === 'out' && i.date.slice(0, 7) === m).reduce((somme, i) => somme + i.amountCents, 0);
    cumul += sorties;
    return { mois: m, sortiesCents: sorties, cumulCents: cumul };
  });
}

export interface EffetProjet {
  mois: string;
  /** Caisse de fin de ce mois avec le projet ; null si la caisse est inconnue. */
  avecCents: number | null;
  /** La même caisse sans lui. */
  sansCents: number | null;
  /** Ce que le projet retire de la caisse jusqu'à ce mois (sa marche). */
  marcheCents: number;
  /** Vrai si un prix manque (livraison, installation…) : la caisse est « au plus » ce chiffre. */
  auPlus: boolean;
}
/**
 * La caisse de fin du mois du projet, avec et sans lui. Le « sans » rend ce que la prévision comptait pour lui (ses sorties jusqu'à ce mois) :
 * un seul calcul de prévision suffit. « au plus » dès qu'un projet posé jusqu'à ce mois a un prix manquant : la vraie dépense ne peut qu'être plus haute.
 */
export function effetProjet(plan: FinancialPlan, plans: FinancialPlan[], months: ForecastMonth[], items: ForecastItem[]): EffetProjet | null {
  const mois = moisDePlan(plan);
  const ligne = mois ? months.find(m => m.month === mois) : undefined;
  if (!mois || !ligne) return null;
  const marcheCents = items.filter(i => i.planId === plan.id && i.direction === 'out' && i.date.slice(0, 7) <= mois).reduce((somme, i) => somme + i.amountCents, 0);
  const auPlus = plans.filter(p => estPose(p) && (moisDePlan(p) ?? '9999') <= mois).some(p => partsInconnues(p) > 0);
  const avecCents = ligne.balanceCents;
  return { mois, avecCents, sansCents: avecCents == null ? null : avecCents + marcheCents, marcheCents, auPlus };
}

export interface EchelleCaisse { lo: number; hi: number; pas: number; ticks: number[] }
const joli = (x: number) => { const e = 10 ** Math.floor(Math.log10(x)); return [1, 2, 5, 10].map(m => m * e).find(v => x <= v)!; };
/**
 * L'échelle de la courbe, en centimes : un pas rond (1, 2 ou 5 × 10ⁿ francs) qui tient en trois marches au plus, zéro toujours dans le champ.
 * Cinq mille francs donnent un pas de deux mille et un sommet à six mille (comme la maquette). Les repères sont les multiples du pas sous le sommet.
 */
export function echelleCaisse(valeursCents: Array<number | null>): EchelleCaisse {
  const v = valeursCents.filter((x): x is number => x != null);
  const hautRaw = Math.max(0, ...v), basRaw = Math.min(0, ...v);
  const pas = joli(Math.max(1, (hautRaw - basRaw) / 100 / 3)) * 100;
  // marge au-dessus de la courbe (15 % de l'étendue) : le sommet ne touche jamais le haut du champ, il reste la place du pointillé et du titre
  const hi = Math.max(1, Math.ceil((hautRaw + 0.15 * (hautRaw - basRaw)) / pas)) * pas, lo = Math.floor(basRaw / pas) * pas;
  const ticks: number[] = [];
  for (let t = lo; t < hi; t += pas) ticks.push(t);
  return { lo, hi, pas, ticks };
}

/**
 * La caisse telle qu'elle était avant la sortie payée : on rend la dépense aux mois dès celui de la facture. Elle sert à garder l'échelle d'avant
 * le paiement (maquette kyh1, sortie : 0, 2 000, 4 000) pour que la courbe abaissée se voie tomber, au lieu de se recadrer sur elle-même.
 * Une caisse inconnue reste inconnue.
 */
export function caisseAvantSortie(valeursCents: Array<number | null>, indexSortie: number, sortieCents: number | null): Array<number | null> {
  if (indexSortie < 0 || sortieCents == null) return valeursCents;
  return valeursCents.map((v, i) => (v != null && i >= indexSortie ? v + sortieCents : v));
}

/** Le nom court du repère dans le bandeau : « Installation de la hotte » → « hotte », « B100 aio brewtool » → « B100 ». */
export function titreCourt(titre: string): string {
  const t = titre.trim();
  const apres = /^\S+\s+(?:de la|de l['’]|du|des|d['’]|de)\s*(\S+)/i.exec(t);
  const court = apres ? apres[1] : t.split(/\s+/)[0] ?? t;
  return court.length > 12 ? `${court.slice(0, 11)}…` : court;
}
