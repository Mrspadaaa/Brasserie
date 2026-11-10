/* Voie f2 (CP-1) : Prévisions dans les états de la vraie app (`?finance-demo=reel`) : sans solde de départ, deux achats partiels le même jour, une seule marche.
   Forme de p5b : une marche = une étiquette ; « ≥ » (au moins) à la place du « + » final ; le dessin n'a pas 500 px pour une marche. */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';
import { financeDemoEntries } from '../../src/dev/financeDemo';
import { groupesRecurrents } from '../../src/ui/finance/previsions/escalier';
import { hauteurEscalier, sortiesDuLot, texteEtiquette, texteLot } from '../../src/ui/finance/previsions/EscalierSvg';
import { ASOF } from './previsionsFixture';

const item = (p: Record<string, unknown>) => ({ id: 'x', date: '2026-11-09', label: 'Ssr · achats', amountCents: 240, direction: 'out', source: 'brew', category: 'brassage', ...p }) as never;
const reel = () => financeDemoEntries('reel').entries;
let LOTS: unknown[] = [], STOCKS: unknown[] = [];

const lire = () => StorageService.getTransactions();
function Ecran() {
  const transactions = useStorageValue(lire);
  return <FinancesTab transactions={transactions} config={defaultConfig} budgetLines={[]} globalTimeFilter="all" batches={LOTS as never} stockItems={STOCKS as never} />;
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(`${ASOF}T10:00:00Z`));
  window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); StorageService.setUiState('finances_workspace', 'forecast');
  const entrees = reel(); LOTS = entrees.filter(e => e.name === 'batches').map(e => e.data); STOCKS = entrees.filter(e => e.name === 'stockItems').map(e => e.data);
  for (const e of entrees) FirestoreRepo.put(e.name, e.id, e.data);
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('Prévisions p5b, états de la vraie app', () => {
  it('le texte d’un montant partiel dit « au moins » (≥), plus le « + » final', () => {
    expect(texteEtiquette(item({ partial: ['houblon'] }))).toBe('achats ≥ 2,40, 09.11');
    expect(texteEtiquette(item({}))).toBe('achats −2,40, 09.11');
  });
  it('deux achats du même jour : un seul lot, une étiquette, un total « au moins »', () => {
    const a = item({ id: 'a', partial: ['houblon'] }), b = item({ id: 'b', amountCents: 6400, partial: ['malt'] });
    expect(sortiesDuLot([a, b], null, groupesRecurrents([]))).toHaveLength(2);
    expect(texteLot([a, b])).toBe('achats ≥ 66,40 ×2, 09.11');
    expect(texteLot([a, item({ id: 'c', label: 'Loyer', source: 'recurring', amountCents: 40_000 })])).toBe('2 sorties ≥ 402,40, 09.11');
    expect(sortiesDuLot([a], null, groupesRecurrents([]))).toEqual([]);
  });
  it('la hauteur du dessin suit le nombre de marches (500 px à partir de 4)', () => {
    expect(hauteurEscalier(1)).toBeLessThan(400);
    expect(hauteurEscalier(2)).toBeLessThan(hauteurEscalier(3));
    expect(hauteurEscalier(4)).toBe(500);
    expect(hauteurEscalier(40)).toBe(500);
  });
  it('sans solde de départ : « à renseigner », écart seul, UNE étiquette pour les achats du jour, dessin plus court que 500 px', () => {
    render(<Ecran />);
    fireEvent.click(screen.getByRole('tab', { name: 'Prévisions' }));
    const tete = document.querySelector('.prv-tache-tete') as HTMLElement | null; // trois lignes ou plus : une ligne-tâche dépliable (fx2)
    if (tete) fireEvent.click(tete);
    expect(screen.getByText('Solde de départ à renseigner')).toBeVisible();
    const etiquettes = screen.getAllByRole('button').filter(b => /achats/i.test(b.getAttribute('aria-label') ?? ''));
    expect(etiquettes).toHaveLength(1);
    expect(etiquettes[0].getAttribute('aria-label')).toMatch(/2 sorties le \d\d\.\d\d : .*au moins/);
    expect(etiquettes[0].textContent).toMatch(/≥ [\d ,]+ ×2/);
    expect(etiquettes[0].textContent).not.toMatch(/\+,/);
    const svg = document.querySelector('svg.prv-svg')!;
    expect(Number(svg.getAttribute('height'))).toBeLessThan(500);
    expect(document.querySelector('.prv-partiel')).not.toBeNull();
    // toucher le lot ouvre la liste des sorties (chaque achat y a sa ligne)
    fireEvent.click(etiquettes[0]);
    expect(screen.getAllByText(/achats/i).length).toBeGreaterThan(1);
  });
});
