import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
import { TransactionJournal, createJournalState } from '../../src/ui/finance/TransactionJournal';
import { todayISO } from '../../src/domain/finance/ledger';
import { shiftMonth } from '../../src/ui/finance/financeFormat';
import type { Transaction } from '../../src/types';
import type { FinancialPayment } from '../../src/domain/finance/types';

/**
 * Opérations (v6b), 10.11 : « Pourquoi je peux pas changer de mois ? Je veux !! »
 * Le mois se change dans tous les périmètres (courantes, archives comprises) et depuis « Par date » ou un exercice.
 */
const today = todayISO();
const moisCourant = today.slice(0, 7);
const moisPrecedent = shiftMonth(moisCourant, -1);
const tx = (id: string, date: string, category: Transaction['category'] = 'brassage', extra: Partial<Transaction> = {}): Transaction => ({
  id, description: `Op ${id}`, date, category, subcategory: '', amountHT: 100, amountTTC: 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: category === 'recettes' ? 'income' : 'expense', amountCents: 10000, paymentStatus: 'unpaid', recordedAt: `${today}T12:00:00Z`, lines: [] },
  ...extra,
});
const pay = (t: Transaction): FinancialPayment => ({ id: `PAY-${t.id}`, transactionId: t.id, date: t.date, amountCents: 10000,
  direction: t.category === 'recettes' ? 'in' : 'out', method: 'bank', recordedAt: `${today}T12:00:00Z` });
const defaults = {
  archives: [], renderRow: (t: Transaction) => <button>{t.description}</button>,
  onManageArchives: () => {}, onPrivateMovement: () => {},
};
const ce = tx('CE-MOIS', `${moisCourant}-02`);
const avant = tx('MOIS-PRECEDENT', `${moisPrecedent}-10`, 'nettoyage');
const vente = tx('VENTE', `${moisCourant}-02`, 'recettes');
const payments = [pay(ce), pay(avant), pay(vente)];
const montre = (name: string) => !!screen.queryByRole('button', { name });
afterEach(cleanup);

