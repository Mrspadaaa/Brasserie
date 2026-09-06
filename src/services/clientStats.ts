import { Client, ClientStats, ClientStatus, Transaction } from '../types';
import { DateUtils } from './dateUtils';

/**
 * Chiffres client dérivés des ventes réelles.
 *
 * Ces valeurs ne sont volontairement PAS stockées sur la fiche client : un
 * `totalSales` figé dans la base se périme à la vente suivante et finit par
 * mentir. On les recalcule à la volée depuis les écritures de recettes.
 */
export const ClientStatsService = {
  /** Rattache une écriture de vente à un client (par son nom). */
  matchesClient(tx: Transaction, client: Client): boolean {
    if (tx.category !== 'recettes') return false;
    const haystack = `${tx.proofNotes || ''} ${tx.description || ''}`.toLowerCase();
    const name = client.name.trim().toLowerCase();
    return name.length > 2 && haystack.includes(name);
  },

  computeStatus(orderCount: number, lastOrderDate: Date | null): ClientStatus {
    if (orderCount === 0) return 'Prospect';
    if (orderCount >= 3) return 'Fidèle';
    // Un client qui n'a plus commandé depuis plus de 6 mois redevient un prospect.
    if (lastOrderDate) {
      const monthsSince =
        (Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
      if (monthsSince > 6) return 'Prospect';
    }
    return 'Actif';
  },

  forClient(client: Client, transactions: Transaction[]): ClientStats {
    const sales = transactions.filter((t) => this.matchesClient(t, client));

    const totalSales = Math.round(sales.reduce((sum, t) => sum + (t.amountTTC || 0), 0) * 100) / 100;

    let lastDate: Date | null = null;
    let lastLabel: string | null = null;
    sales.forEach((t) => {
      const d = DateUtils.parseDate(t.date);
      if (d && (!lastDate || d > lastDate)) {
        lastDate = d;
        lastLabel = t.date;
      }
    });

    return {
      totalSales,
      orderCount: sales.length,
      lastOrder: lastLabel,
      status: this.computeStatus(sales.length, lastDate)
    };
  },

  /** Stats de tous les clients en une passe — évite un O(n²) sur la liste. */
  forAll(clients: Client[], transactions: Transaction[]): Map<string, ClientStats> {
    const map = new Map<string, ClientStats>();
    clients.forEach((c) => map.set(c.id, this.forClient(c, transactions)));
    return map;
  }
};
