// @vitest-environment jsdom
/**
 * CRITIQUE-2 n° 24, ET-PER (E07, D-12, D-13, D-14, D-78, P5) : la période du calendrier EST la période de l'app. Le calendrier l'écrit
 * (`onPeriode`), l'App la tient (`globalTimeFilter`), Finances la lit : il affiche la plage (« 16 nov. → 27 déc. ») et ne liste dans
 * Opérations que les opérations de cette plage. Dans l'autre sens, une plage réglée dans Finances règle la fenêtre du calendrier.
 * Le harnais reprend le fil exact du bloc calendrier d'`App.tsx` (`onPeriode={(p) => setGlobalTimeFilter(p)}` ; Finances reçoit
 * `globalTimeFilter` et `onChangeGlobalTimeFilter`). Aucune donnée réelle : opérations de fixture, services simulés.
 */
import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('recharts', () => ({ ResponsiveContainer: () => null, AreaChart: () => null, Area: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null, CartesianGrid: () => null, BarChart: () => null, Bar: () => null, Cell: () => null, LineChart: () => null, Line: () => null, ReferenceLine: () => null, Legend: () => null, ComposedChart: () => null }));
import type { Transaction } from '../../src/types';
import { etiquetteCourte, type Periode } from '../../src/components/periode/periode';
import { CalendrierTab } from '../../src/components/tabs/CalendrierTab';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { ajouterJours, lundiDe, semainesDe } from '../../src/domain/calendrier';
import { fenetreDePeriode } from '../../src/ui/calendrier/entete/Fenetre';
import { todayISO } from '../../src/domain/finance/ledger';
import { titreJours } from '../../src/ui/finance/operations/plage';

const JOUR = todayISO();
const LUNDI = lundiDe(JOUR);
const suisse = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
const operation = (id: string, iso: string, description: string): Transaction => ({
  id, date: suisse(iso), description, amountHT: 120, tvaRate: 0, tvaAmount: 0, amountTTC: 120, category: 'divers', subcategory: ''
} as Transaction);
/* dans la plage du calendrier (6 semaines depuis ce lundi) : la veille de la fin de la première semaine, au plus aujourd'hui ; dehors : 60 jours avant */
const dedans = operation('T-DEDANS', JOUR, 'ZZ TEST — Malt dans la plage');
const dehors = operation('T-DEHORS', ajouterJours(LUNDI, -60), 'ZZ TEST — Houblon hors plage');

const propsCal = {
  transactions: [], batches: [], stockItems: [], onOpenBatch: vi.fn(), onOpenFinances: vi.fn(), onOpenAgenda: vi.fn(),
  onOpenCourses: vi.fn(), onPoserBrassin: vi.fn(), onPoserFete: vi.fn(), onPoserDepense: vi.fn()
};

/** Le fil de l'App : un seul état de période, écrit par le calendrier et par Finances, lu par les deux. */
function App2({ initiale, journal }: { initiale: Periode; journal: (p: Periode) => void }) {
  const [periode, setPeriode] = useState<Periode>(initiale);
  const regler = (p: Periode) => { journal(p); setPeriode(p); };
  return (
    <>
      <section data-onglet="calendrier"><CalendrierTab {...propsCal} aujourdhui={JOUR} periode={periode} onPeriode={regler} /></section>
      <section data-onglet="finances"><FinancesTab transactions={[dedans, dehors]} config={defaultConfig} budgetLines={[]} globalTimeFilter={periode} onChangeGlobalTimeFilter={regler} /></section>
    </>
  );
}

