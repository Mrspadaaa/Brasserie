import type { Client, Transaction } from '../types';
import { ClientStatsService } from '../services/clientStats';

/**
 * PC-2 (d) : un client sans vente se supprime ; un client qui a des ventes non annulées se garde (ses chiffres et ses factures s'y rattachent).
 * `ClientStatsService` compte déjà les ventes en ignorant les écritures annulées et les avoirs : même règle que « Aucune vente » à l'écran.
 */
export function refusSuppressionClient(client: Client, transactions: Transaction[], tous: Client[] = []): string | null {
  const n = ClientStatsService.forAll(tous.some((c) => c.id === client.id) ? tous : [...tous, client], transactions).get(client.id)?.orderCount ?? 0;
  if (n <= 0) return null;
  return `${client.name.trim() || 'Ce client'} a ${n} vente${n > 1 ? 's' : ''} non annulée${n > 1 ? 's' : ''} : elle${n > 1 ? 's' : ''} reste${n > 1 ? 'nt' : ''} rattachée${n > 1 ? 's' : ''} à son nom. Annule d’abord ${n > 1 ? 'ces ventes' : 'cette vente'}, ou garde le client.`;
}
