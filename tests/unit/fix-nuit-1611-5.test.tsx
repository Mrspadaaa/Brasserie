// @vitest-environment jsdom
// Nuit 16.11, constat 5 : le calendrier d1b montrait « cuve pleine » sur tous les jours quand un brassin en cuve n'a ni mise en bouteille datée
// ni plan de fermentation : 21 jours « pleins » sans le dire. Une fin inconnue se dit : « fin non datée » (jamais une date inventée).
// Fixtures FICTIVES (préfixe ZZ). Aujourd'hui = lun. 16.11.2026 ; la cuve : 30 L ; chaque brassin : 24 L.
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Batch, Recipe } from '../../src/types';

vi.mock('../../src/services/storage', () => ({
  StorageService: {
    getConfig: () => ({ brewhouses: [{ id: 'b', efficiencyPct: 75 }], activeBrewhouseId: 'b' }),
    getUiState: (_k: string, d: unknown) => d, setUiState: () => undefined, subscribe: () => () => undefined,
    getStocks: () => ({ rawMaterials: [], cleaning: [] })
  }
}));
import { FeuilleBrasser } from '../../src/ui/production/brasser/FeuilleBrasser';
import { etatCuve, evenements, occupations, raisonDe, type Contexte } from '../../src/ui/production/brasser/cuveModel';

afterEach(cleanup);

const NOW = new Date(2026, 10, 16, 10).getTime();
const J = (jour: number) => new Date(2026, 10, jour).getTime();
const lot = (id: string, nom: string, extra: Partial<Batch>): Batch => ({
  id, name: nom, style: 'x', brewDate: '', status: 'fermentation', volumeL: 24, gravityLog: [], recipeSnapshot: { name: nom }, ...extra
}) as unknown as Batch;
/** En cuve depuis le 02.11, sans bottlingDate ni plan de fermentation : sa fin est inconnue. */
const STOUT = lot('ZZ-031', 'ZZ Milk Stout', { brewDay: { pitchedAt: new Date(2026, 10, 2, 12).getTime() } as Batch['brewDay'] });
/** La Pils, elle, a une mise en bouteille datée (mar. 17). */
const PILS = lot('ZZ-017', 'ZZ Pils', { bottlingDate: '17.11.2026', brewDay: { pitchedAt: new Date(2026, 9, 27, 12).getTime() } as Batch['brewDay'] });
const ctx = (batches: Batch[]): Contexte => ({ occ: occupations(batches), evts: evenements(batches), capaciteL: 30, volumeL: 24, aujourdhui: J(16) });
const RECETTE = { id: 'r1', name: 'ZZ Blonde', style: 'Blonde', volumeL: 24, fermentables: [], hops: [], yeast: { name: 'ZZ US-05', qty: 1, unit: 'sachet' }, adjuncts: [] } as unknown as Recipe;
const feuille = (batches: Batch[]) => render(<FeuilleBrasser recipe={RECETTE} batches={batches} stock={[]} capaciteL={30} maintenant={NOW} onPlanifier={() => undefined} onAnnuler={() => undefined} />);

describe('constat 5 : « fin non datée » se dit', () => {
  it('modèle : pleine par un brassin sans fin datée -> finNonDatee ; pleine par un brassin daté -> non', () => {
    const sans = ctx([STOUT]);
    expect(etatCuve(sans.occ, J(30), 30, 24)).toMatchObject({ etat: 'pleine', finNonDatee: true });
    const date = ctx([PILS]);
    expect(etatCuve(date.occ, J(17), 30, 24)).toMatchObject({ etat: 'pleine', finNonDatee: false });
    expect(etatCuve(date.occ, J(18), 30, 24)).toMatchObject({ etat: 'libre', finNonDatee: false });
  });
  it('un jour plein par la Pils datée reste « daté » même si la Stout sans fin est aussi en cuve', () => {
    // Pils (24 L) + Stout (24 L) + 24 L > 30 L : pleine ; sans la Stout (24 + 24 > 30), elle serait encore pleine : le jour n'attend pas la Stout.
    expect(etatCuve(ctx([PILS, STOUT]).occ, J(17), 30, 24).finNonDatee).toBe(false);
    expect(etatCuve(ctx([PILS, STOUT]).occ, J(20), 30, 24).finNonDatee).toBe(true);
  });
  it('la phrase du jour dit que la fin n\'est pas datée, et garde « pas de mise en bouteille datée »', () => {
    const r = raisonDe(ctx([STOUT]), J(30));
    expect(r.gras).toBe('La cuve est pleine, sa fin n\'est pas datée');
    expect(r.reste).toContain('pas de mise en bouteille datée');
    expect(r.conflit).toBe(true);
  });
  it('la feuille : les cases s\'appellent « cuve pleine, fin non datée », la légende le dit', () => {
    feuille([STOUT]);
    expect(screen.getByRole('button', { name: /^lundi 30 novembre, cuve pleine, fin non datée/ })).toBeTruthy();
    const case30 = screen.getByRole('button', { name: /^lundi 30 novembre/ });
    expect(case30.getAttribute('data-fin')).toBe('non-datee');
    expect(document.querySelector('.d1b-cles')!.textContent).toContain('fin non datée');
    fireEvent.click(case30);
    expect(screen.getByRole('status').textContent).toContain('pas datée');
    // le jour reste touchable : la raison est dite, rien n'est bloqué
    expect((case30 as HTMLButtonElement).disabled).toBe(false);
  });
  it('une fin datée ne porte pas la mention', () => {
    feuille([PILS]);
    expect(screen.getByRole('button', { name: /^mardi 17 novembre, cuve pleine(?!, fin non datée)/ })).toBeTruthy();
    expect(document.querySelector('.d1b-cles')!.textContent).not.toContain('fin non datée');
  });
});
