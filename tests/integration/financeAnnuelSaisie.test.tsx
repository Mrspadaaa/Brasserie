/* BE-60 (banc du 08.11) : « 2,5 » tapé dans « Exercice » faisait tomber tout l'écran Finances › Annuel
   (buildAnnualReport lançait « Exercice invalide »). Une saisie invalide se refuse avec un message ; l'écran reste.
   La seconde moitié balaie les autres champs numériques de l'écran avec des virgules. */
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
vi.mock('recharts', () => ({ ResponsiveContainer: () => null, AreaChart: () => null, Area: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null, CartesianGrid: () => null }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';
import { parseFiscalYear } from '../../src/domain/finance/annual';
import { todayISO } from '../../src/domain/finance/ledger';

const read = () => StorageService.getTransactions();
function Workspace() { const transactions = useStorageValue(read); return <FinancesTab transactions={transactions} config={defaultConfig} budgetLines={[]} globalTimeFilter="all" onOpenQuickAction={() => {}} />; }
const THIS_YEAR = String(new Date().getFullYear());
beforeEach(() => { window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); StorageService.setUiState('finances_workspace', 'costs'); });
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });
/* g6 : « Exercice » vit dans la feuille « Année et versions », ouverte par le bouton « 2026 ⌄ » de la tête. */
const openAnnual = () => { render(<Workspace />); fireEvent.click(screen.getByRole('tab', { name: 'Annuel' })); fireEvent.click(screen.getByRole('button', { name: /^Année \d{4}/ })); return screen.getByRole('textbox', { name: 'Exercice' }); };
const anneeBouton = () => screen.getByRole('button', { name: /^Année \d{4}/ });
const piste = (n: number) => screen.getByRole('button', { name: new RegExp(`^${n}\\. `) });

describe('parseFiscalYear : un message, jamais une exception', () => {
  it.each(['2,5', '2.5', '', '  ', 'abc', '20', '20260', '-2026', '1899', '2201'])('refuse « %s » avec un message', text => {
    const r = parseFiscalYear(text);
    expect(r).toHaveProperty('error');
    expect((r as { error: string }).error.length).toBeGreaterThan(10);
  });
  it.each([['2026', 2026], [' 1900 ', 1900], ['2200', 2200]])('accepte « %s »', (text, year) => {
    expect(parseFiscalYear(text)).toEqual({ year });
  });
});

describe('Finances › Annuel : le champ Exercice', () => {
  it('« 2,5 » est refusé avec un message près du champ, l’écran reste et l’exercice ne change pas', () => {
    const field = openAnnual();
    expect(field).toHaveValue(THIS_YEAR);
    fireEvent.change(field, { target: { value: '2,5' } });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/2,5/);
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field.getAttribute('aria-describedby')).toBe(alert.id);
    expect(anneeBouton()).toBeVisible();
    fireEvent.blur(field);
    expect(field).toHaveValue(THIS_YEAR);
    expect(screen.getByRole('alert')).toHaveTextContent(/2,5/);
    expect(anneeBouton()).toBeVisible();
  });
  it('taper une année au clavier (2, 20, 202, 2025) ne casse rien en route et change l’exercice', () => {
    const field = openAnnual();
    for (const partial of ['2', '20', '202']) {
      fireEvent.change(field, { target: { value: partial } });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(anneeBouton()).toBeVisible();
    }
    fireEvent.change(field, { target: { value: '2025' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(field).toHaveValue('2025');
    expect(screen.getAllByText(/2025/).length).toBeGreaterThan(0);
  });
  it('une année hors bornes (1800) est refusée et le message dit les bornes', () => {
    const field = openAnnual();
    fireEvent.change(field, { target: { value: '1800' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/1900.*2200/);
    fireEvent.blur(field);
    expect(field).toHaveValue(THIS_YEAR);
  });
  it('vider le champ puis quitter rend l’exercice courant avec un message', () => {
    const field = openAnnual();
    fireEvent.change(field, { target: { value: '' } });
    fireEvent.blur(field);
    expect(field).toHaveValue(THIS_YEAR);
    expect(screen.getByRole('alert')).toBeVisible();
  });
  it('une saisie valide efface le message précédent', () => {
    const field = openAnnual();
    fireEvent.change(field, { target: { value: '2,5' } });
    expect(screen.getByRole('alert')).toBeVisible();
    fireEvent.change(field, { target: { value: '2024' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(anneeBouton()).toHaveTextContent('2024'); // la saisie valide change l'exercice : l'écran repart sur 2024, sans message
  });
});

describe('Finances › Annuel : une virgule dans les autres champs numériques ne fait rien tomber', () => {
  const SAISIES = ['2,5', ',', '2,5,3', '-', '1 234,50', '2.5.', 'abc', '99999999999999999999'];
  const sweep = (dialog: HTMLElement) => {
    const champs = within(dialog).queryAllByRole('textbox').filter(el => (el as HTMLInputElement).inputMode === 'decimal' || (el as HTMLInputElement).inputMode === 'numeric');
    for (const champ of champs) {
      for (const value of SAISIES) fireEvent.change(champ, { target: { value } });
      fireEvent.blur(champ);
    }
    return champs.length;
  };
  const ecranTient = () => expect(screen.queryByRole('button', { name: /^Année \d{4}/ }) ?? screen.getByRole('heading', { level: 3 })).toBeVisible();
  const allerAnnuel = () => { render(<Workspace />); fireEvent.click(screen.getByRole('tab', { name: 'Annuel' })); };
  /* g6 : chaque feuille s'ouvre depuis son étape (étape, bouton). */
  const feuilles: Array<[string, number, RegExp]> = [
    ['Solde d’ouverture', 2, /^Non, corriger/],
    ['Inventaires', 3, /^Noter l’inventaire/],
    ['Comptes et dettes', 5, /^Ajouter/],
    ['Parts privées', 6, /^Autre/],
    ['Vérifications de l’année', 7, /^Cocher ce que j’ai vu/]
  ];
  it.each(feuilles)('la feuille « %s »', (_nom, etape, bouton) => {
    FinanceService.saveProfile({ ...FinanceService.getProfile(), openingCash: { date: todayISO(), amountCents: 10000, confirmed: true } });
    allerAnnuel();
    fireEvent.click(piste(etape));
    fireEvent.click(screen.getByRole('button', { name: bouton }));
    const dialog = screen.getByRole('dialog');
    sweep(dialog);
    ecranTient();
    expect(screen.getByRole('dialog')).toBeVisible();
  });
  it('la feuille d’un matériel à amortir', () => {
    FinanceService.saveAsset({ id: 'CUVE', name: 'Cuve 30 L', category: 'tanks', acquisitionDate: todayISO(), inServiceDate: todayISO(), acquisitionCents: 50000, businessUsePct: 100, method: 'declining', ratePct: 20, openingYear: Number(THIS_YEAR), openingValueCents: 50000, openingConfirmed: false, firstYearFraction: 1 } as any);
    allerAnnuel();
    fireEvent.click(piste(4));
    fireEvent.click(screen.getByRole('button', { name: /Cuve 30 L/ }));
    const dialog = screen.getByRole('dialog', { name: 'Modifier l’amortissement' });
    expect(sweep(dialog)).toBeGreaterThan(2);
    ecranTient();
  });
});
