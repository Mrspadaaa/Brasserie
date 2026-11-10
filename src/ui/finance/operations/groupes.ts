import type { Transaction } from '../../../types';
import { isActiveTransaction, isoDate } from '../../../domain/finance/ledger';

/**
 * Les groupes de la liste Opérations (v6b) : une écriture paraît UNE fois, sous la catégorie de l'écriture (`tx.category`).
 * Les montants des piles ne passent pas par ici (`periodeSynthese`) ; ces groupes ne servent qu'à ranger et à sommer les lignes affichées.
 */
export type GroupeId = 'chargesFixes' | 'recettes' | 'brassage' | 'nettoyage' | 'divers' | 'apports' | 'part' | 'retard' | 'sansDate' | 'annulees';

/** Chemins SVG (viewBox 24, trait) repris des carrés de la maquette v6b ; les autres groupes reçoivent un pictogramme de même gabarit. */
export interface GroupeMeta { id: GroupeId; label: string; chemin: string; fond: string; trait: string; liseré: string; sens: 'recette' | 'charge' }

const VAR = (hex: string) => `rgb(var(--c-${hex}))`;
const TXT = (hex: string) => `rgb(var(--ct-${hex}))`;

export const GROUPES: Record<GroupeId, GroupeMeta> = {
  chargesFixes: { id: 'chargesFixes', label: 'Charges fixes', chemin: 'M4 11l8-6 8 6v9H4z', fond: VAR('3f2556'), trait: TXT('d8b9f4'), liseré: VAR('9856d2'), sens: 'charge' },
  recettes: { id: 'recettes', label: 'Ventes', chemin: 'M12 6v12M6 12h12', fond: VAR('255633'), trait: TXT('b9f4ca'), liseré: VAR('56d27b'), sens: 'recette' },
  brassage: { id: 'brassage', label: 'Brassage', chemin: 'M12 21V8M12 8c-3 0-4-3-4-5 2 0 4 1 4 5z', fond: VAR('564925'), trait: TXT('f4e5b9'), liseré: VAR('d2b356'), sens: 'charge' },
  nettoyage: { id: 'nettoyage', label: 'Nettoyage', chemin: 'M12 3c3 5 6 8 6 12a6 6 0 0 1-12 0c0-4 3-7 6-12z', fond: VAR('254f56'), trait: TXT('b9ecf4'), liseré: VAR('56c1d2'), sens: 'charge' },
  divers: { id: 'divers', label: 'Autres frais', chemin: 'M5 12h.01M12 12h.01M19 12h.01', fond: 'rgb(var(--cave-800))', trait: 'rgb(var(--cave-texte-200))', liseré: 'rgb(var(--cave-400))', sens: 'charge' },
  apports: { id: 'apports', label: 'Apports et prélèvements', chemin: 'M12 4v14M6 12l6 6 6-6', fond: VAR('562544'), trait: TXT('f4b9de'), liseré: VAR('d256a4'), sens: 'charge' },
  part: { id: 'part', label: 'Matériel · à part', chemin: 'M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', fond: VAR('253356'), trait: TXT('b9caf4'), liseré: VAR('567bd2'), sens: 'charge' },
  retard: { id: 'retard', label: 'En retard', chemin: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v5l3 2', fond: VAR('402320'), trait: 'rgb(var(--alert-strong-texte))', liseré: 'rgb(var(--alert-strong-texte))', sens: 'charge' },
  /** Les écritures annulées (10.11) : listées, jamais additionnées. Même en-tête que les autres groupes, sans total ; une catégorie dont tout est annulé n'affiche plus un « 0,00 » au-dessus. */
  annulees: { id: 'annulees', label: 'Annulées', chemin: 'M6 6l12 12M18 6L6 18', fond: 'rgb(var(--cave-800))', trait: 'rgb(var(--cave-texte-200))', liseré: 'rgb(var(--cave-400))', sens: 'charge' },
  sansDate: { id: 'sansDate', label: 'Date à vérifier', chemin: 'M8 3v4M16 3v4M4 9h16M5 5h14v15H5zM12 12v3', fond: 'rgb(var(--cave-800))', trait: 'rgb(var(--cave-texte-200))', liseré: 'rgb(var(--cave-400))', sens: 'charge' },
};

/** Ordre de la maquette : Charges fixes, Ventes, Brassage, Nettoyage ; le reste ensuite ; « à part » après une ligne pointillée ; le retard et le sans-date en fin. */
export const ORDRE: GroupeId[] = ['chargesFixes', 'recettes', 'brassage', 'nettoyage', 'divers', 'apports', 'part', 'retard', 'sansDate', 'annulees'];

/** Un investissement (matériel, local et travaux) se lit à part : ce n'est pas une charge du mois. */
const EST_A_PART = new Set(['materiel', 'renovation']);

/** Le groupe d'une écriture dans le mois : `retard` si elle est ouverte, échue et hors du mois affiché. */
export function groupeDe(tx: Transaction, opts: { retardHorsMois: boolean }): GroupeId {
  if (!isActiveTransaction(tx)) return 'annulees';
  if (!isoDate(tx.date)) return 'sansDate';
  if (opts.retardHorsMois) return 'retard';
  if (EST_A_PART.has(tx.category)) return 'part';
  if (tx.category === 'recettes' || tx.category === 'apports' || tx.category === 'chargesFixes' || tx.category === 'brassage' || tx.category === 'nettoyage') return tx.category;
  return 'divers';
}
