// @vitest-environment jsdom
/**
 * Lot fin, tour 2 (19.11) : FIN-DEUX-PERIODES, FIN-FRISE-AGRANDIR, FIN-PERIODE-PERDUE, neuf n° 5 (« du août »), exercice effacé par l'en-tête.
 * Fixtures « ZZ TEST », services simulés, aucun réseau, aucun Gemini.
 */
import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
vi.mock('recharts', () => ({ ResponsiveContainer: () => null, AreaChart: () => null, Area: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null, CartesianGrid: () => null }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
import type { Transaction } from '../../src/types';
import { serialiser, type Periode } from '../../src/components/periode/periode';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinancesTab, journalApresEntete } from '../../src/components/tabs/FinancesTab';
import { Frise } from '../../src/ui/finance/operations/Frise';
import { de } from '../../src/ui/finance/financeFormat';
import type { Plage } from '../../src/ui/finance/operations/plage';

/* jsdom n'a pas PointerEvent : sans lui, clientX se perd. */
if (!(window as any).PointerEvent) {
  (window as any).PointerEvent = class extends MouseEvent { pointerId: number; constructor(t: string, p: any = {}) { super(t, p); this.pointerId = p.pointerId ?? 1; } };
}

const tx = (id: string, description: string, francs: number, category: string, date: string): Transaction => ({
  id, description, date, category: category as never, subcategory: '', amountHT: francs, amountTTC: francs, tvaAmount: 0, tvaRate: 0,
} as Transaction);
const JEU = [
  tx('ZZ-A', 'ZZ TEST — Étiquettes août', 80, 'divers', '12.08.2026'),
  tx('ZZ-S', 'ZZ TEST — Malt septembre', 40, 'brassage', '10.09.2026'),
  tx('ZZ-N', 'ZZ TEST — Joints novembre', 30, 'divers', '05.11.2026'),
];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-19T10:00:00'));
  localStorage.clear();
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

/** Le fil de l'App : une seule période, tenue par l'App, écrite et lue par Finances. */
function App2({ initiale, journal }: { initiale: Periode; journal: (p: Periode) => void }) {
  const [periode, setPeriode] = useState<Periode>(initiale);
  return <FinancesTab transactions={JEU} config={defaultConfig} budgetLines={[]} globalTimeFilter={periode} onChangeGlobalTimeFilter={p => { journal(p); setPeriode(p); }}/>;
}
const NOV: Periode = { genre: 'mois', annee: 2026, mois: 11 };

describe('FIN-DEUX-PERIODES : Opérations n’a qu’un choix de période, celui de l’en-tête', () => {
  it('dans la page d’Opérations, aucun élément ne se nomme « période » et aucun champ mois', () => {
    StorageService.setUiState('finances_workspace', 'journal');
    render(<App2 initiale={NOV} journal={vi.fn()}/>);
    const panneau = screen.getByRole('tabpanel');
    const nommes = [...panneau.querySelectorAll('[aria-label]')].map(e => e.getAttribute('aria-label') ?? '').filter(l => /période/i.test(l));
    expect(nommes).toEqual([]);
    expect(panneau.querySelector('input[type="month"]')).toBeNull();
    // la frise, acquise, reste : deux poignées
    expect(within(panneau).getAllByRole('slider').map(s => s.getAttribute('aria-label'))).toEqual(['Début', 'Fin']);
  });
});

describe('FIN-PERIODE-PERDUE : la période de la Synthèse (août → nov.) est gardée en ouvrant Opérations par une barre', () => {
  it('Synthèse août → nov., toucher la barre « Autres frais » : Opérations sur 1er août → 30 nov., filtré, la période de l’app inchangée', () => {
    StorageService.setUiState('finances_workspace', 'overview');
    const journal = vi.fn();
    render(<App2 initiale={NOV} journal={journal}/>);
    fireEvent.click(screen.getByRole('button', { name: 'Autre période' }));
    fireEvent.change(screen.getByLabelText('Du'), { target: { value: '2026-08-01' } });
    expect(serialiser(journal.mock.lastCall![0])).toBe('range-2026-08-01_2026-11-30');
    const avant = journal.mock.calls.length;
    const barre = screen.getAllByRole('button').find(b => /^Autres frais .*voir ces opérations d’août/.test(b.getAttribute('aria-label') ?? ''));
    expect(barre, 'barre « Autres frais » de la Synthèse').toBeTruthy();
    fireEvent.click(barre!);
    expect(screen.getByRole('tab', { name: 'Opérations' })).toHaveAttribute('aria-selected', 'true');
    // la période n'a pas été remise à « tout » ni au mois : aucun nouvel appel, ou le même
    for (const c of journal.mock.calls.slice(avant)) expect(serialiser(c[0])).toBe('range-2026-08-01_2026-11-30');
    const [debut, fin] = screen.getAllByRole('slider');
    expect(debut.getAttribute('aria-valuetext')).toMatch(/^1er août 2026/);
    expect(fin.getAttribute('aria-valuetext')).toMatch(/^30 nov\. 2026/);
    const texte = screen.getByRole('tabpanel').textContent ?? '';
    expect(texte).toMatch(/Étiquettes août/);
    expect(texte).toMatch(/Joints novembre/);
    expect(texte).not.toMatch(/Malt septembre/); // filtre « Autres frais » posé
    // ni les piles ni la bande ne se donnent pour un second choix de période (vu au banc 19.11 : « La période par catégorie »)
    const nommes = [...screen.getByRole('tabpanel').querySelectorAll('[aria-label]')].map(e => e.getAttribute('aria-label') ?? '').filter(l => /période/i.test(l));
    expect(nommes).toEqual([]);
  });
});

describe('Exercice ouvert : effacé quand l’en-tête change', () => {
  it('un état avec exercice perd son exercice ; sans exercice, rien ne change', () => {
    const avec = { year: '2025', allDates: true, scope: 'all' } as any;
    expect(journalApresEntete(avec)).toMatchObject({ year: '', allDates: false, scope: 'all' });
    const sans = { year: '', allDates: false } as any;
    expect(journalApresEntete(sans)).toBe(sans);
  });
});

describe('Neuf n° 5 : « d’août », jamais « du août »', () => {
  it('de / d’ : la préposition suit le mot', () => {
    expect(de('août – nov. 2026')).toBe('d’août – nov. 2026');
    expect(de('octobre 2026')).toBe('d’octobre 2026');
    expect(de('novembre 2026')).toBe('de novembre 2026');
  });
});

describe('FIN-FRISE-AGRANDIR : poignée tenue au bord', () => {
  function Banc({ log }: { log: (du: string, au: string) => void }) {
    const [plage, setPlage] = useState<Plage | null>(null);
    return <Frise mois="2026-11" plage={plage} aujourdhui="2026-11-19" jourMax="2027-11-19" nbOperations={5}
      donnees={{ periodeJour: () => { throw new Error('non appelé'); }, moisSaisi: () => false }}
      onPlage={(du, au) => { log(du, au); setPlage({ du, au }); }} onMois={() => setPlage(null)}/>;
  }
  const poser = () => {
    const log = vi.fn();
    const { container } = render(<Banc log={log}/>);
    const piste = container.querySelector('.ops-tr') as HTMLElement;
    vi.spyOn(piste, 'getBoundingClientRect').mockReturnValue({ left: 16, right: 374, width: 358, top: 100, bottom: 124, height: 24, x: 16, y: 100, toJSON: () => ({}) } as DOMRect);
    return { log, container };
  };
  beforeEach(() => { vi.useRealTimers(); vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] }); vi.setSystemTime(new Date('2026-11-19T10:00:00')); });

  it('R1 : un toucher sans glisser ne pose rien, ni sur un bord ni dans la piste', () => {
    const { log, container } = poser();
    const piste = container.querySelector('.ops-tr') as HTMLElement;
    for (const x of [16, 200, 370]) { fireEvent.pointerDown(piste, { clientX: x, pointerId: 1 }); fireEvent.pointerMove(piste, { clientX: x + 4, pointerId: 1 }); fireEvent.pointerUp(piste, { clientX: x + 4, pointerId: 1 }); }
    expect(log).not.toHaveBeenCalled();
  });

  it('R2 : saisi à 10 px du trait, le début suit le déplacement (36 px = 3 jours), sans saut à l’endroit touché', () => {
    const { log } = poser();
    const debut = screen.getByRole('slider', { name: 'Début' });
    fireEvent.pointerDown(debut, { clientX: 26, pointerId: 1 });
    fireEvent.pointerMove(debut, { clientX: 29, pointerId: 1 });
    expect(log).not.toHaveBeenCalled();
    fireEvent.pointerMove(debut, { clientX: 62, pointerId: 1 });
    fireEvent.pointerUp(debut, { clientX: 62, pointerId: 1 });
    expect(log).toHaveBeenLastCalledWith('2026-11-04', '2026-11-30');
  });

  it('R10 : Échap pendant le glisser rend la plage d’avant', () => {
    const { log } = poser();
    const debut = screen.getByRole('slider', { name: 'Début' });
    fireEvent.pointerDown(debut, { clientX: 16, pointerId: 1 });
    fireEvent.pointerMove(debut, { clientX: 120, pointerId: 1 });
    expect(log.mock.calls.at(-1)?.[0]).not.toBe('2026-11-01');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(log).toHaveBeenLastCalledWith('2026-11-01', '2026-11-30');
  });

  it('R7 : le début tenu au bord gauche, en allant vers lui, l’échelle se resserre ; la fin reste ; des semaines, jamais des années', () => {
    vi.useRealTimers(); vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    const { log } = poser();
    const debut = screen.getByRole('slider', { name: 'Début' });
    fireEvent.pointerDown(debut, { clientX: 30, pointerId: 1 });
    fireEvent.pointerMove(debut, { clientX: 40, pointerId: 1 });
    fireEvent.pointerMove(debut, { clientX: 22, pointerId: 1 });
    act(() => { vi.advanceTimersByTime(1000); });
    fireEvent.pointerUp(debut, { clientX: 22, pointerId: 1 });
    const [du, au] = log.mock.calls.at(-1)!;
    expect(au).toBe('2026-11-30');
    expect(du < '2026-10-25').toBe(true);
    expect(du >= '2026-06-01').toBe(true);
  });

  it('poignée tenue : la bulle dit la plage, la ligne « n jours · n opérations » est vide (aucun chiffre sous la bulle)', () => {
    const { container } = poser();
    const debut = screen.getByRole('slider', { name: 'Début' });
    fireEvent.pointerDown(debut, { clientX: 16, pointerId: 1 });
    fireEvent.pointerMove(debut, { clientX: 140, pointerId: 1 });
    expect(container.querySelector('.ops-bulle')?.textContent).toMatch(/→/);
    expect(container.querySelector('.ops-fr-rd')?.textContent).toBe('');
    fireEvent.pointerUp(debut, { clientX: 140, pointerId: 1 });
    expect(container.querySelector('.ops-fr-rd')?.textContent).toMatch(/jours · /);
  });
});
