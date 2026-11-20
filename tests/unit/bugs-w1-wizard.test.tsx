// @vitest-environment jsdom
// Voie w1 (bugs-ecrans, 20.11) : TL-7 (« Objectif NOLO » répété), TL-19 (brouillon repris, dit à l'écran), TE-27 (l'atelier Houblons V5.5
// n'est plus étalé), BK2-5 (section Additifs de l'assistant : épice en grammes). Un test par défaut, écrit avant le correctif (L13).
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { brewerJobs } from '../../src/services/brewerJobs';
import { recetteApercuIdentite } from '../../src/ui/identite/apercuDev';
import type { Recipe } from '../../src/types';
import { allerEtape } from '../helpers/wizard';
import { newNoloConfig } from '../../src/domain/nolo';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
beforeEach(() => { localStorage.clear(); });
afterEach(() => { cleanup(); brewerJobs.stop(); vi.restoreAllMocks(); vi.clearAllMocks(); });

const props = (over: Record<string, unknown> = {}) => ({
  localOnly: true, config: defaultConfig, stockItems: [], knownStyles: ['Pale Ale'], onClose: vi.fn(), onSave: vi.fn(), onCreateStockItem: vi.fn(),
  onLearnIngredient: vi.fn(), onSaveWaterSource: vi.fn(), ...over
});
const attendre = (ms = 250) => new Promise(r => setTimeout(r, ms));
const visible = (n: Element) => !n.closest('.sr-only');

describe('TL-19 : un brouillon repris se dit à l’écran', () => {
  it('« Brouillon repris sur cet appareil. » est lisible (pas seulement annoncé aux lecteurs d’écran)', async () => {
    const { unmount } = render(<BrewWizard {...props({ draftKey: 'ZZ:w1-tl19' })} />);
    fireEvent.change(screen.getByLabelText('Nom de la bière'), { target: { value: 'ZZ TEST — reprise' } });
    await attendre();
    unmount(); // le démontage écrit le brouillon
    render(<BrewWizard {...props({ draftKey: 'ZZ:w1-tl19' })} />);
    const phrase = await screen.findByText('Brouillon repris sur cet appareil.');
    expect(visible(phrase), 'la phrase est à l’écran').toBe(true);
  });
});

describe('TL-7 : un seul « Objectif NOLO » à l’écran', () => {
  it('le bloc complet n’est monté qu’à l’Identité ; Levure et Récap ne le répètent pas', async () => {
    render(<BrewWizard {...props()} />);
    fireEvent.click(screen.getByRole('switch', { name: /Objectif NOLO/ }));
    const blocs = () => document.querySelectorAll('section[aria-label="Objectif NOLO"]').length;
    expect(blocs(), 'Identité : le bloc est là (maquette r4-a)').toBe(1);
    allerEtape(/Levure/); await attendre();
    expect(blocs(), 'Levure').toBe(0);
    allerEtape(/^Récapitulatif$/); await attendre();
    expect(blocs(), 'Récap').toBe(0);
  }, 30000);
});

describe('TE-27 : l’étape Houblons n’étale plus l’atelier V5.5', () => {
  it('l’atelier (variétés « unknown », ID, COA) reste derrière un dépliant fermé', async () => {
    render(<BrewWizard {...props({ ownerKey: 'ZZ-w1', draftKey: 'ZZ-w1:REC-TE27', seed: { recipe: recetteApercuIdentite(), step: 'houblons' } })} />);
    await attendre(500);
    const atelier = document.querySelector('[data-role="atelier-houblons-v55"]') as HTMLDetailsElement | null;
    expect(atelier, 'l’atelier V5.5 a son dépliant').toBeTruthy();
    expect(atelier!.open, 'fermé au repos').toBe(false);
    const feuilles = [...document.querySelectorAll('*')].filter(n => n.children.length === 0 && /\bCOA\b|\bunknown\b/.test(n.textContent ?? ''));
    const etalees = feuilles.filter(n => !n.closest('details:not([open])'));
    expect(etalees.map(n => (n.textContent ?? '').slice(0, 60)), 'rien de l’atelier hors dépliant fermé').toEqual([]);
    expect(screen.getByText(/Mes ajouts de houblons/), 'les lignes de houblon restent en tête').toBeTruthy();
  }, 30000);
});

