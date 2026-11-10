import type { DepreciationCategory, FinanceTransaction, FinancialAsset, FinancialPlan } from './types';
import type { FinanceForecast } from './forecast';
import { DEPRECIATION_CATEGORIES } from './annual';
import { isActiveTransaction, isoDate, montantChf, transactionKind } from './ledger';
import { isUpgradePlan, upgradeBudget, upgradeDetails } from './upgrades';

/**
 * Mesurer un achat de matériel futur (ex. un frigo à 3 000 CHF) : trésorerie, usure, part dans le litre, ventes pour le payer.
 * Fonctions pures, en centimes entiers (comme `forecast.ts`) ; l'appelant convertit une fois les CHF de `brewBudget` (`Math.round(x * 100)`).
 * Une sortie dont une entrée manque est `null` : l'inconnu n'est jamais 0. Aucune écriture, aucune horloge.
 * Source du taux linéaire : barème AFC, `DEPRECIATION_CATEGORIES` (`annual.ts`). Usure économique du litre = linéaire (P2) ; l'AFC dégressif reste dans l'Annuel.
 */

const entierPositif = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
const positif = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;
const MOIS_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const chf = (cents: number) => `${montantChf(cents / 100)} CHF`;
const virgule = (n: number, decimales = 1) => n.toFixed(decimales).replace('.', ',');

export type UsureSaisie = { dureeAns?: number | null; categorie?: DepreciationCategory | null };
const tauxLineaire = (categorie?: DepreciationCategory | null): number | null => {
  const taux = DEPRECIATION_CATEGORIES.find(c => c.id === categorie)?.linearRate;
  return taux && taux > 0 ? taux : null;
};

/** Usure par an, linéaire : base ÷ durée saisie ; sans durée, base × taux linéaire AFC de la catégorie (durée = 100 ÷ taux, non arrondie). `null` si inconnue. */
export function usureParAnCents(baseCents: number | null | undefined, usure?: UsureSaisie): number | null {
  if (!entierPositif(baseCents) || !usure) return null;
  if (positif(usure.dureeAns)) return Math.round(baseCents / usure.dureeAns);
  const taux = tauxLineaire(usure.categorie);
  return taux == null ? null : Math.round(baseCents * taux / 100);
}

/** Pièce d'achat d'un projet : une dépense active liée par `finance.planId`. */
const piecesDuProjet = (plan: FinancialPlan, transactions: FinanceTransaction[]) =>
  transactions.filter(tx => isActiveTransaction(tx) && transactionKind(tx) === 'expense' && tx.finance?.planId === plan.id);

/** L'actif du registre né de l'achat d'un projet : son `transactionId` est une pièce du projet (jamais par le nom). */
export function actifLiePourProjet(plan: FinancialPlan, assets: FinancialAsset[], transactions: FinanceTransaction[]): FinancialAsset | undefined {
  const ids = new Set(piecesDuProjet(plan, transactions).map(tx => tx.id));
  return assets.find(a => a.transactionId != null && ids.has(a.transactionId));
}

/**
 * Usure linéaire annuelle d'un actif du registre, pour le coût du litre (jamais le dégressif).
 * Durée saisie > taux linéaire du registre (méthode linéaire) > taux linéaire AFC de la catégorie. `null` si aucun ; 0 hors période d'usage.
 * `annee` : l'exercice du brassin ; sans lui, l'usure d'une année pleine en service.
 */
export function usureLineaireActifCents(asset: FinancialAsset, annee?: number): number | null {
  const cout = Math.round(asset.acquisitionCents * asset.businessUsePct / 100);
  if (!entierPositif(cout)) return null;
  let tauxPct: number | null = null;
  if (positif(asset.usefulLifeYears)) tauxPct = 100 / asset.usefulLifeYears;
  else if (asset.method === 'linear' && positif(asset.ratePct)) tauxPct = asset.ratePct;
  else tauxPct = tauxLineaire(asset.category);
  if (tauxPct == null) return null;
  if (annee != null) {
    const miseEnService = Number((isoDate(asset.inServiceDate) ?? '').slice(0, 4));
    if (!miseEnService || annee < miseEnService) return 0;
    const cession = isoDate(asset.disposedDate);
    if (cession && Number(cession.slice(0, 4)) < annee) return 0;
    if (annee >= miseEnService + Math.ceil(100 / tauxPct - 1e-9)) return 0;
  }
  return Math.round(cout * tauxPct / 100);
}

