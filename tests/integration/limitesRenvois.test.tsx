// @vitest-environment jsdom
/* CP-18 (10.11), voie rvB. Ses mots : « Pas de renvoi ???? » (Limites de cette prévision). Chaque limite devient une ligne-tâche « … › » qui ouvre sa cible :
   la pièce (date à corriger), la fiche du brassin (date de brassage), le coût du brassin (prix et frais à compléter), le journal filtré, la feuille du solde.
   Domaine : `buildForecast().avertissements` porte { texte, cible } À CÔTÉ des chaînes de `warnings`, qui ne changent pas. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/Sheet', async importOriginal => ({ ...(await importOriginal<typeof import('../../src/ui/Sheet')>()), Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { FinanceService } from '../../src/services/financeService';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';
import { buildForecast } from '../../src/domain/finance/forecast';
import type { Batch, Transaction } from '../../src/types';
import { ASOF, brassin, profil, recette, stocks } from './previsionsFixture';

const RECETTE_TTT = { ...recette(), name: 'Ttt', fermentables: [
  { name: 'Pilsner', weightKg: 5, kind: 'grain', use: 'empatage' }, { name: 'Pale', weightKg: 1, kind: 'grain', use: 'empatage' }, { name: 'Munich', weightKg: 1, kind: 'grain', use: 'empatage' }, { name: 'Cara', weightKg: 1, kind: 'grain', use: 'empatage' }] };
/** « Ttt » : brassage planifié le 08.09.2026 (déjà passé), quatre ingrédients sans prix, ni emballage ni énergie chiffrés. */
const ttt = (): Batch => brassin({ id: 'TTT', name: 'Ttt', plannedBrewDate: '08.09.2026', recipeSnapshot: { ...RECETTE_TTT, sourceRecipeId: 'R1', capturedAt: '2026-11-01T00:00:00Z' } as never });
/** « neipa v3 » : une date de brassage que personne ne sait lire. */
const neipa = (): Batch => brassin({ id: 'NEIPA', name: 'neipa v3', plannedBrewDate: 'demain ou après', brewDate: '' });
const lots = [ttt(), neipa()];
const SANS_DATE: Transaction = { id: 'T-SANS-DATE', date: '', description: 'bac malt + raccord bauhause', category: 'materiel', amountHT: 120, amountTTC: 120, type: 'expense',
  finance: { version: 1, kind: 'expense', amountCents: 12000, vendor: 'Quincaillerie', lines: [], paymentStatus: 'paid', recordedAt: '2026-11-01T10:00:00Z' } } as unknown as Transaction;

const read = () => StorageService.getTransactions();
function Ecran() {
  const transactions = useStorageValue(read);
  return <FinancesTab transactions={transactions} config={defaultConfig} budgetLines={[]} globalTimeFilter="all" batches={lots} stockItems={stocks()} />;
}
const laisser = () => act(async () => { await new Promise(r => setTimeout(r, 0)); });
function semer() {
  FinanceService.saveProfile({ ...FinanceService.getProfile(), ...profil() } as never);
  StorageService.addTransaction(SANS_DATE);
}
async function ouvrirLimites() {
  render(<Ecran />); fireEvent.click(screen.getByRole('tab', { name: 'Prévisions' })); await laisser();
  fireEvent.click(screen.getByRole('button', { name: /Limites \(\d+\)/ })); await laisser();
  return screen.getByRole('dialog', { name: 'Limites de cette prévision' });
}

describe('domaine : des avertissements structurés à côté des chaînes, chaînes inchangées', () => {
  const f = () => buildForecast({ transactions: [SANS_DATE], payments: [], plans: [], profile: profil(), asOf: ASOF, months: 13, batches: lots, stockItems: stocks() });
  it('chaque chaîne de limite qui renvoie quelque part porte une cible', () => {
    const r = f(), cible = (debut: RegExp) => r.avertissements.find(a => debut.test(a.texte));
    expect(r.warnings.join('\n')).toMatch(/Date à corriger : bac malt \+ raccord bauhause\./);
    expect(cible(/^Date à corriger : bac malt/)?.cible).toEqual({ kind: 'piece', txId: 'T-SANS-DATE' });
    expect(cible(/^neipa v3 : date de brassage illisible, aucune sortie prévue\.$/)?.cible).toEqual({ kind: 'brassin', batchId: 'NEIPA', rubrique: 'date' });
    expect(cible(/^Ttt : brassage planifié le 08\.09\.2026, déjà passé ; sorties ramenées à aujourd’hui\.$/)?.cible).toEqual({ kind: 'brassin', batchId: 'TTT', rubrique: 'date' });
    const complet = cible(/^Ttt : à compléter pour une prévision entière : /);
    expect(complet?.cible).toEqual({ kind: 'brassin', batchId: 'TTT', rubrique: 'cout' });
    expect(complet?.manque?.length).toBeGreaterThan(2);
    expect(complet?.detail).toMatch(/\d+ ingrédients sans prix/);
  });
  it('chaque avertissement structuré est une chaîne de `warnings` (rien d’inventé à côté)', () => {
    const r = f();
    for (const a of r.avertissements) if (!/^Solde de trésorerie|paiements? historiques?/.test(a.texte)) expect(r.warnings, a.texte).toContain(a.texte);
  });
});

