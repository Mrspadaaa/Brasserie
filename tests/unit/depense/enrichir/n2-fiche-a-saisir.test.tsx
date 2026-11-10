// @vitest-environment jsdom
/**
 * Voie n2 (mission parcours-complet) : la fiche de l'article dit « à saisir » près d'un champ utile que le travail de fiche a laissé vide (EN-2, EN-3),
 * « non reconnu » près du nom d'un produit sans fiche liée, et la plage d'atténuation publiée à côté du champ vide. Rien d'autre ne change.
 * `champsASaisir` est simulé (le calcul est testé dans n1-fiches.test.ts) ; Gemini n'est jamais appelé.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

const lecture = vi.hoisted(() => ({ manque: [] as string[] }));
vi.mock('../../../../src/services/enrichissement', async orig => {
  const m = await orig<typeof import('../../../../src/services/enrichissement')>();
  return { ...m, champsASaisir: vi.fn(async () => lecture.manque) };
});

import { StockDetailSheet } from '../../../../src/ui/StockDetailSheet';
import { art } from '../nom-b/aide';

beforeEach(() => { lecture.manque = []; });
afterEach(cleanup);
const ouvrir = (item: any) => render(<StockDetailSheet item={item} batches={[]} onClose={() => {}} onSave={() => {}} onDelete={() => {}} onCorrectInventory={() => {}} onToggleFavorite={() => {}}/>);
const champs = () => [...document.querySelectorAll('[data-a-saisir]')].map(e => e.getAttribute('data-a-saisir')).filter(c => c !== 'resume');
const motA = (sel: string) => waitFor(() => { const e = document.querySelector(sel); expect(e).not.toBeNull(); return e!; });
const lien = { id: 'beermaverick-nelson-sauvin', approchee: false, par: 'catalogue' };

describe('N2 — « à saisir » sur la fiche', () => {
  it('un malt non reconnu : « non reconnu » près du nom, « à saisir » sous EBC et PPG', async () => {
    lecture.manque = ['colorEbc', 'potentialPpg'];
    ouvrir(art('MP-1', 'Maris Otter ZZ', 'Malt', 'kg'));
    await screen.findByText('non reconnu');
    expect(champs()).toEqual(['colorEbc', 'potentialPpg']);
    const ebc = screen.getByLabelText('Couleur (EBC)').closest('div')!;
    expect(within(ebc).getByText('à saisir')).toBeInTheDocument();
  });

  it('« à saisir » est un mot : petit, couleur d’attente, sans paragraphe', async () => {
    lecture.manque = ['colorEbc'];
    ouvrir(art('MP-1', 'Maris Otter ZZ', 'Malt', 'kg'));
    const mot = await motA('[data-a-saisir="colorEbc"]');
    expect(mot.textContent).toBe('à saisir');
    expect(mot.className).toMatch(/text-xs/);
    expect(mot.className).toMatch(/text-attention/);
  });

  it('un houblon lié dont l’α est vide : « à saisir » sous l’α, pas « non reconnu »', async () => {
    lecture.manque = ['alphaPct'];
    ouvrir(art('MP-2', 'Nelson Sauvin', 'Houblon', 'g', { fiche: lien }));
    await waitFor(() => expect(champs()).toEqual(['alphaPct']));
    expect(screen.queryByText('non reconnu')).toBeNull();
  });

  it('un houblon lié avec son α (déduit) : rien à saisir, rien de plus qu’avant', async () => {
    lecture.manque = [];
    ouvrir(art('MP-2', 'Nelson Sauvin', 'Houblon', 'g', { alphaPct: 11.5, fiche: lien }));
    await Promise.resolve();
    expect(champs()).toEqual([]);
    expect(screen.queryByText('non reconnu')).toBeNull();
    expect(screen.queryByText(/à saisir/)).toBeNull();
  });

  it('une levure dont l’atténuation n’est publiée qu’en plage : « à saisir · 78–82 % publié », champ vide, rien d’inventé', async () => {
    lecture.manque = ['yeastAttenuationPct'];
    const technicalFacts = [{ key: 'attenuation', reported: '78-82%', origin: 'manufacturer', range: { min: 78, max: 82 }, unit: '%', qualifier: 'range', source: 'Fiche du banc' }];
    ouvrir(art('MP-3', 'US-05 ZZ', 'Levure', 'Stk', { yeastLab: 'Levures du Banc', yeastTempMinC: 18, yeastTempMaxC: 26, fiche: lien, yeastTechnicalFacts: technicalFacts }));
    const mot = await motA('[data-a-saisir="yeastAttenuationPct"]');
    expect(mot.textContent).toBe('à saisir · 78–82 % publié');
    expect(champs()).toEqual(['yeastAttenuationPct']);
    expect((screen.getByLabelText('Atténuation (%)') as HTMLInputElement).value).toBe('');
  });

  it('une atténuation vide sans plage publiée : « à saisir » seul', async () => {
    lecture.manque = ['yeastAttenuationPct'];
    ouvrir(art('MP-3', 'US-05 ZZ', 'Levure', 'Stk', { fiche: lien }));
    const mot = await motA('[data-a-saisir="yeastAttenuationPct"]');
    expect(mot.textContent).toBe('à saisir');
  });

  it('un champ tapé n’est plus « à saisir »', async () => {
    lecture.manque = ['colorEbc', 'potentialPpg'];
    ouvrir(art('MP-1', 'Maris Otter ZZ', 'Malt', 'kg'));
    await waitFor(() => expect(champs()).toEqual(['colorEbc', 'potentialPpg']));
    fireEvent.change(screen.getByLabelText('Couleur (EBC)'), { target: { value: '5' } });
    await waitFor(() => expect(champs()).toEqual(['potentialPpg']));
  });

  it('le résumé replié le dit aussi, et un article sans manque n’a aucun mot ajouté', async () => {
    lecture.manque = ['colorEbc'];
    ouvrir(art('MP-1', 'Maris Otter ZZ', 'Malt', 'kg'));
    await waitFor(() => expect(document.querySelector('summary [data-a-saisir="resume"]')).not.toBeNull());
    cleanup();
    lecture.manque = [];
    ouvrir(art('MP-4', 'Malt de Vienne', 'Malt', 'kg', { colorEbc: 7, potentialPpg: 36 }));
    await Promise.resolve();
    expect(document.querySelector('[data-a-saisir]')).toBeNull();
    expect(screen.queryByText('non reconnu')).toBeNull();
  });
});