export interface LigneUsure { id: string; nom: string; source: 'projet' | 'actif'; usureCents: number }
export interface UsureLitre { totalCents: number; lignes: LigneUsure[]; /** faux si une usure est inconnue : le total est alors un minimum. */ complet: boolean; avertissements: string[] }

/**
 * Usure annuelle linéaire portée par le litre, un matériel comptant une seule fois : l'actif du registre remplace l'estimation du projet
 * dès qu'il existe (`actifLiePourProjet`) ; une facture sans actif laisse l'usure du projet et signale « Actif à créer ».
 * `moisReference` (AAAA-MM) : date du brassin ; un matériel pas encore en service n'est pas compté.
 * `ignorerPlanId` : le projet évalué (et son actif) sort du calcul, pour obtenir le coût du litre « hors ce projet » (entrée de `mesurerAchat`).
 */
export function usureAnnuelleLitre(input: { plans: FinancialPlan[]; assets: FinancialAsset[]; transactions: FinanceTransaction[]; moisReference: string; ignorerPlanId?: string }): UsureLitre {
  const { plans, assets, transactions, moisReference } = input, lignes: LigneUsure[] = [], avertissements: string[] = [];
  let complet = true;
  const annee = Number(moisReference.slice(0, 4));
  const ecarte = new Set<string>();
  for (const plan of plans.filter(isUpgradePlan)) {
    const lie = actifLiePourProjet(plan, assets, transactions);
    if (plan.id === input.ignorerPlanId) { if (lie) ecarte.add(lie.id); continue; }
    if (lie) continue; // l'actif du registre remplace l'estimation du projet : il est compté plus bas, une seule fois
    const factures = piecesDuProjet(plan, transactions);
    if (!(plan.status === 'active' || factures.length > 0 && plan.status !== 'cancelled')) continue;
    const detail = upgradeDetails(plan), enService = detail.inServiceMonth ?? isoDate(plan.date)?.slice(0, 7);
    if (!enService) continue;
    if (factures.length) avertissements.push(`Actif à créer : « ${plan.title} » est facturé mais pas encore au registre ; son usure estimée reste comptée.`);
    if (enService > moisReference) continue;
    const usure = usureParAnCents(upgradeBudget(detail) ?? (plan.amountCents > 0 ? plan.amountCents : null), { dureeAns: detail.usefulLifeYears, categorie: detail.depreciationCategory });
    if (usure == null) { complet = false; avertissements.push(`Usure à renseigner : « ${plan.title} » (durée ou catégorie).`); continue; }
    lignes.push({ id: plan.id, nom: plan.title, source: 'projet', usureCents: usure });
  }
  for (const asset of assets) {
    if (ecarte.has(asset.id)) continue;
    const service = isoDate(asset.inServiceDate)?.slice(0, 7), cede = isoDate(asset.disposedDate)?.slice(0, 7);
    if (!service || service > moisReference || cede && cede <= moisReference) continue;
    const usure = usureLineaireActifCents(asset, annee);
    if (usure == null) { complet = false; avertissements.push(`Usure à renseigner : « ${asset.name} » (durée ou catégorie).`); continue; }
    if (usure > 0) lignes.push({ id: asset.id, nom: asset.name, source: 'actif', usureCents: usure });
  }
  return { totalCents: lignes.reduce((n, l) => n + l.usureCents, 0), lignes, complet, avertissements: [...new Set(avertissements)] };
}