describe('Finances › Prévisions › Limites de cette prévision : chaque limite est une ligne-tâche', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(`${ASOF}T10:00:00Z`));
    window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); StorageService.setUiState('finances_workspace', 'forecast');
  });
  afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.useRealTimers(); vi.restoreAllMocks(); });

  it('aucune puce de texte : date à corriger, date illisible, date passée et « à compléter » sont des boutons', async () => {
    semer(); const dlg = await ouvrirLimites(), w = within(dlg);
    for (const motif of [/bac malt \+ raccord bauhause/, /neipa v3/, /08\.09\.2026, déjà passé/, /sans prix/]) {
      const bouton = w.getAllByText(motif).map(n => n.closest('button')).find(Boolean);
      expect(bouton, `${motif} doit être dans un bouton`).toBeTruthy();
    }
    const puces = [...dlg.querySelectorAll('ul.finance-issues li')].filter(li => !li.querySelector('button'));
    for (const li of puces) expect(li.textContent, 'une puce sans renvoi ne dit pas un manque').toMatch(/non projetés/);
  });

  it('une longue liste d’ingrédients tient en « N ingrédients sans prix › » et la limite du brassin se range sous son nom', async () => {
    semer(); const dlg = await ouvrirLimites();
    expect(within(dlg).getByRole('button', { name: /4 ingrédients sans prix/ })).toBeVisible();
    expect(dlg.textContent).not.toMatch(/Pilsner, Pale, Munich, Cara/);
    const groupe = [...dlg.querySelectorAll('li')].find(li => li.querySelector('strong')?.textContent === 'Ttt');
    expect(groupe, 'Ttt porte deux limites : son nom une fois, ses limites dessous').toBeTruthy();
    expect(groupe!.querySelectorAll('button').length).toBeGreaterThanOrEqual(2);
  });

  it('la pièce sans date ouvre sa modification', async () => {
    semer(); const dlg = await ouvrirLimites();
    fireEvent.click(within(dlg).getByRole('button', { name: /bac malt \+ raccord bauhause/ })); await laisser();
    expect(screen.queryByRole('dialog', { name: 'Limites de cette prévision' })).toBeNull();
    expect([...document.querySelectorAll('input')].some(i => i.value === 'bac malt + raccord bauhause'), 'la modification de la pièce est ouverte').toBe(true);
  });

  it('la pièce sans échéance de la liste des sorties est un bouton qui ouvre sa pièce, et la limite aussi', async () => {
    semer();
    StorageService.addTransaction({ id: 'T-SANS-ECHEANCE', date: '2026-11-02', description: 'Facture atelier sans échéance', category: 'divers', amountHT: 80, amountTTC: 80, type: 'expense',
      finance: { version: 1, kind: 'expense', amountCents: 8000, vendor: 'Atelier', lines: [], paymentStatus: 'unpaid', recordedAt: '2026-11-02T10:00:00Z' } } as unknown as Transaction);
    const dlg = await ouvrirLimites();
    expect(within(dlg).getByRole('button', { name: /Facture atelier sans échéance/ })).toBeVisible();
    fireEvent.click(within(dlg).getByRole('button', { name: /Facture atelier sans échéance/ })); await laisser();
    expect([...document.querySelectorAll('input')].some(i => i.value === 'Facture atelier sans échéance')).toBe(true);
    cleanup(); FirestoreRepo.stopSync(); FirestoreRepo.startSync(); semer();
    StorageService.addTransaction({ id: 'T-SANS-ECHEANCE', date: '2026-11-02', description: 'Facture atelier sans échéance', category: 'divers', amountHT: 80, amountTTC: 80, type: 'expense',
      finance: { version: 1, kind: 'expense', amountCents: 8000, vendor: 'Atelier', lines: [], paymentStatus: 'unpaid', recordedAt: '2026-11-02T10:00:00Z' } } as unknown as Transaction);
    render(<Ecran />); fireEvent.click(screen.getByRole('tab', { name: 'Prévisions' })); await laisser();
    fireEvent.click(screen.getByRole('button', { name: /sorties?\b/i })); await laisser();
    const liste = screen.getByRole('dialog', { name: 'Sorties et entrées prévues' });
    fireEvent.click(within(liste).getByRole('button', { name: /Facture atelier sans échéance/ })); await laisser();
    expect([...document.querySelectorAll('input')].some(i => i.value === 'Facture atelier sans échéance')).toBe(true);
  });

  it('la date de brassage ouvre la fiche du brassin, « à compléter » ouvre son coût', { timeout: 30000 }, async () => {
    semer(); let dlg = await ouvrirLimites();
    fireEvent.click(within(dlg).getByRole('button', { name: /08\.09\.2026, déjà passé/ })); await laisser(); await laisser();
    expect(await screen.findByRole('dialog', { name: /Ttt/ }, { timeout: 15000 }), 'la fiche du brassin Ttt').toBeTruthy();
    expect(screen.queryByRole('dialog', { name: 'Limites de cette prévision' })).toBeNull();
    cleanup();
    FirestoreRepo.stopSync(); FirestoreRepo.startSync(); semer(); dlg = await ouvrirLimites();
    fireEvent.click(within(dlg).getByRole('button', { name: /4 ingrédients sans prix/ })); await laisser();
    expect(document.body.textContent).toMatch(/Budget|Coût|coût/);
    expect(screen.queryByRole('dialog', { name: 'Limites de cette prévision' })).toBeNull();
  });
});
