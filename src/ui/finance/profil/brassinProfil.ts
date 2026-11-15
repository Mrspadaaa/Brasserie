import type { AppConfig, Batch, Recipe, StockItem } from '../../../types';
import { brewBudgetDateKey, estimateBrewBudget, netVolumeSaisi, reductionImpotPourAnnee, annualBrewFixedCosts, type BrewBudgetSnapshot } from '../../../domain/finance/brewBudget';
import { estimerBrassinsPlanifies } from '../../../domain/finance/brewForecast';
import { coutLitre, troisNotions } from '../../../domain/finance/chaineLitre';
import { usureAnnuelleLitre } from '../../../domain/finance/materielFutur';
import type { FinanceTransaction, FinancialAsset, FinancialPlan, FinancialProfile } from '../../../domain/finance/types';

/** « Prochain brassin » de Solde et paramètres (m4pf-c) : son titre, ses litres nets, son coût du litre tout compris, et ce qui manque quand il est partiel. */
export interface BrassinProfil {
  titre: string;
  litres: number | null;
  /** Coût du litre tout compris, arrondi au centime ; `null` si un élément manque (jamais 0). */
  litre: number | null;
  /** Premier élément manquant quand `litre` est null. */
  manque?: string;
  /** `brassin` : un brassin planifié ; `budget` : un budget de brassin prévu (plan « brassage » sans brassin rattaché). */
  origine: 'brassin' | 'budget';
}

export interface EntreeBrassinProfil {
  batches: Batch[]; stockItems: StockItem[]; transactions: FinanceTransaction[]; plans: FinancialPlan[]; assets: FinancialAsset[];
  profile: FinancialProfile; config: Pick<AppConfig, 'fiscal'>; asOf: string; fin: string;
}

/**
 * Le brassin que montre le profil. D'abord un brassin planifié (même calcul que Prévisions) ; à défaut, le prochain budget de brassin prévu
 * (plan « brassage » avec son instantané et un net saisi) : Prévisions le compte déjà, le profil ne dit donc pas « aucun brassin planifié » (t1, problème 3).
 * Le budget est recalculé avec la production du brouillon : c'est elle que le curseur fait varier. Aucun net saisi, aucun brassin : `null`.
 */
export function brassinDuProfil(i: EntreeBrassinProfil): BrassinProfil | null {
  const planifies = estimerBrassinsPlanifies({ batches: i.batches, stockItems: i.stockItems, transactions: i.transactions, plans: i.plans, profile: i.profile, assets: i.assets, asOf: i.asOf, fin: i.fin }).brassins;
  const brassin = planifies.find(b => b.litresNets);
  if (brassin?.litresNets) return { titre: brassin.titre, litres: brassin.litresNets.litres, litre: brassin.coutLitre?.affiche.complet ?? null, manque: brassin.partiel[0], origine: 'brassin' };

  const budgets = i.plans
    .filter(p => p.source === 'brew' && p.status === 'active' && !p.batchId && p.brewEstimate)
    .map(p => ({ plan: p, snap: p.brewEstimate as BrewBudgetSnapshot, jour: brewBudgetDateKey((p.brewEstimate as BrewBudgetSnapshot).brewDate || p.date) ?? '' }))
    .filter(b => b.jour >= i.asOf && netVolumeSaisi(b.snap) != null)
    .sort((a, b) => a.jour.localeCompare(b.jour) || a.plan.id.localeCompare(b.plan.id));
  const prochain = budgets[0];
  if (!prochain) return null;
  const { snap, jour } = prochain;
  const litres = netVolumeSaisi(snap)!;
  const recette = { ...snap.recipeSnapshot, id: snap.recipeSnapshot.sourceRecipeId ?? snap.recipeId ?? snap.id } as Recipe;
  const fixes = annualBrewFixedCosts(i.plans);
  let usure = snap.settings.annualDepreciationCHF;
  if (snap.settings.includeDepreciation !== false) {
    const u = usureAnnuelleLitre({ plans: i.plans, assets: i.assets, transactions: i.transactions, moisReference: jour.slice(0, 7) });
    if (u.lignes.length > 0 && u.complet) usure = u.totalCents / 100;
  }
  const estimation = estimateBrewBudget({
    recipe: recette, stockItems: i.stockItems, batches: i.batches, brewDate: jour, netVolumeL: litres,
    og: recette.ogTarget != null && recette.ogTarget > 1 ? recette.ogTarget : undefined, abv: recette.abvTarget ?? undefined,
    beerTaxReductionPct: reductionImpotPourAnnee(i.config.fiscal, jour), bindings: snap.bindings, prices: snap.prices, cashTreatments: snap.cashTreatments,
    settings: { ...snap.settings, annualVolumeL: i.profile.annualProductionL, annualFixedCHF: fixes.amountCHF ?? snap.settings.annualFixedCHF, annualDepreciationCHF: usure },
    transactions: i.transactions, savedEstimates: i.plans.filter(p => p.brewEstimate && p.id !== prochain.plan.id).map(p => p.brewEstimate as BrewBudgetSnapshot),
    isTvaRegistered: i.profile.vatRegistered, now: `${i.asOf}T12:00:00Z`,
  });
  const notions = troisNotions(estimation);
  const cl = coutLitre({ notions, litres });
  return { titre: snap.title || recette.name || 'Brassin', litres, litre: cl?.affiche.complet ?? null, manque: cl ? undefined : notions?.manque[0] ?? estimation.issues[0], origine: 'budget' };
}
