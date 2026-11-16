// @vitest-environment jsdom
/**
 * Voie v1, constat 21 : « dans chaque feuille qui ouvre une prévision » le geste « Supprimer » avec confirmation.
 * La fiche d'un projet de matériel ouverte depuis une étiquette de Prévisions n'offrait que « Retirer » (état brouillon), « Déplacer » et « Ouvrir le projet ».
 * Services simulés : aucune donnée réelle.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const etat = vi.hoisted(() => ({ saveUpgrade: vi.fn(), supprimer: vi.fn() }));
vi.mock('../../src/services/financeService', () => ({ FinanceService: { saveUpgrade: (...a: unknown[]) => etat.saveUpgrade(...a) } }));
vi.mock('../../src/ui/finance/prevision/supprimerPlan', () => ({ supprimerPlan: (...a: unknown[]) => etat.supprimer(...a) }));
import { FicheProjet } from '../../src/ui/finance/previsions/FicheEtiquette';
import type { FinancialPlan } from '../../src/domain/finance/types';

const plan: FinancialPlan = { id: 'UPGRADE-ZZ', title: 'ZZ TEST - Projet materiel', date: '2026-12-01', amountCents: 11_000, direction: 'out', category: 'materiel', source: 'equipment', status: 'active', createdAt: '2026-11-01T00:00:00.000Z',
  upgrade: { version: 1, timing: 'later', stage: 'ready', budgetKnown: true, datePrecision: 'month', estimateSource: 'estimate', purchaseCents: 10_000, deliveryCents: 1_000 } } as FinancialPlan;
const mesure = { usureParAnCents: 2_200, litreAvant: null, litreApres: null, litreManque: 'aucun-brassin' as const, pointBas: null, soldeFinCents: null, bouteillesPourZero: null, bouteillesPourPayer: null, avertissements: [] };
const rendre = (onClose = vi.fn()) => render(<FicheProjet plan={plan} mesure={mesure} titreFin="Fin" prix="" onPrix={() => {}} onClose={onClose} onOuvrir={() => {}} />);
beforeEach(() => { cleanup(); etat.saveUpgrade.mockReset(); etat.supprimer.mockReset(); etat.saveUpgrade.mockResolvedValue(undefined); });
afterEach(cleanup);

describe('21 : la fiche d’un projet (Prévisions) se supprime', () => {
  it('« Supprimer » demande d’abord ; « Garder » ne retire rien', () => {
    const fermer = vi.fn();
    rendre(fermer);
    fireEvent.click(screen.getByRole('button', { name: /Supprimer/ }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('ZZ TEST - Projet materiel');
    expect(etat.supprimer).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Garder' }));
    expect(etat.supprimer).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(fermer).not.toHaveBeenCalled();
  });
  it('« Oui, supprimer » : le projet part et la fiche se ferme', async () => {
    const fermer = vi.fn();
    rendre(fermer);
    fireEvent.click(screen.getByRole('button', { name: /Supprimer/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Oui, supprimer' }));
    await waitFor(() => expect(etat.supprimer).toHaveBeenCalledWith('UPGRADE-ZZ'));
    expect(fermer).toHaveBeenCalled();
  });
  it('un refus du service se dit dans la question et la fiche reste ouverte', async () => {
    etat.supprimer.mockImplementation(() => { throw new Error('Des pièces sont liées.'); });
    const fermer = vi.fn();
    rendre(fermer);
    fireEvent.click(screen.getByRole('button', { name: /Supprimer/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Oui, supprimer' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Des pièces sont liées.');
    expect(fermer).not.toHaveBeenCalled();
  });
});