describe('BK2-5 : section Additifs de l’assistant', () => {
  const avecCoriandre = (): Recipe => {
    const r = recetteApercuIdentite();
    return { ...r, fermentables: [...(r.fermentables ?? []), { name: 'Coriandre', kind: 'grain', use: 'empatage', weightKg: 0.03 }] } as Recipe;
  };
  it('une épice se note en additif, en grammes, et quitte les fermentescibles', async () => {
    const onSave = vi.fn();
    render(<BrewWizard {...props({ seed: { recipe: avecCoriandre(), step: 'fermentescibles' }, onSave })} />);
    await attendre(400);
    const section = document.querySelector('[data-role="additifs"]') as HTMLElement;
    expect(section, 'la section Additifs existe sous les fermentescibles').toBeTruthy();
    (section as HTMLDetailsElement).open = true;
    fireEvent.click(within(section).getByRole('button', { name: /Noter .*Coriandre.* en additif/ }));
    const quantite = within(section).getByLabelText(/Quantité.*Coriandre/) as HTMLInputElement;
    expect(quantite.value, 'virgule et grammes : 30 g').toBe('30');
    expect((within(section).getByLabelText(/Unité.*Coriandre/) as HTMLSelectElement).value).toBe('g');
    allerEtape(/^Récapitulatif$/); await attendre();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette', exact: true }));
    const saved = onSave.mock.calls[0]?.[0] as Recipe;
    expect(saved.adjuncts?.map(a => [a.name, a.amount, a.unit])).toEqual([['Coriandre', 30, 'g']]);
    expect(saved.fermentables?.some(f => /coriandre/i.test(f.name)), 'plus comptée comme fermentescible').toBe(false);
  }, 40000);
  it('un additif se saisit à la main : nom, quantité à virgule, unité, moment', async () => {
    const onSave = vi.fn();
    render(<BrewWizard {...props({ seed: { recipe: recetteApercuIdentite(), step: 'fermentescibles' }, onSave })} />);
    await attendre(400);
    const section = document.querySelector('[data-role="additifs"]') as HTMLDetailsElement;
    section.open = true;
    fireEvent.click(within(section).getByRole('button', { name: /Ajouter un additif/ }));
    fireEvent.change(within(section).getByLabelText(/Nom de l’additif 1/), { target: { value: 'Irish moss' } });
    fireEvent.change(within(section).getByLabelText(/Quantité.*Irish moss/), { target: { value: '2,5' } });
    fireEvent.change(within(section).getByLabelText(/Moment.*Irish moss/), { target: { value: 'Ébullition' } });
    allerEtape(/^Récapitulatif$/); await attendre();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette', exact: true }));
    const saved = onSave.mock.calls[0]?.[0] as Recipe;
    expect(saved.adjuncts).toEqual([expect.objectContaining({ name: 'Irish moss', amount: 2.5, unit: 'g', step: 'Ébullition' })]);
  }, 40000);
});

