// @vitest-environment jsdom
/**
 * Voie u2, constat 27 (jeu en ligne du 16.11) : un projet de matériel se supprime (confirmation) ;
 * « Archiver » demande confirmation et se défait (« Reprendre ce projet »). Services simulés : aucune donnée réelle.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const etat = vi.hoisted(() => ({ saveUpgrade: vi.fn(), deletePlan: vi.fn() }));
vi.mock('../../src/services/storage', () => ({ StorageService: { getTransactions: () => [], getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [] }), getConfig: () => ({ fiscal: { isTvaRegistered: false } }) } }));
vi.mock('../../src/services/financeService', () => ({ FinanceService: { getPayments: () => [], getPlans: () => [], saveUpgrade: (...a: unknown[]) => etat.saveUpgrade(...a) } }));
vi.mock('../../src/ui/finance/prevision/supprimerPlan', () => ({ supprimerPlan: (...a: unknown[]) => etat.deletePlan(...a) }));
vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: (read: () => unknown) => read() }));
import { UpgradeSheet } from '../../src/ui/finance/UpgradeSheet';
import type { FinancialPlan } from '../../src/domain/finance/types';

const projet = (status: FinancialPlan['status']): FinancialPlan => ({ id: 'UPGRADE-ZZ', title: 'ZZ TEST - Projet materiel', date: '2026-12-01', amountCents: 11_000, direction: 'out', category: 'materiel', source: 'equipment', status, createdAt: '2026-11-16T00:00:00Z',
  upgrade: { version: 1, timing: 'later', stage: 'ready', budgetKnown: true, datePrecision: 'month', estimateSource: 'estimate', purchaseCents: 10_000, deliveryCents: 1_000 } });
beforeEach(() => { cleanup(); etat.saveUpgrade.mockReset(); etat.deletePlan.mockReset(); etat.saveUpgrade.mockResolvedValue(undefined); });
afterEach(cleanup);

describe('27 : Archiver demande confirmation et se défait', () => {
  it('« Archiver » seul n’archive rien : il demande, « Garder » referme la question', () => {
    const fermer = vi.fn();
    render(<UpgradeSheet plan={projet('active')} onClose={fermer} />);
    fireEvent.click(screen.getByRole('button', { name: 'Archiver ce projet' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('ZZ TEST - Projet materiel');
    expect(etat.saveUpgrade).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Garder' }));
    expect(etat.saveUpgrade).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(fermer).not.toHaveBeenCalled();
  });
  it('confirmé : le projet passe à « cancelled » (rien n’est supprimé)', async () => {
    render(<UpgradeSheet plan={projet('active')} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Archiver ce projet' }));
    fireEvent.click(screen.getByRole('button', { name: 'Oui, archiver' }));
    await waitFor(() => expect(etat.saveUpgrade).toHaveBeenCalledWith(expect.objectContaining({ id: 'UPGRADE-ZZ', status: 'cancelled' })));
    expect(etat.deletePlan).not.toHaveBeenCalled();
  });
  it('un projet archivé se reprend d’un geste, sans confirmation (le défaire)', async () => {
    render(<UpgradeSheet plan={projet('cancelled')} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Reprendre ce projet/ }));
    await waitFor(() => expect(etat.saveUpgrade).toHaveBeenCalledWith(expect.objectContaining({ status: 'draft' })));
  });
});

describe('27 : supprimer un projet de matériel', () => {
  it('un nouveau projet n’offre pas « Supprimer »', () => {
    render(<UpgradeSheet onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: /Supprimer/ })).toBeNull();
  });
  it('à venir ou archivé, le projet offre « Supprimer » ; confirmation, « Garder » ne retire rien', () => {
    for (const status of ['draft', 'active', 'cancelled'] as const) {
      cleanup();
      render(<UpgradeSheet plan={projet(status)} onClose={() => {}} />);
      fireEvent.click(screen.getByRole('button', { name: 'Supprimer ce projet' }));
      expect(screen.getByRole('alertdialog')).toHaveTextContent('Supprimer');
      fireEvent.click(screen.getByRole('button', { name: 'Garder' }));
      expect(etat.deletePlan).not.toHaveBeenCalled();
    }
  });
  it('confirmée : le service supprime ce projet, la feuille se ferme', async () => {
    const fermer = vi.fn();
    render(<UpgradeSheet plan={projet('draft')} onClose={fermer} />);
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer ce projet' }));
    fireEvent.click(screen.getByRole('button', { name: 'Oui, supprimer' }));
    await waitFor(() => expect(etat.deletePlan).toHaveBeenCalledWith('UPGRADE-ZZ'));
    await waitFor(() => expect(fermer).toHaveBeenCalled());
    expect(etat.saveUpgrade).not.toHaveBeenCalled();
  });
  it('refus du service (achats liés) : le message s’affiche, rien ne se ferme', async () => {
    etat.deletePlan.mockImplementation(() => { throw new Error('Des pièces sont liées à ce projet : archive-le plutôt.'); });
    const fermer = vi.fn();
    render(<UpgradeSheet plan={projet('draft')} onClose={fermer} />);
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer ce projet' }));
    fireEvent.click(screen.getByRole('button', { name: 'Oui, supprimer' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('archive-le plutôt');
    expect(fermer).not.toHaveBeenCalled();
  });
});
