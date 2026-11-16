// @vitest-environment jsdom
/**
 * Voie v1, constat 20 (rejeu de nuit 16.11) : une écriture annulée n'apparaît plus nulle part par défaut, ni dans la liste « Tout » (archives comprises),
 * ni dans la recherche (qui ouvre le journal en « Tout »), ni dans les totaux ; seulement par « Écritures annulées uniquement ».
 * Avant : « Tout » avec le filtre « Toutes » listait les annulées (« ZZ TEST — Apport 5,00 » restait dans la recherche « ZZ »).
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
import { TransactionJournal } from '../../src/ui/finance/TransactionJournal';
import { todayISO } from '../../src/domain/finance/ledger';
import type { Transaction } from '../../src/types';

const today = todayISO();
const piece = (id: string, description: string, voided = false): Transaction => ({
  id, description, date: today, category: 'apports', subcategory: '', amountHT: 5, amountTTC: 5, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: 'contribution', amountCents: 500, paymentStatus: 'paid', recordedAt: `${today}T12:00:00Z`, lines: [], ...(voided ? { voidedAt: `${today}T12:30:00Z` } : {}) },
});
const defaults = {
  payments: [], archives: [],
  renderRow: (t: Transaction) => <button>{t.description}</button>,
  onManageArchives: () => {}, onSale: () => {}, onPrivateMovement: () => {},
};
const vivante = piece('V', 'ZZ TEST — vivante'), annulee = piece('A', 'ZZ TEST — Apport', true);
afterEach(cleanup);

describe('20 : une écriture annulée n’apparaît plus nulle part par défaut', () => {
  it('liste du mois : absente', () => {
    render(<TransactionJournal {...defaults} transactions={[vivante, annulee]}/>);
    expect(screen.getByRole('button', { name: 'ZZ TEST — vivante' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'ZZ TEST — Apport' })).not.toBeInTheDocument();
  });

  it('recherche (demande arrivée d’ailleurs, portée « Tout ») : absente', () => {
    render(<TransactionJournal {...defaults} transactions={[vivante, annulee]} request={{ key: 'rech', query: 'ZZ' }}/>);
    expect(screen.getByRole('button', { name: 'ZZ TEST — vivante' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'ZZ TEST — Apport' })).not.toBeInTheDocument();
  });

  it('« Tout » : absente ; aucun groupe « Annulées » ni compte d’annulée', () => {
    render(<TransactionJournal {...defaults} transactions={[vivante, annulee]} request={{ key: 'tout', scope: 'all', allDates: true }}/>);
    expect(screen.queryByRole('button', { name: 'ZZ TEST — Apport' })).not.toBeInTheDocument();
    expect(screen.queryByText(/1 annulée/)).not.toBeInTheDocument();
  });

  it('seulement avec « Écritures annulées uniquement » : visible', () => {
    render(<TransactionJournal {...defaults} transactions={[vivante, annulee]} request={{ key: 'rech2', query: 'ZZ' }}/>);
    if (!screen.queryByRole('group', { name: 'État des opérations' })) fireEvent.click(screen.getByRole('button', { name: /^Filtres/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Écritures annulées uniquement' }));
    expect(screen.getByRole('button', { name: 'ZZ TEST — Apport' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'ZZ TEST — vivante' })).not.toBeInTheDocument();
  });
});
