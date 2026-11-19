import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
import { TransactionJournal } from '../../src/ui/finance/TransactionJournal';
import { periodeSynthese } from '../../src/domain/finance/periodeSynthese';
import { todayISO } from '../../src/domain/finance/ledger';
import type { Transaction } from '../../src/types';
import type { FinancialPayment } from '../../src/domain/finance/types';

/**
 * FIN-BARRES-MORTES (19.11) : « SI je click sur les barre ici, ça n'a aucun effet... ».
 * Toucher une barre filtre la liste sur sa catégorie (le filtre « Catégorie » existant), la barre se marque ; un second toucher, ou le ×, rend tout.
 * Données simulées, aucune écriture.
 */
afterEach(cleanup);
const today = todayISO();
const achat = (id: string, description: string, category: Transaction['category'], cents: number): Transaction => ({
  id, description, date: today, category, subcategory: '', amountHT: cents / 100, amountTTC: cents / 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: 'expense', amountCents: cents, paymentStatus: 'paid', recordedAt: `${today}T08:00:00Z`, vendor: 'ZZ TEST', lines: [] },
});
const toutes = [
  achat('B1', 'ZZ TEST malts', 'brassage', 11_040),
  achat('N1', 'ZZ TEST masque gant', 'nettoyage', 2_300),
  achat('D1', 'ZZ TEST vêtements', 'divers', 13_200),
  achat('M1', 'ZZ TEST cuve', 'materiel', 550_000),
];
const paiements: FinancialPayment[] = toutes.map(t => ({ id: `PAY-${t.id}`, transactionId: t.id, date: today, amountCents: t.finance!.amountCents!, direction: 'out', method: 'bank', recordedAt: `${today}T09:00:00Z` }));
const Journal = () => <TransactionJournal transactions={toutes} payments={paiements} archives={[]} onManageArchives={() => {}} onPrivateMovement={() => {}}
  renderRow={t => <p key={t.id} data-testid="ligne">{t.description}</p>}/>;
const lignes = () => screen.queryAllByTestId('ligne').map(n => n.textContent);
const barre = (nom: RegExp) => screen.getByRole('button', { name: nom });

describe('FIN-BARRES-MORTES : toucher une barre filtre les opérations', () => {
  it('« Autres » ne laisse que les autres frais, se marque ; un second toucher rend tout', () => {
    render(<Journal/>);
    expect(lignes()).toHaveLength(4);
    fireEvent.click(barre(/^Autres/));
    expect(lignes()).toEqual(['ZZ TEST vêtements']);
    expect(barre(/^Autres/).getAttribute('aria-pressed')).toBe('true');
    expect(barre(/^Brassage/).getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(barre(/^Autres/));
    expect(lignes()).toHaveLength(4);
    expect(barre(/^Autres/).getAttribute('aria-pressed')).toBe('false');
  });
  it('« Matériel » ne laisse que l’investissement ; le × du filtre rend tout', () => {
    render(<Journal/>);
    fireEvent.click(barre(/^Matériel/));
    expect(lignes()).toEqual(['ZZ TEST cuve']);
    fireEvent.click(screen.getByRole('button', { name: /^Retirer le filtre/ }));
    expect(lignes()).toHaveLength(4);
  });
  it('passer d’une barre à l’autre change le filtre', () => {
    render(<Journal/>);
    fireEvent.click(barre(/^Brassage/));
    fireEvent.click(barre(/^Nettoyage/));
    expect(lignes()).toEqual(['ZZ TEST masque gant']);
  });
  it('Matériel à part : 5 500,00 n’entre pas dans « dépensé » (investissement, pas une charge)', () => {
    const p = periodeSynthese({ transactions: toutes, payments: paiements, mois: today.slice(0, 7), aujourdhui: today });
    expect(p.materielCents).toBe(550_000);
    expect(p.depenseCents).toBe(11_040 + 2_300 + 13_200);
  });
});
