// @vitest-environment jsdom
/**
 * Constat 9 du jeu en ligne 16.11 : « Ouvrir un projet archivé gèle la page ~30 s ». Ce test chronomètre le chemin
 * « Archives › toucher une case › feuille du projet » à un volume de production simulé (ids ZZ, aucune donnée réelle) :
 * 3 000 écritures dont 1 500 achats liés à des projets, 200 projets archivés, 2 ans de paiements, des avoirs.
 * Seuil : l'ouverture (rendu synchrone de la feuille) tient sous 450 ms en jsdom (3× plus lent que Chrome) ; les rendus restent bornés.
 */
import React, { Profiler } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null, ConfirmSheet: ({ open, title }: any) => open ? <div role="dialog" aria-label={title} /> : null }));
vi.mock('recharts', () => ({ ResponsiveContainer: () => null, AreaChart: () => null, Area: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null, CartesianGrid: () => null }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { UpgradeWorkspace } from '../../src/ui/finance/UpgradeWorkspace';
import { upgradeProgress } from '../../src/domain/finance/upgrades';
import { StorageService } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';

const NB_PROJETS = 200, NB_TX = 3000, NB_LIES = 1500;
const mois = (i: number) => { const d = new Date(Date.UTC(2024, 0, 1 + (i % 700))); return d.toISOString().slice(0, 10); };

function seme() {
  for (let p = 0; p < NB_PROJETS; p++) FirestoreRepo.put('financialPlans', `ZZ-P${p}`, { id: `ZZ-P${p}`, title: `ZZ Projet ${p}`, date: `2026-0${(p % 9) + 1}-01`, amountCents: 20000 + p * 3700, direction: 'out', category: 'materiel', source: 'equipment', status: 'cancelled', createdAt: '2026-01-01T10:00:00.000Z',
    upgrade: { version: 1, timing: 'later', stage: 'research', budgetKnown: true, datePrecision: 'month', estimateSource: 'estimate', purchaseCents: 20000 + p * 3700 } });
  for (let i = 0; i < NB_TX; i++) {
    const lie = i < NB_LIES, avoir = lie && i % 10 === 9;
    FirestoreRepo.put('transactions', `ZZ-T${i}`, { id: `ZZ-T${i}`, description: `ZZ ${i}`, date: mois(i), category: 'materiel', subcategory: '', amountHT: 10, amountTTC: 10, tvaRate: 0, tvaAmount: 0,
      finance: { version: 1, kind: avoir ? 'refund' : 'expense', amountCents: 1000, paymentStatus: 'paid', ...(lie ? { planId: `ZZ-P${i % NB_PROJETS}` } : {}), ...(avoir ? { refundOfId: `ZZ-T${i - 1}`, refundDirection: 'in' } : {}),
        lines: [{ id: `ZZ-T${i}-0`, description: 'x', kind: 'equipment', quantity: 1, amountCents: 1000 }] } });
    FirestoreRepo.put('financialPayments', `ZZ-PAY${i}`, { id: `ZZ-PAY${i}`, transactionId: `ZZ-T${i}`, date: mois(i), amountCents: 1000, direction: avoir ? 'in' : 'out', method: 'bank' });
  }
}

beforeEach(() => { window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); });
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

describe('9 : ouvrir un projet archivé, à volume de production', () => {
  it('mesure le chemin Archives › feuille', async () => {
    seme();
    const t = (nom: string, f: () => void) => { const a = performance.now(); f(); return `${nom} ${Math.round(performance.now() - a)} ms`; };
    const tx = StorageService.getTransactions(), pay = FinanceService.getPayments(), plans = FinanceService.getPlans();
    const lignes: string[] = [];
    lignes.push(t('getTransactions+getPayments+getPlans', () => { StorageService.getTransactions(); FinanceService.getPayments(); FinanceService.getPlans(); }));
    lignes.push(t('upgradeProgress × 200 projets', () => { for (const p of plans) upgradeProgress(p, tx, pay); }));
    let rendus = 0;
    render(<Profiler id="ws" onRender={(_i, ph, d) => { rendus += 1; lignes.push(`[rendu ${ph} ${Math.round(d)}]`); }}><UpgradeWorkspace/></Profiler>);
    lignes.push(t('clic Archives (carte)', () => { fireEvent.click(screen.getByRole('button', { name: 'Archives', exact: true })); }));
    const avant = rendus;
    const a0 = performance.now(); lignes.push(t('clic case → feuille', () => { fireEvent.click(screen.getByText('ZZ Projet 5')); })); const msOuverture = performance.now() - a0;
    await screen.findByRole('dialog', { name: 'Mon projet de matériel' });
    await new Promise(r => setTimeout(r, 300));
    // eslint-disable-next-line no-console
    console.log(`VOLUME ${NB_TX} tx, ${NB_PROJETS} projets : ${lignes.join(' · ')} · rendus après clic ${rendus - avant}`);
    expect(rendus - avant).toBeLessThan(12);
    // la base mesurait 580 ms ici (jsdom, 3× plus lent que Chrome) : chaque rendu de l'atelier rejouait les 200 projets × 3 000 écritures
    expect(msOuverture).toBeLessThan(450);
  }, 120000);
});
