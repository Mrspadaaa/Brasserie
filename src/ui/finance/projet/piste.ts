import type { FinancialPlan } from '../../../domain/finance/types';
import { DEPRECIATION_CATEGORIES } from '../../../domain/finance/annual';
import { isoDate, montantChf } from '../../../domain/finance/ledger';
import { usureParAnCents } from '../../../domain/finance/materielFutur';
import { upgradeDetails } from '../../../domain/finance/upgrades';

/**
 * La piste du projet matériel (m3pm-d) : les quatre étapes saisies de `EquipmentUpgrade.stage` (Idée, À étudier, Devis, Prêt à acheter),
 * prolongées par Acheté et En service. Ces deux dernières ne sont pas un champ : elles se déduisent des achats liés (factures de
 * `finance.planId`) et de `inServiceMonth`. Fonctions pures, sans horloge : le mois courant est donné par l'appelant.
 */
export type StationId = 'idea' | 'research' | 'quote' | 'ready' | 'bought' | 'service';
/** Les mots de la maquette m3pm-d (et non « Devis en cours » du domaine). */
export const STATIONS: ReadonlyArray<{ id: StationId; label: string }> = [
  { id: 'idea', label: 'Idée' }, { id: 'research', label: 'À étudier' }, { id: 'quote', label: 'Devis' },
  { id: 'ready', label: 'Prêt à acheter' }, { id: 'bought', label: 'Acheté' }, { id: 'service', label: 'En service' },
];
export const ETAPES_SAISIES = ['idea', 'research', 'quote', 'ready'] as const;
export const estEtapeSaisie = (id: StationId): id is (typeof ETAPES_SAISIES)[number] => (ETAPES_SAISIES as readonly string[]).includes(id);

export interface EtatPiste { faites: Set<StationId>; actuelle: StationId | null }
/**
 * Où en est le projet. Acheté = au moins un achat lié, ou « réalisé » ; En service = acheté et mise en service échue.
 * Un achat fait passer toutes les étapes d'avant, quelle que soit l'étape saisie. Sans achat : les étapes avant l'étape saisie sont faites, elle est en cours.
 */
export function etatPiste(plan: FinancialPlan, achatsLies: number, moisCourant: string): EtatPiste {
  const detail = upgradeDetails(plan);
  const achete = achatsLies > 0 || plan.status === 'completed';
  if (achete) {
    const enService = !!detail.inServiceMonth && detail.inServiceMonth <= moisCourant;
    const faites = new Set<StationId>(STATIONS.filter(s => s.id !== 'service' || enService).map(s => s.id));
    return { faites, actuelle: enService ? null : 'service' };
  }
  const rang = Math.max(0, ETAPES_SAISIES.indexOf(detail.stage));
  return { faites: new Set(STATIONS.slice(0, rang).map(s => s.id)), actuelle: ETAPES_SAISIES[rang] };
}

export const montant = (cents: number) => montantChf(cents / 100);
const moisCourtDe = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-CH', { month: 'short', year: 'numeric' });
/** « nov. 2026 » (mois) ou « 15 nov. 2026 » (jour précis, anciens projets) ; `null` sans date. */
export function quand(plan: FinancialPlan): string | null {
  const date = isoDate(plan.date);
  if (!date) return null;
  return upgradeDetails(plan).datePrecision === 'day' ? new Date(`${date}T12:00:00`).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short', year: 'numeric' }) : moisCourtDe(date);
}
export const moisDe = (aaaaMm: string) => moisCourtDe(`${aaaaMm}-01`);

export interface ResumeUsure { ans: number | null; parAnCents: number | null; mise: string | null }
/** L'usure du futur matériel : durée saisie, sinon 100 ÷ taux linéaire AFC de la catégorie ; par an = budget ÷ durée (`usureParAnCents`). Inconnu = `null`, jamais 0. */
export function resumeUsure(plan: FinancialPlan): ResumeUsure {
  const detail = upgradeDetails(plan);
  const taux = DEPRECIATION_CATEGORIES.find(c => c.id === detail.depreciationCategory)?.linearRate;
  const ans = detail.usefulLifeYears ?? (taux && taux > 0 ? 100 / taux : null);
  const base = detail.budgetKnown ? plan.amountCents : null;
  return { ans, parAnCents: usureParAnCents(base, { dureeAns: detail.usefulLifeYears, categorie: detail.depreciationCategory }), mise: detail.inServiceMonth ?? null };
}
export const texteAns = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1).replace('.', ',')} an${n >= 2 ? 's' : ''}`;