describe('Opérations v6b : le mois se change partout', () => {
  it('archives comprises (périmètre « Tout ») : ‹ est actif et la liste passe au mois précédent', () => {
    render(<TransactionJournal {...defaults} transactions={[ce, avant]} payments={payments}
      state={createJournalState({ scope: 'all', allDates: false })} onStateChange={() => {}}/>);
    expect(screen.getByText('Archives comprises')).toBeVisible();
    const precedent = screen.getByRole('button', { name: 'Mois précédent' });
    expect(precedent).toBeEnabled();
    expect(montre('Op CE-MOIS')).toBe(true);
    expect(montre('Op MOIS-PRECEDENT')).toBe(false);
  });

  it('archives comprises : toucher ‹ change vraiment le mois (état contrôlé)', () => {
    const Hote = () => {
      const [etat, setEtat] = React.useState(() => createJournalState({ scope: 'all', allDates: false }));
      return <TransactionJournal {...defaults} transactions={[ce, avant]} payments={payments} state={etat} onStateChange={setEtat}/>;
    };
    render(<Hote/>);
    fireEvent.click(screen.getByRole('button', { name: 'Mois précédent' }));
    expect(montre('Op MOIS-PRECEDENT')).toBe(true);
    expect(montre('Op CE-MOIS')).toBe(false);
    expect((screen.getByLabelText('Période du journal') as HTMLInputElement).value).toBe(moisPrecedent);
  });

  it('archives comprises, mois affiché : le graphe du mois est rendu', () => {
    render(<TransactionJournal {...defaults} transactions={[ce, vente]} payments={payments}
      state={createJournalState({ scope: 'all', allDates: false })} onStateChange={() => {}}/>);
    expect(screen.getByRole('group', { name: 'Le mois par catégorie' })).toBeInTheDocument();
    expect(screen.getByLabelText('Payé, à payer et dépensé du mois')).toBeInTheDocument();
  });

  it('depuis « Par date », toucher ‹ revient au mois (précédent) et rend le graphe', () => {
    const Hote = () => {
      const [etat, setEtat] = React.useState(() => createJournalState({ allDates: true }));
      return <TransactionJournal {...defaults} transactions={[ce, avant]} payments={payments} state={etat} onStateChange={setEtat}/>;
    };
    render(<Hote/>);
    expect(montre('Op CE-MOIS') && montre('Op MOIS-PRECEDENT')).toBe(true);
    expect(screen.queryByRole('group', { name: 'Le mois par catégorie' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mois précédent' }));
    expect(montre('Op MOIS-PRECEDENT')).toBe(true);
    expect(montre('Op CE-MOIS')).toBe(false);
    expect(screen.getByRole('group', { name: 'Le mois par catégorie' })).toBeInTheDocument();
  });

  it('depuis un exercice (année), toucher ‹ revient au mois', () => {
    const Hote = () => {
      const [etat, setEtat] = React.useState(() => createJournalState({ year: moisCourant.slice(0, 4), allDates: true }));
      return <TransactionJournal {...defaults} transactions={[ce, avant]} payments={payments} state={etat} onStateChange={setEtat}/>;
    };
    render(<Hote/>);
    expect(screen.getByText(`Exercice ${moisCourant.slice(0, 4)}`)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Mois précédent' }));
    expect(screen.queryByText(/^Exercice /)).not.toBeInTheDocument();
    expect(montre('Op MOIS-PRECEDENT')).toBe(true);
    expect(montre('Op CE-MOIS')).toBe(false);
  });

  it('depuis un suivi (« À payer »), toucher ‹ sort du suivi et revient au mois', () => {
    const Hote = () => {
      const [etat, setEtat] = React.useState(() => createJournalState({ filter: 'payable' }));
      return <TransactionJournal {...defaults} transactions={[ce, avant]} payments={[pay(ce), pay(avant)]} state={etat} onStateChange={setEtat}/>;
    };
    render(<Hote/>);
    expect(screen.getByText('Tous les exercices')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Mois précédent' }));
    expect(screen.queryByText('Tous les exercices')).not.toBeInTheDocument();
    expect(montre('Op MOIS-PRECEDENT')).toBe(true);
    expect(montre('Op CE-MOIS')).toBe(false);
  });
});

describe('Opérations v6b : une pièce annulée n\'alourdit pas le mois', () => {
  const annulee = (id: string, category: Transaction['category']) => tx(id, `${moisCourant}-03`, category,
    { finance: { version: 1, kind: 'expense', amountCents: 10810, paymentStatus: 'unpaid', voidedAt: `${today}T12:00:00Z`, recordedAt: `${today}T12:00:00Z`, lines: [] } as any });

  it('un groupe dont tout est annulé ne montre pas un en-tête « 0,00 » au-dessus : elles se rangent dans un seul groupe « Annulées », en fin de liste, sans total', () => {
    const a1 = annulee('ANN-1', 'materiel'), a2 = annulee('ANN-2', 'materiel');
    const { container } = render(<TransactionJournal {...defaults} transactions={[ce, a1, a2]} payments={[pay(ce)]}
      state={createJournalState({ scope: 'all' })} onStateChange={() => {}}/>);
    // Aucun groupe « Matériel · à part » : rien d'actif à y compter.
    expect(container.querySelector('[data-groupe="part"]')).toBeNull();
    expect(container.querySelector('.ops-liste')!.textContent).not.toMatch(/(^|\D)0,00/);
    // Mais elles restent listées (rien n'est caché au brasseur).
    expect(montre('Op ANN-1')).toBe(true);
    expect(montre('Op ANN-2')).toBe(true);
    // Rangées dans un groupe « annulées » dont le sous-total est vide, pas un montant.
    const groupe = container.querySelector('[data-groupe="annulees"]');
    expect(groupe).not.toBeNull();
    expect(groupe!.querySelector('.ops-sub')?.textContent ?? '').toBe('');
  });

  it('une annulée quitte sa catégorie : le total de « Matériel · à part » ne compte que les écritures actives et elle paraît sous « Annulées »', () => {
    const actif = tx('MAT', `${moisCourant}-04`, 'materiel');
    const a1 = annulee('ANN-3', 'materiel');
    const { container } = render(<TransactionJournal {...defaults} transactions={[actif, a1]} payments={[pay(actif)]}
      state={createJournalState({ scope: 'all' })} onStateChange={() => {}}/>);
    const groupe = container.querySelector('[data-groupe="part"]');
    expect(groupe).not.toBeNull();
    expect(groupe!.querySelector('.ops-sub')?.textContent).toBe('100,00');
    expect(groupe!.textContent).not.toContain('Op ANN-3');
    expect(container.querySelector('[data-groupe="annulees"]')?.textContent).toContain('Op ANN-3');
  });
});