export interface AchatMateriel {
  /** Total à sortir de la caisse, TTC (achat + livraison + installation : `upgradeBudget`). `null` = inconnu. */
  coutInitialCents: number | null;
  /** `AAAA-MM`. */
  moisAchat: string;
  usure?: UsureSaisie;
  /** Pour un assujetti à la TVA : le prix HT (la TVA préalable est récupérée). Sinon le TTC, par défaut `coutInitialCents`. */
  assujettiTva?: boolean;
  baseUsureCents?: number | null;
  productionAnnuelleL?: number | null;
  /** Coût complet moyen du litre (charges fixes et usure comprises), **hors usure de CE projet** (`usureAnnuelleLitre` avec `ignorerPlanId`). */
  coutLitreCents?: number | null;
  /** `prixCents` au même régime de TVA que la base (HT pour un assujetti). `coutCents` : coût complet du format (d1) ; sinon repli litre × volume. */
  format?: { label: string; volumeL: number; prixCents: number; coutCents?: number | null; coutVariableCents?: number | null };
  /** Sortie de `buildForecast` (soldes de fin de mois) ; jamais relue ni modifiée. */
  prevision: FinanceForecast;
  /** Le projet est déjà dans la prévision : ses items sont retirés avant de simuler (pas de double compte). */
  ignorerPlanId?: string;
  /** L'actif de ce projet est déjà au registre : son usure est dans le litre, pas ajoutée ici. */
  actifDejaEnregistre?: boolean;
  /** Solde minimal à tenir, centimes (défaut 0). */
  seuilCents?: number;
}
export interface MesureAchat {
  tresorerie: { soldeMoisAchatCents: number; pointBas: { mois: string; soldeCents: number } } | null;
  meilleurMois: { mois: string; soldeMiniCents: number } | null;
  usureParAnCents: number | null;
  /** Centimes par litre, **exact** (non arrondi) : arrondir à l'affichage seulement. */
  partParLitreCents: number | null;
  coutLitreAvecCents: number | null;
  ventes: { formatLabel: string; margeApresTousCoutsCents: number; bouteilles: number; litres: number; bouteillesSiToutEstMarge: number; bouteillesSurMargeVariable: number | null } | null;
  /** Entrées prévues de source plan, récurrente ou brassin (les factures client à encaisser n'en font pas partie). */
  encaissementsPrevusCents: number;
  avertissements: string[];
}

