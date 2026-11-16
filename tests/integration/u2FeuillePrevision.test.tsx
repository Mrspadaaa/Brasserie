// @vitest-environment jsdom
/**
 * Voie u2, constat 21 (jeu en ligne du 16.11) : une prévision se supprime depuis sa feuille, avec confirmation, en plus de l'état « Annulée ».
 * Une nouvelle prévision n'a rien à supprimer. Services simulés : aucune donnée réelle.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
const etat = vi.hoisted(() => ({ savePlan: vi.fn(), deletePlan: vi.fn() }));
vi.mock('../../src/services/storage', () => ({ StorageService: { getTransactions: () => [], getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [] }), getBatches: () => [], subscribe: () => () => {} } }));
vi.mock('../../src/services/financeService', () => ({ FinanceService: { getPayments: () => [], getPlans: () => [], getProfile: () => ({ id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified' }), getAssets: () => [],
  savePlan: (...a: unknown[]) => etat.savePlan(...a) } }));
vi.mock('../../src/ui/finance/prevision/supprimerPlan', () => ({ supprimerPlan: (...a: unknown[]) => etat.deletePlan(...a) }));
vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: (read: () => unknown) => read() }));
import { PlanSheet } from '../../src/ui/finance/FinanceForms';
import type { FinancialPlan } from '../../src/domain/finance/types';

const plan: FinancialPlan = { id: 'PREV-ZZ', title: 'ZZ TEST — Prévision', date: '2026-11-20', amountCents: 700, direction: 'out', category: 'chargesFixes', source: 'manual', status: 'active', createdAt: '2026-11-16T00:00:00Z' };
beforeEach(() => { cleanup(); etat.savePlan.mockReset(); etat.deletePlan.mockReset(); });
afterEach(cleanup);
const feuille = (nom: string) => within(screen.getByRole('dialog', { name: nom }));

describe('21 : supprimer une prévision', () => {
  it('une prévision existante offre « Supprimer » ; une nouvelle, non', () => {
    const { unmount } = render(<PlanSheet onClose={() => {}} />);
    expect(feuille('Prévoir une dépense').queryByRole('button', { name: /Supprimer/ })).toBeNull();
    unmount();
    render(<PlanSheet plan={plan} onClose={() => {}} />);
    expect(feuille('Modifier la prévision').getByRole('button', { name: 'Supprimer cette prévision' })).toBeTruthy();
  });
  it('le geste demande confirmation ; « Garder » ne retire rien', () => {
    const fermer = vi.fn();
    render(<PlanSheet plan={plan} onClose={fermer} />);
    const d = feuille('Modifier la prévision');
    fireEvent.click(d.getByRole('button', { name: 'Supprimer cette prévision' }));
    expect(d.getByRole('alertdialog')).toHaveTextContent('ZZ TEST — Prévision');
    expect(etat.deletePlan).not.toHaveBeenCalled();
    fireEvent.click(d.getByRole('button', { name: 'Garder' }));
    expect(etat.deletePlan).not.toHaveBeenCalled();
    expect(d.queryByRole('alertdialog')).toBeNull();
    expect(fermer).not.toHaveBeenCalled();
  });
  it('confirmée : la prévision est supprimée par le service, la feuille se ferme', async () => {
    const fermer = vi.fn();
    render(<PlanSheet plan={plan} onClose={fermer} />);
    const d = feuille('Modifier la prévision');
    fireEvent.click(d.getByRole('button', { name: 'Supprimer cette prévision' }));
    fireEvent.click(d.getByRole('button', { name: 'Oui, supprimer' }));
    await vi.waitFor(() => expect(etat.deletePlan).toHaveBeenCalledWith('PREV-ZZ'));
    await vi.waitFor(() => expect(fermer).toHaveBeenCalled());
    expect(etat.savePlan).not.toHaveBeenCalled();
  });
  it('refus du service (une pièce est liée) : le message reste dans la feuille, rien ne se ferme', async () => {
    etat.deletePlan.mockImplementation(() => { throw new Error('Des pièces sont liées à cette prévision : elles ne se suppriment pas.'); });
    const fermer = vi.fn();
    render(<PlanSheet plan={plan} onClose={fermer} />);
    const d = feuille('Modifier la prévision');
    fireEvent.click(d.getByRole('button', { name: 'Supprimer cette prévision' }));
    fireEvent.click(d.getByRole('button', { name: 'Oui, supprimer' }));
    expect(await d.findByRole('alert')).toHaveTextContent('pièces sont liées');
    expect(fermer).not.toHaveBeenCalled();
  });
});
