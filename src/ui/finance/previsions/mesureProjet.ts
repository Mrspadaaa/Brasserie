import type { Batch, StockItem } from '../../../types';
import type { FinanceForecast } from '../../../domain/finance/forecast';
import { estimerBrassinsPlanifies } from '../../../domain/finance/brewForecast';
import { mesurerAchat } from '../../../domain/finance/materielFutur';
import { upgradeBudget, upgradeDetails } from '../../../domain/finance/upgrades';
import type { FinanceTransaction, FinancialAsset, FinancialPlan, FinancialProfile } from '../../../domain/finance/types';
import type { Escalier } from './escalier';

/** Fiche d'un projet de matériel : usure, litre avant → après, plus bas, bouteilles. Assemble `mesurerAchat` (d3) et l'escalier quotidien (pas les soldes de fin de mois). */
export interface MesureProjet {
  usureParAnCents: number | null;
  litreAvant: number | null;
  litreApres: number | null;
  pointBas: Escalier['pointBas'];
  soldeFinCents: number | null;
  /** « Pour rester à zéro » : bouteilles à vendre pour combler le plus bas, en trésorerie, avant coût de production. `null` = prix manquant ; 0 = aucun creux. */
  bouteillesPourZero: number | null;
  /** « Pour payer le matériel » : sur la marge après tous les coûts du litre (`mesurerAchat().ventes`). */
  bouteillesPourPayer: number | null;
  avertissements: string[];
}

export const bouteillesPourZero = (pointBasCents: number | null | undefined, prixBouteilleCents: number | null | undefined): number | null => {
  if (pointBasCents == null) return null;
  if (pointBasCents >= 0) return 0;
  if (typeof prixBouteilleCents !== 'number' || !Number.isFinite(prixBouteilleCents) || prixBouteilleCents <= 0) return null;
  return Math.ceil(-pointBasCents / prixBouteilleCents);
};

export function mesureDuProjet(input: { plan: FinancialPlan; plans: FinancialPlan[]; assets: FinancialAsset[]; transactions: FinanceTransaction[]; forecast: FinanceForecast; escalier: Escalier;
  batches: Batch[]; stockItems: StockItem[]; profile: FinancialProfile; asOf: string; fin: string; prixBouteilleCents?: number | null }): MesureProjet {
  const { plan, profile } = input, detail = upgradeDetails(plan);
  // Litre « avant » : le brassin planifié le plus proche, calculé sans l'usure de ce projet (`ignorerPlanId`). Aucun brassin : inconnu.
  const brassins = estimerBrassinsPlanifies({ batches: input.batches, stockItems: input.stockItems, transactions: input.transactions, plans: input.plans, profile, assets: input.assets, asOf: input.asOf, fin: input.fin, ignorerPlanId: plan.id }).brassins;
  const litre = brassins.find(b => b.coutLitre)?.coutLitre ?? null;
  const prix = input.prixBouteilleCents ?? null;
  const mesure = mesurerAchat({ coutInitialCents: upgradeBudget(detail) ?? (plan.amountCents > 0 ? plan.amountCents : null), moisAchat: plan.date.slice(0, 7), usure: { dureeAns: detail.usefulLifeYears, categorie: detail.depreciationCategory },
    assujettiTva: !!profile.vatRegistered, productionAnnuelleL: profile.annualProductionL, coutLitreCents: litre ? litre.complet * 100 : null,
    format: prix && prix > 0 ? { label: 'bouteille 33 cl', volumeL: 0.33, prixCents: prix } : undefined, prevision: input.forecast, ignorerPlanId: plan.id });
  const apres = mesure.coutLitreAvecCents;
  return { usureParAnCents: mesure.usureParAnCents, litreAvant: litre ? litre.affiche.complet : null, litreApres: apres == null ? null : Math.round(apres) / 100,
    pointBas: input.escalier.pointBas, soldeFinCents: input.escalier.soldeFinCents, bouteillesPourZero: bouteillesPourZero(input.escalier.pointBas?.soldeCents, prix),
    bouteillesPourPayer: mesure.ventes?.bouteilles ?? null, avertissements: mesure.avertissements };
}
