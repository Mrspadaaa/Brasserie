/* Voie fx1 (10.11, « Tu termines les fix ? ») : palette de v6b en clair, puce IA calculée, outil d'analyse (Budget, Sources), plage de la Synthèse.
   Aucun réseau, aucun Gemini (BrewerChat est simulé). Les nombres de la cascade sont éprouvés dans tests/unit/fx1Analyse.test.ts. */
import React from 'react';
import { readFileSync } from 'node:fs';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
vi.mock('recharts', () => ({ ResponsiveContainer: () => null, AreaChart: () => null, Area: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null, CartesianGrid: () => null }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: ({ initialQuestion }: any) => <div role="dialog" aria-label="Compagnon">{initialQuestion}</div> }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';
import { FinanceAssistant } from '../../src/ui/finance/FinanceAssistant';
import { periodeSynthese } from '../../src/domain/finance/periodeSynthese';
import { budgetAnalyse, cascade, type EntreeAnalyse } from '../../src/domain/finance/analyse';
import { BudgetVue } from '../../src/ui/finance/analyse/Budget';
import { SourcesVue } from '../../src/ui/finance/analyse/Sources';
import { questionPoste } from '../../src/ui/finance/operations/assistant';
import type { Transaction } from '../../src/types';
import type { FinanceTransaction, FinancialPayment, FinancialProfile, TransactionFinance } from '../../src/domain/finance/types';

afterEach(cleanup);

/* ---------- 1. La palette de v6b, en clair seulement ---------- */
describe('fx1-1 : Opérations en clair prend la palette de v6b ; la cave garde ses jetons', () => {
  const css = readFileSync('src/ui/finance/operations.css', 'utf8');
  const bloc = (sel: string) => { const i = css.indexOf(sel); return i < 0 ? '' : css.slice(i, css.indexOf('}', i)); };
  const clair = bloc(":root:not([data-theme='cave']) .ops {");
  const dans = (b: string, jeton: string, rgb: string) => new RegExp(`--${jeton}:\\s*${rgb};`).test(b);
  it.each([
    ['c-9856d2', '152 86 210', 'Fixes violet'], ['c-56d27b', '86 210 123', 'Ventes vert vif'], ['c-d2b356', '210 179 86', 'Brassage or'],
    ['c-56c1d2', '86 193 210', 'Nettoyage cyan'], ['c-567bd2', '86 123 210', 'Matériel bleu'],
  ])('liseré et pile %s = %s (%s)', (jeton, rgb) => expect(dans(clair, jeton, rgb)).toBe(true));
  it.each([
    ['c-3f2556', '63 37 86'], ['c-255633', '37 86 51'], ['c-564925', '86 73 37'], ['c-254f56', '37 79 86'], ['c-253356', '37 51 86'],
    ['ct-d8b9f4', '216 185 244'], ['ct-b9f4ca', '185 244 202'], ['ct-f4e5b9', '244 229 185'], ['ct-b9ecf4', '185 236 244'], ['ct-b9caf4', '185 202 244'],
  ])('cercle plein : %s = %s (fond sombre, trait clair)', (jeton, rgb) => expect(dans(clair, jeton, rgb)).toBe(true));
  it('la palette est portée par la racine Opérations en clair et ne redéfinit rien en cave', () => {
    expect(clair.length).toBeGreaterThan(0);
    expect(/\[data-theme='cave'\]\s*\.ops\s*\{[^}]*--c-/.test(css)).toBe(false);
  });
  it('contraste : le trait de chaque cercle (clair) sur son fond (sombre) dépasse 4,5', () => {
    const lum = (s: string) => { const [r, g, b] = s.split(' ').map(Number).map(v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const rapport = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    for (const [fond, trait] of [['63 37 86', '216 185 244'], ['37 86 51', '185 244 202'], ['86 73 37', '244 229 185'], ['37 79 86', '185 236 244'], ['37 51 86', '185 202 244']]) expect(rapport(fond, trait)).toBeGreaterThan(4.5);
  });
});

/* ---------- 2. La puce IA pose la question calculée ---------- */
const tx = (id: string, description: string, cents: number, category: string, date: string, finance: Partial<TransactionFinance> = {}): Transaction => ({
  id, description, date, category: category as never, subcategory: '', amountHT: cents / 100, amountTTC: cents / 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: category === 'recettes' ? 'income' : 'expense', amountCents: cents, lines: [], paymentStatus: 'unpaid', ...finance },
}) as Transaction;
const periodeDe = (transactions: Transaction[]) => periodeSynthese({ transactions, payments: [], mois: '2026-11', aujourdhui: '2026-11-10' });

describe('fx1-2 : « ✦ Pourquoi <le poste le plus lourd> pèse autant ? »', () => {
  it('le plus gros poste des piles donne le libellé, accordé', () => {
    const p = periodeDe([tx('a', 'Loyer', 46800, 'chargesFixes', '2026-11-02'), tx('b', 'Malt', 18680, 'brassage', '2026-11-03'), tx('c', 'Vente', 72000, 'recettes', '2026-11-04')]);
    expect(questionPoste(p, 'le mois')!.libelle).toBe('Pourquoi les charges fixes pèsent autant ?');
    const q = periodeDe([tx('b', 'Malt', 18680, 'brassage', '2026-11-03'), tx('d', 'Soude', 4200, 'nettoyage', '2026-11-05')]);
    expect(questionPoste(q, 'le mois')!.libelle).toBe('Pourquoi le brassage pèse autant ?');
  });
  it('la question envoyée parle du même poste et de la période, et demande les données manquantes', () => {
    const p = periodeDe([tx('b', 'Malt', 18680, 'brassage', '2026-11-03')]);
    const { question } = questionPoste(p, 'le mois')!;
    expect(question).toMatch(/brassage/i); expect(question).toMatch(/le mois/); expect(question).toMatch(/manquant/);
  });
  it('sans poste (ni vente ni dépense, ou ventes seules) : rien, le libellé actuel reste', () => {
    expect(questionPoste(periodeDe([]), 'le mois')).toBeNull();
    expect(questionPoste(periodeDe([tx('c', 'Vente', 72000, 'recettes', '2026-11-04')]), 'le mois')).toBeNull();
  });
  it('FinanceAssistant : sans `pose`, le libellé actuel ; avec `pose`, la question calculée part au compagnon', () => {
    const { rerender } = render(<FinanceAssistant view="journal" month="2026-11" allDates={false} year={2026} horizon={90}/>);
    expect(screen.getByRole('button', { name: /Vérifier mes opérations/ })).toBeTruthy();
    rerender(<FinanceAssistant view="journal" month="2026-11" allDates={false} year={2026} horizon={90} pose={{ libelle: 'Pourquoi le brassage pèse autant ?', question: 'Q-calculée' }}/>);
    expect(screen.queryByText(/Vérifier mes opérations/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Pourquoi le brassage pèse autant \?/ }));
    expect(screen.getByRole('dialog', { name: 'Compagnon' }).textContent).toBe('Q-calculée');
  });
});

/* ---------- 3 et 4. L'outil d'analyse : Budget, Sources ---------- */
const AUJ = '2026-11-10';
const fx = (id: string, description: string, cents: number, category: string, date: string, finance: Partial<TransactionFinance> = {}): FinanceTransaction => tx(id, description, cents, category, date, { paymentStatus: 'paid', ...finance }) as FinanceTransaction;
const pai = (t: FinanceTransaction, direction: 'in' | 'out'): FinancialPayment => ({ id: `P-${t.id}`, transactionId: t.id, date: t.date as string, amountCents: t.finance!.amountCents, direction, method: 'bank', recordedAt: `${t.date}T10:00:00Z` });
const profil: FinancialProfile = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified', openingCash: { date: '2026-09-01', amountCents: 200000, confirmed: true } };
const vente = fx('V1', 'Café du Bourg', 72000, 'recettes', '2026-10-22'), loyer = fx('L1', 'Loyer', 40000, 'chargesFixes', '2026-10-25');
const apport = fx('A1', 'Apport du brasseur', 40000, 'apports', '2026-10-28', { kind: 'contribution' });
const elec = fx('E1', 'Électricité', 12000, 'chargesFixes', '2026-10-20', { paymentStatus: 'unpaid' });
const entree: EntreeAnalyse = { transactions: [vente, loyer, apport, elec], payments: [pai(vente, 'in'), pai(loyer, 'out'), pai(apport, 'in')], plans: [], profile: profil, aujourdhui: AUJ };
const plage = { du: '2026-10', au: '2026-11' };
const props = () => ({ duree: '30 jours', onJournal: vi.fn(), onTransaction: vi.fn(), onProfile: vi.fn(), onPrevisions: vi.fn() });

describe('fx1-3 : Budget — « Ventes » n\'est pas une dépense', () => {
  it('la liste des règles ne porte que des dépenses ; les entrées sont une ligne à part ; le dépensé ne change pas', () => {
    const b = budgetAnalyse(entree, plage);
    const p = props();
    const { container } = render(<BudgetVue {...p} b={b} pourquoi={null}/>);
    const regles = [...container.querySelectorAll('.ana-regles .ana-regle')].map(e => e.textContent);
    expect(regles.length).toBeGreaterThan(0);
    expect(regles.some(t => /^Ventes/.test(t ?? ''))).toBe(false);
    expect(regles.some(t => /^Charges fixes/.test(t ?? ''))).toBe(true);
    const entrees = screen.getByRole('button', { name: /^Entrées 720,00 CHF, rien de prévu/ });
    expect(entrees.textContent).toMatch(/entrées/i); expect(entrees.textContent).toContain('720,00');
    expect(container.querySelector('.ana-regles')!.contains(entrees)).toBe(false);
    expect(container.querySelector('.ana-gros')!.textContent).toContain(`${(b.depenseCents / 100).toFixed(2).replace('.', ',')}`);
    fireEvent.click(entrees);
    expect(p.onJournal).toHaveBeenCalledWith(expect.objectContaining({ category: 'recettes' }));
  });
  it('sans vente : pas de ligne d\'entrées', () => {
    const b = budgetAnalyse({ ...entree, transactions: [loyer], payments: [pai(loyer, 'out')] }, plage);
    render(<BudgetVue {...props()} b={b} pourquoi={null}/>);
    expect(screen.queryByRole('button', { name: /^Entrées/ })).toBeNull();
  });
});

describe('fx1-4 : Sources — deux lignes nommées, chacune avec son renvoi', () => {
  it('« apports privés » et « reste à payer » remplacent « Pas encore payé, apports »', () => {
    const c = cascade(entree, plage);
    const p = props();
    const { container } = render(<SourcesVue {...p} c={c} aujourdhui={AUJ} finJour={AUJ} pourquoi={null}/>);
    expect(container.textContent).not.toMatch(/Pas encore payé, apports/);
    const apports = screen.getByRole('listitem', { name: /^Apports privés \+400,00 CHF/ });
    const reste = screen.getByRole('listitem', { name: /^Reste à payer \+120,00 CHF/ });
    expect(within(apports).getByText('Apports privés')).toBeTruthy(); expect(within(reste).getByText('Reste à payer')).toBeTruthy();
    fireEvent.click(apports); expect(p.onJournal).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'apports', allDates: true }));
    fireEvent.click(reste); expect(p.onJournal).toHaveBeenLastCalledWith(expect.objectContaining({ filter: 'payable', allDates: true }));
  });
  it('un reste ou des apports à zéro ne font pas de ligne', () => {
    const c = cascade({ ...entree, transactions: [vente, loyer], payments: [pai(vente, 'in'), pai(loyer, 'out')] }, plage);
    render(<SourcesVue {...props()} c={c} aujourdhui={AUJ} finJour={AUJ} pourquoi={null}/>);
    expect(screen.queryByText('Apports privés')).toBeNull(); expect(screen.queryByText('Reste à payer')).toBeNull();
  });
});