// ---- Tour 2 (critique k3, 20.11) ----------------------------------------------------------------------------------------------------------
describe('k3 n° 1 : Levure sans matériel figé garde le choix de souche', () => {
  it('NOLO actif sans matériel figé : l’invite d’adoption n’occupe pas l’étape (renvoi d’une ligne), la levure se choisit', async () => {
    const r = { ...recetteApercuIdentite(), nolo: { ...newNoloConfig(), enabled: true } } as Recipe;
    render(<BrewWizard {...props({ seed: { recipe: r, step: 'levure' } })} />);
    await attendre(600);
    const prompt = document.querySelector('aside[aria-label="Matériel requis pour le scénario NOLO"]');
    expect(prompt, 'plus d’invite répétée à Levure').toBeNull();
    const renvoi = document.querySelector('[data-role="nolo-materiel-renvoi"]');
    expect(renvoi, 'une ligne de renvoi, avec le geste d’adoption').toBeTruthy();
    expect(within(renvoi as HTMLElement).getByRole('button', { name: /Adapter à mon matériel actuel/ })).toBeTruthy();
    expect(screen.queryByText(/Cette recette n’a pas de matériel figé/), 'la phrase de l’Identité n’est pas répétée').toBeNull();
    expect(document.body.textContent, 'le choix de levure est à l’écran').toMatch(/levure|souche/i);
  }, 30000);
});

describe('k3 n° 7 : la ligne d’additif a trois parts lisibles', () => {
  it('quantité, unité et moment sont dans une grille ; le moment garde sa place (7 rem au moins)', async () => {
    render(<BrewWizard {...props({ seed: { recipe: recetteApercuIdentite(), step: 'fermentescibles' } })} />);
    await attendre(400);
    const section = document.querySelector('[data-role="additifs"]') as HTMLDetailsElement;
    section.open = true;
    fireEvent.click(within(section).getByRole('button', { name: /Ajouter un additif/ }));
    const ligne = section.querySelector('[data-role="additif-ligne"]') as HTMLElement;
    expect(ligne.className).toMatch(/grid-cols-\[5rem_4\.5rem_minmax\(7rem,1fr\)\]/);
    for (const champ of [...ligne.children]) expect(champ.className, 'aucun w-full/w-20 en concurrence').not.toMatch(/\bw-(20|24)\b/);
  }, 30000);
});

describe('k3 n° 8 : TL-19, brouillon repris', () => {
  it('lisible et cadré, avec « Repartir d’une recette vierge » (confirmation, puis le brouillon est jeté) ; effacé au changement d’étape', async () => {
    const onClose = vi.fn();
    const { unmount } = render(<BrewWizard {...props({ draftKey: 'ZZ:w1-tl19b' })} />);
    fireEvent.change(screen.getByLabelText('Nom de la bière'), { target: { value: 'ZZ TEST — reprise 2' } });
    await attendre();
    unmount();
    render(<BrewWizard {...props({ draftKey: 'ZZ:w1-tl19b', onClose })} />);
    const phrase = await screen.findByText('Brouillon repris sur cet appareil.');
    const cadre = phrase.closest('.recipe-draft-status') as HTMLElement;
    expect(cadre.className, 'cadre léger, texte courant (14 px)').toMatch(/border/);
    expect(cadre.className).toMatch(/text-sm/);
    const geste = within(cadre).getByRole('button', { name: 'Repartir d’une recette vierge' });
    fireEvent.click(geste);
    expect(await screen.findByText('Supprimer ce brouillon ?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Abandonner', exact: true }));
    expect(onClose).toHaveBeenCalled();
    expect(localStorage.getItem('ZZ:w1-tl19b') ?? '', 'brouillon jeté').not.toMatch(/reprise 2/);
  }, 40000);
  it('la phrase disparaît (reste annoncée aux lecteurs d’écran) quand l’étape change', async () => {
    const { unmount } = render(<BrewWizard {...props({ draftKey: 'ZZ:w1-tl19c' })} />);
    fireEvent.change(screen.getByLabelText('Nom de la bière'), { target: { value: 'ZZ TEST — reprise 3' } });
    await attendre();
    unmount();
    render(<BrewWizard {...props({ draftKey: 'ZZ:w1-tl19c' })} />);
    const phrase = await screen.findByText('Brouillon repris sur cet appareil.');
    expect(visible(phrase)).toBe(true);
    allerEtape(/Malts/); await attendre();
    const apres = screen.queryAllByText('Brouillon repris sur cet appareil.');
    expect(apres.filter(visible), 'plus à l’écran après le changement d’étape').toEqual([]);
  }, 40000);
});