export function mesurerAchat(input: AchatMateriel): MesureAchat {
  const avertissements: string[] = [], { prevision } = input;
  const cout = entierPositif(input.coutInitialCents) ? input.coutInitialCents : null;

  // Base de l'usure et des ventes : TTC, ou HT pour un assujetti (jamais le TTC par défaut).
  let baseHT: number | null = null;
  if (input.assujettiTva) {
    if (entierPositif(input.baseUsureCents)) baseHT = input.baseUsureCents;
    else avertissements.push('TVA : assujetti, donne le prix HT du matériel pour l’usure et les ventes (la TVA préalable est récupérée).');
  } else baseHT = entierPositif(input.baseUsureCents) ? input.baseUsureCents : cout;

  const usure = input.actifDejaEnregistre ? null : usureParAnCents(baseHT, input.usure);
  if (input.actifDejaEnregistre) avertissements.push('L’usure de ce matériel est déjà dans le registre (actif) : elle n’est pas ajoutée une seconde fois au litre.');
  const part = usure != null && positif(input.productionAnnuelleL) ? usure / input.productionAnnuelleL : null;
  const coutLitre = typeof input.coutLitreCents === 'number' && Number.isFinite(input.coutLitreCents) && input.coutLitreCents >= 0 ? input.coutLitreCents : null;
  const coutLitreAvec = part != null && coutLitre != null ? coutLitre + part : null;

  // Ventes pour le payer : sur la marge (P3). Le coût du litre est celui sans ce matériel, sinon l'achat se rattrape deux fois.
  let ventes: MesureAchat['ventes'] = null;
  const f = input.format;
  if (f && baseHT != null && positif(f.volumeL) && entierPositif(f.prixCents)) {
    let coutFormat: number | null = null;
    if (entierPositif(f.coutCents)) coutFormat = f.coutCents;
    else if (coutLitre != null) {
      coutFormat = Math.round(coutLitre * f.volumeL);
      avertissements.push(`Coût du format : coût complet moyen du litre × volume (charges fixes et usure comprises) ; marge de rattrapage prudente, pas une marge marginale.`);
    }
    if (coutFormat != null) {
      const marge = f.prixCents - coutFormat;
      if (marge <= 0) avertissements.push(`Chaque vente de « ${f.label} » perd de l’argent (marge ${chf(marge)}) : aucune vente ne paie ce matériel.`);
      else {
        const margeVariable = entierPositif(f.coutVariableCents) ? f.prixCents - f.coutVariableCents : null;
        const bouteilles = Math.ceil(baseHT / marge);
        const litres = Math.round(bouteilles * f.volumeL * 10) / 10;
        ventes = { formatLabel: f.label, margeApresTousCoutsCents: marge, bouteilles, litres, bouteillesSiToutEstMarge: f.prixCents > 0 ? Math.ceil(baseHT / f.prixCents) : 0,
          bouteillesSurMargeVariable: margeVariable != null && margeVariable > 0 ? Math.ceil(baseHT / margeVariable) : null };
        avertissements.push(`Ventes : ${bouteilles} × « ${f.label} » (${virgule(litres)} L) sur la marge après tous les coûts du litre, ${chf(marge)} l’unité.`);
      }
    }
  }

  // Trésorerie : l'achat décale d'un montant constant tous les soldes cumulés suivants (le cumul de `buildForecast` est une somme de flux).
  const mois = prevision.months.map(m => m.month);
  const retour = (mois_k: string) => prevision.items.filter(i => i.planId === input.ignorerPlanId && i.date.slice(0, 7) <= mois_k)
    .reduce((n, i) => n + (i.direction === 'out' ? i.amountCents : -i.amountCents), 0);
  const soldes = prevision.months.map(m => m.balanceCents == null ? null : m.balanceCents + (input.ignorerPlanId ? retour(m.month) : 0));
  let tresorerie: MesureAchat['tresorerie'] = null, meilleurMois: MesureAchat['meilleurMois'] = null;
  const seuil = typeof input.seuilCents === 'number' && Number.isFinite(input.seuilCents) ? input.seuilCents : 0;
  if (cout != null && soldes.length && soldes.every(s => s != null)) {
    const base = soldes as number[];
    const i = MOIS_RE.test(input.moisAchat) ? mois.indexOf(input.moisAchat) : -1;
    if (i >= 0) {
      let bas = i;
      for (let k = i; k < base.length; k++) if (base[k] < base[bas]) bas = k;
      tresorerie = { soldeMoisAchatCents: base[i] - cout, pointBas: { mois: mois[bas], soldeCents: base[bas] - cout } };
    } else if (MOIS_RE.test(input.moisAchat) && input.moisAchat < mois[0]) avertissements.push(`Mois d’achat passé : ${input.moisAchat} précède le mois courant (${mois[0]}).`);
    else avertissements.push(`Achat hors de l’horizon prévu (${mois.length} mois, de ${mois[0]} à ${mois[mois.length - 1]}).`);
    // Meilleur mois : premier mois dont le point bas (minimum des soldes d'ici la fin de l'horizon, moins l'achat) tient le seuil.
    const minSuffixe = new Array<number>(base.length);
    for (let k = base.length - 1; k >= 0; k--) minSuffixe[k] = k === base.length - 1 ? base[k] : Math.min(base[k], minSuffixe[k + 1]);
    const k = minSuffixe.findIndex(m => m - cout >= seuil);
    if (k >= 0) meilleurMois = { mois: mois[k], soldeMiniCents: minSuffixe[k] - cout };
    else avertissements.push(`Avec cet achat, aucun mois ne tient le seuil de ${chf(seuil)} dans l’horizon.`);
  }
  if (tresorerie) {
    avertissements.push('Soldes de fin de mois : un creux au milieu du mois n’est pas vu.');
    if (input.assujettiTva && cout != null && baseHT != null && cout > baseHT) avertissements.push(`TVA préalable (environ ${chf(cout - baseHT)}) récupérée au décompte suivant : non modélisée, le point bas est trop bas d’autant.`);
  }

  const encaissementsPrevusCents = prevision.items.filter(i => i.direction === 'in' && ['plan', 'recurring', 'brew'].includes(i.source)).reduce((n, i) => n + i.amountCents, 0);
  const sorties = prevision.items.filter(i => i.direction === 'out').reduce((n, i) => n + i.amountCents, 0);
  if (encaissementsPrevusCents < sorties) avertissements.push(`Les entrées prévues (${chf(encaissementsPrevusCents)}) ne couvrent pas les sorties prévues (${chf(sorties)}) : le solde tend à baisser, un meilleur mois n’a de sens qu’avec des ventes attendues.`);
  if (prevision.undatedOutCents > 0) avertissements.push(`${chf(prevision.undatedOutCents)} de sorties sans échéance ne sont pas comptés dans les soldes.`);

  return { tresorerie, meilleurMois, usureParAnCents: usure, partParLitreCents: part, coutLitreAvecCents: coutLitreAvec, ventes, encaissementsPrevusCents, avertissements: [...new Set(avertissements)] };
}
