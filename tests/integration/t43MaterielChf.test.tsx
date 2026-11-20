/**
 * T4-3 (en ligne, passe 5) : Stocks › Matériel › À venir, « Les suivants » : « 2 achats · 1 550 », « 350 », « 1 200 » sans CHF, sous
 * « 3 200 CHF TTC, au moins » (PCN-40 sur un autre écran). L'unité est dite partout où un montant l'est, comme sur la carte du prochain achat.
 * L'Atelier (maquette kh1r, D-41) ne change pas.
 */
import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { FinanceService } from '../../src/services/financeService';
import { UpgradeWorkspace } from '../../src/ui/finance/UpgradeWorkspace';
import type { FinancialPlan } from '../../src/domain/finance/types';

const plan = (id: string, title: string, cents: number | null, o: { timing?: 'soon' | 'later' } = {}): FinancialPlan => ({
  id, title, date: '', amountCents: cents ?? 0, direction: 'out', category: 'materiel', source: 'equipment', status: 'draft', createdAt: '2026-01-01T10:00:00.000Z',
  upgrade: { version: 1, timing: o.timing ?? 'later', stage: 'idea', budgetKnown: cents != null, datePrecision: 'month', estimateSource: 'estimate', ...(cents != null ? { purchaseCents: cents } : {}) } });

beforeEach(() => { window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); });
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

const monter = () => {
  FinanceService.savePlan(plan('ZZ-1', 'ZZ Frigo', 320000, { timing: 'soon' }));
  FinanceService.savePlan(plan('ZZ-2', 'ZZ Cuve', 35000));
  FinanceService.savePlan(plan('ZZ-3', 'ZZ Pompe', 120000));
};

describe('T4-3 : les suivants disent CHF', () => {
  it('Stocks › Matériel : le total « N achats · … » et chaque prix de ligne portent CHF', () => {
    monter();
    const { container } = render(<UpgradeWorkspace vue="future" onVue={() => {}}/>);
    const entete = container.querySelector('.kh-lt')!;
    expect(entete.textContent).toMatch(/2 achats · .*1\D?550 CHF/);
    const prix = [...container.querySelectorAll('.kh-r .kh-a')].map(e => (e.textContent ?? '').replace(/\s/g, ' '));
    expect(prix).toHaveLength(2);
    for (const t of prix) expect(t).toMatch(/\d CHF$/);
  });
  it('« au moins » reste devant le total quand un prix manque, avec l’unité', () => {
    monter();
    FinanceService.savePlan(plan('ZZ-4', 'ZZ Sans prix', null));
    const { container } = render(<UpgradeWorkspace vue="future" onVue={() => {}}/>);
    expect(container.querySelector('.kh-lt')!.textContent).toMatch(/au moins .*CHF/);
  });
  it('Atelier (sans vue) : la liste ne change pas, pas de CHF ajouté', () => {
    monter();
    const { container } = render(<UpgradeWorkspace/>);
    expect(container.querySelector('.kh-lt')!.textContent).not.toMatch(/CHF/);
    void screen; void within;
  });
});
