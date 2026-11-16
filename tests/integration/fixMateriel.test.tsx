// @vitest-environment jsdom
/**
 * fix-materiel (jeu en ligne 16.11, constats 7, 8, 9, 27 et n° 5 de la critique ka4) : Atelier › Matériel.
 * 7 : la ligne sans prix d'À venir a son crayon et son « + mois » ; un « prochain achat » est toujours mis en avant.
 * 8 et 27 : un projet se supprime (feuille, confirmation sur place, achats liés gardés) ; Archiver demande une confirmation légère.
 * 9 : ouvrir un projet archivé ne boucle pas (nombre de rendus borné).
 * n° 5 : la feuille ne dit pas « Payé en » d'un mois qui n'est qu'une date prévue.
 * Données : fixtures simulées (ids ZZ), aucune donnée réelle, Gemini jamais.
 */
import React, { Profiler } from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null, ConfirmSheet: ({ open, title }: any) => open ? <div role="dialog" aria-label={title} /> : null }));
vi.mock('recharts', () => ({ ResponsiveContainer: () => null, AreaChart: () => null, Area: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null, CartesianGrid: () => null }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { FinanceService } from '../../src/services/financeService';
import { StorageService } from '../../src/services/storage';
import { UpgradeWorkspace } from '../../src/ui/finance/UpgradeWorkspace';
import { UpgradeSheet } from '../../src/ui/finance/UpgradeSheet';
import type { FinancialPlan } from '../../src/domain/finance/types';

const plan = (id: string, title: string, cents: number | null, status: FinancialPlan['status'], o: { date?: string; timing?: 'soon' | 'later'; stage?: 'idea' | 'research' | 'quote' | 'ready'; createdAt?: string } = {}): FinancialPlan => ({
  id, title, date: o.date ?? '', amountCents: cents ?? 0, direction: 'out', category: 'materiel', source: 'equipment', status, createdAt: o.createdAt ?? '2026-01-01T10:00:00.000Z',
  upgrade: { version: 1, timing: o.timing ?? 'later', stage: o.stage ?? 'idea', budgetKnown: cents != null, datePrecision: 'month', estimateSource: 'estimate', ...(cents != null ? { purchaseCents: cents } : {}) } });
const achatLie = (planId: string) => StorageService.addTransaction({ id: 'ZZ-T-ACHAT', description: 'ZZ Achat lié', date: '2026-02-10', category: 'materiel', subcategory: '', amountHT: 100, amountTTC: 100, tvaRate: 0, tvaAmount: 0,
  finance: { version: 1, kind: 'expense', amountCents: 10000, paymentStatus: 'paid', planId, lines: [{ id: 'ZZ-T-ACHAT-0', description: 'Achat', kind: 'equipment', quantity: 1, amountCents: 10000 }] } } as any);

beforeEach(() => { window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); });
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

describe('7 : À venir, la ligne sans prix et le prochain achat', () => {
  it('la ligne sans prix a son crayon et son « + mois », comme une ligne chiffrée', () => {
    FinanceService.savePlan(plan('ZZ-A', 'ZZ Armoire', 45000, 'draft', { timing: 'soon' }));
    FinanceService.savePlan(plan('ZZ-B', 'ZZ TEST - Matériel', null, 'draft'));
    render(<UpgradeWorkspace/>);
    expect(screen.getByRole('button', { name: 'Modifier ZZ TEST - Matériel' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Poser ZZ TEST - Matériel sur un mois' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Noter le prix : ZZ TEST - Matériel' })).toBeVisible(); // « à estimer » reste (maquette)
  });
  it('« + mois » d’une ligne sans prix pose le mois sans l’inclure dans les prévisions (le prix manque : rien n’est inventé)', async () => {
    FinanceService.savePlan(plan('ZZ-B', 'ZZ TEST - Matériel', null, 'draft'));
    FinanceService.savePlan(plan('ZZ-A', 'ZZ Armoire', 45000, 'draft', { timing: 'soon' }));
    render(<UpgradeWorkspace/>);
    fireEvent.click(screen.getByRole('button', { name: 'Poser ZZ TEST - Matériel sur un mois' }));
    const mois = within(screen.getByRole('group', { name: 'Poser ZZ TEST - Matériel sur un mois' })).getAllByRole('button')[1];
    fireEvent.click(mois);
    await waitFor(() => expect(FinanceService.getPlans().find(p => p.id === 'ZZ-B')?.date).toMatch(/^\d{4}-\d{2}-01$/));
    expect(FinanceService.getPlans().find(p => p.id === 'ZZ-B')).toMatchObject({ status: 'draft', amountCents: 0 });
  });
  it('quand des projets existent, le prochain achat est toujours en avant : aucun posé, aucun prix ni mois → le premier par ordre, « à estimer »', () => {
    FinanceService.savePlan(plan('ZZ-B', 'ZZ TEST - Matériel', null, 'draft', { timing: 'later' }));
    FinanceService.savePlan(plan('ZZ-E', 'ZZ 2e évier', null, 'draft', { timing: 'soon', stage: 'research' }));
    render(<UpgradeWorkspace/>);
    const hero = screen.getByRole('region', { name: 'Prochain achat' });
    expect(within(hero).getByText('ZZ 2e évier')).toBeVisible(); // bientôt avant plus tard
    expect(within(hero).getByText('à estimer')).toBeVisible();
    expect(within(hero).queryByText(/CHF TTC/)).not.toBeInTheDocument(); // jamais « 0 CHF »
    expect(within(hero).getByRole('button', { name: 'Modifier ZZ 2e évier' })).toBeVisible();
    // le héros n'est pas répété dans « Les suivants »
    expect(screen.getAllByText('ZZ 2e évier')).toHaveLength(1);
  });
});

describe('8 et 27 : supprimer un projet, confirmer l’archivage', () => {
  const ouvrirArchive = (nom: string) => {
    render(<UpgradeWorkspace/>);
    fireEvent.click(screen.getByRole('button', { name: 'Archives', exact: true }));
    fireEvent.click(screen.getByText(nom));
  };
  beforeEach(() => {
    FinanceService.savePlan(plan('ZZ-TEST-MATERIEL', 'ZZ TEST - Matériel', null, 'cancelled', { date: '2026-11-01' }));
    FinanceService.savePlan(plan('ZZ-MOULIN', 'ZZ Moulin', 65000, 'cancelled', { date: '2026-05-01', stage: 'research' }));
    achatLie('ZZ-TEST-MATERIEL');
  });
  it('la feuille d’un projet archivé propose « Supprimer ce projet » ; la confirmation est sur place, jamais confirm()', async () => {
    const confirmer = vi.spyOn(window, 'confirm').mockReturnValue(true);
    ouvrirArchive('ZZ TEST - Matériel');
    expect(screen.getByRole('dialog', { name: 'Mon projet de matériel' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer ce projet' }));
    const alerte = screen.getByRole('alertdialog');
    // fusion du 16.11 : la brique en ligne `Confirmation` (« Garder » · « Oui, supprimer »), notre texte sur les achats liés
    expect(alerte).toHaveTextContent('Supprimer « ZZ TEST - Matériel » ?');
    expect(alerte).toHaveTextContent('Ses achats liés restent dans les comptes.');
    expect(within(alerte).getByRole('button', { name: 'Garder' })).toBeVisible();
    expect(within(alerte).getByRole('button', { name: 'Garder' })).toHaveFocus();
    // rien n'est encore supprimé
    expect(FinanceService.getPlans().some(p => p.id === 'ZZ-TEST-MATERIEL')).toBe(true);
    fireEvent.click(within(alerte).getByRole('button', { name: 'Oui, supprimer' }));
    await waitFor(() => expect(FinanceService.getPlans().some(p => p.id === 'ZZ-TEST-MATERIEL')).toBe(false));
    expect(confirmer).not.toHaveBeenCalled();
    // les achats liés restent dans les comptes ; l'autre projet n'est pas touché
    expect(StorageService.getTransactions().some(t => t.id === 'ZZ-T-ACHAT')).toBe(true);
    expect(FinanceService.getPlans().some(p => p.id === 'ZZ-MOULIN')).toBe(true);
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Mon projet de matériel' })).not.toBeInTheDocument());
  });
  it('Garder (l’annulation) garde le projet', () => {
    ouvrirArchive('ZZ TEST - Matériel');
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer ce projet' }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Garder' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(FinanceService.getPlans().some(p => p.id === 'ZZ-TEST-MATERIEL')).toBe(true);
  });
  it('Archiver (feuille d’un projet à venir) demande une confirmation légère, puis archive', async () => {
    FinanceService.savePlan(plan('ZZ-VENIR', 'ZZ Évier', null, 'draft'));
    render(<UpgradeWorkspace/>);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier ZZ Évier' }));
    fireEvent.click(screen.getByRole('button', { name: 'Archiver ce projet' }));
    const alerte = screen.getByRole('alertdialog');
    expect(alerte).toHaveTextContent('Archiver « ZZ Évier » ?');
    expect(FinanceService.getPlans().find(p => p.id === 'ZZ-VENIR')?.status).toBe('draft');
    fireEvent.click(within(alerte).getByRole('button', { name: 'Oui, archiver' }));
    await waitFor(() => expect(FinanceService.getPlans().find(p => p.id === 'ZZ-VENIR')?.status).toBe('cancelled'));
  });
  it('un projet à venir se supprime depuis sa fiche, avec la même confirmation', async () => {
    FinanceService.savePlan(plan('ZZ-VENIR', 'ZZ Évier', null, 'draft'));
    render(<UpgradeWorkspace/>);
    fireEvent.click(screen.getByText('ZZ Évier'));
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    const alerte = screen.getByRole('alertdialog');
    expect(alerte).toHaveTextContent('Supprimer « ZZ Évier » ?');
    expect(alerte).toHaveTextContent('Ses achats liés restent dans les comptes.');
    fireEvent.click(within(alerte).getByRole('button', { name: 'Oui, supprimer' }));
    await waitFor(() => expect(FinanceService.getPlans().some(p => p.id === 'ZZ-VENIR')).toBe(false));
  });
  it('un projet né d’une ancienne idée de matériel se supprime pour de bon (l’idée d’origine ne le fait pas revenir)', () => {
    StorageService.addCreativeItem({ id: 'ZZ-IDEE', type: 'equipment', title: 'ZZ Idée de départ', status: 'research', createdAt: '2026-01-01' } as any);
    const ombre = FinanceService.getPlans().find(p => p.upgrade?.sourceCreativeItemId === 'ZZ-IDEE')!;
    expect(ombre).toBeTruthy();
    StorageService.deleteUpgradePlan(ombre);
    expect(FinanceService.getPlans().some(p => p.title === 'ZZ Idée de départ')).toBe(false);
    expect(StorageService.getCreativeItems().some(i => i.id === 'ZZ-IDEE')).toBe(false);
  });
});

describe('9 : ouvrir un projet archivé ne boucle pas', () => {
  it('l’ouverture depuis Archives se pose en peu de rendus (une boucle de rendu les ferait grimper)', async () => {
    FinanceService.savePlan(plan('ZZ-TEST-MATERIEL', 'ZZ TEST - Matériel', null, 'cancelled', { date: '2026-11-01' }));
    FinanceService.savePlan(plan('ZZ-MOULIN', 'ZZ Moulin', 65000, 'cancelled', { date: '2026-05-01', stage: 'research' }));
    for (let i = 0; i < 300; i++) StorageService.addTransaction({ id: `ZZ-GROS-${i}`, description: `ZZ ${i}`, date: '2026-03-10', category: 'materiel', subcategory: '', amountHT: 10, amountTTC: 10, tvaRate: 0, tvaAmount: 0,
      finance: { version: 1, kind: 'expense', amountCents: 1000, paymentStatus: 'paid', lines: [{ id: `ZZ-GROS-${i}-0`, description: 'x', kind: 'equipment', quantity: 1, amountCents: 1000 }] } } as any);
    let rendus = 0;
    render(<Profiler id="ws" onRender={() => { rendus += 1; }}><UpgradeWorkspace/></Profiler>);
    fireEvent.click(screen.getByRole('button', { name: 'Archives', exact: true }));
    const avant = rendus, t0 = performance.now();
    fireEvent.click(screen.getByText('ZZ TEST - Matériel'));
    await screen.findByRole('dialog', { name: 'Mon projet de matériel' });
    await new Promise(r => setTimeout(r, 300));
    expect(rendus - avant).toBeLessThan(12);
    expect(performance.now() - t0).toBeLessThan(3000);
  });
});

describe('n° 5 (critique ka4) : « Payé en » faux', () => {
  it('un projet sans aucun paiement ne dit pas « Payé en » : la date du projet est un mois prévu', () => {
    const projet = plan('ZZ-REFRAC', 'ZZ Réfractomètre', 4500, 'cancelled', { date: '2026-02-01', stage: 'idea' });
    render(<UpgradeSheet plan={projet} onClose={() => {}}/>);
    expect(screen.queryByText(/Payé en/)).not.toBeInTheDocument();
    expect(screen.getByText(/Prévu en févr\. 2026/)).toBeInTheDocument();
  });
});
