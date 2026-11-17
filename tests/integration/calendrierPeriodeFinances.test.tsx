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
import type { Periode } from '../../src/components/periode/periode';
import { CalendrierTab } from '../../src/components/tabs/CalendrierTab';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { ajouterJours, lundiDe } from '../../src/domain/calendrier';
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
