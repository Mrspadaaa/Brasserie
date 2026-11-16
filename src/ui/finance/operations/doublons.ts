import { createContext } from 'react';
import type { Transaction } from '../../../types';
import { FinanceService } from '../../../services/financeService';
import { StorageService } from '../../../services/storage';
import { contrePaiement } from './calculs';
import { isoDate } from '../../../domain/finance/ledger';

/**
 * m1do-a : le geste de la paire. « Annuler celle-ci » annule l'ÉCRITURE en trop (jamais une suppression : sa pièce et son historique restent),
 * « Rétablir » la reprend dans le délai ci-dessous. Les règles Firestore refusent de modifier une écriture déjà annulée : le rétablissement
 * n'est donc possible que tant que rien n'est écrit ; l'annulation s'écrit à la fin du délai, au départ de l'écran ou à la fermeture de la page.
 */
export const DELAI_RETABLIR_MS = 8000;

export interface GestePaire {
  /** Annulée dans le délai (pas encore écrite) : la ligne se montre barrée avec « Rétablir ». */
  enAttente: (id: string) => boolean;
  annuler: (id: string) => void;
  retablir: (id: string) => void;
  /** Le jour dit sur la ligne annulée (« annulée le 15 nov. »). */
  jour: string;
  /** Le refus d'une annulation (stock consommé, avoir lié…), dit sous la ligne. */
  erreur: (id: string) => string;
}
/** Fourni par le journal autour des lignes d'une paire ; la ligne y remplace son geste habituel. Absent partout ailleurs. */
export const ContextePaire = createContext<GestePaire | null>(null);

/**
 * Annule une écriture en trop par les services existants, dans l'ordre et un lot par étape (règles Firestore : un paiement par pièce et par lot, le
 * solde réglé doit être nul avant l'annulation) : un contre-paiement `CONTRE-<id>` pour chaque paiement encore actif, puis `revertTransaction`.
 * Une étape qui échoue arrête la suite et dit ce qui est déjà écrit.
 */
export async function annulerEcriture(transaction: Transaction, maintenant: string): Promise<void> {
  const ecrits: string[] = [];
  try {
    const paiements = FinanceService.getPayments();
    const annules = new Set(paiements.filter(p => p.reversalOfId).map(p => p.reversalOfId));
    for (const p of paiements.filter(x => x.transactionId === transaction.id && !x.reversalOfId && !annules.has(x.id))) {
      FinanceService.recordPayment(contrePaiement(p, maintenant));
      ecrits.push('paiement inversé');
      await Promise.resolve(); // le lot de cette étape part ici, avant l'écriture suivante
    }
    const resultat = StorageService.revertTransaction(transaction.id);
    if (!resultat.success) throw new Error(resultat.message);
  } catch (e) {
    const raison = e instanceof Error ? e.message : 'Annulation impossible.';
    throw new Error(ecrits.length ? `${raison} Déjà écrit : ${ecrits.join(', ')}. Vérifie l’écriture dans la liste.` : raison);
  }
}

const jourMois = new Intl.DateTimeFormat('fr-CH', { day: 'numeric' });
const mois = new Intl.DateTimeFormat('fr-CH', { month: 'short' });
/**
 * « saisies le 14 et le 15 oct. » : les jours où les pièces ont été saisies (`recordedAt`), sans année ni heure ; une seule date : « saisie le 14 oct. ».
 * Plus de deux jours : « saisies du 14 au 20 oct. » ; sans date de saisie connue : rien (inconnu n'est pas inventé).
 */
export function saisiesLe(transactions: Transaction[]): string {
  const jours = [...new Set(transactions.map(t => isoDate(t.finance?.recordedAt?.slice(0, 10))).filter((j): j is string => !!j))].sort();
  if (!jours.length) return '';
  const d = (j: string) => new Date(`${j}T12:00:00`);
  const meme = (a: string, b: string) => a.slice(0, 7) === b.slice(0, 7);
  if (jours.length === 1) return `saisie${transactions.length > 1 ? 's' : ''} le ${jourMois.format(d(jours[0]))} ${mois.format(d(jours[0]))}`;
  const premier = jours[0], dernier = jours[jours.length - 1];
  if (jours.length === 2) return `saisies le ${jourMois.format(d(premier))}${meme(premier, dernier) ? '' : ` ${mois.format(d(premier))}`} et le ${jourMois.format(d(dernier))} ${mois.format(d(dernier))}`;
  return `saisies du ${jourMois.format(d(premier))}${meme(premier, dernier) ? '' : ` ${mois.format(d(premier))}`} au ${jourMois.format(d(dernier))} ${mois.format(d(dernier))}`;
}
