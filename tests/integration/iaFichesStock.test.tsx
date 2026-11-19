// @vitest-environment jsdom
/**
 * IA-COMPLETER-ABSENT (19.11) : « Pourquoi il y a pas la possibilité d'appeler l'autocomplete de l'agent IA ? »
 * Chaque fiche du stock incomplète (levure, malt, houblon) porte « Compléter avec l'IA » (le même AiAssist que le wizard), atteint
 * sans ouvrir de repli. Gemini jamais appelé : le callable `aiTask` est simulé ici ; rien n'est écrit avant « Reprendre ces valeurs ».
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const simule = vi.hoisted(() => ({ appel: vi.fn() }));
vi.mock('firebase/functions', () => ({ httpsCallable: () => simule.appel }));
vi.mock('../../src/services/firebase', () => ({ functions: {} }));
vi.mock('../../src/services/enrichissement', async orig => {
  const m = await orig<typeof import('../../src/services/enrichissement')>();
  return { ...m, champsASaisir: vi.fn(async () => []) };
});

import { StockDetailSheet } from '../../src/ui/StockDetailSheet';
import { art } from '../unit/depense/nom-b/aide';

const reponse = (data: Record<string, unknown>) => simule.appel.mockResolvedValue({ data: { ok: true, model: 'simule', tier: 'fast', data } });
const FICHES = {
  levure: { found: true, name: 'US-05 ZZ', source: 'Fermentis — fiche publiée (SIMULÉ)', sourceUrl: 'https://fermentis.com/fr/product/safale-us-05/', technicalFacts: [], lab: 'Fermentis', form: 'sèche', attenuationPct: 81, tempMinC: 18, tempMaxC: 26 },
  malt: { found: true, name: 'Pale ZZ', source: 'Malterie ZZ — fiche publiée (SIMULÉ)', colorEbc: 6, potentialPpg: 37 },
  houblon: { found: true, name: 'Citra ZZ', source: 'Fiche variété (SIMULÉ)', alphaPct: 12.5 }
};
const incomplete = {
  Levure: () => art('MP-3', 'US-05 ZZ', 'Levure', 'Stk'),
  Malt: () => art('MP-1', 'Pale ZZ', 'Malt', 'kg'),
  Houblon: () => art('MP-2', 'Citra ZZ', 'Houblon', 'g')
};
const ouvrir = (item: any, onSave = vi.fn()) => {
  render(<StockDetailSheet item={item} batches={[]} onClose={() => {}} onSave={onSave} onDelete={() => {}} onToggleFavorite={() => {}}/>);
  return onSave;
};
const actionneur = () => screen.queryByRole('button', { name: /Compléter avec l’IA/ });

beforeEach(() => { simule.appel.mockReset(); });
afterEach(cleanup);

describe('IA-COMPLETER-ABSENT : la fiche du stock offre « Compléter avec l’IA »', () => {
  it.each(['Levure', 'Malt', 'Houblon'] as const)('%s incomplète : l’actionneur est là, sans rien ouvrir, et rien ne part avant le clic', (categorie) => {
    ouvrir(incomplete[categorie]());
    expect(actionneur()).not.toBeNull();
    expect(simule.appel).not.toHaveBeenCalled();
  });

  it.each([
    ['Levure', 'levure', 'Atténuation (%)', '81'],
    ['Malt', 'malt', 'Couleur (EBC)', '6'],
    ['Houblon', 'houblon', 'Acide alpha (%)', '12,5']
  ] as const)('%s : un clic = un appel simulé ; rien écrit avant « Reprendre » ; puis le champ est rempli et « Enregistrer » le porte', async (categorie, kind, label, attendu) => {
    reponse(FICHES[kind]);
    const onSave = ouvrir(incomplete[categorie]());
    const champ = () => screen.getByLabelText(label) as HTMLInputElement;
    expect(champ().value).toBe('');
    fireEvent.click(actionneur()!);
    await screen.findByRole('button', { name: /Reprendre ces valeurs/ });
    expect(simule.appel).toHaveBeenCalledTimes(1);
    expect(simule.appel.mock.calls[0][0]).toMatchObject({ task: 'lookupIngredient', context: { kind } });
    expect(champ().value).toBe('');
    fireEvent.click(screen.getByRole('button', { name: /Reprendre ces valeurs/ }));
    await waitFor(() => expect(champ().value).toBe(attendu));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].technicalSource).toMatch(/SIMULÉ/);
  });

  it('une fiche complète n’offre pas l’actionneur', () => {
    ouvrir(art('MP-1', 'Pale ZZ', 'Malt', 'kg', { colorEbc: 6, potentialPpg: 37 }));
    expect(actionneur()).toBeNull();
    cleanup();
    ouvrir(art('MP-2', 'Citra ZZ', 'Houblon', 'g', { alphaPct: 12.5 }));
    expect(actionneur()).toBeNull();
    cleanup();
    ouvrir(art('MP-3', 'US-05 ZZ', 'Levure', 'Stk', { yeastLab: 'Fermentis', yeastAttenuationPct: 81, yeastTempMinC: 18, yeastTempMaxC: 26 }));
    expect(actionneur()).toBeNull();
  });

  it('une valeur déjà saisie par le brasseur n’est jamais écrasée : seul le trou est comblé', async () => {
    reponse(FICHES.levure);
    ouvrir(art('MP-3', 'US-05 ZZ', 'Levure', 'Stk', { yeastLab: 'Mon labo' }));
    fireEvent.click(actionneur()!);
    fireEvent.click(await screen.findByRole('button', { name: /Reprendre ces valeurs/ }));
    await waitFor(() => expect((screen.getByLabelText('Atténuation (%)') as HTMLInputElement).value).toBe('81'));
    expect((screen.getByLabelText('Laboratoire') as HTMLInputElement).value).toBe('Mon labo');
  });

  it('« Ignorer » n’écrit rien', async () => {
    reponse(FICHES.malt);
    ouvrir(incomplete.Malt());
    fireEvent.click(actionneur()!);
    fireEvent.click(await screen.findByRole('button', { name: 'Ignorer' }));
    expect((screen.getByLabelText('Couleur (EBC)') as HTMLInputElement).value).toBe('');
  });
});
