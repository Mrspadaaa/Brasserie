import { describe, it, expect, vi, afterEach } from 'vitest';
import { DateUtils } from '../../src/services/dateUtils';
import { ClientStatsService } from '../../src/services/clientStats';
import { Client, Transaction } from '../../src/types';

/**
 * Dates suisses et chiffres client.
 *
 * Les dates s'écrivent JJ.MM.AAAA partout dans l'application — c'est la forme
 * que Gaëtan tape et celle des pièces comptables. Un `new Date()` natif lit
 * « 03.09.2026 » comme le 9 mars aux États-Unis : d'où l'analyse explicite.
 *
 * Les chiffres client ne sont volontairement pas stockés : un `totalSales`
 * figé dans la fiche se périme à la vente suivante.
 */

afterEach(() => {
  vi.useRealTimers();
});

describe('Lecture d’une date', () => {
  it('lit le format suisse JJ.MM.AAAA', () => {
    const d = DateUtils.parseDate('03.09.2026')!;
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8); // septembre
    expect(d.getDate()).toBe(3);
  });

  it('ne confond pas le jour et le mois comme le ferait Date natif', () => {
    expect(DateUtils.parseDate('03.09.2026')!.getMonth()).not.toBe(2);
  });

  it('lit aussi une date ISO', () => {
    expect(DateUtils.parseDate('2026-09-03')!.getFullYear()).toBe(2026);
  });

  it('renvoie null sur une date vide ou illisible', () => {
    expect(DateUtils.parseDate(undefined)).toBeNull();
    expect(DateUtils.parseDate('')).toBeNull();
    expect(DateUtils.parseDate('la semaine dernière')).toBeNull();
  });
});

describe('Filtre par période', () => {
  it('« tout » ne filtre rien', () => {
    expect(DateUtils.isDateInPeriod('03.09.2026', 'all')).toBe(true);
    expect(DateUtils.isDateInPeriod(undefined, 'all')).toBe(true);
  });

  it('conserve les dates inconnues dans l’historique sans inventer leur trimestre', () => {
    expect(DateUtils.isDateInPeriod('date inconnue', 'all')).toBe(true);
    expect(DateUtils.isDateInPeriod('date inconnue', 'q1')).toBe(false);
  });

  it('range les mois dans le bon trimestre', () => {
    expect(DateUtils.isDateInPeriod('15.02.2026', 'q1')).toBe(true);
    expect(DateUtils.isDateInPeriod('15.05.2026', 'q2')).toBe(true);
    expect(DateUtils.isDateInPeriod('15.08.2026', 'q3')).toBe(true);
    expect(DateUtils.isDateInPeriod('15.11.2026', 'q4')).toBe(true);
    expect(DateUtils.isDateInPeriod('15.05.2026', 'q1')).toBe(false);
  });

  it('suit l’horloge réelle pour « ce mois » et « le mois dernier »', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15)); // janvier : le mois d'avant change d'année
    expect(DateUtils.isDateInPeriod('05.01.2026', 'this-month')).toBe(true);
    expect(DateUtils.isDateInPeriod('05.12.2025', 'last-month')).toBe(true);
    expect(DateUtils.isDateInPeriod('05.11.2025', 'last-month')).toBe(false);
  });

  it('donne un libellé lisible à chaque période', () => {
    expect(DateUtils.getPeriodLabel('q3')).toContain('trimestre');
    expect(DateUtils.getPeriodLabel('all')).toContain('historique');
  });
});

const client = (over: Partial<Client> = {}): Client =>
  ({ id: 'C-1', name: 'Le Carnotzet Gourmand', status: 'Prospect', ...over }) as Client;

const sale = (over: Partial<Transaction> = {}): Transaction =>
  ({
    id: 'T-1',
    date: '10.06.2026',
    description: 'Vente 24 bouteilles',
    category: 'recettes',
    amountHT: 100,
    amountTTC: 108.1,
    tvaRate: 0.081,
    proofNotes: 'Le Carnotzet Gourmand',
    ...over
  }) as Transaction;

describe('Rattachement d’une vente à un client', () => {
  it('reconnaît le client cité dans la pièce', () => {
    expect(ClientStatsService.matchesClient(sale(), client())).toBe(true);
  });

  it('ignore une dépense, même si le nom y figure', () => {
    expect(
      ClientStatsService.matchesClient(sale({ category: 'brassage' }), client())
    ).toBe(false);
  });

  it('refuse un nom trop court pour être discriminant', () => {
    // « Le » apparaîtrait dans une écriture sur deux.
    expect(ClientStatsService.matchesClient(sale(), client({ name: 'Le' }))).toBe(false);
  });
});

describe('Statut du client, déduit des ventes', () => {
  it('sans commande, c’est un prospect', () => {
    expect(ClientStatsService.computeStatus(0, null)).toBe('Prospect');
  });

  it('trois commandes en font un fidèle', () => {
    expect(ClientStatsService.computeStatus(3, new Date())).toBe('Fidèle');
  });

  it('un client silencieux depuis plus de six mois redevient prospect', () => {
    const vieux = new Date(Date.now() - 250 * 24 * 3600 * 1000);
    expect(ClientStatsService.computeStatus(1, vieux)).toBe('Prospect');
  });

  it('une commande récente le garde actif', () => {
    const recent = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    expect(ClientStatsService.computeStatus(1, recent)).toBe('Actif');
  });
});

describe('Chiffres d’un client', () => {
  const txs = [
    sale({ id: 'T-1', date: '10.06.2026', amountTTC: 108.1 }),
    sale({ id: 'T-2', date: '02.09.2026', amountTTC: 54.05 }),
    sale({ id: 'T-3', proofNotes: 'Brau-Rauchshop', amountTTC: 999 })
  ];

  it('ne totalise que ses propres ventes', () => {
    const s = ClientStatsService.forClient(client(), txs);
    expect(s.orderCount).toBe(2);
    expect(s.totalSales).toBe(162.15);
  });

  it('retient la dernière commande, pas la dernière saisie', () => {
    const s = ClientStatsService.forClient(client(), txs);
    expect(s.lastOrder).toBe('02.09.2026');
  });

  it('calcule tous les clients en une passe', () => {
    const map = ClientStatsService.forAll([client(), client({ id: 'C-2', name: 'Bar du Pont' })], txs);
    expect(map.get('C-1')?.orderCount).toBe(2);
    expect(map.get('C-2')?.orderCount).toBe(0);
    expect(map.get('C-2')?.status).toBe('Prospect');
  });
});
