import { Client, ClientStats, ClientStatus, Transaction } from '../types';
import { DateUtils } from './dateUtils';

/**
 * Chiffres client dérivés des ventes réelles.
 *
 * Ces valeurs ne sont volontairement PAS stockées sur la fiche client : un
 * `totalSales` figé dans la base se périme à la vente suivante et finit par
 * mentir. On les recalcule à la volée depuis les écritures de recettes.
 */
/** Sans accents ni majuscules : « Éric » et « eric » se rattachent au même client. */
const plat = (text: string) => text.normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '').toLowerCase();
const echapper = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, (c) => '\\' + c);

export const ClientStatsService = {
  /**
   * Rattache une écriture de vente à un client (par son nom).
   *
   * Le nom doit y figurer comme MOT ENTIER : « Bar » ne compte plus « Barbier » (AM-71). Une vente annulée n'est plus une vente ;
   * un avoir n'est pas une vente (il se déduit, voir `forClient`).
   */
  matchesClient(tx: Transaction, client: Client): boolean {
    if (tx.category !== 'recettes') return false;
    if (tx.finance?.voidedAt || tx.finance?.kind === 'refund') return false;
    const name = plat(client.name.trim());
    if (name.length <= 2) return false;
    const haystack = plat(`${tx.proofNotes || ''} ${tx.description || ''}`);
    return new RegExp(`(^|[^\\p{L}\\p{N}])${echapper(name)}($|[^\\p{L}\\p{N}])`, 'u').test(haystack);
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

  /**
   * `tous` : les autres clients. Quand « Bar » et « Bar du Pont » citent tous deux une vente, elle va au nom le plus long
   * (le plus précis) ; sans `tous`, la seule correspondance de mot entier compte.
   */
  forClient(client: Client, transactions: Transaction[], tous: Client[] = []): ClientStats {
    const nom = (c: Client) => plat(c.name.trim()).length;
    const sales = transactions.filter((t) =>
      this.matchesClient(t, client) &&
      !tous.some((autre) => autre.id !== client.id && nom(autre) > nom(client) && this.matchesClient(t, autre)));

    /* Un avoir lié à une de ses ventes se déduit du chiffre d'affaires ; il ne compte ni comme commande ni comme date. */
    const ids = new Set(sales.map((t) => t.id));
    const avoirs = transactions.filter((t) => t.finance?.kind === 'refund' && !t.finance.voidedAt &&
      t.finance.refundOfId !== undefined && ids.has(t.finance.refundOfId));

    const totalSales = Math.round((sales.reduce((sum, t) => sum + (t.amountTTC || 0), 0) - avoirs.reduce((sum, t) => sum + (t.amountTTC || 0), 0)) * 100) / 100;

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
    clients.forEach((c) => map.set(c.id, this.forClient(c, transactions, clients)));
    return map;
  }
};