beforeEach(() => {
  localStorage.clear();
  StorageService.setUiState('finances_workspace', 'journal');
  for (const cle of ['calendrier_epingles', 'calendrier_etoiles', 'calendrier_masquees', 'calendrier_ordre']) StorageService.setUiState(cle, []);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const finances = () => within(document.querySelector('[data-onglet="finances"]') as HTMLElement);
const calendrier = () => document.querySelector('[data-onglet="calendrier"]') as HTMLElement;

describe('Décision pilote (c), CRITIQUE-7 : la période « mois » se lit dès aujourd’hui sur 4 semaines au moins', () => {
  const NOV: Periode = { genre: 'mois', annee: 2026, mois: 11 };
  const semaines = (f: { du: string; semaines: number } | null) => f && semainesDe(f.du, f.semaines).map(s => `S${s.numero}`);
  it('aujourd’hui 18 nov. 2026 : novembre → S47 à S50 (16 nov. – 13 déc.), le mois finit avant, la fenêtre déborde sur décembre', () => {
    const f = fenetreDePeriode(NOV, lundiDe('2026-11-18'), 52);
    expect(f).toEqual({ du: '2026-11-16', semaines: 4 });
    expect(semaines(f)).toEqual(['S47', 'S48', 'S49', 'S50']);
    expect(ajouterJours(f!.du, f!.semaines * 7 - 1)).toBe('2026-12-13');
  });
  it('aujourd’hui 2 nov. 2026 : novembre → S45 à S49 (le mois en a déjà 5)', () => {
    expect(semaines(fenetreDePeriode(NOV, lundiDe('2026-11-02'), 52))).toEqual(['S45', 'S46', 'S47', 'S48', 'S49']);
  });
  it('aujourd’hui 30 nov. 2026 : jamais une semaine seule, 4 semaines dès S49', () => {
    const f = fenetreDePeriode(NOV, lundiDe('2026-11-30'), 52);
    expect(f).toEqual({ du: '2026-11-30', semaines: 4 });
    expect(semaines(f)).toEqual(['S49', 'S50', 'S51', 'S52']);
  });
  it('une plage « du … au » courte n’est pas allongée (seul le mois l’est), et l’horizon borne toujours', () => {
    expect(fenetreDePeriode({ genre: 'dates', du: '2026-11-16', au: '2026-11-22' }, '2026-11-16', 52)).toEqual({ du: '2026-11-16', semaines: 1 });
    expect(fenetreDePeriode(NOV, '2026-11-30', 2)).toEqual({ du: '2026-11-30', semaines: 2 });
  });
});

describe('ET-PER : calendrier → Finances', () => {
  it('« 6 sem. » au calendrier : Finances affiche la plage et ne liste que l’opération de cette plage', async () => {
    const journal = vi.fn();
    render(<App2 initiale={{ genre: 'mois', annee: Number(JOUR.slice(0, 4)), mois: Number(JOUR.slice(5, 7)) }} journal={journal} />);
    /* au départ (le mois en cours, réglé par Finances) : la fenêtre du calendrier ne suit pas un mois, elle garde ses 6 semaines */
    fireEvent.click(calendrier().querySelector('[data-ent-periode]')!);
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Période et vue' })).getByRole('button', { name: /^6 sem/ }));
    const plage = { genre: 'dates', du: LUNDI, au: ajouterJours(LUNDI, 6 * 7 - 1) };
    expect(journal).toHaveBeenLastCalledWith(plage);
    const titre = titreJours({ du: plage.du, au: plage.au }, JOUR);
    await waitFor(() => expect(finances().getByLabelText(`Plage du ${titre}`)).toBeInTheDocument());
    expect(finances().getByLabelText('Du')).toHaveValue(plage.du);
    expect(finances().getByLabelText('Au')).toHaveValue(plage.au);
    await waitFor(() => expect(finances().getAllByText(/Malt dans la plage/).length).toBeGreaterThan(0));
    expect(finances().queryByRole('button', { name: /Houblon hors plage/ })).toBeNull();
    expect(document.querySelector('[data-onglet="finances"]')!.textContent).not.toMatch(/Houblon hors plage/);
  });
});

describe('CRITIQUE-4 n° 5 (D-14) : FinancesTab seul, monté sur une période « du … au » de l’app', () => {
  it('Opérations ne liste que l’opération de la plage, et la plage est celle du calendrier (3 mois)', async () => {
    const plage: Periode = { genre: 'dates', du: LUNDI, au: ajouterJours(LUNDI, 13 * 7 - 1) };
    const loin = operation('T-LOIN', ajouterJours(LUNDI, 13 * 7 + 3), 'ZZ TEST — Fût après la plage');
    render(<FinancesTab transactions={[dedans, dehors, loin]} config={defaultConfig} budgetLines={[]} globalTimeFilter={plage} onChangeGlobalTimeFilter={vi.fn()} />);
    expect(screen.getByLabelText('Du')).toHaveValue(plage.du);
    expect(screen.getByLabelText('Au')).toHaveValue(plage.au);
    await waitFor(() => expect(screen.getAllByText(/Malt dans la plage/).length).toBeGreaterThan(0));
    expect(document.body.textContent).not.toMatch(/Houblon hors plage/);
    expect(document.body.textContent).not.toMatch(/Fût après la plage/);
  });

  it('« 3 mois » au calendrier écrit la plage de 13 semaines que Finances affiche', async () => {
    const journal = vi.fn();
    render(<App2 initiale={{ genre: 'dates', du: LUNDI, au: ajouterJours(LUNDI, 6 * 7 - 1) }} journal={journal} />);
    fireEvent.click(calendrier().querySelector('[data-ent-periode]')!);
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Période et vue' })).getByRole('button', { name: /^3 mois/ }));
    const au = ajouterJours(LUNDI, 13 * 7 - 1);
    expect(journal).toHaveBeenLastCalledWith({ genre: 'dates', du: LUNDI, au });
    await waitFor(() => expect(finances().getByLabelText('Au')).toHaveValue(au));
    expect(calendrier().querySelector('[data-frise]')!.getAttribute('data-nb-colonnes')).toBe('13');
  });
});

describe('CRITIQUE-6 n° 11 (E07 ET-PER, D-12, D-13) : à 390, la barre de l’app et le calendrier disent la même période, dans les deux sens', () => {
  const MOIS: Periode = { genre: 'mois', annee: Number(JOUR.slice(0, 4)), mois: Number(JOUR.slice(5, 7)) };
  /* la fin du mois en cours, et son lundi : les semaines du mois dans l'horizon (de ce lundi au lundi de la dernière semaine du mois) */
  const finMois = (() => { const d = new Date(Date.UTC(MOIS.genre === 'mois' ? MOIS.annee : 0, MOIS.genre === 'mois' ? MOIS.mois : 0, 0)); return d.toISOString().slice(0, 10); })();
  /* décision pilote (c), CRITIQUE-7 : 4 semaines au moins dès aujourd'hui ; si le mois finit avant, la fenêtre déborde sur le suivant */
  const semainesDuMois = Math.max(4, Math.round((Date.parse(lundiDe(finMois)) - Date.parse(LUNDI)) / (7 * 86_400_000)) + 1);

  it('l’app sur le mois en cours : le calendrier montre les semaines de ce mois et son bouton dit le même libellé que la barre', async () => {
    const journal = vi.fn();
    render(<App2 initiale={MOIS} journal={journal} />);
    await waitFor(() => expect(calendrier().querySelector('[data-frise]')!.getAttribute('data-nb-colonnes')).toBe(String(semainesDuMois)));
    const bouton = calendrier().querySelector('[data-ent-periode]') as HTMLElement;
    expect(bouton.textContent).toContain(etiquetteCourte(MOIS));
    /* lire la période ne l'écrit pas : la barre garde « mois » */
    expect(journal).not.toHaveBeenCalled();
  });

  it('« 6 sem. » au calendrier : la barre de l’app reçoit la même plage, et le calendrier dit « 6 sem. »', async () => {
    const journal = vi.fn();
    render(<App2 initiale={MOIS} journal={journal} />);
    fireEvent.click(calendrier().querySelector('[data-ent-periode]')!);
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Période et vue' })).getByRole('button', { name: /^6 sem/ }));
    const plage: Periode = { genre: 'dates', du: LUNDI, au: ajouterJours(LUNDI, 6 * 7 - 1) };
    expect(journal).toHaveBeenLastCalledWith(plage);
    await waitFor(() => expect(calendrier().querySelector('[data-frise]')!.getAttribute('data-nb-colonnes')).toBe('6'));
    expect((calendrier().querySelector('[data-ent-periode]') as HTMLElement).textContent).toMatch(/6 sem\./);
    /* la barre de l'app lit la même période : son libellé est celui de cette plage */
    expect(etiquetteCourte(plage)).not.toBe(etiquetteCourte(MOIS));
  });
});

describe('ET-PER : Finances → calendrier', () => {
  it('une plage de 4 semaines tapée dans Opérations règle la fenêtre du calendrier (4 colonnes, depuis ce lundi)', async () => {
    const journal = vi.fn();
    const depart: Periode = { genre: 'dates', du: LUNDI, au: ajouterJours(LUNDI, 6 * 7 - 1) };
    render(<App2 initiale={depart} journal={journal} />);
    expect(calendrier().querySelector('[data-frise]')!.getAttribute('data-nb-colonnes')).toBe('6');
    const au = ajouterJours(LUNDI, 4 * 7 - 1);
    fireEvent.change(finances().getByLabelText('Au'), { target: { value: au } });
    await waitFor(() => expect(journal).toHaveBeenLastCalledWith({ genre: 'dates', du: LUNDI, au }));
    await waitFor(() => expect(calendrier().querySelector('[data-frise]')!.getAttribute('data-nb-colonnes')).toBe('4'));
  });
});