/* ---------- Opérations : la puce, dans le vrai écran ; Synthèse : la plage ---------- */
const MOIS = ['2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];
function annee() {
  for (const m of MOIS) {
    for (const t of [tx(`V-${m}`, `Vente ${m}`, 10000, 'recettes', `${m}-04`), tx(`B-${m}`, `Malt ${m}`, 2500, 'brassage', `${m}-06`)]) {
      StorageService.addTransaction(t);
      FinanceService.recordPayment({ id: `PAI-${t.id}`, transactionId: t.id, date: t.date as string, amountCents: t.finance!.amountCents, direction: t.finance!.kind === 'income' ? 'in' : 'out', method: 'bank', recordedAt: `${t.date}T10:00:00Z` } as never);
    }
  }
}
const lire = () => StorageService.getTransactions();
function Ecran() { const transactions = useStorageValue(lire); return <FinancesTab transactions={transactions} config={defaultConfig} budgetLines={[]} globalTimeFilter="all" />; }

describe('fx1-2 et fx1-5 dans FinancesTab', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-09T10:00:00Z'));
    window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync();
    StorageService.setUiState('finances_workspace', 'overview');
  });
  afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.useRealTimers(); vi.restoreAllMocks(); });

  it('Opérations : la puce pose la question du poste le plus lourd du mois ; la Synthèse garde la sienne', () => {
    annee(); render(<Ecran/>);
    expect(screen.queryByRole('button', { name: /Pourquoi le brassage pèse autant/ })).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Opérations' }));
    fireEvent.click(screen.getByRole('button', { name: /Pourquoi le brassage pèse autant \?/ }));
    expect(screen.getByRole('dialog', { name: 'Compagnon' }).textContent).toMatch(/brassage/i);
    cleanup();
  });
  it('la plage du … au … survit à un changement d\'onglet', () => {
    annee(); render(<Ecran/>);
    fireEvent.click(screen.getByRole('button', { name: 'Autre période' }));
    fireEvent.change(screen.getByLabelText('Du mois'), { target: { value: '2026-06' } });
    expect(screen.getByRole('heading', { level: 2, name: 'Juin – nov. 2026' })).toBeVisible();
    fireEvent.click(screen.getByRole('tab', { name: 'Opérations' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Synthèse' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Juin – nov. 2026' })).toBeVisible();
    expect(within(screen.getByRole('group', { name: 'Période' })).getByRole('button', { name: 'Autre période' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('un mois touché après coup remplace la plage, aussi après le changement d\'onglet', () => {
    annee(); render(<Ecran/>);
    fireEvent.click(screen.getByRole('button', { name: 'Autre période' }));
    fireEvent.change(screen.getByLabelText('Du mois'), { target: { value: '2026-06' } });
    fireEvent.click(screen.getByRole('tab', { name: 'Opérations' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Synthèse' }));
    fireEvent.click(within(screen.getByRole('group', { name: 'Période' })).getByRole('button', { name: 'oct.' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Octobre' })).toBeVisible();
  });
});
